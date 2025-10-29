import { useCallback, useEffect, useState } from 'react';

/**
 * useSession Hook - 会话管理
 *
 * 管理当前会话 ID，支持会话切换和持久化
 * 用于多会话数据隔离（见 TEMPLATE_ARCHITECTURE.md）
 *
 * @param storageKey - 存储键名
 * @returns { sessionId, setSessionId, clearSession }
 *
 * @example
 * ```tsx
 * const { sessionId, setSessionId } = useSession('current-session');
 *
 * // 切换会话
 * setSessionId('project-002');
 * ```
 */
export function useSession(storageKey = 'current-session-id') {
  const [sessionId, setSessionIdState] = useState<string>(() => {
    // 从 localStorage 恢复会话 ID
    return localStorage.getItem(storageKey) || '';
  });

  // 更新会话 ID
  const setSessionId = useCallback(
    (newSessionId: string) => {
      setSessionIdState(newSessionId);
      localStorage.setItem(storageKey, newSessionId);

      // 触发自定义事件，通知其他组件会话已切换
      window.dispatchEvent(
        new CustomEvent('session-changed', {
          detail: { sessionId: newSessionId },
        })
      );
    },
    [storageKey]
  );

  // 清除会话
  const clearSession = useCallback(() => {
    setSessionIdState('');
    localStorage.removeItem(storageKey);

    window.dispatchEvent(
      new CustomEvent('session-changed', {
        detail: { sessionId: '' },
      })
    );
  }, [storageKey]);

  // 监听其他组件触发的会话切换事件
  useEffect(() => {
    const handleSessionChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ sessionId: string }>;
      setSessionIdState(customEvent.detail.sessionId);
    };

    window.addEventListener('session-changed', handleSessionChange);
    return () => {
      window.removeEventListener('session-changed', handleSessionChange);
    };
  }, []);

  return {
    sessionId,
    setSessionId,
    clearSession,
  };
}
