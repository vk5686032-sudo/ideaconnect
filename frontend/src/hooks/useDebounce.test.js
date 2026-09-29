// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useDebounce from '../hooks/useDebounce';

describe('useDebounce', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('returns the initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('first'));
    expect(result.current).toBe('first');
  });

  it('does not settle early', () => {
    const { result, rerender } = renderHook(({ v }) => useDebounce(v), { initialProps: { v: 'a' } });
    rerender({ v: 'ab' });
    act(() => vi.advanceTimersByTime(299));
    expect(result.current).toBe('a');
    act(() => vi.advanceTimersByTime(2));
    expect(result.current).toBe('ab');
  });

  // The regression this hook exists for: typing "MediMatch" used to fire eight
  // requests, one per prefix, because the feed inputs wrote straight into the
  // react-query key. Only the final value may reach the query.
  it('collapses a burst of keystrokes into a single final value', () => {
    const { result, rerender } = renderHook(({ v }) => useDebounce(v), { initialProps: { v: '' } });
    for (const ch of 'MediMatch') {
      rerender({ v: ch });
      act(() => vi.advanceTimersByTime(50)); // faster than the debounce
    }
    expect(result.current).toBe('');
    act(() => vi.advanceTimersByTime(300));
    expect(result.current).toBe('h', 'only the last keystroke should be emitted');
  });

  it('honours a custom delay', () => {
    const { result, rerender } = renderHook(({ v }) => useDebounce(v, 1000), { initialProps: { v: 'a' } });
    rerender({ v: 'b' });
    act(() => vi.advanceTimersByTime(300));
    expect(result.current).toBe('a', '300ms is not enough at a 1000ms delay');
    act(() => vi.advanceTimersByTime(700));
    expect(result.current).toBe('b');
  });

  it('clears its timer on unmount', () => {
    const clearSpy = vi.spyOn(globalThis, 'clearTimeout');
    const { unmount } = renderHook(() => useDebounce('a'));
    unmount();
    expect(clearSpy).toHaveBeenCalled();
    clearSpy.mockRestore();
  });
});
