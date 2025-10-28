// UI Action Store - Manages dialog-driven UI actions
// 管理对话驱动的UI操作（如自动选择模板、自动填写表单等）

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

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
  pendingActions: UIAction[];  // 待执行的操作队列
  executedActions: UIAction[]; // 已执行的操作历史

  // Actions
  addAction: (type: UIActionType, payload: any, source?: 'dialog' | 'sse' | 'manual') => string;
  executeAction: (actionId: string) => void;
  clearAction: (actionId: string) => void;
  clearAllPendingActions: () => void;
  getLatestActionByType: (type: UIActionType) => UIAction | null;
}

// ============================================================================
// Store Implementation
// ============================================================================

export const useUIActionStore = create<UIActionStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      pendingActions: [],
      executedActions: [],

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

        set((state) => ({
          pendingActions: [...state.pendingActions, newAction],
        }));

        return actionId;
      },

      // Mark action as executed
      executeAction: (actionId) => {
        console.log('[UIActionStore] Executing action:', actionId);

        set((state) => {
          const action = state.pendingActions.find((a) => a.id === actionId);
          if (!action) return state;

          return {
            pendingActions: state.pendingActions.filter((a) => a.id !== actionId),
            executedActions: [
              ...state.executedActions,
              { ...action, executed: true },
            ],
          };
        });
      },

      // Remove action without executing
      clearAction: (actionId) => {
        console.log('[UIActionStore] Clearing action:', actionId);

        set((state) => ({
          pendingActions: state.pendingActions.filter((a) => a.id !== actionId),
        }));
      },

      // Clear all pending actions
      clearAllPendingActions: () => {
        console.log('[UIActionStore] Clearing all pending actions');

        set({
          pendingActions: [],
        });
      },

      // Get latest action by type
      getLatestActionByType: (type) => {
        const { pendingActions } = get();
        const actions = pendingActions.filter((a) => a.type === type);
        return actions.length > 0 ? actions[actions.length - 1] : null;
      },
    }),
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
