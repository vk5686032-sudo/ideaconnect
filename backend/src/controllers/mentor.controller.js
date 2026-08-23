const User = require('../models/User');
const Invitation = require('../models/Invitation');
const Chat = require('../models/Chat');
const { successResponse, errorResponse } = require('../utils/response');
const notificationService = require('../services/notification.service');

// List approved mentors (public)
exports.getMentors = async (req, res, next) => {
  try {
    const { search } = req.query;

    const query = { role: 'mentor', isMentorApproved: true, isActive: { $ne: false } };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { bio: { $regex: search, $options: 'i' } },
        { skills: { $regex: search, $options: 'i' } },
      ];
    }

    const mentors = await User.find(query)
      .select('name role isMentorApproved avatar bio skills interests reputation createdAt')
      .sort({ reputation: -1, createdAt: -1 });

    successResponse(res, 200, 'Mentors retrieved successfully', mentors);
  } catch (error) {
    next(error);
  }
};

// Send a mentorship request to an approved mentor
exports.sendMentorRequest = async (req, res, next) => {
  try {
    const { message } = req.body;

    const mentor = await User.findById(req.params.id);
    if (!mentor) {
      return errorResponse(res, 404, 'User not found');
    }

    const isApprovedMentor = mentor.role === 'mentor' && mentor.isMentorApproved;
    if (!isApprovedMentor && mentor.role !== 'admin') {
      return errorResponse(res, 400, 'This user is not an approved mentor');
    }

    if (mentor._id.toString() === req.user._id.toString()) {
      return errorResponse(res, 400, 'You cannot request mentorship from yourself');
    }

    // Prevent duplicate pending requests to the same mentor
    const existingRequest = await Invitation.findOne({
      sender: req.user._id,
      recipient: mentor._id,
      type: 'mentor-request',
      status: 'pending',
    });

    if (existingRequest) {
      return errorResponse(res, 400, 'You already have a pending request with this mentor');
    }

    const invitation = await Invitation.create({
      sender: req.user._id,
      recipient: mentor._id,
      type: 'mentor-request',
      message: message || '',
    });

    await notificationService.create({
      recipient: mentor._id,
      sender: req.user._id,
      type: 'mentor-request',
      title: 'New Mentorship Request',
      message: `${req.user.name} requested your mentorship`,
      relatedInvitation: invitation._id,
      actionUrl: '/dashboard',
    });

    successResponse(res, 201, 'Mentorship request sent successfully', invitation);
  } catch (error) {
    next(error);
  }
};

// Mentorship requests I sent
exports.getMyMentorRequests = async (req, res, next) => {
  try {
    const requests = await Invitation.find({
      sender: req.user._id,
      type: 'mentor-request',
    })
      .populate('recipient', 'name avatar')
      .sort({ createdAt: -1 });

    successResponse(res, 200, 'My mentorship requests retrieved successfully', requests);
  } catch (error) {
    next(error);
  }
};

// Incoming mentorship requests for the current mentor
exports.getIncomingMentorRequests = async (req, res, next) => {
  try {
    const requests = await Invitation.find({
      recipient: req.user._id,
      type: 'mentor-request',
    })
      .populate('sender', 'name avatar bio skills role')
      .sort({ createdAt: -1 });

    successResponse(res, 200, 'Incoming mentorship requests retrieved successfully', requests);
  } catch (error) {
    next(error);
  }
};

// Accept or reject a mentorship request (mentor only)
exports.handleMentorRequest = async (req, res, next) => {
  try {
    const { requestId, action } = req.params; // action: 'accept' or 'reject'

    const invitation = await Invitation.findOne({
      _id: requestId,
      type: 'mentor-request',
    }).populate('sender', 'name');

    if (!invitation) {
      return errorResponse(res, 404, 'Request not found');
    }

    if (invitation.recipient.toString() !== req.user._id.toString()) {
      return errorResponse(res, 403, 'Not authorized to handle this request');
    }

    if (invitation.status !== 'pending') {
      return errorResponse(res, 400, 'This request has already been handled');
    }

    // Lazy expiry — a stale pending request expires on touch
    if (invitation.expiresAt && invitation.expiresAt < new Date()) {
      invitation.status = 'expired';
      await invitation.save();
      return errorResponse(res, 400, 'This request has expired');
    }

    if (action === 'accept') {
      invitation.status = 'accepted';

      // Open (or reuse) a direct chat so both sides can start talking
      let chat = await Chat.findOne({
        type: 'direct',
        participants: { $all: [invitation.sender._id, req.user._id] },
      });

      if (!chat) {
        chat = await Chat.create({
          type: 'direct',
          participants: [invitation.sender._id, req.user._id],
        });
      }

      await notificationService.create({
        recipient: invitation.sender._id,
        sender: req.user._id,
        type: 'mentor-request-accepted',
        title: 'Mentorship Request Accepted',
        message: `${req.user.name} accepted your mentorship request`,
        relatedInvitation: invitation._id,
        actionUrl: `/chat/${chat._id}`,
      });
    } else if (action === 'reject') {
      invitation.status = 'rejected';

      await notificationService.create({
        recipient: invitation.sender._id,
        sender: req.user._id,
        type: 'mentor-request-rejected',
        title: 'Mentorship Request Declined',
        message: `${req.user.name} declined your mentorship request`,
        relatedInvitation: invitation._id,
        actionUrl: '/teams',
      });
    } else {
      return errorResponse(res, 400, 'Invalid action. Use "accept" or "reject"');
    }

    await invitation.save();

    successResponse(res, 200, `Request ${action}ed successfully`, invitation);
  } catch (error) {
    next(error);
  }
};
