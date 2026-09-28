const config = require('../config/env');

// The localhost entries are development conveniences — Vite on 5173/5174 and
// Expo web on 8081. They used to be appended unconditionally in both the REST
// CORS allowlist and the socket.io one, so a production deployment shipped
// them alongside `credentials: true`, which means any page a user happens to
// have open on those ports gets credentialed cross-origin access.
//
// This is the single source of truth for both. They used to be maintained
// separately and had already drifted apart: the socket list was missing
// 5174 and 127.0.0.1:5173, and it read process.env.FRONTEND_URL as one
// literal, so a comma-separated FRONTEND_URL silently broke websockets.
const DEV_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  // Expo web (`npm run web` in mobile/) serves from 8081, not 5173.
  'http://localhost:8081',
  'http://127.0.0.1:8081',
];

const getAllowedOrigins = () => {
  const configuredOrigins = (config.frontendUrl || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  if (config.nodeEnv === 'production') return configuredOrigins;

  return [...configuredOrigins, ...DEV_ORIGINS];
};

module.exports = { getAllowedOrigins, DEV_ORIGINS };
