// Unit tests for useToggle hook
// Tests boolean state toggling with initial values and custom setters

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useToggle } from './useToggle';

describe('useToggle', () => {
  it('should initialize with default value false', () => {
    const { result } = renderHook(() => useToggle());

    const [value] = result.current;
    expect(value).toBe(false);
  });

  it('should initialize with provided initial value', () => {
    const { result } = renderHook(() => useToggle(true));

    const [value] = result.current;
    expect(value).toBe(true);
  });

  it('should toggle value when toggle function is called', () => {
    const { result } = renderHook(() => useToggle(false));

    const [initialValue, toggle] = result.current;
    expect(initialValue).toBe(false);

    act(() => {
      toggle();
    });

    const [newValue] = result.current;
    expect(newValue).toBe(true);

    act(() => {
      toggle();
    });

    const [finalValue] = result.current;
    expect(finalValue).toBe(false);
  });

  it('should set value to true when setTrue is called', () => {
    const { result } = renderHook(() => useToggle(false));

    const [initialValue, , setTrue] = result.current;
    expect(initialValue).toBe(false);

    act(() => {
      setTrue();
    });

    const [newValue] = result.current;
    expect(newValue).toBe(true);

    // Calling setTrue again should keep it true
    act(() => {
      setTrue();
    });

    const [stillTrue] = result.current;
    expect(stillTrue).toBe(true);
  });

  it('should set value to false when setFalse is called', () => {
    const { result } = renderHook(() => useToggle(true));

    const [initialValue, , , setFalse] = result.current;
    expect(initialValue).toBe(true);

    act(() => {
      setFalse();
    });

    const [newValue] = result.current;
    expect(newValue).toBe(false);

    // Calling setFalse again should keep it false
    act(() => {
      setFalse();
    });

    const [stillFalse] = result.current;
    expect(stillFalse).toBe(false);
  });

  it('should provide stable function references', () => {
    const { result, rerender } = renderHook(() => useToggle());

    const [, toggle1, setTrue1, setFalse1] = result.current;

    rerender();

    const [, toggle2, setTrue2, setFalse2] = result.current;

    // Function references should be stable across re-renders
    expect(toggle1).toBe(toggle2);
    expect(setTrue1).toBe(setTrue2);
    expect(setFalse1).toBe(setFalse2);
  });

  it('should work with different initial values', () => {
    // Test with true initial value
    const { result: result1 } = renderHook(() => useToggle(true));
    const [value1, toggle1] = result1.current;
    expect(value1).toBe(true);

    act(() => {
      toggle1();
    });

    const [newValue1] = result1.current;
    expect(newValue1).toBe(false);

    // Test with false initial value
    const { result: result2 } = renderHook(() => useToggle(false));
    const [value2, toggle2] = result2.current;
    expect(value2).toBe(false);

    act(() => {
      toggle2();
    });

    const [newValue2] = result2.current;
    expect(newValue2).toBe(true);
  });

  it('should handle complex toggle sequences', () => {
    const { result } = renderHook(() => useToggle());

    const [, toggle, setTrue, setFalse] = result.current;

    // Start with false, toggle to true
    act(() => {
      toggle();
    });
    expect(result.current[0]).toBe(true);

    // Set to false explicitly
    act(() => {
      setFalse();
    });
    expect(result.current[0]).toBe(false);

    // Set to true explicitly
    act(() => {
      setTrue();
    });
    expect(result.current[0]).toBe(true);

    // Toggle back to false
    act(() => {
      toggle();
    });
    expect(result.current[0]).toBe(false);

    // Multiple toggles
    act(() => {
      toggle(); // true
      toggle(); // false
      toggle(); // true
    });
    expect(result.current[0]).toBe(true);
  });
});