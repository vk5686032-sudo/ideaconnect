const User = require('../models/User');

// Matches "@Name" runs: starts with a letter, then letters/spaces/apostrophes/hyphens
const MENTION_REGEX = /@([A-Za-z][A-Za-z .'\-]{1,49})/g;

/**
 * Extract raw "@..." candidate strings (with trailing words) from text.
 * e.g. "ping @John Smith about this" -> ["John Smith about this"]
 */
const extractMentionCandidates = (text) => {
  const names = [];
  if (!text) return names;
  let match;
  while ((match = MENTION_REGEX.exec(text)) !== null) {
    names.push(match[1].trim());
  }
  MENTION_REGEX.lastIndex = 0;
  return names.filter(Boolean);
};

/**
 * Resolve "@Full Name" patterns in text to registered users.
 * Longest name wins ("@John Smith" matches John Smith, not John).
 * Excludes the sender; capped at `limit` users per message.
 */
const resolveMentionedUsers = async (text, { excludeIds = [], limit = 5 } = {}) => {
  const candidates = extractMentionCandidates(text);
  if (candidates.length === 0) return [];

  // Candidate pool: users whose FIRST token matches any candidate's first word
  const firstTokens = [...new Set(candidates.map((c) => c.split(/\s+/)[0]).filter(Boolean))];
  if (firstTokens.length === 0) return [];

  const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Prefix-match so first token "priya" can find a user named "Priya Sharma"
  const pool = await User.find({
    name: { $in: firstTokens.map((t) => new RegExp(`^${escapeRegex(t)}`, 'i')) },
  }).select('_id name avatar');

  const excluded = new Set(excludeIds.map((id) => id.toString()));
  const matched = new Map();

  for (const candidate of candidates) {
    const words = candidate.toLowerCase().split(/\s+/).filter(Boolean);
    for (let len = Math.min(words.length, 6); len >= 1; len--) {
      const phrase = words.slice(0, len).join(' ');
      const hit = pool.find((u) => u.name.toLowerCase() === phrase);
      if (hit && !excluded.has(hit._id.toString()) && !matched.has(hit._id.toString())) {
        matched.set(hit._id.toString(), hit);
      }
      if (hit) break;
    }
  }

  return [...matched.values()].slice(0, limit);
};

module.exports = {
  extractMentionCandidates,
  resolveMentionedUsers,
};
