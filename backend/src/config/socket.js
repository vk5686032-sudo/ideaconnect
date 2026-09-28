const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const config = require('./env');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: [
        'http://localhost:5173',
        // Expo web (`npm run web` in mobile/) serves from 8081. Needed for the
        // polling transport, which a browser origin-checks like any request.
        'http://localhost:8081',
        'http://127.0.0.1:8081',
        process.env.FRONTEND_URL,
      ].filter(Boolean),
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // JWT handshake authentication — sockets without a valid token are rejected
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }
      const decoded = jwt.verify(token, config.jwtSecret);
      socket.userId = decoded.id;
      next();
    } catch (error) {
      next(new Error('Invalid or expired token'));
    }
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
