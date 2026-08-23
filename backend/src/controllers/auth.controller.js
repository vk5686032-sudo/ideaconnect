const User = require('../models/User');
const Idea = require('../models/Idea');
const { successResponse, errorResponse } = require('../utils/response');
const {
  generateToken,
  generateVerificationToken,
  generateResetToken,
  generateRefreshToken,
  hashToken,
} = require('../utils/jwt');
const emailService = require('../services/email.service');
const crypto = require('crypto');
const config = require('../config/env');

// Issue a refresh token: stores only its hash, keeps at most 5 devices
const issueRefreshToken = async (user) => {
  const refreshToken = generateRefreshToken();
  user.refreshTokens.push({
    tokenHash: hashToken(refreshToken),
    expiresAt: new Date(Date.now() + config.refreshTokenExpireDays * 24 * 60 * 60 * 1000),
  });

  // Cap concurrent device sessions
  while (user.refreshTokens.length > 5) {
    user.refreshTokens.shift();
  }

  await user.save();
  return refreshToken;
};

const buildAuthPayload = (user, accessToken, refreshToken) => ({
  user: {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    isVerified: user.isVerified,
    isMentorApproved: user.isMentorApproved,
    reputation: user.reputation,
  },
  token: accessToken,
  ...(refreshToken ? { refreshToken } : {}),
});

// Register user
exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return errorResponse(res, 400, 'Email already registered');
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
    });

    // Generate verification token
    const verificationToken = generateVerificationToken();
    user.verificationToken = verificationToken;
    user.verificationExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    await user.save();

    // Send verification email
    try {
      await emailService.sendVerificationEmail(email, verificationToken, name);
    } catch (emailError) {
      console.error('Email error:', emailError);
    }

    // Generate JWT token
    const token = generateToken(user._id);
    const refreshToken = await issueRefreshToken(user);

    successResponse(
      res,
      201,
      'Registration successful. Please check your email for verification.',
      buildAuthPayload(user, token, refreshToken)
    );
  } catch (error) {
    next(error);
  }
};

// Login user
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return errorResponse(res, 401, 'Invalid credentials');
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return errorResponse(res, 401, 'Invalid credentials');
    }

    // Generate tokens
    const token = generateToken(user._id);
    const refreshToken = await issueRefreshToken(user);

    successResponse(res, 200, 'Login successful', buildAuthPayload(user, token, refreshToken));
  } catch (error) {
    next(error);
  }
};

// Refresh access token (rotates the refresh token on every use)
exports.refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return errorResponse(res, 400, 'refreshToken is required');
    }

    const tokenHash = hashToken(refreshToken);
    const user = await User.findOne({
      'refreshTokens.tokenHash': tokenHash,
      'refreshTokens.expiresAt': { $gt: new Date() },
    });

    if (!user) {
      return errorResponse(res, 401, 'Invalid or expired refresh token');
    }

    if (user.isActive === false) {
      // Banned/deactivated users lose all sessions
      user.refreshTokens = [];
      await user.save();
      return errorResponse(res, 403, 'Your account has been suspended. Contact support.');
    }

    // Rotation: revoke the used token, issue a fresh pair
    user.refreshTokens = user.refreshTokens.filter(
      (t) => t.tokenHash !== tokenHash
    );
    const accessToken = generateToken(user._id);
    const newRefreshToken = await issueRefreshToken(user);

    successResponse(res, 200, 'Token refreshed', buildAuthPayload(user, accessToken, newRefreshToken));
  } catch (error) {
    next(error);
  }
};

// Logout current device: revoke the provided refresh token
exports.logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      const tokenHash = hashToken(refreshToken);
      await User.updateOne(
        { _id: req.user._id },
        { $pull: { refreshTokens: { tokenHash } } }
      );
    }
    successResponse(res, 200, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};

// Logout everywhere: revoke all refresh tokens for this account
exports.logoutAll = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { $set: { refreshTokens: [] } });
    successResponse(res, 200, 'Logged out from all devices');
  } catch (error) {
    next(error);
  }
};

// Get current user
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('ideasCreated')
      .populate('projectsJoined');

    successResponse(res, 200, 'User retrieved successfully', user);
  } catch (error) {
    next(error);
  }
};

// Verify email
exports.verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      verificationToken: token,
      verificationExpire: { $gt: Date.now() },
    });

    if (!user) {
      return errorResponse(res, 400, 'Invalid or expired verification token');
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationExpire = undefined;
    await user.save();

    successResponse(res, 200, 'Email verified successfully');
  } catch (error) {
    next(error);
  }
};

// Forgot password
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    // Generate reset token
    const resetToken = generateResetToken();
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    // Send reset email
    try {
      await emailService.sendResetEmail(email, resetToken, user.name);
    } catch (emailError) {
      console.error('Email error:', emailError);
      return errorResponse(res, 500, 'Error sending reset email');
    }

    successResponse(res, 200, 'Password reset email sent');
  } catch (error) {
    next(error);
  }
};

// Reset password
exports.resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return errorResponse(res, 400, 'Invalid or expired reset token');
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    // Password change invalidates all existing sessions
    user.refreshTokens = [];
    await user.save();

    const jwtToken = generateToken(user._id);
    const refreshToken = await issueRefreshToken(user);

    successResponse(res, 200, 'Password reset successful', buildAuthPayload(user, jwtToken, refreshToken));
  } catch (error) {
    next(error);
  }
};

// Resend verification
exports.resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    if (user.isVerified) {
      return errorResponse(res, 400, 'Email already verified');
    }

    const verificationToken = generateVerificationToken();
    user.verificationToken = verificationToken;
    user.verificationExpire = Date.now() + 24 * 60 * 60 * 1000;
    await user.save();

    try {
      await emailService.sendVerificationEmail(email, verificationToken, user.name);
    } catch (emailError) {
      console.error('Email error:', emailError);
    }

    successResponse(res, 200, 'Verification email sent');
  } catch (error) {
    next(error);
  }
};
