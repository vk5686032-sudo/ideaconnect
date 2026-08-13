const { Server } = require('socket.io');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: [
        'http://localhost:5173',
        process.env.FRONTEND_URL,
      ].filter(Boolean),
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  require('../sockets/chat.socket')(io);

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

module.exports = { initSocket, getIO };
