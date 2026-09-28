// IMPORTANT: no DB needed — the skip decision is pure.
process.env.NODE_ENV = 'test';

const { test } = require('node:test');
const assert = require('node:assert/strict');

const { shouldSkipLimiting } = require('../utils/ip');

const reqFrom = (ip) => ({ ip });

test('production does not skip a private IP', () => {
  // The whole reason shouldSkipLimiting exists. Behind the compose nginx every
  // request used to arrive as 172.x with no 'trust proxy' set, the old
  // skip swallowed all of them, and rate limiting was off in the exact
  // deployment the README documents.
  const skip = shouldSkipLimiting('production');
  assert.equal(skip(reqFrom('172.18.0.3')), false, 'container-network IP must still be counted');
  assert.equal(skip(reqFrom('127.0.0.1')), false, 'loopback must still be counted');
  assert.equal(skip(reqFrom('::ffff:172.18.0.3')), false, 'v4-mapped form must still be counted');
  assert.equal(skip(reqFrom('203.0.113.9')), false);
});

test('a missing IP is counted, not skipped', () => {
  // isPrivateIP(undefined) is true, so the naive `skip: isPrivateIP(req.ip)`
  // treated an unresolvable address as exempt.
  assert.equal(shouldSkipLimiting('production')(reqFrom(undefined)), false);
});

test('development skips loopback so local work is not throttled', () => {
  const skip = shouldSkipLimiting('development');
  assert.equal(skip(reqFrom('127.0.0.1')), true);
  assert.equal(skip(reqFrom('192.168.1.20')), true);
  assert.equal(skip(reqFrom('203.0.113.9')), false, 'a public IP is real traffic even in dev');
});

test('the test suite is not throttled by its own limiter', () => {
  assert.equal(shouldSkipLimiting('test')(reqFrom('127.0.0.1')), true);
});

test('credential routes are limited but /refresh is not', () => {
  // /refresh is excluded on purpose: the mobile client refreshes silently, and
  // a tight bucket there logs people out without adding any security.
  const fs = require('node:fs');
  const src = fs.readFileSync(require.resolve('../routes/auth.routes'), 'utf8');
  const limited = (route) => new RegExp(`router\\.(post|put|get)\\('${route}'[^)]*authLimiter`).test(src);

  for (const route of ['/register', '/login', '/forgot-password', '/resend-verification']) {
    assert.equal(limited(route), true, `${route} must be rate limited`);
  }
  assert.match(src, /router\.put\('\/reset-password\/:token',\s*authLimiter/);
  assert.equal(
    limited('/refresh'),
    false,
    '/refresh must stay unlimited or mobile refreshes get throttled'
  );
});
