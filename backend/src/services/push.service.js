const Expo = require('expo-server-sdk');

// Fire-and-forget Expo push delivery. Never throws — push is best-effort and
// must not break the API flows that trigger notifications.
const expo = new Expo.Expo();

const isExpoPushToken = (token) => Expo.ExpoPushToken.isValid(token);

// Send a push to all of a user's registered devices.
// recipientId: mongoose ObjectId or string
// payload: { title, body, data }
const sendPushToUser = async (recipientId, { title, body, data }) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(recipientId).select('pushTokens');
    const tokens = (user?.pushTokens || []).map((p) => p.token).filter(isExpoPushToken);

    if (tokens.length === 0) return;

    // expo-server-sdk accepts batches of up to 100
    const messages = tokens.map((token) => ({
      to: token,
      sound: 'default',
      title: title || 'IdeaConnect',
      body: body || '',
      data: data || {},
    }));

    const chunks = expo.chunkPushNotifications(messages);
    await Promise.all(
      chunks.map(async (chunk) => {
        try {
          const receipts = await expo.sendPushNotificationsAsync(chunk);
          // Drop devices that errored permanently so dead tokens get cleaned up
          receipts.forEach((receipt, i) => {
            if (receipt.status === 'error' && receipt.details?.error === 'DeviceNotRegistered') {
              removePushToken(recipientId, chunk[i].to);
            }
          });
        } catch (chunkError) {
          console.error('[push] chunk send failed:', chunkError.message);
        }
      })
    );
  } catch (error) {
    console.error('[push] dispatch failed:', error.message);
  }
};

// Best-effort removal of an invalid device token
const removePushToken = async (userId, token) => {
  try {
    await require('../models/User').updateOne(
      { _id: userId },
      { $pull: { pushTokens: { token } } }
    );
  } catch {
    /* ignore */
  }
};

module.exports = { sendPushToUser, removePushToken, isExpoPushToken };
