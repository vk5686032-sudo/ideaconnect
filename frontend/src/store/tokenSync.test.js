// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// The access token is kept twice: raw in localStorage/sessionStorage, which the
// axios interceptor reads, and in the auth store, which useSocket reads to
// authenticate the websocket. The refresh path used to write only the storage
// copy. The two drifted apart the first time a token was refreshed and the
// store's copy never changed again, so the socket kept presenting a token that
// had expired -- and every realtime feature (chat, typing, presence,
// notification toasts) was dead for the rest of the session, with only
// "[socket] connection error: Invalid or expired token" in the console.
//
// setTokens exists so the refresh path has one call that moves both.

vi.mock('../api/axios', () => ({ default: { interceptors: { request: { use: () => {} }, response: { use: () => {} } } } }));
vi.mock('../api/auth.api', () => ({ authApi: { getMe: jest.fn() } }));
vi.mock('../api/tokenStorage', () => ({ getAccessToken: jest.fn(), getRefreshToken: jest.fn(), setTokens: jest.fn(), clearTokens: jest.fn() }));

import useAuthStore from './authSlice';

describe('auth store setTokens', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    useAuthStore.setState({ user: null, token: null, isAuthenticated: false, rememberMe: true });
  });
  afterEach(() => vi.restoreAllMocks());

  it('writes the renewed token to the store AND to storage', () => {
    localStorage.setItem('token', 'old-token');
    localStorage.setItem('refreshToken', 'old-refresh');

    useAuthStore.getState().setTokens('new-token', 'new-refresh');

    expect(useAuthStore.getState().token).toBe('new-token');
    expect(localStorage.getItem('token')).toBe('new-token');
    expect(localStorage.getItem('refreshToken')).toBe('new-refresh');
  });

  it('keeps the store token and the storage token identical', () => {
    // This is the invariant the socket bug was really about: the socket reads
    // the store, the interceptor reads storage, and they must never disagree.
    localStorage.setItem('token', 'old');
    useAuthStore.getState().setTokens('a', 'ra');
    expect(useAuthStore.getState().token).toBe(localStorage.getItem('token'));

    useAuthStore.getState().setTokens('b', 'rb');
    expect(useAuthStore.getState().token).toBe(localStorage.getItem('token'));
  });

  it('follows rememberMe: writes to sessionStorage when that is where we are', () => {
    sessionStorage.setItem('token', 'old-token');
    useAuthStore.getState().setTokens('new-token', 'new-refresh');
    expect(sessionStorage.getItem('token')).toBe('new-token');
  });

  it('leaves the refresh token alone when none is supplied', () => {
    localStorage.setItem('token', 'old');
    localStorage.setItem('refreshToken', 'keep-me');
    useAuthStore.getState().setTokens('new-token');
    expect(localStorage.getItem('refreshToken')).toBe('keep-me');
    expect(useAuthStore.getState().token).toBe('new-token');
  });

  it('does not touch the user or the authenticated flag', () => {
    useAuthStore.setState({ user: { _id: 'u1', name: 'Priya' }, isAuthenticated: true, token: 'old' });
    localStorage.setItem('token', 'old');
    useAuthStore.getState().setTokens('new', 'r');
    const s = useAuthStore.getState();
    expect(s.isAuthenticated).toBe(true);
    expect(s.user.name).toBe('Priya');
    expect(s.token).toBe('new');
  });
});