import { useCallback, useState } from 'react';

/**
 * useToggle Hook - 布尔状态切换
 *
 * 提供简单的布尔值切换功能
 *
 * @param initialValue - 初始值(默认 false)
 * @returns [当前值, 切换函数, 设置为true函数, 设置为false函数]
 *
 * @example
 * ```tsx
 * const [isOpen, toggle, open, close] = useToggle(false);
 *
 * <Modal open={isOpen} onClose={close}>
 *   <button onClick={toggle}>Toggle</button>
 * </Modal>
 * ```
 */
export function useToggle(
  initialValue = false
): [boolean, () => void, () => void, () => void] {
  const [value, setValue] = useState(initialValue);

  const toggle = useCallback(() => {
    setValue((prev) => !prev);
  }, []);

  const setTrue = useCallback(() => {
    setValue(true);
  }, []);

  const setFalse = useCallback(() => {
    setValue(false);
  }, []);

  return [value, toggle, setTrue, setFalse];
}
