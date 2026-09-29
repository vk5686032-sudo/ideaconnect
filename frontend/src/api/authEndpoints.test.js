// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// The interceptor's whole 401 policy hangs off this list, and it was a bare
// array with no coverage. A wrong current password was missing from it, which
// meant a typo was handled as an expired access token: the client refreshed and
// re-sent the request, and could call hardLogout() and sign the user out.
//
// The list is re-declared here rather than imported, because axios.js pulls in
// the auth store and touches localStorage at module scope. Asserting on a copy
// still guards the list against someone adding an endpoint in one place only.
const AUTH_ENDPOINTS = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/resend-verification',
  '/auth/refresh',
  '/users/change-password',
];

const isAuthRequest = (url) => AUTH_ENDPOINTS.some((e) => url.endsWith(e));

describe('AUTH_ENDPOINTS — 401s that are a user-facing outcome, not an expired session', () => {
  const expected = [
    ['/auth/login', 'wrong password on login'],
    ['/auth/register', 'duplicate or invalid registration'],
    ['/auth/forgot-password', 'unknown email'],
    ['/auth/resend-verification', 'unknown email'],
    ['/auth/refresh', 'expired refresh token'],
    ['/users/change-password', 'wrong CURRENT password — the case that was missed'],
  ];

  for (const [url, why] of expected) {
    it(`exempts ${url} (${why})`, () => {
      expect(isAuthRequest(url)).toBe(true);
    });
  }

  it('does NOT exempt ordinary authenticated endpoints', () => {
    // The whole point: these really do mean the access token expired.
    for (const url of ['/ideas', '/users/me/stats', '/ideas/abc/comments', '/auth/me']) {
      expect(isAuthRequest(url)).toBe(false);
    }
  });

  it('matches with endsWith, so the paths have to stay distinct', () => {
    // The real matcher is endsWith, not an exact match. That is fine for this
    // set — none of these suffixes is shared with a real route — but it does
    // mean a future route ending in one of these strings would be wrongly
    // exempted. Asserted here so the caveat is recorded rather than assumed.
    expect(isAuthRequest('/admin/users/change-password')).toBe(true);
    expect(isAuthRequest('/api/v1/auth/login')).toBe(true);
  });
});

describe('the list cannot drift from the real one', () => {
  let source;

  beforeEach(() => {
    source = require('node:fs').readFileSync(
      require.resolve('../api/axios.js'),
      'utf8'
    );
  });
  afterEach(() => vi.restoreAllMocks());

  it('matches the endpoints declared in src/api/axios.js', () => {
    const block = source.match(/const AUTH_ENDPOINTS = \[([\s\S]*?)\];/);
    expect(block, 'AUTH_ENDPOINTS should still be a literal array in axios.js').toBeTruthy();
    const inSource = [...block[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
    expect(inSource.sort()).toEqual([...AUTH_ENDPOINTS].sort());
  });
});
