// Unit tests for useDebounce hook
// Tests debouncing functionality with proper delays and cancellation

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from './useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return the initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500));
    expect(result.current).toBe('initial');
  });

  it('should debounce value changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 500 },
      }
    );

    expect(result.current).toBe('initial');

    // Change value but don't advance timer
    rerender({ value: 'updated', delay: 500 });
    expect(result.current).toBe('initial'); // Should still be initial

    // Advance timer by less than delay
    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(result.current).toBe('initial'); // Should still be initial

    // Advance timer to complete delay
    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(result.current).toBe('updated'); // Should now be updated
  });

  it('should reset timer on rapid value changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 500 },
      }
    );

    // First change
    rerender({ value: 'change1', delay: 500 });
    act(() => {
      vi.advanceTimersByTime(250);
    });

    // Second change before first completes
    rerender({ value: 'change2', delay: 500 });
    act(() => {
      vi.advanceTimersByTime(250);
    });

    // Should still be initial (timer was reset)
    expect(result.current).toBe('initial');

    // Complete the timer
    act(() => {
      vi.advanceTimersByTime(250);
    });

    // Should be the latest value
    expect(result.current).toBe('change2');
  });

  it('should handle delay changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 500 },
      }
    );

    rerender({ value: 'updated', delay: 1000 }); // Change both value and delay

    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current).toBe('initial'); // Should still be initial (new delay is 1000ms)

    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current).toBe('updated'); // Should now be updated
  });

  it('should cleanup timer on unmount', () => {
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
    const { unmount } = renderHook(() => useDebounce('test', 500));

    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });

  it('should handle zero delay', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 0 },
      }
    );

    rerender({ value: 'updated', delay: 0 });

    // With zero delay, should update immediately after next tick
    act(() => {
      vi.advanceTimersByTime(0);
    });

    expect(result.current).toBe('updated');
  });
});