const onlineUsers = {};

module.exports = (io) => {
  io.on('connection', (socket) => {
    // JOIN USER
    socket.on('join', (userId) => {
      onlineUsers[userId] = socket.id;
    });

    // SEND MESSAGE
    socket.on('sendMessage', (data) => {
      const receiverSocket = onlineUsers[data.receiverId];
      if (receiverSocket) {
        io.to(receiverSocket).emit('receiveMessage', data);
      }
    });

    // CALL USER
    socket.on('callUser', (data) => {
      const receiverSocket = onlineUsers[data.to];
      if (receiverSocket) {
        io.to(receiverSocket).emit('incomingCall', data);
      }
    });

    // ACCEPT CALL
    socket.on('acceptCall', (data) => {
      const callerSocket = onlineUsers[data.to];
      if (callerSocket) {
        io.to(callerSocket).emit('callAccepted');
      }
    });

    // DISCONNECT
    socket.on('disconnect', () => {
      for (let userId in onlineUsers) {
        if (onlineUsers[userId] === socket.id) {
          delete onlineUsers[userId];
        }
      }
    });
  });
};