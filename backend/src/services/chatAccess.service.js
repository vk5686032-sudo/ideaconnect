const mongoose = require('mongoose');
const Chat = require('../models/Chat');

/**
 * Is this user a participant in this chat?
 *
 * The single source of truth for chat membership. HTTP controllers and the
 * Socket.io handlers must both go through here, otherwise the socket path
 * bypasses the authorization the REST path enforces.
 *
 * Never throws: an unknown or malformed id is simply "not a participant".
 * Callers treat false as "deny", so a bad id must not become a 500.
 */
const isChatParticipant = async (chatId, userId) => {
  if (!chatId || !userId) return false;
  if (!mongoose.isValidObjectId(chatId) || !mongoose.isValidObjectId(userId)) {
    return false;
  }

  try {
    const chat = await Chat.exists({ _id: chatId, participants: userId });
    return Boolean(chat);
  } catch {
    return false;
  }
};

/**
 * Which of `candidateIds` share at least one chat with `userId`?
 *
 * Used to scope presence: a user should only learn that people they actually
 * correspond with are online, not the whole platform's user list.
 *
 * Returns a Set of id strings. Never throws.
 */
const getChatPeers = async (userId, candidateIds) => {
  const result = new Set();
  if (!userId || !Array.isArray(candidateIds) || candidateIds.length === 0) {
    return result;
  }
  if (!mongoose.isValidObjectId(userId)) return result;

  const candidates = candidateIds.filter((id) => mongoose.isValidObjectId(id));
  if (candidates.length === 0) return result;

  try {
    const chats = await Chat.find(
      { participants: userId },
      { participants: 1 }
    ).lean();

    const allowed = new Set([userId.toString()]);
    for (const chat of chats) {
      for (const participant of chat.participants) {
        allowed.add(participant.toString());
      }
    }
    for (const id of candidates) {
      if (allowed.has(id.toString())) result.add(id.toString());
    }
  } catch {
    return result;
  }

  return result;
};

module.exports = { isChatParticipant, getChatPeers };
