const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const config = require('./env');
const { getAllowedOrigins } = require('../utils/origins');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      // Same allowlist as the REST layer. This used to be a separate hardcoded
      // array, so a comma-separated FRONTEND_URL worked for REST but silently
      // broke websockets, and the localhost dev origins leaked into production.
      origin: getAllowedOrigins(),
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
