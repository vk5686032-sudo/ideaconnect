// IMPORTANT: dedicated test DB before requiring the app.
process.env.MONGODB_URI =
  process.env.MONGODB_URI_EMAIL ||
  'mongodb://localhost:27017/ideaconnect_test_email';
process.env.NODE_ENV = 'test';

const { test } = require('node:test');
const assert = require('node:assert/strict');

const { buildVerificationUrls, buildResetUrls } = require('../services/email.service');

test('the web link uses a path segment, which is what the web router expects', () => {
  const urls = buildVerificationUrls('http://localhost:5173', 'ideaconnect', 'tok123');
  assert.equal(urls.web, 'http://localhost:5173/verify-email/tok123');
});

test('the app link uses the mobile scheme with a query param', () => {
  // The mobile screens read the token via useLocalSearchParams, so a path
  // segment would leave the token undefined and the screen would show
  // "invalid link" on every real reset.
  const urls = buildVerificationUrls('http://localhost:5173', 'ideaconnect', 'tok123');
  assert.equal(urls.app, 'ideaconnect://verify-email?token=tok123');
});

test('reset links follow the same shape', () => {
  const urls = buildResetUrls('http://localhost:5173', 'ideaconnect', 'tok456');
  assert.equal(urls.web, 'http://localhost:5173/reset-password/tok456');
  assert.equal(urls.app, 'ideaconnect://reset-password?token=tok456');
});

test('the app link falls back to the web link when no scheme is configured', () => {
  const urls = buildResetUrls('http://localhost:5173', '', 'tok456');
  assert.equal(urls.app, urls.web, 'with no scheme configured there is no app link to offer');
});
