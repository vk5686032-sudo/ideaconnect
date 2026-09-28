// IMPORTANT: dedicated test DB before requiring the app, so dotenv never
// loads the dev MONGODB_URI.
process.env.MONGODB_URI =
  process.env.MONGODB_URI_REUSE || 'mongodb://localhost:27017/ideaconnect_test_reuse';
process.env.NODE_ENV = 'test';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');

const app = require('../app');
const User = require('../models/User');
const connectDB = require('../config/db');

let server;
let request;

before(async () => {
  await connectDB();
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  request = require('supertest')(`http://localhost:${server.address().port}`);
});

after(async () => {
  await User.deleteMany({});
  await mongoose.disconnect();
  server.close();
});

const signUp = async (email) => {
  const res = await request.post('/api/auth/register').send({
    name: 'Token Owner',
    email,
    password: 'password123',
  });
  assert.equal(res.status, 201, 'register should succeed');
  return res.body.data.refreshToken;
};

test('rotating a refresh token still works normally', async () => {
  const token = await signUp('rotate@example.com');
  const res = await request.post('/api/auth/refresh').send({ refreshToken: token });
  assert.equal(res.status, 200);
  assert.ok(res.body.data.refreshToken, 'a new refresh token is issued');
});

test('a rotated-out token is rejected', async () => {
  const token = await signUp('rotated-out@example.com');
  await request.post('/api/auth/refresh').send({ refreshToken: token });

  const replay = await request.post('/api/auth/refresh').send({ refreshToken: token });
  assert.equal(replay.status, 401, 'the used token must not work twice');
});

test('replaying a rotated-out token revokes every session', async () => {
  // Rotation deleted the old entry outright, so a stolen token being replayed
  // was indistinguishable from random garbage: the 401 looked like a bad
  // guess and the other live sessions kept working. A replay is the signal
  // that a token leaked, so the whole family has to die.
  const stolen = await signUp('replay@example.com');

  // The legitimate client rotates first, which is the realistic ordering:
  // the attacker is holding a copy of the token the victim just used.
  const rotated = await request.post('/api/auth/refresh').send({ refreshToken: stolen });
  assert.equal(rotated.status, 200);
  const liveToken = rotated.body.data.refreshToken;

  // The attacker replays the old copy.
  const replay = await request.post('/api/auth/refresh').send({ refreshToken: stolen });
  assert.equal(replay.status, 401);

  // ...and the legitimate client is logged out too, because we cannot tell
  // which of the two is the thief. That is the point.
  const after = await request.post('/api/auth/refresh').send({ refreshToken: liveToken });
  assert.equal(after.status, 401, 'all sessions must be revoked on reuse');
});

test('a never-issued token does not revoke anything', async () => {
  // Garbage must not log the caller out of their real session, otherwise the
  // endpoint becomes a trivial denial-of-service against other devices.
  const live = await signUp('garbage@example.com');

  const junk = await request
    .post('/api/auth/refresh')
    .send({ refreshToken: 'not-a-real-token-at-all' });
  assert.equal(junk.status, 401);

  const stillGood = await request.post('/api/auth/refresh').send({ refreshToken: live });
  assert.equal(stillGood.status, 200, 'a bogus token must not kill real sessions');
});

test('rotated entries do not consume the 5-device cap', async () => {
  const token = await signUp('cap@example.com');
  // Rotate several times; each rotation retires one entry.
  let current = token;
  for (let i = 0; i < 6; i += 1) {
    const res = await request.post('/api/auth/refresh').send({ refreshToken: current });
    assert.equal(res.status, 200, `rotation ${i} should succeed`);
    current = res.body.data.refreshToken;
  }

  const user = await User.findOne({ email: 'cap@example.com' });
  const live = user.refreshTokens.filter((t) => !t.revokedAt);
  assert.ok(live.length <= 5, `expected at most 5 live sessions, got ${live.length}`);
  assert.equal(live.length, 1, 'a single device rotating should hold exactly one live token');
});
