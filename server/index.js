// ...existing code...
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
    origin: true, // Dynamically match request origin
    methods: ['GET', 'POST'],
    credentials: true
  }
});
app.set('io', io);

// Connect Database
connectDB();

// Init Middleware
app.use(express.json());

// --- Production-ready CORS: automatically match origin ---
app.use(cors({
  origin: true, 
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-auth-token"]
}));
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


// File upload route
app.use('/api/upload', require('./routes/upload'));
// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Define Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/contacts', require('./routes/contacts'));
app.use('/api/interactions', require('./routes/interactions'));
app.use('/api/share', require('./routes/share'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/reminders', require('./routes/reminders'));
app.use('/api/ai-reminders', require('./routes/aiReminders'));
app.use('/api/vault', require('./routes/vault'));

// Root route for health check / status
app.get('/', (req, res) => {
  res.json({ 
    status: "OK", 
    message: "Smart Contact Management System API is running...", 
    timestamp: new Date().toISOString() 
  });
});

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

const getOnlineSummary = () => {
  const summary = {};
  for (const [uid, sockets] of onlineUsers.entries()) {
    summary[uid] = sockets.size;
  }
  return summary;
};

io.on('connection', (socket) => {
  const auth = socket.handshake.auth || {};
  const userId = auth.userId;

  if (userId) {
    addOnlineSocket(userId, socket.id);
    socket.join(`user:${userId}`);
    console.log(`[Socket] User ${userId} connected. Online users:`, JSON.stringify(getOnlineSummary()));
  }

  socket.on('join', (uid) => {
    const idToJoin = uid || userId;
    if (idToJoin) {
      addOnlineSocket(idToJoin, socket.id);
      socket.join(`user:${idToJoin}`);
      console.log(`[Socket] User ${idToJoin} joined 'user:${idToJoin}'. Online:`, JSON.stringify(getOnlineSummary()));
    }
  });

  socket.on('joinRoom', (roomId) => {
    if (roomId) {
      socket.join(String(roomId));
      console.log(`[Socket] Socket ${socket.id} joined room ${roomId}`);
    }
  });

  // Helper to resolve contactId to linkedUserId
  const resolveTargetId = async (id) => {
    if (!id) return null;
    if (isObjectIdLike(id)) {
      try {
        const contact = await Contact.findById(id).select('linkedUserId').lean();
        if (contact && contact.linkedUserId) {
          return String(contact.linkedUserId);
        }
      } catch (err) {}
    }
    return String(id);
  };

  // --- CALL HANDLERS (Standardized) ---

  socket.on('callKey', async (data) => {
    const { to, from, key } = data || {};
    const senderId = String(from || userId || '');
    const targetUserId = await resolveTargetId(to);
    
    console.log(`[Socket Debug] callKey from ${senderId} to ${to} (target: ${targetUserId})`);
    console.log(`[Socket Debug] Target ${targetUserId} exists in onlineUsers:`, onlineUsers.has(targetUserId));

    if (!targetUserId || !key) return;

    io.to(`user:${targetUserId}`).emit('callKey', { from: senderId, key });
  });
  
  // Handler for call initiation (Handles both legacy 'callUser' and new 'call-user')
  const handleCallUser = async (data) => {
    const { to, from, fromName, type, offer, signal } = data || {};
    const senderUserId = String(from || userId || '');
    const targetUserId = await resolveTargetId(to);

    console.log(`[Socket Debug] call-user from ${senderUserId} to ${to} (target: ${targetUserId})`);
    console.log(`[Socket Debug] Sender online: ${onlineUsers.has(senderUserId)}, Target online: ${onlineUsers.has(targetUserId)}`);

    const finalOffer = offer || signal;
    if (!targetUserId || !senderUserId || !finalOffer) {
      console.warn('[Socket Debug] Missing data for call-user', { targetUserId, senderUserId, hasOffer: !!finalOffer });
      return;
    }
    if (targetUserId === senderUserId) {
      console.warn('[Socket Debug] User attempting to call themselves');
      return;
    }

    activeCalls.set(buildCallKey(senderUserId, targetUserId), { from: senderUserId, to: targetUserId, startedAt: Date.now() });

    if (onlineUsers.has(targetUserId)) {
      console.log(`[Socket Debug] Emitting incomingCall to user:${targetUserId}`);
      io.to(`user:${targetUserId}`).emit('incomingCall', {
        from: senderUserId,
        fromName,
        type,
        offer: finalOffer,
        signal: finalOffer // legacy support
      });
      emitUserNotification(targetUserId, {
        type: 'call',
        title: 'Incoming Call',
        body: `${fromName || 'Someone'} is calling you`,
        senderId: senderUserId,
      });
      trackInteraction({
        userId: senderUserId,
        contactId: to,
        type: 'call_outgoing',
        metadata: { status: 'ringing' },
      });
    } else {
      console.log(`[Socket Debug] Target user ${targetUserId} is offline`);
      socket.emit('user-offline', { userId: targetUserId });
      trackInteraction({
        userId: senderUserId,
        contactId: to,
        type: 'call_missed',
        notes: 'Recipient offline',
      });
    }
  };

  socket.on('call-user', handleCallUser);
  socket.on('callUser', handleCallUser);

  const handleAcceptCall = async (data) => {
    const { to, answer, signal } = data || {};
    const targetUserId = await resolveTargetId(to);
    const finalAnswer = answer || signal;
    if (!targetUserId || !finalAnswer) return;
    
    console.log(`[Socket Debug] Accept-call from ${userId} to ${targetUserId}`);
    io.to(`user:${targetUserId}`).emit('call-accepted', { answer: finalAnswer, signal: finalAnswer });
    io.to(`user:${targetUserId}`).emit('callAccepted', { answer: finalAnswer, signal: finalAnswer }); // Home.tsx support
    io.to(`user:${targetUserId}`).emit('callAnswered', { answer: finalAnswer, signal: finalAnswer }); // Home.tsx variant
  };

  socket.on('accept-call', handleAcceptCall);
  socket.on('acceptCall', handleAcceptCall);
  socket.on('answerCall', handleAcceptCall);

  socket.on('reject-call', async (data) => {
    const { to } = data || {};
    const targetUserId = await resolveTargetId(to);
    if (targetUserId) {
      io.to(`user:${targetUserId}`).emit('call-rejected');
      io.to(`user:${targetUserId}`).emit('callRejected'); // Home.tsx
      trackInteraction({
        userId: targetUserId,
        contactId: userId,
        type: 'call_missed',
        notes: 'Call rejected by recipient',
      });
    }
  });

  const handleIceCandidate = async (data) => {
    const { to, candidate } = data || {};
    const targetUserId = await resolveTargetId(to);
    if (targetUserId && candidate) {
      io.to(`user:${targetUserId}`).emit('ice-candidate', { from: userId, candidate });
      io.to(`user:${targetUserId}`).emit('iceCandidate', { from: userId, candidate }); // Home.tsx
    }
  };

  socket.on('ice-candidate', handleIceCandidate);
  socket.on('iceCandidate', handleIceCandidate);

  const handleEndCall = async (data) => {
    const { to } = data || {};
    const targetUserId = await resolveTargetId(to);
    if (targetUserId) {
      io.to(`user:${targetUserId}`).emit('call-ended');
      io.to(`user:${targetUserId}`).emit('callEnded'); // Legacy support
    }

    const key = buildCallKey(userId, targetUserId);
    const call = activeCalls.get(key);
    if (call) {
      const durationSeconds = Math.max(0, Math.floor((Date.now() - call.startedAt) / 1000));
      activeCalls.delete(key);
      if (targetUserId) {
        trackInteraction({ userId, contactId: to, type: 'call_outgoing', duration: durationSeconds });
      }
    }
  };

  socket.on('end-call', handleEndCall);
  socket.on('endCall', handleEndCall);

  // --- MESSAGING HANDLERS ---

  socket.on('sendMessage', async (data) => {
    try {
      const {
        senderId,
        receiverId,
        text,
        message, // fallback
        clientMessageId,
        isTemporary,
        expiresAt,
        messageType = 'text',
        sharedContactId,
        shareToken,
        sharedContactName,
        shareExpiresAt,
        sharePayload,
      } = data || {};

      const effectiveSender = String(senderId || userId);
      const targetUserId = await resolveTargetId(receiverId || data.to);
      const content = String(text || message || '').trim();

      if (!effectiveSender || !targetUserId) return;
      if (messageType === 'text' && !content) return;

      // Always ensure shareExpiresAt and sharePayload.expiresAt for contact_share
      let finalShareExpiresAt = shareExpiresAt;
      let finalSharePayload = sharePayload;
      let createdAt = new Date().toISOString();
      if (messageType === 'contact_share') {
        // Fallback: if missing, set to createdAt + 5min
        if (!finalShareExpiresAt || isNaN(new Date(finalShareExpiresAt).getTime())) {
          finalShareExpiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
        }
        if (!finalSharePayload || typeof finalSharePayload !== 'object') {
          finalSharePayload = {};
        }
        if (!finalSharePayload.expiresAt || isNaN(new Date(finalSharePayload.expiresAt).getTime())) {
          finalSharePayload.expiresAt = finalShareExpiresAt;
        }
      }
      const messageData = {
        _id: `tmp-${Date.now()}`,
        senderId: effectiveSender,
        receiverId: targetUserId,
        text: content,
        messageType,
        status: 'delivered',
        deliveredAt: new Date().toISOString(),
        createdAt,
        clientMessageId: clientMessageId || null,
        isTemporary: Boolean(isTemporary),
        expiresAt: expiresAt || null,
        sharedContactId,
        shareToken,
        sharedContactName,
        shareExpiresAt: finalShareExpiresAt,
        sharePayload: finalSharePayload,
      };

      // Broadcast to both raw and resolved rooms for safety
      io.to(`user:${targetUserId}`).emit('receiveMessage', messageData);
      if (receiverId && receiverId !== targetUserId) {
        io.to(`user:${receiverId}`).emit('receiveMessage', messageData);
      }
      
      // Echo back to sender
      socket.emit('receiveMessage', messageData);

      // Persistence in background
      Message.create({
        ownerId: effectiveSender,
        senderId: effectiveSender,
        receiverId: receiverId || targetUserId,
        text: content,
        messageType,
        clientMessageId,
        isTemporary,
        expiresAt,
        sharedContactId,
        shareToken,
        sharedContactName,
        shareExpiresAt,
        sharePayload,
        status: 'delivered',
        deliveredAt: new Date(),
      }).catch(err => console.error('[Socket] Message Save error:', err.message));

      // Track interaction
      trackInteraction({
        userId: effectiveSender,
        contactId: receiverId || targetUserId,
        type: 'message_sent',
        metadata: { clientMessageId }
      }).catch(() => {});

    } catch (err) {
      console.error('[Socket] sendMessage Error:', err.message);
    }
  });

  socket.on('typing', async (data) => {
    const receiverId = typeof data === 'string' ? data : data.to;
    const targetId = await resolveTargetId(receiverId);
    if (targetId) {
      io.to(`user:${targetId}`).emit('typing', { from: userId });
    }
  });

  socket.on('stopTyping', async (data) => {
    const receiverId = typeof data === 'string' ? data : data.to;
    const targetId = await resolveTargetId(receiverId);
    if (targetId) {
      io.to(`user:${targetId}`).emit('stopTyping', { from: userId });
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

  socket.on('disconnect', () => {
    if (userId) {
      removeOnlineSocket(userId, socket.id);
      console.log(`[Socket] User ${userId} disconnected`);
    }
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
    const filteredContactsByUser = new Map();
    for (const contact of contacts) {
      if (!contact.userId || !isObjectIdLike(contact.userId)) continue;
      const key = String(contact.userId);
      if (!filteredContactsByUser.has(key)) filteredContactsByUser.set(key, []);
      filteredContactsByUser.get(key).push(contact);
    }

    for (const [uid, userContacts] of filteredContactsByUser.entries()) {
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
