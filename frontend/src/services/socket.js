import { io } from 'socket.io-client';
import { resolveSocketUrl } from '../config/endpoints';

// undefined => connect to the page origin. See config/endpoints.js: the old
// `|| 'http://localhost:5000'` broke websockets in the Docker/CI build.
const SOCKET_URL = resolveSocketUrl(import.meta.env.VITE_SOCKET_URL);

let socket = null;

// The backend reads socket.userId off the handshake, so a socket that connects
// with a dead token is useless and cannot be rescued later — it has to
// reconnect. "Invalid or expired token" means exactly that.
const AUTH_ERROR = /invalid or expired token/i;

const attachHandlers = (s) => {
  s.on('connect', () => {
    console.log('[socket] connected', s.id);
  });

  s.on('connect_error', (err) => {
    console.warn('[socket] connection error:', err.message);
    if (AUTH_ERROR.test(err.message)) {
      // Stop retrying against a token the server has already rejected. The
      // axios interceptor is about to renew it and the auth store will hand us
      // a fresh one, which re-runs this hook's effect and reconnects. Retrying
      // the same dead token just burns the attempts before that happens.
      s.disconnect();
    }
  });

  return s;
};

export const connectSocket = (token) => {
  if (socket?.connected) return socket;

  // A socket left over from a failed attempt still holds the token it was
  // built with. Updating its auth and reconnecting is what lets a renewed
  // token take effect; building a second socket while the first lingers just
  // leaks it and doubles the connection attempts.
  if (socket) {
    socket.auth = { token };
    socket.removeAllListeners();
    socket.connect();
    return attachHandlers(socket);
  }

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    // Generous, with a backoff ceiling: the first attempt can land while the
    // access token is still expired and the interceptor is mid-refresh, so the
    // socket needs to still be trying a few seconds later. Handing up after 5
    // fast retries left every realtime feature dead for a user returning to an
    // idle tab, with only a console warning to show for it.
    reconnectionAttempts: 12,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
  });

  return attachHandlers(socket);
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