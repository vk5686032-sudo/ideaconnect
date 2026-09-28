import { io } from 'socket.io-client';
import { resolveSocketUrl } from '../config/endpoints';

// undefined => connect to the page origin. See config/endpoints.js: the old
// `|| 'http://localhost:5000'` broke websockets in the Docker/CI build.
const SOCKET_URL = resolveSocketUrl(import.meta.env.VITE_SOCKET_URL);

let socket = null;

export const connectSocket = (token) => {
  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.log('[socket] connected', socket.id);
  });

  socket.on('connect_error', (err) => {
    console.warn('[socket] connection error:', err.message);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
    console.log('[socket] disconnected');
  }
};

export const getSocket = () => socket;
