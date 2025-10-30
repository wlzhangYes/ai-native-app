import { useCallback, useEffect, useRef } from 'react';
import { useWorkflowStore } from '../../stores/useWorkflowStore';
import { useDialogStore } from '../../stores/useDialogStore';
import { useTodos } from '../business/dialog/useTodos';
import type { Workflow } from '../../types/models';

interface UseAIWorkflowOptions {
  sessionId: string;
  autoSyncTodos?: boolean; // 是否自动同步 TodoWrite 到工作流
}

/**
 * useAIWorkflow Hook - AI 工作流功能组合
 *
 * 整合工作流阶段、任务、文档、TodoWrite 等功能
 * 提供统一的 AI 工作流管理接口
 *
 * 依赖：useWorkflowStore (Zustand), useDialogStore (Zustand), useTodos (Business Layer)
 *
 * @param options - 配置选项
 * @returns 工作流相关操作和状态
 *
 * @example
 * ```tsx
 * const {
 *   workflow,
 *   todos,
 *   expandedKeys,
 *   selectedKeys,
 *   setExpandedKeys,
 *   setSelectedKeys
 * } = useAIWorkflow({ sessionId: 'project-001' });
 * ```
 */
export function useAIWorkflow(options: UseAIWorkflowOptions) {
  const { sessionId, autoSyncTodos = true } = options;

  // Workflow Store
  const workflow = useWorkflowStore((state) => state.workflow);
  const activeStageId = useWorkflowStore((state) => state.activeStageId);
  const expandedKeys = useWorkflowStore((state) => state.expandedKeys);
  const selectedKeys = useWorkflowStore((state) => state.selectedKeys);
  const setExpandedKeys = useWorkflowStore((state) => state.setExpandedKeys);
  const setSelectedKeys = useWorkflowStore((state) => state.setSelectedKeys);
  const setActiveStage = useWorkflowStore((state) => state.setActiveStage);
  const setSelectedDocument = useWorkflowStore((state) => state.setSelectedDocument);
  const setSelectedTask = useWorkflowStore((state) => state.setSelectedTask);
  const syncTodosToTasks = useWorkflowStore((state) => state.syncTodosToTasks);

  // Dialog Store (for tool calls)
  const toolCalls = useDialogStore((state) => state.toolCalls);

  // Extract todos from tool calls
  const { todos } = useTodos(toolCalls);

  // Track last synced todos to avoid infinite loops
  const lastTodosRef = useRef<string>('');

  // Auto-sync todos to workflow tasks
  useEffect(() => {
    if (!autoSyncTodos || todos.length === 0) return;

    // Compare todos by JSON string to avoid infinite loops
    const todosKey = JSON.stringify(todos);
    if (todosKey !== lastTodosRef.current) {
      console.log('[useAIWorkflow] Auto-syncing todos to tasks:', todos);
      syncTodosToTasks(todos);
      lastTodosRef.current = todosKey;
    }
  }, [todos, autoSyncTodos, syncTodosToTasks]);

  // Select stage
  const selectStage = useCallback(
    (stageId: string) => {
      setActiveStage(stageId);
      setSelectedKeys([`stage-${stageId}`]);
    },
    [setActiveStage, setSelectedKeys]
  );

  // Select task
  const selectTask = useCallback(
    (stageId: string, taskId: string) => {
      setSelectedTask(taskId);
      setSelectedKeys([`task-${taskId}`]);
    },
    [setSelectedTask, setSelectedKeys]
  );

  // Select document
  const selectDocument = useCallback(
    (documentId: string) => {
      setSelectedDocument(documentId);
      setSelectedKeys([`doc-${documentId}`]);
    },
    [setSelectedDocument, setSelectedKeys]
  );

  // Expand all stages
  const expandAll = useCallback(() => {
    if (!workflow) return;
    const allKeys = workflow.stages.map((stage) => `stage-${stage.id}`);
    setExpandedKeys(allKeys);
  }, [workflow, setExpandedKeys]);

  // Collapse all stages
  const collapseAll = useCallback(() => {
    setExpandedKeys([]);
  }, [setExpandedKeys]);

  // Get stage by id
  const getStage = useCallback(
    (stageId: string) => {
      return workflow?.stages.find((s) => s.id === stageId);
    },
    [workflow]
  );

  // Get task by id
  const getTask = useCallback(
    (stageId: string, taskId: string) => {
      const stage = workflow?.stages.find((s) => s.id === stageId);
      return stage?.tasks.find((t) => t.id === taskId);
    },
    [workflow]
  );

  // Get document by id
  const getDocument = useCallback(
    (documentId: string) => {
      return workflow?.documents?.find((d) => d.id === documentId);
    },
    [workflow]
  );

  // Get workflow progress
  const getProgress = useCallback(() => {
    if (!workflow || workflow.stages.length === 0) return 0;

    const totalTasks = workflow.stages.reduce(
      (sum, stage) => sum + stage.tasks.length,
      0
    );

    if (totalTasks === 0) return 0;

    const completedTasks = workflow.stages.reduce(
      (sum, stage) =>
        sum + stage.tasks.filter((t) => t.status === 'completed').length,
      0
    );

    return Math.round((completedTasks / totalTasks) * 100);
  }, [workflow]);

  // Check if should use ThoughtChain display
  const shouldUseThoughtChain = useCallback(() => {
    // 有 todos 且没有工作流 → 使用 ThoughtChain
    if (todos.length > 0 && !workflow) {
      return true;
    }

    // 工作流只有一个阶段且是自动生成的 'stage-todos' → 使用 ThoughtChain
    if (workflow?.stages.length === 1 && workflow.stages[0].id === 'stage-todos') {
      return true;
    }

    // 其他情况使用 Tree（多阶段工作流）
    return false;
  }, [todos, workflow]);

  return {
    // Workflow data
    workflow,
    todos,
    activeStageId,
    expandedKeys,
    selectedKeys,

    // Tree state management
    setExpandedKeys,
    setSelectedKeys,

    // Selection operations
    selectStage,
    selectTask,
    selectDocument,

    // Expand/collapse operations
    expandAll,
    collapseAll,

    // Query operations
    getStage,
    getTask,
    getDocument,
    getProgress,

    // Display mode
    shouldUseThoughtChain,
  };
}
