import { describe, it, expect, vi, afterEach } from 'vitest';
import { timeSince } from './helpers';

describe('timeSince', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "Just now" for a recent timestamp', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-08T12:00:00Z'));
    const recent = new Date('2026-08-08T11:59:50Z'); // 10s ago
    expect(timeSince(recent.toISOString())).toBe('Just now');
  });

  it('formats minutes', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-08T12:00:00Z'));
    const d = new Date('2026-08-08T11:50:00Z'); // 10 min ago
    expect(timeSince(d.toISOString())).toBe('10 minutes ago');
  });

  it('uses singular unit for 1', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-08T12:00:00Z'));
    const d = new Date('2026-08-08T11:59:00Z'); // 1 min ago
    expect(timeSince(d.toISOString())).toBe('1 minute ago');
  });

  it('formats hours', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-08T12:00:00Z'));
    const d = new Date('2026-08-08T10:00:00Z'); // 2 hrs ago
    expect(timeSince(d.toISOString())).toBe('2 hours ago');
  });

  it('formats days', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-08T12:00:00Z'));
    const d = new Date('2026-08-05T12:00:00Z'); // 3 days ago
    expect(timeSince(d.toISOString())).toBe('3 days ago');
  });

  it('handles future dates by returning "Just now"', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-08T12:00:00Z'));
    const future = new Date('2026-08-09T12:00:00Z');
    expect(timeSince(future.toISOString())).toBe('Just now');
  });

  it('handles invalid dates gracefully', () => {
    expect(() => timeSince('not-a-date')).not.toThrow();
  });
});
