const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const connectDB = require('./config/db');
const path = require('path');
const cors = require('cors');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Connect Database
connectDB();

// Init Middleware
app.use(express.json());
app.use(cors());

// Define Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/contacts', require('./routes/contacts'));
app.use('/api/interactions', require('./routes/interactions'));
app.use('/api/share', require('./routes/share'));
app.use('/api/dashboard', require('./routes/dashboard'));

// Socket.IO for WebRTC signaling
const onlineUsers = new Map(); // Map of userId -> socketId

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // User authentication
  const userId = socket.handshake.auth.userId;
  if (userId) {
    onlineUsers.set(userId, socket.id);
    console.log(`User ${userId} is online`);
    
    // Broadcast online users to all clients
    io.emit('online-users', Array.from(onlineUsers.keys()));
  }

  // Handle call initiation
  socket.on('call-user', (data) => {
    const { to, from, fromName, type, offer } = data;
    const recipientSocketId = onlineUsers.get(to);
    
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('incoming-call', {
        from,
        fromName,
        type,
        offer,
      });
      console.log(`Call from ${from} to ${to}`);
    } else {
      socket.emit('user-offline', { userId: to });
    }
  });

  // Handle call acceptance
  socket.on('accept-call', (data) => {
    const { to, answer } = data;
    const callerSocketId = onlineUsers.get(to);
    
    if (callerSocketId) {
      io.to(callerSocketId).emit('call-accepted', { answer });
      console.log(`Call accepted by recipient`);
    }
  });

  // Handle call rejection
  socket.on('reject-call', (data) => {
    const { to } = data;
    const callerSocketId = onlineUsers.get(to);
    
    if (callerSocketId) {
      io.to(callerSocketId).emit('call-rejected');
      console.log(`Call rejected by recipient`);
    }
  });

  // Handle ICE candidates
  socket.on('ice-candidate', (data) => {
    const { to, candidate } = data;
    const recipientSocketId = onlineUsers.get(to);
    
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('ice-candidate', { candidate });
    }
  });

  // Handle call end
  socket.on('end-call', (data) => {
    const { to } = data;
    const recipientSocketId = onlineUsers.get(to);
    
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('call-ended');
      console.log(`Call ended`);
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    
    // Remove user from online users
    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        console.log(`User ${userId} is offline`);
        break;
      }
    }
    
    // Broadcast updated online users
    io.emit('online-users', Array.from(onlineUsers.keys()));
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => console.log(`Server started on port ${PORT}`));
