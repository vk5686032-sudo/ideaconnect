import { describe, it, expect, beforeEach, vi } from 'vitest';
import { z } from 'zod';
import { authStorage, normalizeUser, toEnvelope } from './authStorage';

// Regression cover for the session bug: the persist adapter used to call
// JSON.parse on the value zustand v5 hands it (an object, not a string), so
// setAuth threw, the session was never persisted, and a reload logged the
// user out. These tests exercise the real module, not a copy of it.

class MemStorage {
  constructor() {
    this.map = new Map();
  }
  getItem(k) {
    return this.map.has(k) ? this.map.get(k) : null;
  }
  setItem(k, v) {
    this.map.set(k, String(v));
  }
  removeItem(k) {
    this.map.delete(k);
  }
  keys() {
    return [...this.map.keys()];
  }
}

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  // Must be declared or zod strips it, and the default `rememberMe = true`
  // in setAuth would silently force every session into localStorage.
  rememberMe: z.boolean().optional(),
});

describe('toEnvelope', () => {
  it('passes an object through untouched (zustand v5 contract)', () => {
    const envelope = { state: { a: 1 }, version: 0 };
    expect(toEnvelope(envelope)).toBe(envelope);
  });

  it('parses a JSON string', () => {
    expect(toEnvelope('{"state":{"a":1},"version":0}')).toEqual({
      state: { a: 1 },
      version: 0,
    });
  });
});

describe('authStorage', () => {
  let localStorage;
  let sessionStorage;

  beforeEach(() => {
    localStorage = new MemStorage();
    sessionStorage = new MemStorage();
    vi.stubGlobal('localStorage', localStorage);
    vi.stubGlobal('sessionStorage', sessionStorage);
  });

  it('accepts the object envelope zustand v5 passes (does not throw)', () => {
    expect(() =>
      authStorage.setItem('auth-storage', { state: { rememberMe: true }, version: 0 })
    ).not.toThrow();
  });

  it('still accepts a JSON string envelope', () => {
    expect(() =>
      authStorage.setItem('auth-storage', JSON.stringify({ state: { rememberMe: true }, version: 0 }))
    ).not.toThrow();
  });

  it('persists to localStorage when rememberMe is true', () => {
    authStorage.setItem('auth-storage', { state: { rememberMe: true }, version: 0 });
    expect(localStorage.keys()).toContain('auth-storage');
    expect(sessionStorage.keys()).not.toContain('auth-storage');
  });

  it('persists to sessionStorage when rememberMe is false', () => {
    authStorage.setItem('auth-storage', { state: { rememberMe: false }, version: 0 });
    expect(sessionStorage.keys()).toContain('auth-storage');
    expect(localStorage.keys()).not.toContain('auth-storage');
  });

  it('reads back the persisted state so a reload restores the session', () => {
    authStorage.setItem('auth-storage', {
      state: { user: { id: 'u1', name: 'Ada' }, token: 't', isAuthenticated: true, rememberMe: true },
      version: 0,
    });
    const restored = authStorage.getItem('auth-storage');
    expect(restored.version).toBe(0);
    expect(restored.state.user.name).toBe('Ada');
    expect(restored.state.isAuthenticated).toBe(true);
  });

  it('returns null instead of throwing on corrupt stored data', () => {
    localStorage.setItem('auth-storage', 'not json');
    expect(authStorage.getItem('auth-storage')).toBeNull();
  });

  it('migrates a pre-existing string-encoded session into the new shape', () => {
    localStorage.setItem(
      'auth-storage',
      JSON.stringify({ state: { user: { id: 'u9' }, rememberMe: true }, version: 0 })
    );
    expect(authStorage.getItem('auth-storage').state.user.id).toBe('u9');
  });

  it('falls back to sessionStorage when the envelope has no state', () => {
    authStorage.setItem('auth-storage', { version: 0 });
    expect(sessionStorage.keys()).toContain('auth-storage');
  });

  it('removeItem clears both storages', () => {
    localStorage.setItem('auth-storage', '{}');
    sessionStorage.setItem('auth-storage', '{}');
    authStorage.removeItem('auth-storage');
    expect(localStorage.keys()).not.toContain('auth-storage');
    expect(sessionStorage.keys()).not.toContain('auth-storage');
  });
});

describe('normalizeUser', () => {
  it('adds _id when only id is present', () => {
    const u = normalizeUser({ id: 'u1', name: 'Ada' });
    expect(u._id).toBe('u1');
    expect(u.id).toBe('u1');
  });

  it('adds id when only _id is present', () => {
    const u = normalizeUser({ _id: 'u2', name: 'Bo' });
    expect(u.id).toBe('u2');
  });

  it('passes through null', () => {
    expect(normalizeUser(null)).toBeNull();
  });
});

describe('login schema', () => {
  it('keeps rememberMe so the storage choice is not lost to zod stripping', () => {
    const parsed = loginSchema.parse({
      email: 'a@b.com',
      password: 'password123',
      rememberMe: false,
    });
    expect(parsed.rememberMe).toBe(false);
  });

  it('still parses when rememberMe is absent', () => {
    const parsed = loginSchema.parse({ email: 'a@b.com', password: 'password123' });
    expect(parsed.rememberMe).toBeUndefined();
  });

  it('rejects a short password', () => {
    expect(() => loginSchema.parse({ email: 'a@b.com', password: 'short' })).toThrow();
  });
});
