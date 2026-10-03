// IMPORTANT: dedicated test DB BEFORE requiring the app, same as socketAuth.test.js.
// The runner executes test files concurrently, and other suites wipe the shared
// user collection in beforeEach.
process.env.MONGODB_URI =
  process.env.MONGODB_URI_GROUPNAME ||
  'mongodb://localhost:27017/ideaconnect_test_groupname';
process.env.NODE_ENV = 'test';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');

const request = require('supertest');
const app = require('../app');
const User = require('../models/User');
const Chat = require('../models/Chat');

/**
 * Regression: `POST /chats/group` had no validation at all -- it was the only
 * chat write with no `validate()` middleware and no controller check. `name` is
 * optional on the Chat model, so a nameless request succeeded and produced an
 * unnameable team. The only thing preventing it was the web form's own
 * `if (!form.name.trim())` guard, which any other API client bypasses -- and one
 * such team was actually created during the acceptance sweep.
 */

let owner;
let token;

const post = (body) =>
  request(app)
    .post('/api/v1/chats/group')
    .set('Authorization', `Bearer ${token}`)
    .send(body);

before(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  owner = await User.create({
    name: 'Group Owner',
    email: `group-owner-${Date.now()}@example.com`,
    password: 'password123',
  });
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: owner.email, password: 'password123' });
  token = res.body.data.token;
});

after(async () => {
  await Chat.deleteMany({ creator: owner._id });
  await User.deleteMany({ _id: owner._id });
  await mongoose.disconnect();
});

test('rejects a missing name', async () => {
  const res = await post({ description: 'no name given' });
  assert.equal(res.status, 400);
  assert.equal(res.body.message, 'Team name is required');
});

test('rejects an empty name', async () => {
  const res = await post({ name: '' });
  assert.equal(res.status, 400);
});

test('rejects a whitespace-only name', async () => {
  // Trimmed before the check, so '   ' is not a name.
  const res = await post({ name: '   ' });
  assert.equal(res.status, 400);
  assert.equal(res.body.message, 'Team name is required');
});

test('rejects a null name', async () => {
  const res = await post({ name: null });
  assert.equal(res.status, 400);
});

test('creates the team and trims the stored name', async () => {
  const res = await post({ name: '  Trimmed Team  ', members: [] });
  assert.equal(res.status, 201);
  assert.equal(res.body.data.name, 'Trimmed Team');
  assert.equal(res.body.data.type, 'group');
});

test('always includes the creator as a participant and admin', async () => {
  const res = await post({ name: 'Solo Team', members: [] });
  assert.ok(res.body.data.participants.map((p) => String(p._id)).includes(String(owner._id)));
  assert.ok(res.body.data.admins.map((a) => String(a._id)).includes(String(owner._id)));
});
