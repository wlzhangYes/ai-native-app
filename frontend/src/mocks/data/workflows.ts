// Mock data for Workflows
// Based on data-model.md workflow structure

import type { Workflow } from '@/types/models';
import { StageStatus, TaskStatus } from '@/types/models';

export const mockWorkflows: Workflow[] = [
  {
    id: 'workflow-001',
    projectId: 'proj-001',
    currentStageIndex: 0,
    stages: [
      {
        id: 'stage-0-001',
        stageNumber: 0,
        name: '项目初始化',
        status: StageStatus.Pending,
        tasks: [
          {
            id: 'task-001',
            stageId: 'stage-0-001',
            name: '确定项目归属',
            status: TaskStatus.Completed,
            createdAt: '2025-10-27T09:00:00Z',
            completedAt: '2025-10-27T09:10:00Z',
          },
          {
            id: 'task-002',
            stageId: 'stage-0-001',
            name: '创建宪章',
            status: TaskStatus.Completed,
            createdAt: '2025-10-27T09:05:00Z',
            completedAt: '2025-10-27T09:20:00Z',
            metadata: {
              uiComponentType: 'template-selection',
            },
          },
        ],
      },
      {
        id: 'stage-1-001',
        stageNumber: 1,
        name: '需求阶段',
        status: StageStatus.Pending,
        tasks: [
          {
            id: 'task-101',
            stageId: 'stage-1-001',
            name: '功能规格说明',
            status: TaskStatus.Pending,
            createdAt: '2025-10-27T09:00:00Z',
          },
          {
            id: 'task-102',
            stageId: 'stage-1-001',
            name: '需求澄清',
            status: TaskStatus.Pending,
            createdAt: '2025-10-27T09:00:00Z',
          },
          {
            id: 'task-103',
            stageId: 'stage-1-001',
            name: '原型设计',
            status: TaskStatus.Pending,
            createdAt: '2025-10-27T09:00:00Z',
          },
        ],
      },
      {
        id: 'stage-2-001',
        stageNumber: 2,
        name: '方案阶段',
        status: StageStatus.Pending,
        tasks: [
          {
            id: 'task-201',
            stageId: 'stage-2-001',
            name: '技术方案',
            status: TaskStatus.Pending,
            createdAt: '2025-10-27T09:00:00Z',
          },
          {
            id: 'task-202',
            stageId: 'stage-2-001',
            name: '任务拆解',
            status: TaskStatus.Pending,
            createdAt: '2025-10-27T09:00:00Z',
          },
        ],
      },
    ],
  },
];

// Factory function to create a new workflow
export function createMockWorkflow(projectId: string): Workflow {
  return {
    id: `workflow-${Date.now()}`,
    projectId,
    currentStageIndex: 0,
    stages: [
      {
        id: `stage-0-${Date.now()}`,
        stageNumber: 0,
        name: '创建项目',
        status: StageStatus.Pending,
        tasks: [],
      },
      {
        id: `stage-1-${Date.now()}`,
        stageNumber: 1,
        name: '需求阶段',
        status: StageStatus.Pending,
        tasks: [],
      },
      {
        id: `stage-2-${Date.now()}`,
        stageNumber: 2,
        name: '方案阶段',
        status: StageStatus.Pending,
        tasks: [],
      },
    ],
  };
}
