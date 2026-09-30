// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// A 401 has two meanings in this app and telling them apart by endpoint is
// what went wrong before. Listing `/users/change-password` stopped a mistyped
// current password from triggering a refresh -- but it also stopped a genuinely
// expired token from ever refreshing, so the form failed with the server's
// generic "Not authorized to access this route" and there was no way forward.
//
// The rule that replaced it reads the JWT's own `exp`: if our token is still
// valid, the server is rejecting this request on its merits, so surface its
// message and touch nothing. If it has expired, refresh like any other 401.

const AUTH_ENDPOINTS = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/resend-verification',
  '/auth/refresh',
];

const isAuthRequest = (url) => AUTH_ENDPOINTS.some((e) => url.endsWith(e));

const b64url = (obj) =>
  btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const makeToken = (expiresInSeconds) =>
  `${b64url({ alg: 'HS256' })}.${b64url({ exp: Math.floor(Date.now() / 1000) + expiresInSeconds })}.sig`;

/** Mirror of isAccessTokenExpired in axios.js. */
const isAccessTokenExpired = () => {
  const token = localStorage.getItem('token');
  if (!token) return true;
  try {
    const [, payload] = token.split('.');
    if (!payload) return true;
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join('')
    );
    const exp = JSON.parse(json).exp;
    if (!exp) return true;
    return exp * 1000 <= Date.now() + 5000;
  } catch {
    return true;
  }
};

/** Mirror of the interceptor's decision: refresh, or hand the error back. */
const shouldAttemptRefresh = ({ status, url, token }) => {
  if (status !== 401) return false;
  if (isAuthRequest(url)) return false;
  if (!token) return false;
  return isAccessTokenExpired();
};

describe('401 policy: expired session vs. server-rejected request', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  afterEach(() => vi.restoreAllMocks());

  it('surfaces the server message when our token is still valid', () => {
    localStorage.setItem('token', makeToken(3600));
    expect(isAccessTokenExpired()).toBe(false);
    expect(
      shouldAttemptRefresh({ status: 401, url: '/users/change-password', token: true })
    ).toBe(false);
  });

  it('refreshes when our token has actually expired', () => {
    localStorage.setItem('token', makeToken(-60));
    expect(isAccessTokenExpired()).toBe(true);
    expect(
      shouldAttemptRefresh({ status: 401, url: '/users/change-password', token: true })
    ).toBe(true);
  });

  it('refreshes ordinary endpoints once the token is expired', () => {
    localStorage.setItem('token', makeToken(-60));
    expect(shouldAttemptRefresh({ status: 401, url: '/ideas', token: true })).toBe(true);
  });

  it('never refreshes for the auth endpoints, expired or not', () => {
    for (const url of AUTH_ENDPOINTS) {
      localStorage.setItem('token', makeToken(-60));
      expect(shouldAttemptRefresh({ status: 401, url, token: true }), url).toBe(false);
    }
  });

  it('treats a missing or unreadable token as expired', () => {
    expect(isAccessTokenExpired()).toBe(true); // nothing stored
    localStorage.setItem('token', 'not-a-jwt');
    expect(isAccessTokenExpired()).toBe(true);
  });

  it('treats a token with no exp claim as expired', () => {
    localStorage.setItem('token', `${b64url({})}.${b64url({ sub: 'x' })}.sig`);
    expect(isAccessTokenExpired()).toBe(true);
  });

  it('gives a token a few seconds of slack so one that dies mid-flight still refreshes', () => {
    localStorage.setItem('token', makeToken(2));
    expect(isAccessTokenExpired()).toBe(true);
    localStorage.setItem('token', makeToken(30));
    expect(isAccessTokenExpired()).toBe(false);
  });

  it('ignores non-401 statuses entirely', () => {
    localStorage.setItem('token', makeToken(-60));
    expect(shouldAttemptRefresh({ status: 403, url: '/ideas', token: true })).toBe(false);
    expect(shouldAttemptRefresh({ status: 500, url: '/ideas', token: true })).toBe(false);
  });

  it('does not refresh when there is no refresh token to use', () => {
    localStorage.setItem('token', makeToken(-60));
    expect(shouldAttemptRefresh({ status: 401, url: '/ideas', token: false })).toBe(false);
  });
});

describe('the endpoint list stays in sync with axios.js', () => {
  let source;

  beforeEach(() => {
    source = require('node:fs').readFileSync(require.resolve('../api/axios.js'), 'utf8');
  });

  it('matches the endpoints declared in src/api/axios.js', () => {
    const block = source.match(/const AUTH_ENDPOINTS = \[([\s\S]*?)\];/);
    expect(block, 'AUTH_ENDPOINTS should still be a literal array in axios.js').toBeTruthy();
    const inSource = [...block[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
    expect(inSource.sort()).toEqual([...AUTH_ENDPOINTS].sort());
  });

  it('keeps change-password out of that list', () => {
    // It belongs to the expiry check now. Leaving it here would re-introduce
    // the original bug: an expired token could never refresh.
    expect(AUTH_ENDPOINTS).not.toContain('/users/change-password');
  });
});