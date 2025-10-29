import { useEffect, useRef } from 'react';

/**
 * usePrevious Hook - 获取上一次的值
 *
 * 保存并返回上一次渲染时的值
 *
 * @param value - 当前值
 * @returns 上一次的值
 *
 * @example
 * ```tsx
 * const [count, setCount] = useState(0);
 * const prevCount = usePrevious(count);
 *
 * console.log(`当前: ${count}, 上一次: ${prevCount}`);
 * ```
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}
