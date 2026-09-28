// IMPORTANT: no DB needed â€” these are schema/validation definitions.
process.env.NODE_ENV = 'test';

const { test } = require('node:test');
const assert = require('node:assert/strict');

const { PASSWORD_MIN, registerSchema, resetPasswordSchema, loginSchema } = require('../validations/auth.validation');
const User = require('../models/User');

// The password minimum is enforced in three independent places: the zod
// request schemas, the Mongoose model, and a copy in each client (frontend
// Login/Register/ResetPassword/Settings, mobile login/register/reset-password/
// settings). Nothing shares a constant across packages, so drift is easy and
// the failure mode is nasty: the client accepts 7 characters, the server
// rejects them, and the user just sees a generic error.

test('the password minimum is at least 8 characters', () => {
  assert.ok(PASSWORD_MIN >= 8, `expected >= 8, got ${PASSWORD_MIN}`);
});

test('the Mongoose model agrees with the request schemas', () => {
  const [modelMin] = User.schema.path('password').options.minlength;
  assert.equal(
    modelMin,
    PASSWORD_MIN,
    'models/User.js minlength must match validations/auth.validation.js PASSWORD_MIN'
  );
});

test('register and reset schemas both use the shared minimum', () => {
  for (const [name, schema] of [
    ['register', registerSchema],
    ['resetPassword', resetPasswordSchema],
  ]) {
    const parsed = schema.safeParse({
      body: {
        ...(name === 'register' ? { name: 'Someone', email: 'a@b.co' } : {}),
        password: 'x'.repeat(PASSWORD_MIN - 1),
        confirmPassword: 'x'.repeat(PASSWORD_MIN - 1),
      },
    });
    assert.equal(parsed.success, false, `${name} must reject ${PASSWORD_MIN - 1} characters`);
  }
});

test('the demo passwords still satisfy the rule', () => {
  // Every seeded account uses password123. If this fails the whole demo breaks
  // and the seed script is the thing that needs changing.
  assert.ok('password123'.length >= PASSWORD_MIN, 'password123 is 9 characters');
});

test('login does NOT enforce the registration minimum', () => {
  // Signup and login are different questions. Login must accept anything the
  // server might legitimately hold: accounts created before the minimum was
  // raised still have short passwords, and a client-side min(8) would lock
  // those users out of the app with no way to sign in at all. The backend
  // loginSchema is deliberately min(1) for the same reason.
  assert.equal(loginSchema.safeParse({ body: { email: 'a@b.co', password: 'short' } }).success, true);
  assert.equal(loginSchema.safeParse({ body: { email: 'a@b.co', password: '' } }).success, false);
});

test('the client login forms match the backend login schema', () => {
  // Same reason as above, on the clients. These are the two forms a returning
  // user with an older short password actually types into.
  const fs = require('node:fs');
  const path = require('node:path');
  // __dirname is backend/src/__tests__, so the repo root is three levels up.
  const repoRoot = path.join(__dirname, '../../..');
  const files = [
    'mobile/app/(auth)/login.tsx',
    'frontend/src/pages/Login/Login.jsx',
  ];
  for (const rel of files) {
    const file = path.join(repoRoot, rel);
    // Fail loudly rather than skip: a silently-skipped assertion is worse than
    // no assertion, because it looks like coverage.
    assert.ok(fs.existsSync(file), `expected to find ${rel} at ${file}`);
    const src = fs.readFileSync(file, 'utf8');
    assert.match(
      src,
      /password:\s*z\.string\(\)\.min\(1,/,
      `${rel} must not enforce the signup minimum on login`
    );
  }
});
