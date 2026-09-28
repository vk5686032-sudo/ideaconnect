// IMPORTANT: no DB needed — these are schema/validation definitions.
process.env.NODE_ENV = 'test';

const { test } = require('node:test');
const assert = require('node:assert/strict');

const { PASSWORD_MIN, registerSchema, resetPasswordSchema } = require('../validations/auth.validation');
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
