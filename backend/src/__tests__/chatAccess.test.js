// IMPORTANT: dedicated test DB BEFORE requiring the app, so dotenv doesn't
// load the dev MONGODB_URI (dotenv won't override existing vars).
// Its own database: the runner executes test files concurrently, and api.test.js
// wipes the shared user collection in beforeEach.
process.env.MONGODB_URI =
  process.env.MONGODB_URI_CHATACCESS ||
  'mongodb://localhost:27017/ideaconnect_test_chataccess';
process.env.NODE_ENV = 'test';

const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');

const User = require('../models/User');
const Chat = require('../models/Chat');
const connectDB = require('../config/db');
const { isChatParticipant } = require('../services/chatAccess.service');

let userA;
let userB;
let outsider;
let chatWithBoth;
let chatWithAOnly;

const mkUser = (name, email) =>
  User.create({ name, email, password: 'password123', role: 'user' });

before(async () => {
  await connectDB();
  [userA, userB, outsider] = await Promise.all([
    mkUser('Alfa', 'alfa@test.com'),
    mkUser('Beta', 'beta@test.com'),
    mkUser('Out', 'out@test.com'),
  ]);
  chatWithBoth = await Chat.create({
    type: 'direct',
    participants: [userA._id, userB._id],
  });
  chatWithAOnly = await Chat.create({
    type: 'group',
    name: 'A only',
    participants: [userA._id],
  });
});

after(async () => {
  await Chat.deleteMany({});
  await User.deleteMany({});
  await mongoose.disconnect();
});

beforeEach(async () => {
  // Messages are mutated by the read-receipt tests; clear between cases.
  await mongoose.connection.collection('messages').deleteMany({});
});

test('a listed participant is a participant', async () => {
  assert.equal(await isChatParticipant(chatWithBoth._id, userA._id), true);
  assert.equal(await isChatParticipant(chatWithBoth._id, userB._id), true);
});

test('a non-participant is rejected', async () => {
  assert.equal(await isChatParticipant(chatWithBoth._id, outsider._id), false);
});

test('membership does not leak across chats', async () => {
  assert.equal(await isChatParticipant(chatWithAOnly._id, userB._id), false);
  assert.equal(await isChatParticipant(chatWithAOnly._id, userA._id), true);
});

test('a non-existent chat is rejected rather than throwing', async () => {
  const missing = new mongoose.Types.ObjectId();
  assert.equal(await isChatParticipant(missing, userA._id), false);
});

test('a malformed chat id is rejected rather than throwing', async () => {
  // Must not surface as an unhandled CastError to the caller.
  assert.equal(await isChatParticipant('not-an-object-id', userA._id), false);
});

test('a missing user id is rejected', async () => {
  assert.equal(await isChatParticipant(chatWithBoth._id, null), false);
  assert.equal(await isChatParticipant(chatWithBoth._id, undefined), false);
});
