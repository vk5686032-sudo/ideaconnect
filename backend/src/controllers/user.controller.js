const User = require('../models/User');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');
const cloudinary = require('../config/cloudinary');

// Get all users (with pagination and search)
exports.getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const skill = req.query.skill;

    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { skills: { $regex: search, $options: 'i' } },
      ];
    }

    if (skill) {
      query.skills = { $in: [new RegExp(skill, 'i')] };
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    paginatedResponse(res, 200, 'Users retrieved successfully', users, page, limit, total);
  } catch (error) {
    next(error);
  }
};

// Get user by ID
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('ideasCreated')
      .populate('projectsJoined');

    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    successResponse(res, 200, 'User retrieved successfully', user);
  } catch (error) {
    next(error);
  }
};

// Update profile
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, bio, skills, interests, education, experience, socialLinks } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;
    if (skills) updateData.skills = skills;
    if (interests) updateData.interests = interests;
    if (education) updateData.education = education;
    if (experience) updateData.experience = experience;
    if (socialLinks) updateData.socialLinks = socialLinks;

    const user = await User.findByIdAndUpdate(req.user._id, updateData, {
      new: true,
      runValidators: true,
    }).select('-password');

    successResponse(res, 200, 'Profile updated successfully', user);
  } catch (error) {
    next(error);
  }
};

// Update avatar
exports.updateAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return errorResponse(res, 400, 'Please upload an image');
    }

    const user = await User.findById(req.user._id);

    // Delete old avatar from cloudinary
    if (user.avatar && user.avatar.public_id) {
      await cloudinary.uploader.destroy(user.avatar.public_id);
    }

    // Upload new avatar
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'ideaconnect/avatars' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(req.file.buffer);
    });

    user.avatar = {
      public_id: result.public_id,
      url: result.secure_url,
    };
    await user.save();

    successResponse(res, 200, 'Avatar updated successfully', { avatar: user.avatar });
  } catch (error) {
    next(error);
  }
};

// Change password
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return errorResponse(res, 401, 'Current password is incorrect');
    }

    user.password = newPassword;
    await user.save();

    successResponse(res, 200, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
};

// Delete account
exports.deleteAccount = async (req, res, next) => {
  try {
    const { password } = req.body;

    const user = await User.findById(req.user._id).select('+password');

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return errorResponse(res, 401, 'Password is incorrect');
    }

    // Delete avatar from cloudinary
    if (user.avatar && user.avatar.public_id) {
      await cloudinary.uploader.destroy(user.avatar.public_id);
    }

    await user.deleteOne();

    successResponse(res, 200, 'Account deleted successfully');
  } catch (error) {
    next(error);
  }
};

// Get user stats
exports.getUserStats = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    const stats = {
      ideasCount: user.ideasCreated.length,
      projectsCount: user.projectsJoined.length,
      reputation: user.reputation,
    };

    successResponse(res, 200, 'Stats retrieved successfully', stats);
  } catch (error) {
    next(error);
  }
};

// Search users by skills
exports.searchBySkills = async (req, res, next) => {
  try {
    const { skills } = req.query;

    if (!skills) {
      return errorResponse(res, 400, 'Please provide skills to search');
    }

    const skillsArray = skills.split(',').map((s) => s.trim());

    const users = await User.find({
      skills: { $in: skillsArray.map((s) => new RegExp(s, 'i')) },
    }).select('-password');

    successResponse(res, 200, 'Users found', users);
  } catch (error) {
    next(error);
  }
};
