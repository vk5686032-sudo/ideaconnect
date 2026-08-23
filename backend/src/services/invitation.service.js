const Invitation = require('../models/Invitation');

// Flip pending invitations past their expiresAt to 'expired'.
// Cheap single updateMany — safe to run on a schedule.
const expireStale = async () => {
  try {
    const result = await Invitation.updateMany(
      { status: 'pending', expiresAt: { $lt: new Date() } },
      { $set: { status: 'expired' } }
    );
    if (result.modifiedCount > 0) {
      console.log(`[invitation-expiry] Marked ${result.modifiedCount} stale invitation(s) as expired`);
    }
    return result.modifiedCount;
  } catch (error) {
    console.error('[invitation-expiry] Failed to expire stale invitations:', error.message);
    return 0;
  }
};

module.exports = { expireStale };
