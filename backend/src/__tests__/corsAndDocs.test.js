// IMPORTANT: no DB needed — these are pure config decisions.
process.env.NODE_ENV = 'test';

const { test } = require('node:test');
const assert = require('node:assert/strict');

const load = (nodeEnv, frontendUrl) => {
  // config/env snapshots NODE_ENV and FRONTEND_URL at require time, so both it
  // and utils/origins have to come out of the cache for a new environment to
  // take effect. dotenv will not re-run and overwrite what is set here.
  const configPath = require.resolve('../config/env');
  const originsPath = require.resolve('../utils/origins');
  delete require.cache[originsPath];
  delete require.cache[configPath];
  process.env.NODE_ENV = nodeEnv;
  process.env.FRONTEND_URL = frontendUrl;
  return require('../utils/origins');
};

// The dev origins were appended unconditionally in BOTH the REST allowlist and
// the socket.io one, and CORS ran with credentials: true. In production that
// means any page a user has open on localhost:5173 or :8081 gets
// credentialed cross-origin API access.

test('production does not allow the localhost dev origins', () => {
  const { getAllowedOrigins } = load('production', 'https://ideaconnect.example.com');
  const origins = getAllowedOrigins();
  assert.equal(origins.includes('http://localhost:5173'), false);
  assert.equal(origins.includes('http://localhost:8081'), false);
  assert.equal(origins.includes('http://127.0.0.1:5174'), false);
});

test('production still allows the configured origin', () => {
  const { getAllowedOrigins } = load('production', 'https://ideaconnect.example.com');
  assert.deepEqual(getAllowedOrigins(), ['https://ideaconnect.example.com']);
});

test('production splits a comma-separated FRONTEND_URL', () => {
  const { getAllowedOrigins } = load('production', 'https://a.example.com, https://b.example.com');
  assert.deepEqual(getAllowedOrigins(), ['https://a.example.com', 'https://b.example.com']);
});

test('development still allows Vite and Expo web', () => {
  const { getAllowedOrigins } = load('development', 'http://localhost:5173');
  const origins = getAllowedOrigins();
  for (const expected of [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'http://localhost:8081',
    'http://127.0.0.1:8081',
  ]) {
    assert.equal(origins.includes(expected), true, `${expected} should be allowed in dev`);
  }
});

test('REST and websockets share one allowlist', () => {
  // They used to be two hardcoded arrays that had already drifted: the socket
  // list was missing 5174 and 127.0.0.1:5173, and read process.env.FRONTEND_URL
  // as a single literal so a comma-list silently broke websockets.
  const { getAllowedOrigins } = load('production', 'https://a.example.com, https://b.example.com');
  const socketSrc = require('node:fs').readFileSync(require.resolve('../config/socket'), 'utf8');

  assert.match(socketSrc, /getAllowedOrigins\(\)/, 'socket.js must use the shared list');
  assert.doesNotMatch(
    socketSrc,
    /process\.env\.FRONTEND_URL/,
    'socket.js must not read FRONTEND_URL directly'
  );
  assert.ok(getAllowedOrigins().length === 2);
});

test('the API docs are not mounted in production', () => {
  const src = require('node:fs').readFileSync(require.resolve('../app'), 'utf8');
  assert.match(src, /config\.nodeEnv !== 'production' \|\| process\.env\.SERVE_API_DOCS === 'true'/);
  assert.match(
    src,
    /docs\.json[\s\S]{0,400}404/,
    'the raw spec must 404 in production rather than 200'
  );
});

// Leave the process as the rest of the suite expects it.
delete process.env.FRONTEND_URL;
process.env.NODE_ENV = 'test';
