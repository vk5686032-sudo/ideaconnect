/**
 * IdeaConnect backend API tests.
 *
 * Uses Node's built-in test runner (node:test) + supertest against the
 * Express app. Requires MongoDB (a dedicated `ideaconnect_test` database —
 * the real dev DB is never touched).
 *
 * Run:  npm test
 */

// IMPORTANT: set a dedicated test DB BEFORE requiring the app, so
// dotenv doesn't load the dev MONGODB_URI (dotenv won't override existing vars).
process.env.MONGODB_URI = process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/ideaconnect_test';
process.env.NODE_ENV = 'test';

const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert');
const mongoose = require('mongoose');

const app = require('../app');
const User = require('../models/User');
const connectDB = require('../config/db');

let server;
let request;

before(async () => {
  // Connect to the dedicated test DB
  await connectDB();
  // Start app on an ephemeral port so tests never clash with the dev server
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const port = server.address().port;
  request = require('supertest')(`http://localhost:${port}`);
});

after(async () => {
  await User.deleteMany({});
  await mongoose.disconnect();
  server.close();
});

beforeEach(async () => {
  // Fresh user collection per test
  await User.deleteMany({});
});

test('GET /api/health returns 200 ok', async () => {
  const res = await request.get('/api/health');
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.status, 'ok');
});

test('POST /api/auth/register creates a user', async () => {
  const res = await request.post('/api/auth/register').send({
    name: 'Test User',
    email: 'test@test.com',
    password: 'password123',
  });

  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.body.success, true);
  assert.ok(res.body.data.token, 'register should return a token');
  assert.strictEqual(res.body.data.user.email, 'test@test.com');
});

test('POST /api/auth/register rejects duplicate email', async () => {
  await request.post('/api/auth/register').send({
    name: 'First',
    email: 'dup@test.com',
    password: 'password123',
  });

  const res = await request.post('/api/auth/register').send({
    name: 'Second',
    email: 'dup@test.com',
    password: 'password123',
  });

  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.body.success, false);
});

test('POST /api/auth/login succeeds with valid credentials', async () => {
  await request.post('/api/auth/register').send({
    name: 'Login User',
    email: 'login@test.com',
    password: 'password123',
  });

  const res = await request.post('/api/auth/login').send({
    email: 'login@test.com',
    password: 'password123',
  });

  assert.strictEqual(res.status, 200);
  assert.ok(res.body.data.token, 'login should return a token');
});

test('POST /api/auth/login fails with wrong password', async () => {
  await request.post('/api/auth/register').send({
    name: 'Wrong Pass',
    email: 'wrong@test.com',
    password: 'password123',
  });

  const res = await request.post('/api/auth/login').send({
    email: 'wrong@test.com',
    password: 'wrong-password',
  });

  assert.strictEqual(res.status, 401);
  assert.strictEqual(res.body.success, false);
});

test('protected route rejects request without token', async () => {
  const res = await request.get('/api/auth/me');
  assert.strictEqual(res.status, 401);
});

test('protected route works with a valid token', async () => {
  const reg = await request.post('/api/auth/register').send({
    name: 'Authed User',
    email: 'authed@test.com',
    password: 'password123',
  });
  const token = reg.body.data.token;

  const res = await request.get('/api/auth/me').set('Authorization', `Bearer ${token}`);
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.data.email, 'authed@test.com');
});

test('public ideas list is accessible without token', async () => {
  const res = await request.get('/api/ideas');
  assert.strictEqual(res.status, 200);
  assert.ok(Array.isArray(res.body.data), 'ideas list should be an array');
});

test('unknown route returns 404 JSON', async () => {
  const res = await request.get('/api/does-not-exist');
  assert.strictEqual(res.status, 404);
  assert.strictEqual(res.body.success, false);
});
