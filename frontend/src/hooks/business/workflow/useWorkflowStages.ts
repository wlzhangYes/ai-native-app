import { useCallback } from 'react';
import { useWorkflowStore } from '../../../stores/useWorkflowStore';
import type { WorkflowStage, Task } from '../../../types/workflow';

/**
 * useWorkflowStages Hook - 工作流阶段管理
 *
 * 封装工作流阶段的 CRUD 操作
 * 依赖：useWorkflowStore (Zustand)
 *
 * @returns 工作流阶段相关操作和数据
 *
 * @example
 * ```tsx
 * const { stages, addStage, updateStageStatus } = useWorkflowStages();
 *
 * addStage({
 *   id: 'stage-1',
 *   name: '需求分析',
 *   status: 'pending'
 * });
 * ```
 */
export function useWorkflowStages() {
  const workflow = useWorkflowStore((state) => state.workflow);
  const setWorkflow = useWorkflowStore((state) => state.setWorkflow);
  const addStage = useWorkflowStore((state) => state.addStage);
  const updateStage = useWorkflowStore((state) => state.updateStage);
  const deleteStage = useWorkflowStore((state) => state.deleteStage);

  const stages = workflow?.stages || [];

  // 更新阶段状态
  const updateStageStatus = useCallback(
    (stageId: string, status: WorkflowStage['status']) => {
      const stage = stages.find((s) => s.id === stageId);
      if (stage) {
        updateStage(stageId, { ...stage, status });
      }
    },
    [stages, updateStage]
  );

  // 添加任务到阶段
  const addTaskToStage = useCallback(
    (stageId: string, task: Task) => {
      const stage = stages.find((s) => s.id === stageId);
      if (stage) {
        const updatedTasks = [...(stage.tasks || []), task];
        updateStage(stageId, { ...stage, tasks: updatedTasks });
      }
    },
    [stages, updateStage]
  );

  // 更新阶段中的任务
  const updateTaskInStage = useCallback(
    (stageId: string, taskId: string, updates: Partial<Task>) => {
      const stage = stages.find((s) => s.id === stageId);
      if (stage && stage.tasks) {
        const updatedTasks = stage.tasks.map((task) =>
          task.id === taskId ? { ...task, ...updates } : task
        );
        updateStage(stageId, { ...stage, tasks: updatedTasks });
      }
    },
    [stages, updateStage]
  );

  // 删除阶段中的任务
  const deleteTaskFromStage = useCallback(
    (stageId: string, taskId: string) => {
      const stage = stages.find((s) => s.id === stageId);
      if (stage && stage.tasks) {
        const updatedTasks = stage.tasks.filter((task) => task.id !== taskId);
        updateStage(stageId, { ...stage, tasks: updatedTasks });
      }
    },
    [stages, updateStage]
  );

  // 获取阶段进度（完成任务数 / 总任务数）
  const getStageProgress = useCallback(
    (stageId: string): number => {
      const stage = stages.find((s) => s.id === stageId);
      if (!stage || !stage.tasks || stage.tasks.length === 0) {
        return 0;
      }

      const completedTasks = stage.tasks.filter(
        (task) => task.status === 'completed'
      ).length;
      return Math.round((completedTasks / stage.tasks.length) * 100);
    },
    [stages]
  );

  // 获取所有进行中的阶段
  const getInProgressStages = useCallback(() => {
    return stages.filter((stage) => stage.status === 'in_progress');
  }, [stages]);

  // 获取所有已完成的阶段
  const getCompletedStages = useCallback(() => {
    return stages.filter((stage) => stage.status === 'completed');
  }, [stages]);

  return {
    workflow,
    stages,
    setWorkflow,
    addStage,
    updateStage,
    updateStageStatus,
    deleteStage,
    addTaskToStage,
    updateTaskInStage,
    deleteTaskFromStage,
    getStageProgress,
    getInProgressStages,
    getCompletedStages,
  };
}
