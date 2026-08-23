const User = require('../models/User');

// Point values for reputation-earning actions.
// Toggles are symmetric: reversing an action reverses the points.
const POINTS = {
  IDEA_LIKED: 2,          // someone likes your idea
  COMMENT_RECEIVED: 3,    // someone comments on your idea
  REPLY_RECEIVED: 1,      // someone replies to your comment
  MENTOR_REVIEW_GIVEN: 5, // you submit a mentor review on someone's idea
  TASK_COMPLETED: 10,     // an assigned task you own is marked completed
};

// Atomic reputation delta. Never throws — reputation must not break flows.
const award = async (userId, delta) => {
  try {
    if (!userId || !delta) return;
    await User.findByIdAndUpdate(userId, { $inc: { reputation: delta } });
  } catch (error) {
    console.error('[reputation] award failed:', error.message);
  }
};

module.exports = { award, POINTS };
