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

// How long a rotated-out token's hash is kept so a replay can be recognised.
// Long enough to cover a token that leaked and got used the same day, short
// enough that the retired hashes are not a growing table.
const REUSE_DETECTION_WINDOW_MS = 24 * 60 * 60 * 1000;

// Issue a refresh token: stores only its hash, keeps at most 5 live devices
const issueRefreshToken = async (user) => {
  const now = Date.now();
  const refreshToken = generateRefreshToken();

  // Drop live tokens that have expired, and retired ones we no longer need to
  // recognise. Retired hashes must survive the rotation window — pruning them
  // immediately would leave a replay with nothing to match against, which is
  // the whole problem this is solving. Only *live* tokens count toward the
  // device cap, otherwise a client refreshing every 15 minutes would age
  // itself out of its own account within an hour.
  user.refreshTokens = user.refreshTokens.filter((t) => {
    if (t.revokedAt) return now - new Date(t.revokedAt).getTime() < REUSE_DETECTION_WINDOW_MS;
    return new Date(t.expiresAt).getTime() > now;
  });

  user.refreshTokens.push({
    tokenHash: hashToken(refreshToken),
    expiresAt: new Date(now + config.refreshTokenExpireDays * 24 * 60 * 60 * 1000),
  });

  // Cap concurrent device sessions. The array is append-ordered, so shift()
  // drops the oldest, which is the one most likely to be retired.
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
    // Looked up by hash alone, ignoring expiry, so that a token which was
    // rotated out is still findable. If it is not in here at all, the caller
    // simply made it up and there is nothing to revoke.
    const user = await User.findOne({ 'refreshTokens.tokenHash': tokenHash });

    if (!user) {
      return errorResponse(res, 401, 'Invalid or expired refresh token');
    }

    const presented = user.refreshTokens.find((t) => t.tokenHash === tokenHash);

    // Reuse of a token that was already spent. Either the token leaked or the
    // client is replaying, and we cannot tell which — so every session for the
    // account dies and both parties re-authenticate. Keeping the retired hash
    // is what makes this detectable.
    if (presented.revokedAt) {
      user.refreshTokens = [];
      await user.save();
      return errorResponse(
        res,
        401,
        'This session was already used. All sessions have been signed out — please sign in again.'
      );
    }

    if (new Date(presented.expiresAt) <= new Date()) {
      return errorResponse(res, 401, 'Invalid or expired refresh token');
    }

    if (user.isActive === false) {
      // Banned/deactivated users lose all sessions
      user.refreshTokens = [];
      await user.save();
      return errorResponse(res, 403, 'Your account has been suspended. Contact support.');
    }

    // Rotation: retire the used token rather than delete it, issue a fresh pair
    presented.revokedAt = new Date();
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
//
// Always the same answer, whether or not the address is registered. This used
// to 404 with "User not found", which made the reset form an enumeration
// oracle — one request per guess tells you which addresses have accounts.
// The /auth/forgot-password OpenAPI entry already documented the intent.
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Same wording in every branch, including the success one below.
    const generic = 'If an account exists for that email, a reset link has been sent.';

    const user = await User.findOne({ email });
    if (!user) {
      return successResponse(res, 200, generic);
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
      // Logged, not surfaced. Returning 500 here would hand the caller an
      // oracle for "this address exists but our mail is broken".
      console.error('Email error:', emailError);
    }

    successResponse(res, 200, generic);
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
//
// Same non-enumeration rule as forgotPassword: a 404 here, or the 400
// "Email already verified", tells an attacker which addresses are registered
// and which are already confirmed.
exports.resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;

    const generic = 'If an account exists for that email, a verification link has been sent.';

    const user = await User.findOne({ email });
    if (!user || user.isVerified) {
      return successResponse(res, 200, generic);
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

    successResponse(res, 200, generic);
  } catch (error) {
    next(error);
  }
};
