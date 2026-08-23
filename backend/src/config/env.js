const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

module.exports = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  // Short-lived access token; renewed silently via the refresh token
  jwtExpire: process.env.JWT_EXPIRE || '15m',
  refreshTokenExpireDays: Number(process.env.REFRESH_TOKEN_EXPIRE_DAYS) || 30,
  // API rate limit: requests per window per IP. Defaults are generous for a
  // demo/LAN app — the frontend fires several calls per page load and polls
  // notifications. Set RATE_LIMIT_MAX to tune for production.
  rateLimit: {
    max: Number(process.env.RATE_LIMIT_MAX) || 600,
    windowMs: 15 * 60 * 1000,
  },
  smtp: {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
  ai: {
    provider: process.env.AI_PROVIDER || 'openai',
    openaiKey: process.env.OPENAI_API_KEY,
    geminiKey: process.env.GEMINI_API_KEY,
  },
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
};
