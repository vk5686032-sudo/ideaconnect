// No DOM, no network â€” these are pure string decisions that decided where every
// API call and websocket went.
import { describe, it, expect } from 'vitest';
import { resolveApiUrl, resolveSocketUrl } from '../config/endpoints';

describe('resolveSocketUrl', () => {
  // The regression: docker-compose.yml and ci.yml both build the frontend with
  // VITE_SOCKET_URL="" and expect nginx to proxy /socket.io. An empty string
  // resolving to http://localhost:5000 pointed every visitor's browser at port
  // 5000 on their own machine, so chat, typing, presence and notification
  // pushes were all dead in the deployed build.
  it('treats an empty setting as same-origin rather than localhost', () => {
    expect(resolveSocketUrl('')).toBeUndefined();
  });

  it('treats an absent setting as same-origin', () => {
    expect(resolveSocketUrl(undefined)).toBeUndefined();
    expect(resolveSocketUrl(null)).toBeUndefined();
  });

  it('treats whitespace as unset', () => {
    expect(resolveSocketUrl('   ')).toBeUndefined();
  });

  it('honours an explicit absolute URL', () => {
    expect(resolveSocketUrl('http://203.0.113.10:5000')).toBe('http://203.0.113.10:5000');
  });

  it('never returns a localhost default', () => {
    // Any fallback here reintroduces the original bug for anyone who forgets
    // to set the variable, so assert on the shape rather than one value.
    for (const input of ['', undefined, null, '  ']) {
      expect(String(resolveSocketUrl(input))).not.toContain('localhost');
    }
  });
});

describe('resolveApiUrl', () => {
  it('defaults to a relative path so dev matches the deployed shape', () => {
    expect(resolveApiUrl('')).toBe('/api/v1');
    expect(resolveApiUrl(undefined)).toBe('/api/v1');
  });

  it('honours an explicit URL', () => {
    expect(resolveApiUrl('http://203.0.113.10:5000/api/v1')).toBe('http://203.0.113.10:5000/api/v1');
  });

  it('keeps the /api/v1 suffix when handed a bare origin', () => {
    // A bare host would silently drop the version prefix, so be explicit.
    expect(resolveApiUrl('   ')).toBe('/api/v1');
  });
});
