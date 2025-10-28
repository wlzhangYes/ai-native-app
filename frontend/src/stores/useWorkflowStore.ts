// Workflow Store - Manages workflow state and tree structure
// Based on data-model.md Zustand store design

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { Workflow, Stage, Task, StageStatus, TaskStatus, Todo } from '@/types/models';

// ============================================================================
// Store State Interface
// ============================================================================

interface WorkflowStore {
  // State
  currentSessionId: string | null; // 当前会话ID，用于隔离数据
  workflow: Workflow | null;
  activeStageId: string | null;
  selectedDocumentId: string | null;
  selectedTaskId: string | null; // Currently selected task in workflow tree
  expandedKeys: string[]; // Tree expanded node keys
  selectedKeys: string[]; // Tree selected node keys

  // Actions
  setCurrentSession: (sessionId: string) => void; // 切换会话并加载对应数据
  setWorkflow: (workflow: Workflow) => void;
  updateStage: (stageId: string, updates: Partial<Stage>) => void;
  updateStageStatus: (stageId: string, status: StageStatus) => void;
  addTask: (stageId: string, task: Task) => void;
  updateTask: (stageId: string, taskId: string, updates: Partial<Task>) => void;
  updateTaskStatus: (stageId: string, taskId: string, status: TaskStatus) => void;
  setActiveStage: (stageId: string) => void;
  setSelectedDocument: (documentId: string | null) => void;
  setSelectedTask: (taskId: string | null) => void;
  setExpandedKeys: (keys: string[]) => void;
  setSelectedKeys: (keys: string[]) => void;
  toggleExpanded: (key: string) => void;
  clearWorkflow: () => void;
  syncTodosToTasks: (todos: Todo[]) => void; // Sync TodoWrite todos to active stage tasks
}

// ============================================================================
// Store Implementation
// ============================================================================

// Helper functions for session-based localStorage
const getWorkflowStorageKey = (sessionId: string) => `workflow-session-${sessionId}`;

const saveWorkflowToStorage = (sessionId: string, data: {
  workflow: Workflow | null;
  activeStageId: string | null;
  expandedKeys: string[];
  selectedKeys: string[];
}) => {
  try {
    const key = getWorkflowStorageKey(sessionId);
    localStorage.setItem(key, JSON.stringify(data));
    console.log(`[WorkflowStore] Saved session data to ${key}`);
  } catch (error) {
    console.error('[WorkflowStore] Failed to save session data:', error);
  }
};

const loadWorkflowFromStorage = (sessionId: string) => {
  try {
    const key = getWorkflowStorageKey(sessionId);
    const data = localStorage.getItem(key);
    if (data) {
      const parsed = JSON.parse(data);
      console.log(`[WorkflowStore] Loaded session data from ${key}`);
      return parsed;
    }
  } catch (error) {
    console.error('[WorkflowStore] Failed to load session data:', error);
  }
  return null;
};

