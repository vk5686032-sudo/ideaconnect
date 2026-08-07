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

module.exports = {
  generateToken,
  verifyToken,
  generateVerificationToken,
  generateResetToken,
};
