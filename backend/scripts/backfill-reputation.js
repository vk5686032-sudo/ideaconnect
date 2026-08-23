// One-time backfill: compute reputation from historical activity.
//
//   node scripts/backfill-reputation.js          -> dry run (prints computed scores)
//   node scripts/backfill-reputation.js --apply  -> reset & persist scores
//
// Scheme mirrors services/reputation.service.js:
//   like received +2 · comment received +3 · reply received +1 · task completed +10

const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const Idea = require('../src/models/Idea');
const Comment = require('../src/models/Comment');
const Task = require('../src/models/Task');
const User = require('../src/models/User');

const P = { IDEA_LIKED: 2, COMMENT_RECEIVED: 3, REPLY_RECEIVED: 1, TASK_COMPLETED: 10 };

const run = async () => {
  await connectDB();
  const apply = process.argv.includes('--apply');

  const scores = new Map();
  const add = (userId, pts) => {
    if (!userId) return;
    const key = userId.toString();
    scores.set(key, (scores.get(key) || 0) + pts);
  };

  // Likes received on own ideas (self-likes excluded)
  const ideas = await Idea.find().select('author likes');
  for (const idea of ideas) {
    const realLikes = (idea.likes || []).filter(
      (id) => id && id.toString() !== idea.author?.toString()
    );
    realLikes.forEach(() => add(idea.author, P.IDEA_LIKED));
  }

  // Comments + replies
  const comments = await Comment.find({ idea: { $ne: null } }).select('author idea parent');
  const ideasById = new Map(ideas.map((i) => [i._id.toString(), i]));
  const commentsById = new Map(comments.map((c) => [c._id.toString(), c]));

  for (const c of comments) {
    const idea = ideasById.get(c.idea?.toString());
    if (!idea) continue;
    if (c.author?.toString() !== idea.author?.toString()) {
      add(idea.author, P.COMMENT_RECEIVED);
    }
    if (c.parent) {
      const parent = commentsById.get(c.parent.toString());
      if (parent && c.author?.toString() !== parent.author?.toString()) {
        add(parent.author, P.REPLY_RECEIVED);
      }
    }
  }

  // Completed assigned tasks (current state is the source of truth)
  const tasks = await Task.find({ status: 'completed' }).select('assignedTo');
  tasks.forEach((t) => t.assignedTo && add(t.assignedTo, P.TASK_COMPLETED));

  const entries = [...scores.entries()];
  console.log(`Computed reputation for ${entries.length} user(s):\n`);

  for (const [userId, score] of entries) {
    const u = await User.findById(userId).select('name email reputation');
    console.log(`  ${u ? `${u.name} <${u.email}>` : userId}: ${u?.reputation ?? 0} -> ${score}`);
  }
  if (entries.length === 0) console.log('  (no qualifying activity found)');

  if (apply) {
    await User.updateMany({}, { $set: { reputation: 0 } });
    await Promise.all(
      entries.map(([userId, score]) =>
        User.findByIdAndUpdate(userId, { $set: { reputation: score } })
      )
    );
    console.log('\nBackfill applied.');
  } else {
    console.log('\nDRY RUN - no changes made. Re-run with --apply to persist.');
  }

  await mongoose.connection.close();
  process.exit(0);
};

run();
