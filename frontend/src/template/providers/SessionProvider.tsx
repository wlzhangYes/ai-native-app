import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { useSession } from '../../hooks/infrastructure/useSession';

/**
 * Session Context 类型
 */
export interface SessionContextType {
  sessionId: string;
  setSessionId: (sessionId: string) => void;
  clearSession: () => void;
  storageKeyPrefix: string;
}

/**
 * Session Context
 */
const SessionContext = createContext<SessionContextType | null>(null);

/**
 * SessionProvider Props
 */
export interface SessionProviderProps {
  /** 当前会话 ID */
  sessionId: string;
  /** LocalStorage 存储键前缀（用于会话隔离） */
  storageKeyPrefix?: string;
  /** 子组件 */
  children: React.ReactNode;
  /** 会话变化回调 */
  onSessionChange?: (sessionId: string) => void;
}

/**
 * SessionProvider - 会话管理 Provider
 *
 * 管理当前会话 ID，提供会话上下文
 * 支持会话切换和数据隔离
 *
 * @example
 * ```tsx
 * <SessionProvider sessionId="project-001" storageKeyPrefix="app">
 *   <App />
 * </SessionProvider>
 * ```
 */
export const SessionProvider: React.FC<SessionProviderProps> = ({
  sessionId: propSessionId,
  storageKeyPrefix = 'app',
  children,
  onSessionChange,
}) => {
  const {
    sessionId: localSessionId,
    setSessionId: setLocalSessionId,
    clearSession,
  } = useSession(`${storageKeyPrefix}-session`);

  // 同步 prop sessionId 到 local state
  useEffect(() => {
    if (propSessionId !== localSessionId) {
      setLocalSessionId(propSessionId);
    }
  }, [propSessionId, localSessionId, setLocalSessionId]);

  // 监听会话变化，触发回调
  useEffect(() => {
    if (localSessionId && onSessionChange) {
      onSessionChange(localSessionId);
    }
  }, [localSessionId, onSessionChange]);

  // 创建 context value（使用 useMemo 避免不必要的重渲染）
  const contextValue = useMemo<SessionContextType>(
    () => ({
      sessionId: localSessionId,
      setSessionId: setLocalSessionId,
      clearSession,
      storageKeyPrefix,
    }),
    [localSessionId, setLocalSessionId, clearSession, storageKeyPrefix]
  );

  return (
    <SessionContext.Provider value={contextValue}>
      {children}
    </SessionContext.Provider>
  );
};

/**
 * useSessionContext Hook
 *
 * 在组件中使用会话上下文
 *
 * @example
 * ```tsx
 * const { sessionId, setSessionId } = useSessionContext();
 * ```
 */
export function useSessionContext(): SessionContextType {
  const context = useContext(SessionContext);

  if (!context) {
    throw new Error('useSessionContext must be used within SessionProvider');
  }

  return context;
}
