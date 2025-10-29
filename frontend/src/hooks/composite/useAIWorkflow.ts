import { useCallback, useEffect } from 'react';
import { useWorkflowStages } from '../business/workflow/useWorkflowStages';
import { useDocuments } from '../business/document/useDocuments';
import { useTodos } from '../business/dialog/useTodos';
import type { WorkflowStage, Task } from '../../types/workflow';
import type { Document } from '../../types/models';

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
 * 依赖：useWorkflowStages, useDocuments, useTodos (Business Layer)
 *
 * @param options - 配置选项
 * @returns 工作流相关操作和状态
 *
 * @example
 * ```tsx
 * const {
 *   stages,
 *   documents,
 *   addStageWithTasks,
 *   completeTask
 * } = useAIWorkflow({ sessionId: 'project-001' });
 * ```
 */
export function useAIWorkflow(options: UseAIWorkflowOptions) {
  const { sessionId, autoSyncTodos = true } = options;

  const {
    stages,
    addStage,
    updateStage,
    updateStageStatus,
    addTaskToStage,
    updateTaskInStage,
    getStageProgress,
  } = useWorkflowStages();

  const {
    documents,
    selectedDocument,
    addDocument,
    updateDocument,
    selectDocument,
  } = useDocuments();

  const { todos } = useTodos();

  // 自动同步 TodoWrite 到工作流
  useEffect(() => {
    if (!autoSyncTodos || todos.length === 0) return;

    // 查找或创建 "任务列表" 阶段
    let taskListStage = stages.find((s) => s.name === '任务列表');

    if (!taskListStage) {
      // 创建新阶段
      const newStage: WorkflowStage = {
        id: 'stage-tasks',
        name: '任务列表',
        status: 'in_progress',
        tasks: [],
      };
      addStage(newStage);
      taskListStage = newStage;
    }

    // 同步 todos 到 tasks
    const tasks: Task[] = todos.map((todo) => ({
      id: `task-${Date.now()}-${Math.random()}`,
      name: todo.content,
      status: todo.status,
      description: todo.content,
    }));

    updateStage(taskListStage.id, {
      ...taskListStage,
      tasks,
      status:
        todos.every((t) => t.status === 'completed')
          ? 'completed'
          : todos.some((t) => t.status === 'in_progress')
            ? 'in_progress'
            : 'pending',
    });
  }, [todos, stages, autoSyncTodos, addStage, updateStage]);

  // 添加带任务的阶段
  const addStageWithTasks = useCallback(
    (stage: Omit<WorkflowStage, 'id'>, tasks: Omit<Task, 'id'>[]) => {
      const stageId = `stage-${Date.now()}`;
      const stageTasks: Task[] = tasks.map((task, index) => ({
        ...task,
        id: `task-${stageId}-${index}`,
      }));

      addStage({
        ...stage,
        id: stageId,
        tasks: stageTasks,
      });

      return stageId;
    },
    [addStage]
  );

  // 完成任务（自动更新阶段状态）
  const completeTask = useCallback(
    (stageId: string, taskId: string) => {
      updateTaskInStage(stageId, taskId, { status: 'completed' });

      // 检查该阶段所有任务是否完成
      const stage = stages.find((s) => s.id === stageId);
      if (stage && stage.tasks) {
        const allCompleted = stage.tasks.every(
          (t) => t.id === taskId || t.status === 'completed'
        );
        if (allCompleted) {
          updateStageStatus(stageId, 'completed');
        }
      }
    },
    [stages, updateTaskInStage, updateStageStatus]
  );

  // 开始任务
  const startTask = useCallback(
    (stageId: string, taskId: string) => {
      updateTaskInStage(stageId, taskId, { status: 'in_progress' });
      updateStageStatus(stageId, 'in_progress');
    },
    [updateTaskInStage, updateStageStatus]
  );

  // 添加文档到阶段
  const addDocumentToStage = useCallback(
    (stageId: string, document: Omit<Document, 'id'>) => {
      const docId = `doc-${Date.now()}`;
      const newDoc: Document = {
        ...document,
        id: docId,
      };

      addDocument(newDoc);

      // 更新阶段的文档引用
      const stage = stages.find((s) => s.id === stageId);
      if (stage) {
        const documents = stage.documents || [];
        updateStage(stageId, {
          ...stage,
          documents: [...documents, docId],
        });
      }

      return docId;
    },
    [stages, addDocument, updateStage]
  );

  // 获取阶段的所有文档
  const getStageDocuments = useCallback(
    (stageId: string): Document[] => {
      const stage = stages.find((s) => s.id === stageId);
      if (!stage || !stage.documents) return [];

      return documents.filter((doc) => stage.documents?.includes(doc.id));
    },
    [stages, documents]
  );

  // 获取工作流整体进度
  const getOverallProgress = useCallback((): number => {
    if (stages.length === 0) return 0;

    const totalProgress = stages.reduce((sum, stage) => {
      return sum + getStageProgress(stage.id);
    }, 0);

    return Math.round(totalProgress / stages.length);
  }, [stages, getStageProgress]);

  return {
    // 工作流数据
    stages,
    documents,
    selectedDocument,
    todos,

    // 阶段操作
    addStage,
    updateStage,
    updateStageStatus,
    addStageWithTasks,

    // 任务操作
    addTaskToStage,
    updateTaskInStage,
    completeTask,
    startTask,
    getStageProgress,

    // 文档操作
    addDocument,
    updateDocument,
    selectDocument,
    addDocumentToStage,
    getStageDocuments,

    // 工作流统计
    getOverallProgress,
  };
}
