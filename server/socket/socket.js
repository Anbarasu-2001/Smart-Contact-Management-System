const onlineUsers = {};

module.exports = (io) => {
  io.on('connection', (socket) => {
    // JOIN USER
    socket.on('join', (userId) => {
      onlineUsers[userId] = socket.id;
    });

    // SEND MESSAGE
    socket.on('sendMessage', (data) => {
      const targetId = data.receiverId || data.to;
      const receiverSocket = onlineUsers[targetId];
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
        io.to(callerSocket).emit('callAccepted', data);
      }
    });
    
    // ANSWER CALL
    socket.on('answerCall', (data) => {
      const callerSocket = onlineUsers[data.to];
      if (callerSocket) {
        io.to(callerSocket).emit('callAnswered', data);
      }
    });

    // ICE CANDIDATE
    socket.on('iceCandidate', (data) => {
      const receiverSocket = onlineUsers[data.to];
      if (receiverSocket) {
        io.to(receiverSocket).emit('iceCandidate', data);
      }
    });

    // REJECT CALL
    socket.on('reject-call', (data) => {
      const callerSocket = onlineUsers[data.to];
      if (callerSocket) {
        io.to(callerSocket).emit('call-rejected', data);
      }
    });

    // END CALL
    socket.on('endCall', (data) => {
      const receiverSocket = onlineUsers[data.to];
      if (receiverSocket) {
        io.to(receiverSocket).emit('callEnded', data);
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