export const useWorkflowStore = create<WorkflowStore>()(
  devtools(
    persist(
      immer((set, get) => ({
      // Initial state
      currentSessionId: null,
      workflow: null,
      activeStageId: null,
      selectedDocumentId: null,
      selectedTaskId: null,
      expandedKeys: [],
      selectedKeys: [],

      // 设置当前会话并加载对应数据
      setCurrentSession: (sessionId) =>
        set((state) => {
          console.log(`[WorkflowStore] Switching to session: ${sessionId}`);

          // 保存当前会话数据（如果有）
          if (state.currentSessionId) {
            saveWorkflowToStorage(state.currentSessionId, {
              workflow: state.workflow,
              activeStageId: state.activeStageId,
              expandedKeys: state.expandedKeys,
              selectedKeys: state.selectedKeys,
            });
          }

          // 加载新会话数据
          const sessionData = loadWorkflowFromStorage(sessionId);
          state.currentSessionId = sessionId;
          state.workflow = sessionData?.workflow || null;
          state.activeStageId = sessionData?.activeStageId || null;
          state.expandedKeys = sessionData?.expandedKeys || [];
          state.selectedKeys = sessionData?.selectedKeys || [];
          state.selectedDocumentId = null;
          state.selectedTaskId = null;
        }),

      // Set entire workflow
      setWorkflow: (workflow) =>
        set((state) => {
          state.workflow = workflow;
          if (workflow.stages.length > 0) {
            state.activeStageId = workflow.stages[workflow.currentStageIndex]?.id || null;
          }
        }),

      // Update a specific stage
      updateStage: (stageId, updates) =>
        set((state) => {
          if (state.workflow) {
            const stageIndex = state.workflow.stages.findIndex((s) => s.id === stageId);
            if (stageIndex !== -1) {
              state.workflow.stages[stageIndex] = {
                ...state.workflow.stages[stageIndex],
                ...updates,
              };
            }
          }
        }),

      // Update stage status
      updateStageStatus: (stageId, status) =>
        set((state) => {
          if (state.workflow) {
            const stageIndex = state.workflow.stages.findIndex((s) => s.id === stageId);
            if (stageIndex !== -1) {
              state.workflow.stages[stageIndex].status = status;
              if (status === 'completed') {
                state.workflow.stages[stageIndex].completedAt = new Date().toISOString();
              }
            }
          }
        }),

      // Add a task to a stage
      addTask: (stageId, task) =>
        set((state) => {
          if (state.workflow) {
            const stageIndex = state.workflow.stages.findIndex((s) => s.id === stageId);
            if (stageIndex !== -1) {
              state.workflow.stages[stageIndex].tasks.push(task);
            }
          }
        }),

      // Update a specific task
      updateTask: (stageId, taskId, updates) =>
        set((state) => {
          if (state.workflow) {
            const stageIndex = state.workflow.stages.findIndex((s) => s.id === stageId);
            if (stageIndex !== -1) {
              const taskIndex = state.workflow.stages[stageIndex].tasks.findIndex((t) => t.id === taskId);
              if (taskIndex !== -1) {
                state.workflow.stages[stageIndex].tasks[taskIndex] = {
                  ...state.workflow.stages[stageIndex].tasks[taskIndex],
                  ...updates,
                };
              }
            }
          }
        }),

      // Update task status
      updateTaskStatus: (stageId, taskId, status) =>
        set((state) => {
          if (state.workflow) {
            const stageIndex = state.workflow.stages.findIndex((s) => s.id === stageId);
            if (stageIndex !== -1) {
              const taskIndex = state.workflow.stages[stageIndex].tasks.findIndex((t) => t.id === taskId);
              if (taskIndex !== -1) {
                state.workflow.stages[stageIndex].tasks[taskIndex].status = status;
                if (status === 'completed') {
                  state.workflow.stages[stageIndex].tasks[taskIndex].completedAt = new Date().toISOString();
                }
              }
            }
          }
        }),

      // Set active stage
      setActiveStage: (stageId) =>
        set((state) => {
          state.activeStageId = stageId;
        }),

      // Set selected document
      setSelectedDocument: (documentId) =>
        set((state) => {
          state.selectedDocumentId = documentId;
        }),

      // Set selected task
      setSelectedTask: (taskId) =>
        set((state) => {
          state.selectedTaskId = taskId;
        }),

      // Set expanded tree keys
      setExpandedKeys: (keys) =>
        set((state) => {
          state.expandedKeys = keys;
        }),

      // Set selected tree keys
      setSelectedKeys: (keys) =>
        set((state) => {
          state.selectedKeys = keys;
        }),

      // Toggle a single expanded key
      toggleExpanded: (key) =>
        set((state) => {
          const index = state.expandedKeys.indexOf(key);
          if (index !== -1) {
            state.expandedKeys.splice(index, 1);
          } else {
            state.expandedKeys.push(key);
          }
        }),

      // Clear workflow state
      clearWorkflow: () =>
        set((state) => {
          state.workflow = null;
          state.activeStageId = null;
          state.selectedDocumentId = null;
          state.selectedTaskId = null;
          state.expandedKeys = [];
          state.selectedKeys = [];
        }),

      // Sync TodoWrite todos to active stage tasks
      syncTodosToTasks: (todos) =>
        set((state) => {
          console.log('[WorkflowStore] Syncing todos to tasks (flat structure):', todos);

          // Helper function to map todo status to task status
          const mapTodoStatus = (status: string): TaskStatus => {
            switch (status) {
              case 'in_progress':
                return 'in_progress' as TaskStatus;
              case 'completed':
                return 'completed' as TaskStatus;
              default:
                return 'pending' as TaskStatus;
            }
          };

          // Determine stage status based on todos
          const allCompleted = todos.every((todo) => todo.status === 'completed');
          const anyInProgress = todos.some((todo) => todo.status === 'in_progress');

          let stageStatus: StageStatus;
          if (allCompleted) {
            stageStatus = 'completed' as StageStatus;
          } else if (anyInProgress || todos.length > 0) {
            stageStatus = 'in_progress' as StageStatus;
          } else {
            stageStatus = 'pending' as StageStatus;
          }

          // Create a single stage containing all todos as tasks
          const singleStage: Stage = {
            id: 'stage-todos',
            workflowId: state.workflow?.id || 'workflow-default',
            name: '任务列表',
            description: 'AI 生成的任务列表',
            order: 0,
            status: stageStatus,
            tasks: todos.map((todo, index) => {
              const taskId = `task-${Date.now()}-${index}`;
              return {
                id: taskId,
                stageId: 'stage-todos',
                name: todo.content,
                description: todo.activeForm !== todo.content ? todo.activeForm : undefined,
                status: mapTodoStatus(todo.status),
                createdAt: new Date().toISOString(),
                completedAt: todo.status === 'completed' ? new Date().toISOString() : undefined,
              };
            }),
            documents: [],
            createdAt: new Date().toISOString(),
            completedAt: allCompleted ? new Date().toISOString() : undefined,
          };

          // If workflow doesn't exist, create a new one
          if (!state.workflow) {
            state.workflow = {
              id: 'workflow-default',
              projectId: 'project-default',
              name: '默认工作流',
              description: 'AI 生成的工作流',
              stages: [singleStage],
              currentStageIndex: 0,
              status: 'in_progress' as StageStatus,
              createdAt: new Date().toISOString(),
            };
            state.activeStageId = 'stage-todos';
            console.log(`[WorkflowStore] Created new workflow with ${todos.length} flat tasks`);
          } else {
            // Replace entire workflow with single flat stage
            state.workflow.stages = [singleStage];
            state.workflow.currentStageIndex = 0;
            state.activeStageId = 'stage-todos';
            console.log(`[WorkflowStore] Replaced workflow with ${todos.length} flat tasks`);
          }
        }),
      })),
      {
        name: 'workflow-store',
        partialize: (state) => ({
          workflow: state.workflow,
          activeStageId: state.activeStageId,
          selectedDocumentId: state.selectedDocumentId,
          selectedTaskId: state.selectedTaskId,
          expandedKeys: state.expandedKeys,
          selectedKeys: state.selectedKeys,
        }),
      }
    ),
    { name: 'WorkflowStore' }
  )
);

// ============================================================================
// Selectors
// ============================================================================

export const selectWorkflow = (state: WorkflowStore) => state.workflow;
export const selectActiveStageId = (state: WorkflowStore) => state.activeStageId;
export const selectActiveStage = (state: WorkflowStore) =>
  state.workflow?.stages.find((s) => s.id === state.activeStageId);
export const selectExpandedKeys = (state: WorkflowStore) => state.expandedKeys;
export const selectSelectedKeys = (state: WorkflowStore) => state.selectedKeys;
