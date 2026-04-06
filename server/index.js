const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const connectDB = require('./config/db');
const path = require('path');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Message = require('./models/Message');
const Contact = require('./models/Contact');
const Reminder = require('./models/Reminder');
const ShareLink = require('./models/ShareLink');
const Interaction = require('./models/Interaction');
const AIReminder = require('./models/AIReminder');
require('dotenv').config({ path: path.join(__dirname, '.env') });



const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: [
      'http://localhost:3000', // Next.js/React dev server
      'http://127.0.0.1:3000',
      'http://localhost:5000', // Allow self for testing
    ],
    methods: ['GET', 'POST'],
    credentials: true
  }
});
app.set('io', io);

// Connect Database
connectDB();

// Init Middleware
app.use(express.json());

// --- CORS for development: allow localhost:3000 and custom headers ---
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-auth-token"]
}));

// --- Manual CORS headers to ensure x-auth-token is always allowed ---
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type,x-auth-token,Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// --- (Optional) Allow all origins for development ---
// app.use(cors({
//   origin: '*',
//   credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'x-auth-token', 'Authorization'],
// }));

// Define Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/contacts', require('./routes/contacts'));
app.use('/api/interactions', require('./routes/interactions'));
app.use('/api/share', require('./routes/share'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/reminders', require('./routes/reminders'));
app.use('/api/ai-reminders', require('./routes/aiReminders'));

const onlineUsers = new Map(); // Map of userId -> Set<socketId>
const activeCalls = new Map(); // Map<callKey, { from, to, startedAt }>

const getChatRoom = (userId, contactId) => `chat:${userId}_${contactId}`;
const getPairChatRoom = (userA, userB) => `chat:${[String(userA), String(userB)].sort().join('_')}`;
const isObjectIdLike = (value) => /^[a-fA-F0-9]{24}$/.test(String(value || ''));
const buildCallKey = (from, to) => [String(from), String(to)].sort().join(':');

const emitUserNotification = (targetUserId, payload) => {
  if (!targetUserId) return;
  io.to(`user:${String(targetUserId)}`).emit('notification', {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    ...payload,
  });
};

const trackInteraction = async ({ userId, contactId, type, duration = 0, notes = '', metadata = {} }) => {
  try {
    if (!userId || !contactId || !isObjectIdLike(contactId)) return;
    await Interaction.create({
      userId,
      contactId,
      type,
      timestamp: new Date(),
      duration,
      notes,
      metadata,
    });
  } catch (err) {
    console.error('trackInteraction error:', err.message);
  }
};

const addOnlineSocket = (userId, socketId) => {
  const existing = onlineUsers.get(userId) || new Set();
  existing.add(socketId);
  onlineUsers.set(userId, existing);
};

const removeOnlineSocket = (userId, socketId) => {
  const existing = onlineUsers.get(userId);
  if (!existing) return;
  existing.delete(socketId);
  if (existing.size === 0) {
    onlineUsers.delete(userId);
  } else {
    onlineUsers.set(userId, existing);
  }
};

const getPrimarySocketId = (userId) => {
  const sockets = onlineUsers.get(userId);
  if (!sockets || sockets.size === 0) {
    return null;
  }
  return sockets.values().next().value;
};

io.use((socket, next) => {
  const auth = socket.handshake.auth || {};
  const token = auth.token || auth.authToken;
  const userId = auth.userId;

  if (!token || !userId) {
    return next(new Error('Unauthorized socket connection'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.user || decoded.user.id !== userId) {
      return next(new Error('Invalid socket user'));
    }
    socket.data.userId = decoded.user.id;
    return next();
  } catch (err) {
    return next(new Error('Invalid socket token'));
  }
});

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  const userId = socket.data.userId;
  if (userId) {
    addOnlineSocket(userId, socket.id);
    socket.join(`user:${userId}`);
    console.log(`User ${userId} is online`);

    // Broadcast online users to all clients
    io.emit('online-users', Array.from(onlineUsers.keys()));
  }

  socket.on('join', (joinUserId) => {
    const uid = String(joinUserId || userId || '');
    if (!uid) return;
    socket.join(`user:${uid}`);
  });

  // Compatibility event so clients can explicitly mark presence after auth.
  socket.on('online', (onlineUserId) => {
    const uid = String(onlineUserId || userId || '');
    if (!uid) return;
    addOnlineSocket(uid, socket.id);
    socket.join(`user:${uid}`);
    io.emit('online-users', Array.from(onlineUsers.keys()));
    console.log('User joined room:', uid);

    });

  socket.on('join-chat', ({ contactId }) => {
    if (!userId || !contactId) return;
    socket.join(getChatRoom(userId, contactId));
    socket.to(getChatRoom(userId, contactId)).emit('message-seen', { contactId });
  });

  socket.on('typing-start', ({ contactId }) => {
    if (!userId || !contactId) return;
    socket.to(getChatRoom(userId, contactId)).emit('typing-start', { contactId, userId });
  });

  socket.on('typing-stop', ({ contactId }) => {
    if (!userId || !contactId) return;
    socket.to(getChatRoom(userId, contactId)).emit('typing-stop', { contactId, userId });
  });

  socket.on('joinRoom', (roomId) => {
    if (!roomId) return;
    socket.join(String(roomId));
  });

  socket.on('typing', (receiverId) => {
    if (!userId || !receiverId) return;
    io.to(`user:${String(receiverId)}`).emit('typing', { from: userId });
  });

  socket.on('notification', (payload) => {
    if (!userId || !payload || typeof payload !== 'object') return;
    const title = String(payload.title || '').trim();
    const body = String(payload.body || '').trim();
    if (!title && !body) return;

    emitUserNotification(userId, {
      type: 'message',
      title: title || 'Test Notification',
      body: body || 'Hello',
      senderId: userId,
    });
  });

  socket.on('stopTyping', (receiverId) => {
    if (!userId || !receiverId) return;
    io.to(`user:${String(receiverId)}`).emit('stopTyping', { from: userId });
  });

  socket.on('sendMessage', async (data) => {
    try {
      const {
        senderId,
        receiverId,
        message,
        clientMessageId,
        expiresInMinutes = null,
        messageType = 'text',
        sharedContactId = null,
        shareToken = null,
        sharedContactName = null,
        shareExpiresAt = null,
        sharePayload = null,
      } = data || {};
      const safeText = String(message || '').trim();
      if (!userId || !receiverId) return;
      const temporaryMinutes = Number(expiresInMinutes);
      const isTemporary = Number.isFinite(temporaryMinutes) && temporaryMinutes > 0;
      const expiresAt = isTemporary ? new Date(Date.now() + Math.floor(temporaryMinutes) * 60 * 1000) : null;
      const normalizedMessageType = messageType === 'contact_share' ? 'contact_share' : 'text';

      if (normalizedMessageType === 'text' && !safeText) return;
      if (normalizedMessageType === 'contact_share' && !(sharePayload?.token || shareToken)) return;

      const effectiveSender = String(senderId || userId);
      const chatRoomId = getPairChatRoom(effectiveSender, receiverId);

      let doc = null;
      if (clientMessageId) {
        doc = await Message.findOne({ senderId: effectiveSender, clientMessageId }).lean();
      }

      if (!doc) {
        const created = await Message.create({
          ownerId: effectiveSender,
          senderId: effectiveSender,
          receiverId,
          chatRoomId,
          sender: 'user',
          messageType: normalizedMessageType,
          text: normalizedMessageType === 'contact_share'
            ? (safeText || `Contact access granted${sharedContactName ? `: ${sharedContactName}` : ''}`)
            : safeText,
          sharedContactId,
          shareToken: sharePayload?.token || shareToken || null,
          sharedContactName,
          shareExpiresAt: sharePayload?.expiresAt || shareExpiresAt || null,
          sharePayload: normalizedMessageType === 'contact_share'
            ? {
              type: 'contact_share',
              contactId: sharePayload?.contactId || sharedContactId || null,
              token: sharePayload?.token || shareToken || null,
              expiresAt: sharePayload?.expiresAt || shareExpiresAt || null,
            }
            : null,
          status: 'delivered',
          deliveredAt: new Date(),
          clientMessageId: clientMessageId || null,
          isTemporary,
          expiresAt,
        });
        doc = created.toObject();
      }

      const messageData = {
        _id: doc._id,
        senderId: effectiveSender,
        receiverId: String(receiverId),
        chatRoomId,
        messageType: doc.messageType || 'text',
        text: doc.text,
        sharedContactId: doc.sharedContactId || null,
        shareToken: doc.shareToken || null,
        sharedContactName: doc.sharedContactName || null,
        shareExpiresAt: doc.shareExpiresAt || null,
        sharePayload: doc.sharePayload || null,
        status: doc.status || 'delivered',
        deliveredAt: doc.deliveredAt || new Date().toISOString(),
        seenAt: doc.seenAt || null,
        createdAt: doc.createdAt || new Date().toISOString(),
        clientMessageId: doc.clientMessageId || clientMessageId || null,
        isTemporary: Boolean(doc.isTemporary),
        expiresAt: doc.expiresAt || null,
      };

      io.to(`user:${String(receiverId)}`).emit('newMessage', messageData);
      io.to(`user:${effectiveSender}`).emit('newMessage', messageData);
      io.to(`user:${String(receiverId)}`).emit('receiveMessage', messageData);
      io.to(`user:${effectiveSender}`).emit('receiveMessage', messageData);
      io.to(`user:${effectiveSender}`).emit('message-delivered', {
        messageId: doc._id,
        receiverId: String(receiverId),
        contactId: String(receiverId),
      });

      emitUserNotification(receiverId, {
        type: 'message',
        title: 'New Message',
        body: normalizedMessageType === 'contact_share'
          ? `Contact access shared${sharedContactName ? `: ${sharedContactName}` : ''}`
          : safeText,
        senderId: effectiveSender,
      });
    } catch (err) {
      console.error('sendMessage error:', err.message);
    }
  });

  socket.on('send-message', async (data) => {
    try {
      const {
        contactId,
        text,
        clientMessageId,
        expiresInMinutes = null,
        messageType = 'text',
        sharedContactId = null,
        shareToken = null,
        shareLink = null,
        sharedContactName = null,
        shareExpiresAt = null,
        sharePayload = null,
      } = data || {};
      if (!userId || !contactId) return;
      const temporaryMinutes = Number(expiresInMinutes);
      const isTemporary = Number.isFinite(temporaryMinutes) && temporaryMinutes > 0;
      const expiresAt = isTemporary ? new Date(Date.now() + Math.floor(temporaryMinutes) * 60 * 1000) : null;

      const normalizedMessageType = messageType === 'contact_share' ? 'contact_share' : 'text';
      const safeText = (text || '').trim();
      if (normalizedMessageType === 'text' && !safeText) return;
      if (normalizedMessageType === 'contact_share' && !shareToken) return;

      const contact = await Contact.findById(contactId).lean();
      if (!contact || contact.userId.toString() !== userId) return;

      let message = null;
      if (clientMessageId) {
        message = await Message.findOne({ ownerId: userId, clientMessageId });
      }

      if (!message) {
        const payloadText = normalizedMessageType === 'contact_share'
          ? (safeText || `Shared contact: ${sharedContactName || 'Contact'}`)
          : safeText;

        message = await Message.create({
          ownerId: userId,
          contactId,
          sender: 'user',
          messageType: normalizedMessageType,
          text: payloadText,
          sharedContactId,
          shareToken,
          shareLink,
          sharedContactName,
          shareExpiresAt,
          sharePayload: normalizedMessageType === 'contact_share'
            ? {
              type: 'contact_share',
              contactId: sharePayload?.contactId || sharedContactId || null,
              token: sharePayload?.token || shareToken || null,
              expiresAt: sharePayload?.expiresAt || shareExpiresAt || null,
            }
            : null,
          status: 'delivered',
          deliveredAt: new Date(),
          clientMessageId: clientMessageId || null,
          isTemporary,
          expiresAt,
        });
      }

      const payload = {
        _id: message._id,
        ownerId: message.ownerId,
        contactId: message.contactId,
        sender: message.sender,
        messageType: message.messageType,
        text: message.text,
        sharedContactId: message.sharedContactId,
        shareToken: message.shareToken,
        shareLink: message.shareLink,
        sharedContactName: message.sharedContactName,
        shareExpiresAt: message.shareExpiresAt,
        sharePayload: message.sharePayload || null,
        status: message.status,
        deliveredAt: message.deliveredAt,
        seenAt: message.seenAt,
        createdAt: message.createdAt,
        clientMessageId: message.clientMessageId,
        isTemporary: Boolean(message.isTemporary),
        expiresAt: message.expiresAt || null,
      };

      
        const receivingUserId = contact.linkedUserId ? String(contact.linkedUserId) : null;
        
        io.to(getChatRoom(userId, contactId)).emit('new-message', payload);
        io.to(getChatRoom(userId, contactId)).emit('receiveMessage', payload);
        
        // Broadcast the message directly to the remote user's socket room if they are online
        if (receivingUserId) {
            io.to(`user:${receivingUserId}`).emit('receiveMessage', payload);
            io.to(`user:${receivingUserId}`).emit('newMessage', payload);
            io.to(`user:${receivingUserId}`).emit('new-message', payload);
            
            // Generate notification for the receiving user, NOT the sender
            emitUserNotification(receivingUserId, {
                type: 'message',
                title: 'New Message',
                body: normalizedMessageType === 'contact_share'
                    ? (safeText || `Shared contact: ${sharedContactName || 'Contact'}`)
                    : safeText,
                senderId: userId,
                contactId: String(contact._id),
            });
        }
        
        io.to(getChatRoom(userId, contactId)).emit('message-delivered', {
          messageId: message._id,
          contactId,
        });

        await trackInteraction({
        userId,
        contactId,
        type: 'message_sent',
        metadata: { messageId: message._id.toString() },
      });
    } catch (err) {
      console.error('send-message error:', err.message);
    }
  });

  // Handle call initiation
  socket.on('call-user', (data) => {
    const { to, from, fromName, type, offer } = data || {};
    const targetUserId = String(to || '');
    const senderUserId = String(from || userId || '');
    if (!targetUserId || !senderUserId || !offer) return;
    if (targetUserId === senderUserId) return; // Prevent self-call

    activeCalls.set(buildCallKey(senderUserId, targetUserId), { from: senderUserId, to: targetUserId, startedAt: Date.now() });

    if (onlineUsers.has(targetUserId)) {
      io.to(`user:${targetUserId}`).emit('incomingCall', {
        from: senderUserId,
        fromName,
        type,
        offer,
      });
      emitUserNotification(to, {
        type: 'call',
        title: 'Incoming Call',
        body: `${fromName || 'Someone'} is calling you`,
        senderId: senderUserId,
      });
      console.log('Caller:', senderUserId);
      console.log('Receiver:', targetUserId);
      trackInteraction({
        userId: senderUserId,
        contactId: targetUserId,
        type: 'call_outgoing',
        metadata: { status: 'ringing' },
      });
    } else {
      socket.emit('user-offline', { userId: targetUserId });
      trackInteraction({
        userId: senderUserId,
        contactId: targetUserId,
        type: 'call_missed',
        notes: 'Recipient offline',
      });
    }
  });

  socket.on('callUser', (data) => {
    const { to, from, fromName, type, offer } = data || {};
    const targetUserId = String(to || '');
    const senderUserId = String(from || userId || '');
    if (!targetUserId || !senderUserId || !offer) return;

    activeCalls.set(buildCallKey(senderUserId, targetUserId), { from: senderUserId, to: targetUserId, startedAt: Date.now() });

    if (onlineUsers.has(targetUserId)) {
      io.to(`user:${targetUserId}`).emit('incomingCall', {
        from: senderUserId,
        fromName,
        type,
        offer,
      });
      io.to(`user:${targetUserId}`).emit('incoming-call', {
        from: senderUserId,
        fromName,
        type,
        offer,
      });
      emitUserNotification(targetUserId, {
        type: 'call',
        title: 'Incoming Call',
        body: `${fromName || 'Someone'} is calling you`,
        senderId: senderUserId,
      });
    } else {
      socket.emit('user-offline', { userId: targetUserId });
    }
  });

  // Handle call acceptance
  socket.on('accept-call', (data) => {
    const { to, answer } = data;
    const targetUserId = String(to || '');
    if (targetUserId && answer) {
      io.to(`user:${targetUserId}`).emit('call-accepted', { answer });
      io.to(`user:${targetUserId}`).emit('callAnswered', { answer });
      io.to(`user:${targetUserId}`).emit('callAccepted', { answer });
      console.log(`Call accepted by recipient`);

      trackInteraction({
        userId,
        contactId: targetUserId,
        type: 'call_incoming',
        metadata: { status: 'accepted' },
      });
    }
  });

  socket.on('answerCall', (data) => {
    const { to, answer } = data || {};
    const targetUserId = String(to || '');
    if (!targetUserId || !answer) return;
    io.to(`user:${targetUserId}`).emit('callAnswered', { answer });
    io.to(`user:${targetUserId}`).emit('call-accepted', { answer });
    io.to(`user:${targetUserId}`).emit('callAccepted', { answer });
  });

  socket.on('acceptCall', (data) => {
    const { to, signal, answer } = data || {};
    const targetUserId = String(to || '');
    const resolvedAnswer = answer || signal;
    if (!targetUserId || !resolvedAnswer) return;
    io.to(`user:${targetUserId}`).emit('callAnswered', { answer: resolvedAnswer });
    io.to(`user:${targetUserId}`).emit('call-accepted', { answer: resolvedAnswer });
    io.to(`user:${targetUserId}`).emit('callAccepted', { answer: resolvedAnswer });
  });

  // Handle call rejection
  socket.on('reject-call', (data) => {
    const { to } = data;
    const targetUserId = String(to || '');
    if (targetUserId) {
      io.to(`user:${targetUserId}`).emit('call-rejected');
      console.log(`Call rejected by recipient`);

      trackInteraction({
        userId: targetUserId,
        contactId: userId,
        type: 'call_missed',
        notes: 'Call rejected by recipient',
      });
    }
  });

  // Handle ICE candidates
  socket.on('ice-candidate', (data) => {
    const { to, candidate } = data;
    const targetUserId = String(to || '');
    if (!targetUserId || !candidate) return;
    io.to(`user:${targetUserId}`).emit('ice-candidate', { candidate });
    io.to(`user:${targetUserId}`).emit('iceCandidate', { candidate });
  });

  socket.on('iceCandidate', (data) => {
    const { to, candidate } = data || {};
    const targetUserId = String(to || '');
    if (!targetUserId || !candidate) return;
    io.to(`user:${targetUserId}`).emit('iceCandidate', { candidate });
    io.to(`user:${targetUserId}`).emit('ice-candidate', { candidate });
  });

  // Handle call end
  socket.on('end-call', (data) => {
    const { to } = data;
    const targetUserId = String(to || '');
    if (targetUserId) {
      io.to(`user:${targetUserId}`).emit('call-ended');
      io.to(`user:${targetUserId}`).emit('callEnded');
      console.log(`Call ended`);
    }

    const key = buildCallKey(userId, targetUserId);
    const call = activeCalls.get(key);
    if (call) {
      const durationSeconds = Math.max(0, Math.floor((Date.now() - call.startedAt) / 1000));
      activeCalls.delete(key);
      if (targetUserId) {
        trackInteraction({ userId, contactId: targetUserId, type: 'call_outgoing', duration: durationSeconds });
        trackInteraction({ userId: targetUserId, contactId: userId, type: 'call_incoming', duration: durationSeconds });
      }
    }
  });

  socket.on('endCall', (data) => {
    const { to } = data || {};
    const targetUserId = String(to || '');
    if (targetUserId) {
      io.to(`user:${targetUserId}`).emit('callEnded');
      io.to(`user:${targetUserId}`).emit('call-ended');
    }

    const key = buildCallKey(userId, targetUserId);
    const call = activeCalls.get(key);
    if (call) {
      const durationSeconds = Math.max(0, Math.floor((Date.now() - call.startedAt) / 1000));
      activeCalls.delete(key);
      if (targetUserId) {
        trackInteraction({ userId, contactId: targetUserId, type: 'call_outgoing', duration: durationSeconds });
        trackInteraction({ userId: targetUserId, contactId: userId, type: 'call_incoming', duration: durationSeconds });
      }
    }
  });

  socket.on('mark-seen', async (data) => {
    try {
      const { contactId } = data || {};
      if (!userId || !contactId) return;
      await Message.updateMany(
        { ownerId: userId, contactId, sender: 'contact', read: false },
        { $set: { read: true, status: 'seen', seenAt: new Date() } }
      );
      io.to(getChatRoom(userId, contactId)).emit('message-seen', { contactId });
    } catch (err) {
      console.error('mark-seen error:', err.message);
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);

    if (userId) {
      removeOnlineSocket(userId, socket.id);
      if (!onlineUsers.has(userId)) {
        console.log(`User ${userId} is offline`);
      }
    }

    // Broadcast updated online users
    io.emit('online-users', Array.from(onlineUsers.keys()));
  });
});

const computeNextReminderDate = (date, repeat) => {
  const next = new Date(date);
  if (repeat === 'daily') next.setDate(next.getDate() + 1);
  if (repeat === 'weekly') next.setDate(next.getDate() + 7);
  if (repeat === 'monthly') next.setMonth(next.getMonth() + 1);
  return next;
};

const generateAIInsightReminders = async () => {
  const now = new Date();
  const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  const dayStamp = now.toISOString().slice(0, 10);

  const contacts = await Contact.find({}).select('_id userId name').lean();
  const contactsByUser = new Map();

  for (const contact of contacts) {
    const key = String(contact.userId);
    if (!contactsByUser.has(key)) contactsByUser.set(key, []);
    contactsByUser.get(key).push(contact);
  }

  for (const [uid, userContacts] of contactsByUser.entries()) {
    const contactIds = userContacts.map((c) => c._id);
    if (!contactIds.length) continue;

    const grouped = await Interaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(uid),
          contactId: { $in: contactIds },
        },
      },
      {
        $group: {
          _id: '$contactId',
          lastInteractionAt: { $max: '$timestamp' },
          missedCallsRecent: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$type', 'call_missed'] },
                    { $gte: ['$timestamp', twoDaysAgo] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          weeklyInteractions: {
            $sum: {
              $cond: [
                { $gte: ['$timestamp', new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)] },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    const groupedMap = new Map(grouped.map((g) => [String(g._id), g]));

    for (const contact of userContacts) {
      const summary = groupedMap.get(String(contact._id));
      const lastInteractionAt = summary?.lastInteractionAt || null;
      const missedCallsRecent = summary?.missedCallsRecent || 0;
      const weeklyInteractions = summary?.weeklyInteractions || 0;

      if (!lastInteractionAt || new Date(lastInteractionAt) < fiveDaysAgo) {
        const days = lastInteractionAt
          ? Math.max(1, Math.ceil((now.getTime() - new Date(lastInteractionAt).getTime()) / (24 * 60 * 60 * 1000)))
          : 7;
        const uniqueKey = `${uid}:${String(contact._id)}:inactive_contact:${dayStamp}`;
        const reminder = await AIReminder.findOneAndUpdate(
          { uniqueKey },
          {
            $setOnInsert: {
              userId: uid,
              contactId: contact._id,
              message: `You haven't contacted ${contact.name} in ${days} days`,
              priority: days >= 7 ? 'high' : 'medium',
              category: 'inactive_contact',
              uniqueKey,
            },
          },
          { upsert: true, new: true }
        );

        io.to(`user:${uid}`).emit('ai-reminder-due', {
          _id: reminder._id,
          message: reminder.message,
          priority: reminder.priority,
          contactId: reminder.contactId,
          category: reminder.category,
        });
        emitUserNotification(uid, {
          type: 'reminder',
          title: 'AI Reminder',
          body: reminder.message,
          contactId: reminder.contactId?.toString?.() || undefined,
        });
      }

      if (missedCallsRecent > 0) {
        const uniqueKey = `${uid}:${String(contact._id)}:missed_call_followup:${dayStamp}`;
        const reminder = await AIReminder.findOneAndUpdate(
          { uniqueKey },
          {
            $setOnInsert: {
              userId: uid,
              contactId: contact._id,
              message: `Call back ${contact.name} (${missedCallsRecent} missed calls)`,
              priority: 'high',
              category: 'missed_call_followup',
              uniqueKey,
            },
          },
          { upsert: true, new: true }
        );

        io.to(`user:${uid}`).emit('ai-reminder-due', {
          _id: reminder._id,
          message: reminder.message,
          priority: reminder.priority,
          contactId: reminder.contactId,
          category: reminder.category,
        });
        emitUserNotification(uid, {
          type: 'reminder',
          title: 'AI Reminder',
          body: reminder.message,
          contactId: reminder.contactId?.toString?.() || undefined,
        });
      }

      if (weeklyInteractions >= 5) {
        const uniqueKey = `${uid}:${String(contact._id)}:regular_followup:${dayStamp}`;
        await AIReminder.findOneAndUpdate(
          { uniqueKey },
          {
            $setOnInsert: {
              userId: uid,
              contactId: contact._id,
              message: `${contact.name} is a frequent contact. Keep the momentum with a quick follow-up.`,
              priority: 'low',
              category: 'regular_followup',
              uniqueKey,
            },
          },
          { upsert: true, new: true }
        );
      }
    }
  }
};

setInterval(async () => {
  try {
    const now = new Date();
    const dueReminders = await Reminder.find({
      isActive: true,
      remindAt: { $lte: now },
    }).limit(100);

    for (const reminder of dueReminders) {
      io.to(`user:${reminder.userId.toString()}`).emit('reminder-due', {
        _id: reminder._id,
        message: reminder.message,
        remindAt: reminder.remindAt,
        contactId: reminder.contactId,
      });
      emitUserNotification(reminder.userId.toString(), {
        type: 'reminder',
        title: 'Reminder',
        body: reminder.message,
        contactId: reminder.contactId?.toString?.() || undefined,
      });

      if (reminder.repeat === 'none') {
        reminder.isActive = false;
      } else {
        reminder.remindAt = computeNextReminderDate(reminder.remindAt, reminder.repeat);
      }
      reminder.lastNotifiedAt = now;
      await reminder.save();
    }
  } catch (err) {
    console.error('Reminder scheduler error:', err.message);
  }
}, 30000);

setInterval(async () => {
  try {
    await ShareLink.updateMany(
      { isActive: true, expiresAt: { $lte: new Date() } },
      { $set: { isActive: false } }
    );
  } catch (err) {
    console.error('Share link expiry worker error:', err.message);
  }
}, 60000);

setInterval(async () => {
  try {
    await generateAIInsightReminders();
  } catch (err) {
    console.error('AI reminder scheduler error:', err.message);
  }
}, 60 * 60 * 1000);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => console.log(`Server started on port ${PORT}`));
// End of file
