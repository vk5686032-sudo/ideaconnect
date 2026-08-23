const jwt = require('jsonwebtoken');
const config = require('../config/env');

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, config.jwtSecret, {
    expiresIn: config.jwtExpire,
  });
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.jwtSecret);
  } catch (error) {
    return null;
  }
};

const generateVerificationToken = () => {
  const token = require('crypto').randomBytes(32).toString('hex');
  return token;
};

const generateResetToken = () => {
  const token = require('crypto').randomBytes(32).toString('hex');
  return token;
};

// Opaque refresh token — only its sha256 hash is stored server-side
const generateRefreshToken = () => {
  return require('crypto').randomBytes(48).toString('hex');
};

const hashToken = (token) => {
  return require('crypto').createHash('sha256').update(token).digest('hex');
};

module.exports = {
  generateToken,
  verifyToken,
  generateVerificationToken,
  generateResetToken,
  generateRefreshToken,
  hashToken,
};
