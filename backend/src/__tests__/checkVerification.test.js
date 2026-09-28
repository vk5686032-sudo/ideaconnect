// IMPORTANT: no DB needed — checkVerification is pure middleware logic.
process.env.NODE_ENV = 'test';

const { test } = require('node:test');
const assert = require('node:assert/strict');

// config is read at require time, so each environment needs its own copy of
// the module. Bust the cache rather than mutating a shared singleton.
const loadCheckVerification = (nodeEnv) => {
  const configPath = require.resolve('../config/env');
  const authPath = require.resolve('../middlewares/auth');
  delete require.cache[authPath];
  process.env.NODE_ENV = nodeEnv;
  delete require.cache[configPath];
  return require('../middlewares/auth').checkVerification;
};

const fakeRes = () => {
  const res = { statusCode: 200, body: null };
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (payload) => {
    res.body = payload;
    return res;
  };
  return res;
};

test('production blocks an unverified user from writing', () => {
  // This was an unconditional next() with the real check commented out, so
  // unverified accounts could write in production too. 16 routes rely on it.
  const checkVerification = loadCheckVerification('production');
  const res = fakeRes();
  let nexted = false;

  checkVerification({ user: { isVerified: false } }, res, () => {
    nexted = true;
  });

  assert.equal(nexted, false, 'must not continue the chain');
  assert.equal(res.statusCode, 403);
  assert.match(res.body.message, /verify your email/i);
});

test('production lets a verified user through', () => {
  const checkVerification = loadCheckVerification('production');
  const res = fakeRes();
  let nexted = false;

  checkVerification({ user: { isVerified: true } }, res, () => {
    nexted = true;
  });

  assert.equal(nexted, true);
  assert.equal(res.statusCode, 200);
});

test('development still bypasses, so local work is not blocked', () => {
  const checkVerification = loadCheckVerification('development');
  const res = fakeRes();
  let nexted = false;

  checkVerification({ user: { isVerified: false } }, res, () => {
    nexted = true;
  });

  assert.equal(nexted, true, 'dev bypass must be preserved');
});

// Leave the process on test so the other suites in this run are unaffected.
loadCheckVerification('test');
