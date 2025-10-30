// UI Action Store - Manages dialog-driven UI actions
// 管理对话驱动的UI操作（如自动选择模板、自动填写表单等）

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// ============================================================================
// UI Action Types
// ============================================================================

/**
 * UI操作类型
 */
export type UIActionType =
  | 'select-template'      // 选择模板
  | 'select-task'          // 选择任务
  | 'fill-form'            // 填写表单
  | 'upload-file'          // 上传文件
  | 'navigate-to'          // 导航到某个位置
  | 'open-document';       // 打开文档

/**
 * UI操作数据接口
 */
export interface UIAction {
  id: string;              // 操作ID
  type: UIActionType;      // 操作类型
  payload: any;            // 操作数据
  timestamp: number;       // 时间戳
  executed: boolean;       // 是否已执行
  source: 'dialog' | 'sse' | 'manual'; // 操作来源
}

// ============================================================================
// Store State Interface
// ============================================================================

interface UIActionStore {
  // State
  currentSessionId: string | null; // 当前会话ID，用于隔离数据
  pendingActions: UIAction[];  // 待执行的操作队列
  executedActions: UIAction[]; // 已执行的操作历史

  // Actions
  setCurrentSession: (sessionId: string) => void; // 切换会话并加载对应数据
  saveSessionData: () => void; // 保存当前会话数据到 localStorage
  loadSessionData: (sessionId: string) => void; // 从 localStorage 加载会话数据
  addAction: (type: UIActionType, payload: any, source?: 'dialog' | 'sse' | 'manual') => string;
  executeAction: (actionId: string) => void;
  clearAction: (actionId: string) => void;
  clearAllPendingActions: () => void;
  getLatestActionByType: (type: UIActionType) => UIAction | null;
}

// ============================================================================
// Store Implementation
// ============================================================================

// Helper functions for session-based localStorage
const getUIActionStorageKey = (sessionId: string) => `ui-action-session-${sessionId}`;

const saveUIActionsToStorage = (sessionId: string, data: {
  pendingActions: UIAction[];
  executedActions: UIAction[];
}) => {
  try {
    const key = getUIActionStorageKey(sessionId);
    localStorage.setItem(key, JSON.stringify(data));
    console.log(`[UIActionStore] Saved session data to ${key}`);
  } catch (error) {
    console.error('[UIActionStore] Failed to save session data:', error);
  }
};

const loadUIActionsFromStorage = (sessionId: string): {
  pendingActions: UIAction[];
  executedActions: UIAction[];
} | null => {
  try {
    const key = getUIActionStorageKey(sessionId);
    const data = localStorage.getItem(key);
    if (data) {
      const parsed = JSON.parse(data);
      console.log(`[UIActionStore] Loaded session data from ${key}`);
      return {
        pendingActions: parsed.pendingActions || [],
        executedActions: parsed.executedActions || [],
      };
    }
  } catch (error) {
    console.error('[UIActionStore] Failed to load session data:', error);
  }
  return null;
};

export const useUIActionStore = create<UIActionStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        currentSessionId: null,
        pendingActions: [],
        executedActions: [],

        // 设置当前会话并加载对应数据
        setCurrentSession: (sessionId) =>
          set((state) => {
            console.log(`[UIActionStore] Switching to session: ${sessionId}`);

            // 保存当前会话数据（如果有）
            if (state.currentSessionId) {
              saveUIActionsToStorage(state.currentSessionId, {
                pendingActions: state.pendingActions,
                executedActions: state.executedActions,
              });
            }

            // 加载新会话数据
            const sessionData = loadUIActionsFromStorage(sessionId);
            state.currentSessionId = sessionId;
            state.pendingActions = sessionData?.pendingActions || [];
            state.executedActions = sessionData?.executedActions || [];
          }),

        // 保存当前会话数据
        saveSessionData: () => {
          const state = get();
          if (state.currentSessionId) {
            saveUIActionsToStorage(state.currentSessionId, {
              pendingActions: state.pendingActions,
              executedActions: state.executedActions,
            });
          }
        },

        // 加载会话数据
        loadSessionData: (sessionId) =>
          set((state) => {
            const sessionData = loadUIActionsFromStorage(sessionId);
            if (sessionData) {
              state.pendingActions = sessionData.pendingActions;
              state.executedActions = sessionData.executedActions;
            }
          }),

        // Add a new UI action
        addAction: (type, payload, source = 'dialog') => {
          const actionId = `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

          const newAction: UIAction = {
            id: actionId,
            type,
            payload,
            timestamp: Date.now(),
            executed: false,
            source,
          };

          console.log('[UIActionStore] Adding action:', newAction);

          set((state) => {
            state.pendingActions.push(newAction);
          });

          return actionId;
        },

        // Mark action as executed
        executeAction: (actionId) => {
          console.log('[UIActionStore] Executing action:', actionId);

          set((state) => {
            const action = state.pendingActions.find((a) => a.id === actionId);
            if (!action) return;

            state.pendingActions = state.pendingActions.filter((a) => a.id !== actionId);
            state.executedActions.push({ ...action, executed: true });
          });
        },

        // Remove action without executing
        clearAction: (actionId) => {
          console.log('[UIActionStore] Clearing action:', actionId);

          set((state) => {
            state.pendingActions = state.pendingActions.filter((a) => a.id !== actionId);
          });
        },

        // Clear all pending actions
        clearAllPendingActions: () => {
          console.log('[UIActionStore] Clearing all pending actions');

          set((state) => {
            state.pendingActions = [];
          });
        },

        // Get latest action by type
        getLatestActionByType: (type) => {
          const { pendingActions } = get();
          const actions = pendingActions.filter((a) => a.type === type);
          return actions.length > 0 ? actions[actions.length - 1] : null;
        },
      })),
      {
        name: 'ui-action-store',
        partialize: (state) => ({
          // Don't persist session data - managed by session-based localStorage
          // Don't persist currentSessionId, pendingActions, or executedActions
        }),
      }
    ),
    { name: 'UIActionStore' }
  )
);

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to consume and execute UI actions of a specific type
 *
 * @param type - Action type to listen for
 * @param handler - Handler function to execute when action is available
 */
export function useUIAction<T = any>(
  type: UIActionType,
  handler: (payload: T, actionId: string) => void
) {
  const pendingActions = useUIActionStore((state) => state.pendingActions);
  const executeAction = useUIActionStore((state) => state.executeAction);

  // Find actions of the specified type
  const relevantActions = pendingActions.filter((a) => a.type === type);

  // Execute the handler for each relevant action
  relevantActions.forEach((action) => {
    try {
      handler(action.payload as T, action.id);
      executeAction(action.id);
    } catch (error) {
      console.error(`[useUIAction] Error executing action ${action.id}:`, error);
      executeAction(action.id); // Mark as executed even if error occurred
    }
  });
}