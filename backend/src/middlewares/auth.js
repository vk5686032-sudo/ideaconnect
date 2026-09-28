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

// Attaches req.user when a valid token is present, but never rejects.
// Used on public detail routes that need visibility checks.
exports.optionalAuth = async (req, res, next) => {
  try {
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, config.jwtSecret);
      const user = await User.findById(decoded.id);
      if (user && user.isActive !== false) {
        req.user = user;
      }
    }
  } catch (error) {
    // Invalid/expired token — continue anonymously
  }
  next();
};

// EMAIL VERIFICATION.
//
// This was a blanket no-op with the real check commented out, so unverified
// accounts could write in production as well as in dev. The 16 write routes
// that reference it (ideas, projects, tasks, ...) are the ones this covers.
//
// Bypassed outside production so local work is not blocked. Before deploying
// with NODE_ENV=production, run the one-time migration, otherwise every
// existing account is locked out (isVerified defaults to false):
//
//   node scripts/backfill-verified.js --apply
exports.checkVerification = (req, res, next) => {
  if (config.nodeEnv === 'production' && !req.user.isVerified) {
    return errorResponse(res, 403, 'Please verify your email to access this feature');
  }
  next();
};

// Only approved mentors (admins included) may perform mentor-only actions
exports.isApprovedMentor = (req, res, next) => {
  const isMentor = req.user.role === 'mentor' && req.user.isMentorApproved;
  if (!isMentor && req.user.role !== 'admin') {
    return errorResponse(res, 403, 'Only approved mentors can perform this action');
  }
  next();
};
