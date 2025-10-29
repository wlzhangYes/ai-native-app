import { useCallback, useEffect, useState } from 'react';

/**
 * useLocalStorage Hook - LocalStorage 状态同步
 *
 * 提供与 localStorage 同步的状态管理
 * 支持跨标签页同步
 *
 * @param key - 存储键名
 * @param initialValue - 初始值
 * @returns [value, setValue, removeValue]
 *
 * @example
 * ```tsx
 * const [user, setUser, removeUser] = useLocalStorage('user', null);
 *
 * setUser({ id: 1, name: 'Alice' });
 * ```
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  // 从 localStorage 读取初始值
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // 更新值
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        // 支持函数式更新
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;

        setStoredValue(valueToStore);
        window.localStorage.setItem(key, JSON.stringify(valueToStore));

        // 触发自定义事件，通知其他 hooks
        window.dispatchEvent(
          new CustomEvent('local-storage', {
            detail: { key, value: valueToStore },
          })
        );
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  // 删除值
  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);

      window.dispatchEvent(
        new CustomEvent('local-storage', {
          detail: { key, value: null },
        })
      );
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  // 监听 storage 事件（跨标签页同步）
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch (error) {
          console.error(`Error parsing storage event for key "${key}":`, error);
        }
      }
    };

    // 监听自定义事件（同一标签页内同步）
    const handleCustomEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ key: string; value: T }>;
      if (customEvent.detail.key === key) {
        setStoredValue(customEvent.detail.value);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('local-storage', handleCustomEvent);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('local-storage', handleCustomEvent);
    };
  }, [key]);

  return [storedValue, setValue, removeValue];
}
