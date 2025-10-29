import { useCallback, useRef } from 'react';

/**
 * useThrottle Hook - 节流函数执行
 *
 * 在指定时间内只执行一次函数
 *
 * @param callback - 要节流的函数
 * @param delay - 节流延迟时间(ms)
 * @returns 节流后的函数
 *
 * @example
 * ```tsx
 * const handleScroll = useThrottle(() => {
 *   console.log('Scrolling...');
 * }, 200);
 *
 * <div onScroll={handleScroll}>...</div>
 * ```
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const lastRunRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastRun = now - lastRunRef.current;

      if (timeSinceLastRun >= delay) {
        // 如果距离上次执行已经超过延迟时间，立即执行
        callback(...args);
        lastRunRef.current = now;
      } else {
        // 否则，取消之前的计时器，设置新的计时器在剩余时间后执行
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
          callback(...args);
          lastRunRef.current = Date.now();
        }, delay - timeSinceLastRun);
      }
    },
    [callback, delay]
  );
}
