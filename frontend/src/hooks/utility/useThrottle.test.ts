// Unit tests for useThrottle hook
// Tests throttling functionality with proper intervals and leading/trailing edge handling

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useThrottle } from './useThrottle';

describe('useThrottle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return the initial value immediately', () => {
    const { result } = renderHook(() => useThrottle('initial', 500));
    expect(result.current).toBe('initial');
  });

  it('should throttle value changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useThrottle(value, delay),
      {
        initialProps: { value: 'initial', delay: 500 },
      }
    );

    expect(result.current).toBe('initial');

    // First change should be immediate (leading edge)
    rerender({ value: 'change1', delay: 500 });
    expect(result.current).toBe('change1');

    // Subsequent changes within delay should be ignored
    rerender({ value: 'change2', delay: 500 });
    expect(result.current).toBe('change1'); // Should still be change1

    rerender({ value: 'change3', delay: 500 });
    expect(result.current).toBe('change1'); // Should still be change1

    // After delay period, next change should be allowed
    act(() => {
      vi.advanceTimersByTime(500);
    });

    rerender({ value: 'change4', delay: 500 });
    expect(result.current).toBe('change4'); // Should now update
  });

  it('should handle rapid value changes correctly', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useThrottle(value, delay),
      {
        initialProps: { value: 'initial', delay: 1000 },
      }
    );

    // First change (leading edge)
    rerender({ value: 'A', delay: 1000 });
    expect(result.current).toBe('A');

    // Multiple rapid changes within throttle period
    act(() => {
      vi.advanceTimersByTime(100);
    });
    rerender({ value: 'B', delay: 1000 });
    expect(result.current).toBe('A'); // Should not update

    act(() => {
      vi.advanceTimersByTime(200);
    });
    rerender({ value: 'C', delay: 1000 });
    expect(result.current).toBe('A'); // Should not update

    act(() => {
      vi.advanceTimersByTime(300);
    });
    rerender({ value: 'D', delay: 1000 });
    expect(result.current).toBe('A'); // Should not update

    // Complete the throttle period
    act(() => {
      vi.advanceTimersByTime(400);
    });

    // Next change should be allowed
    rerender({ value: 'E', delay: 1000 });
    expect(result.current).toBe('E');
  });

  it('should handle delay changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useThrottle(value, delay),
      {
        initialProps: { value: 'initial', delay: 500 },
      }
    );

    // First change
    rerender({ value: 'change1', delay: 500 });
    expect(result.current).toBe('change1');

    // Change delay mid-throttle
    act(() => {
      vi.advanceTimersByTime(250);
    });
    rerender({ value: 'change2', delay: 1000 }); // New delay is longer
    expect(result.current).toBe('change1'); // Should still be throttled

    // Original delay passes but new delay hasn't
    act(() => {
      vi.advanceTimersByTime(250);
    });
    rerender({ value: 'change3', delay: 1000 });
    expect(result.current).toBe('change1'); // Should still be throttled

    // New delay completes
    act(() => {
      vi.advanceTimersByTime(500);
    });
    rerender({ value: 'change4', delay: 1000 });
    expect(result.current).toBe('change4'); // Should now update
  });

  it('should handle zero delay', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useThrottle(value, delay),
      {
        initialProps: { value: 'initial', delay: 0 },
      }
    );

    // With zero delay, every change should be immediate
    rerender({ value: 'change1', delay: 0 });
    expect(result.current).toBe('change1');

    rerender({ value: 'change2', delay: 0 });
    expect(result.current).toBe('change2');

    rerender({ value: 'change3', delay: 0 });
    expect(result.current).toBe('change3');
  });

  it('should cleanup timer on unmount', () => {
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
    const { unmount, rerender } = renderHook(
      ({ value, delay }) => useThrottle(value, delay),
      {
        initialProps: { value: 'initial', delay: 500 },
      }
    );

    // Trigger throttle
    rerender({ value: 'change', delay: 500 });

    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });
});