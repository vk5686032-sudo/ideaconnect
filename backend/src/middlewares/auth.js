const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/env');
const { errorResponse } = require('../utils/response');

exports.protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return errorResponse(res, 401, 'Not authorized to access this route');
    }

    // Verify token
    const decoded = jwt.verify(token, config.jwtSecret);

    // Get user from token
    const user = await User.findById(decoded.id);

    if (!user) {
      return errorResponse(res, 401, 'User not found');
    }

    // Block banned/deactivated users
    if (user.isActive === false) {
      return errorResponse(res, 403, 'Your account has been suspended. Contact support.');
    }

    req.user = user;
    next();
  } catch (error) {
    return errorResponse(res, 401, 'Not authorized to access this route');
  }
};

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return errorResponse(res, 403, 'Not authorized to perform this action');
    }
    next();
  };
};

exports.checkVerification = (req, res, next) => {
  if (!req.user.isVerified) {
    return errorResponse(res, 403, 'Please verify your email to access this feature');
  }
  next();
};
