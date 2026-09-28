// IMPORTANT: dedicated test DB before requiring the app, so dotenv never
// loads the dev MONGODB_URI.
process.env.MONGODB_URI =
  process.env.MONGODB_URI_ENUM || 'mongodb://localhost:27017/ideaconnect_test_enum';
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

const realUser = async () => {
  await request.post('/api/auth/register').send({
    name: 'Real Person',
    email: 'real.person@example.com',
    password: 'password123',
  });
};

// These endpoints used to answer 404 "User not found" for an unknown address
// and 200 for a known one, which turns them into an account-enumeration
// oracle: ask the form whether an address is registered, one request per try.
// The OpenAPI spec for /auth/forgot-password already promised the opposite.

test('forgot-password gives the same answer for an unknown address', async () => {
  const res = await request
    .post('/api/auth/forgot-password')
    .send({ email: 'nobody.here@example.com' });

  assert.equal(res.status, 200, 'must not distinguish unknown from known');
  assert.match(res.body.message, /if an account/i);
});

test('forgot-password gives the identical answer for a known address', async () => {
  await realUser();
  const res = await request
    .post('/api/auth/forgot-password')
    .send({ email: 'real.person@example.com' });

  assert.equal(res.status, 200);
  assert.match(res.body.message, /if an account/i);
});

test('the two forgot-password answers are indistinguishable', async () => {
  const unknown = await request
    .post('/api/auth/forgot-password')
    .send({ email: 'still.nobody@example.com' });
  const known = await request
    .post('/api/auth/forgot-password')
    .send({ email: 'real.person@example.com' });

  assert.equal(unknown.status, known.status, 'status code must match');
  assert.equal(
    unknown.body.message,
    known.body.message,
    'message text must match or the difference still leaks existence'
  );
  assert.equal(
    JSON.stringify(Object.keys(unknown.body).sort()),
    JSON.stringify(Object.keys(known.body).sort()),
    'response shape must match'
  );
});

test('resend-verification gives the same answer for an unknown address', async () => {
  const res = await request
    .post('/api/auth/resend-verification')
    .send({ email: 'nobody.here@example.com' });

  assert.equal(res.status, 200, 'must not 404 on an unknown address');
  assert.match(res.body.message, /if an account/i);
});

test('resend-verification does not reveal that an address is already verified', async () => {
  // The user is unverified here. A verified one used to answer
  // 400 "Email already verified", leaking both existence and state.
  const res = await request
    .post('/api/auth/resend-verification')
    .send({ email: 'real.person@example.com' });

  assert.equal(res.status, 200);
  assert.doesNotMatch(res.body.message, /already verified/i);
});
