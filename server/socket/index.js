    // WebRTC Signaling: Offer
    socket.on('offer', (data) => {
      const { to, from, offer, callMode } = data;
      if (onlineUsers[to]) {
        io.to(onlineUsers[to]).emit('offer', { from, to, offer, callMode });
      }
    });

    // WebRTC Signaling: Answer
    socket.on('answer', (data) => {
      const { to, from, answer } = data;
      if (onlineUsers[to]) {
        io.to(onlineUsers[to]).emit('answer', { from, to, answer });
      }
    });

    // WebRTC Signaling: ICE Candidate
    socket.on('iceCandidate', (data) => {
      const { to, from, candidate } = data;
      if (onlineUsers[to]) {
        io.to(onlineUsers[to]).emit('iceCandidate', { from, to, candidate });
      }
    });
const { Server } = require('socket.io');
const Contact = require('../models/Contact'); // added

function setupSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  const onlineUsers = {};

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on("join", (userId) => {
      onlineUsers[userId] = socket.id;
      console.log('User joined:', userId, 'socket:', socket.id);
    });

    socket.on('joinRoom', (roomId) => {
      socket.join(roomId);
    });

    socket.on('sendMessage', async (data) => {
      let receiverId = data.receiverId;
      const message = data.message || data; // handle both { to, message } and { senderId, receiverId, text } 
      
      // If it has 'to' (which is contactId), find the actual receiver ID
      if (data.to && !receiverId) {
        try {
          const contact = await Contact.findById(data.to);
          if (contact) {
            receiverId = contact.linkedUserId;
            if (receiverId) receiverId = String(receiverId);
          }
        } catch (err) {
          console.error('Error finding contact for socket message', err.message);
        }
      }

      if (!receiverId) return;

      const receiverSocket = onlineUsers[receiverId];

      if (receiverSocket) {
        io.to(receiverSocket).emit('receiveMessage', message);
      }

      // socket.emit('messageSent', message);
    });

    socket.on('typing', async (data) => {
      let receiverId = data.to;
      try {
        const contact = await Contact.findById(data.to);
        if (contact && contact.linkedUserId) receiverId = String(contact.linkedUserId);
      } catch (err) {}
      if (receiverId && onlineUsers[receiverId]) {
        io.to(onlineUsers[receiverId]).emit('typing', { from: data.from });
      }
    });

    socket.on('stopTyping', async (data) => {
      let receiverId = data.to;
      try {
        const contact = await Contact.findById(data.to);
        if (contact && contact.linkedUserId) receiverId = String(contact.linkedUserId);
      } catch (err) {}
      if (receiverId && onlineUsers[receiverId]) {
        io.to(onlineUsers[receiverId]).emit('stopTyping', { from: data.from });
      }
    });

    socket.on('call', (data) => {
      io.to(data.roomId).emit('call', data);
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      for (let userId in onlineUsers) {
        if (onlineUsers[userId] === socket.id) {
          delete onlineUsers[userId];
        }
      }
    });
  });

  return io;
}

module.exports = setupSocket;
