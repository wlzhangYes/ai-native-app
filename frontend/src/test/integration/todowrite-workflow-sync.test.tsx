// Integration tests for TodoWrite to WorkflowTree synchronization
// Tests real-time workflow updates from Claude's TodoWrite tool calls

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTodos } from '@/hooks/useTodos';
import { useDialogStore } from '@/stores/useDialogStore';
import { useWorkflowStore } from '@/stores/useWorkflowStore';
import type { ToolCall, Todo, WorkflowStage } from '@/types/models';

describe('TodoWrite to WorkflowTree Sync Integration', () => {
  let dialogStore: ReturnType<typeof useDialogStore>;
  let workflowStore: ReturnType<typeof useWorkflowStore>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Get store instances
    dialogStore = useDialogStore.getState();
    workflowStore = useWorkflowStore.getState();

    // Clear all data
    dialogStore.clearMessages();
    dialogStore.clearToolCalls();
    workflowStore.clearWorkflow();
  });

  it('should extract todos from tool calls correctly', async () => {
    const sessionId = 'test-session';

    const toolCall: ToolCall = {
      id: 'extract_001',
      name: 'TodoWrite',
      input: {
        todos: [
          {
            content: '分析需求文档',
            status: 'completed',
            activeForm: '分析需求文档',
          },
          {
            content: '设计数据库架构',
            status: 'in_progress',
            activeForm: '正在设计数据库架构',
          },
          {
            content: '实现用户界面',
            status: 'pending',
            activeForm: '实现用户界面',
          },
        ],
      },
    };

    await act(async () => {
      dialogStore.setCurrentSession(sessionId);
      dialogStore.addToolCall(toolCall);
    });

    const { result } = renderHook(() => useTodos(sessionId));

    const todos = result.current;
    expect(todos).toHaveLength(3);
    expect(todos[0].content).toBe('分析需求文档');
    expect(todos[0].status).toBe('completed');
    expect(todos[1].content).toBe('设计数据库架构');
    expect(todos[1].status).toBe('in_progress');
    expect(todos[2].content).toBe('实现用户界面');
    expect(todos[2].status).toBe('pending');
  });

  it('should auto-create workflow when todos first appear', async () => {
    const sessionId = 'auto-create-session';

    const todos: Todo[] = [
      {
        content: '初始任务',
        status: 'pending',
        activeForm: '初始任务',
      },
    ];

    await act(async () => {
      workflowStore.setCurrentSession(sessionId);
      workflowStore.syncTodosToTasks(todos);
    });

    const workflow = workflowStore.currentWorkflow;
    expect(workflow).toBeDefined();
    expect(workflow!.id).toBe('auto-generated');
    expect(workflow!.name).toBe('AI 工作流');
    expect(workflow!.stages).toHaveLength(1);
    expect(workflow!.stages[0].name).toBe('任务列表');
    expect(workflow!.stages[0].tasks).toHaveLength(1);
    expect(workflow!.stages[0].tasks[0].name).toBe('初始任务');
  });

  it('should sync todos to existing workflow tasks', async () => {
    const sessionId = 'sync-session';

    // Pre-create workflow
    const existingWorkflow = {
      id: 'existing-workflow',
      name: '现有工作流',
      description: '测试现有工作流',
      stages: [
        {
          id: 'stage-1',
          name: '任务列表',
          description: '任务管理',
          status: 'pending' as const,
          tasks: [],
        },
      ],
      sessionId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await act(async () => {
      workflowStore.setCurrentSession(sessionId);
      workflowStore.setWorkflow(existingWorkflow);
    });

    const todos: Todo[] = [
      {
        content: '第一个任务',
        status: 'completed',
        activeForm: '第一个任务',
      },
      {
        content: '第二个任务',
        status: 'in_progress',
        activeForm: '正在执行第二个任务',
      },
    ];

    await act(async () => {
      workflowStore.syncTodosToTasks(todos);
    });

    const workflow = workflowStore.currentWorkflow;
    expect(workflow!.stages[0].tasks).toHaveLength(2);
    expect(workflow!.stages[0].tasks[0].name).toBe('第一个任务');
    expect(workflow!.stages[0].tasks[0].status).toBe('completed');
    expect(workflow!.stages[0].tasks[1].name).toBe('正在执行第二个任务');
    expect(workflow!.stages[0].tasks[1].status).toBe('in_progress');
  });

  it('should calculate stage status based on task completion', async () => {
    const sessionId = 'status-calc-session';

    await act(async () => {
      workflowStore.setCurrentSession(sessionId);
    });

    // Test: All tasks pending -> stage pending
    let todos: Todo[] = [
      { content: '任务1', status: 'pending', activeForm: '任务1' },
      { content: '任务2', status: 'pending', activeForm: '任务2' },
    ];

    await act(async () => {
      workflowStore.syncTodosToTasks(todos);
    });

    let workflow = workflowStore.currentWorkflow;
    expect(workflow!.stages[0].status).toBe('pending');

    // Test: Some tasks in progress -> stage in_progress
    todos = [
      { content: '任务1', status: 'completed', activeForm: '任务1' },
      { content: '任务2', status: 'in_progress', activeForm: '正在执行任务2' },
      { content: '任务3', status: 'pending', activeForm: '任务3' },
    ];

    await act(async () => {
      workflowStore.syncTodosToTasks(todos);
    });

    workflow = workflowStore.currentWorkflow;
    expect(workflow!.stages[0].status).toBe('in_progress');

    // Test: All tasks completed -> stage completed
    todos = [
      { content: '任务1', status: 'completed', activeForm: '任务1' },
      { content: '任务2', status: 'completed', activeForm: '任务2' },
    ];

    await act(async () => {
      workflowStore.syncTodosToTasks(todos);
    });

    workflow = workflowStore.currentWorkflow;
    expect(workflow!.stages[0].status).toBe('completed');
  });

  it('should handle task updates and removals', async () => {
    const sessionId = 'update-session';

    await act(async () => {
      workflowStore.setCurrentSession(sessionId);
    });

    // Initial todos
    let todos: Todo[] = [
      { content: '任务A', status: 'pending', activeForm: '任务A' },
      { content: '任务B', status: 'pending', activeForm: '任务B' },
      { content: '任务C', status: 'pending', activeForm: '任务C' },
    ];

    await act(async () => {
      workflowStore.syncTodosToTasks(todos);
    });

    let workflow = workflowStore.currentWorkflow;
    expect(workflow!.stages[0].tasks).toHaveLength(3);

    // Update: Remove task B, update task A status, add task D
    todos = [
      { content: '任务A', status: 'completed', activeForm: '任务A' },
      { content: '任务C', status: 'in_progress', activeForm: '正在执行任务C' },
      { content: '任务D', status: 'pending', activeForm: '任务D' },
    ];

    await act(async () => {
      workflowStore.syncTodosToTasks(todos);
    });

    workflow = workflowStore.currentWorkflow;
    expect(workflow!.stages[0].tasks).toHaveLength(3);

    const taskNames = workflow!.stages[0].tasks.map(t => t.name);
    expect(taskNames).toContain('任务A');
    expect(taskNames).toContain('正在执行任务C');
    expect(taskNames).toContain('任务D');
    expect(taskNames).not.toContain('任务B');

    // Verify statuses were updated
    const taskA = workflow!.stages[0].tasks.find(t => t.name === '任务A');
    const taskC = workflow!.stages[0].tasks.find(t => t.name === '正在执行任务C');
    const taskD = workflow!.stages[0].tasks.find(t => t.name === '任务D');

    expect(taskA?.status).toBe('completed');
    expect(taskC?.status).toBe('in_progress');
    expect(taskD?.status).toBe('pending');
  });

  it('should preserve task metadata during sync', async () => {
    const sessionId = 'metadata-session';

    // Create workflow with task that has metadata
    const workflowWithMetadata = {
      id: 'metadata-workflow',
      name: '元数据测试工作流',
      description: '测试任务元数据保留',
      stages: [
        {
          id: 'stage-1',
          name: '任务列表',
          description: '任务管理',
          status: 'pending' as const,
          tasks: [
            {
              id: 'task-with-metadata',
              name: '带元数据的任务',
              description: '这个任务有额外的元数据',
              status: 'pending' as const,
              estimatedHours: 4,
              priority: 'high',
              metadata: {
                originalDescription: '原始描述',
                customField: 'custom value',
              },
            },
          ],
        },
      ],
      sessionId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await act(async () => {
      workflowStore.setCurrentSession(sessionId);
      workflowStore.setWorkflow(workflowWithMetadata);
    });

    // Update task status via todo sync
    const todos: Todo[] = [
      {
        content: '带元数据的任务',
        status: 'completed',
        activeForm: '带元数据的任务',
      },
    ];

    await act(async () => {
      workflowStore.syncTodosToTasks(todos);
    });

    const workflow = workflowStore.currentWorkflow;
    const updatedTask = workflow!.stages[0].tasks[0];

    // Status should be updated
    expect(updatedTask.status).toBe('completed');

    // Metadata should be preserved
    expect(updatedTask.description).toBe('这个任务有额外的元数据');
    expect(updatedTask.estimatedHours).toBe(4);
    expect(updatedTask.priority).toBe('high');
    expect(updatedTask.metadata?.originalDescription).toBe('原始描述');
    expect(updatedTask.metadata?.customField).toBe('custom value');
  });

  it('should handle empty todos list', async () => {
    const sessionId = 'empty-session';

    // Create workflow with tasks
    await act(async () => {
      workflowStore.setCurrentSession(sessionId);
      workflowStore.syncTodosToTasks([
        { content: '临时任务', status: 'pending', activeForm: '临时任务' },
      ]);
    });

    let workflow = workflowStore.currentWorkflow;
    expect(workflow!.stages[0].tasks).toHaveLength(1);

    // Sync with empty todos
    await act(async () => {
      workflowStore.syncTodosToTasks([]);
    });

    workflow = workflowStore.currentWorkflow;
    expect(workflow!.stages[0].tasks).toHaveLength(0);
    expect(workflow!.stages[0].status).toBe('pending');
  });

  it('should maintain workflow persistence across sessions', async () => {
    const sessionId = 'persistence-session';

    const todos: Todo[] = [
      { content: '持久化任务1', status: 'completed', activeForm: '持久化任务1' },
      { content: '持久化任务2', status: 'in_progress', activeForm: '正在执行持久化任务2' },
    ];

    // Create workflow in session
    await act(async () => {
      workflowStore.setCurrentSession(sessionId);
      workflowStore.syncTodosToTasks(todos);
    });

    let workflow = workflowStore.currentWorkflow;
    expect(workflow!.stages[0].tasks).toHaveLength(2);

    // Switch to different session and back
    await act(async () => {
      workflowStore.setCurrentSession('other-session');
    });

    expect(workflowStore.currentWorkflow).toBeNull();

    await act(async () => {
      workflowStore.setCurrentSession(sessionId);
    });

    // Workflow should be restored
    workflow = workflowStore.currentWorkflow;
    expect(workflow).toBeDefined();
    expect(workflow!.stages[0].tasks).toHaveLength(2);
    expect(workflow!.stages[0].tasks[0].name).toBe('持久化任务1');
    expect(workflow!.stages[0].tasks[1].name).toBe('正在执行持久化任务2');
  });

  it('should handle rapid todo updates without race conditions', async () => {
    const sessionId = 'rapid-session';

    await act(async () => {
      workflowStore.setCurrentSession(sessionId);
    });

    // Simulate rapid todo updates
    const updateSequence = [
      [{ content: '快速任务1', status: 'pending', activeForm: '快速任务1' }],
      [
        { content: '快速任务1', status: 'in_progress', activeForm: '正在执行快速任务1' },
        { content: '快速任务2', status: 'pending', activeForm: '快速任务2' },
      ],
      [
        { content: '快速任务1', status: 'completed', activeForm: '快速任务1' },
        { content: '快速任务2', status: 'in_progress', activeForm: '正在执行快速任务2' },
        { content: '快速任务3', status: 'pending', activeForm: '快速任务3' },
      ],
    ] as Todo[][];

    await act(async () => {
      // Apply all updates rapidly
      for (const todos of updateSequence) {
        workflowStore.syncTodosToTasks(todos);
      }
    });

    // Verify final state is consistent
    const workflow = workflowStore.currentWorkflow;
    expect(workflow!.stages[0].tasks).toHaveLength(3);

    const finalTasks = workflow!.stages[0].tasks;
    expect(finalTasks[0].name).toBe('快速任务1');
    expect(finalTasks[0].status).toBe('completed');
    expect(finalTasks[1].name).toBe('正在执行快速任务2');
    expect(finalTasks[1].status).toBe('in_progress');
    expect(finalTasks[2].name).toBe('快速任务3');
    expect(finalTasks[2].status).toBe('pending');

    // Stage status should reflect the mixed completion state
    expect(workflow!.stages[0].status).toBe('in_progress');
  });

  it('should handle complex workflow structures', async () => {
    const sessionId = 'complex-session';

    // Create a complex multi-stage workflow
    const complexWorkflow = {
      id: 'complex-workflow',
      name: '复杂工作流',
      description: '多阶段复杂工作流测试',
      stages: [
        {
          id: 'stage-1',
          name: '设计阶段',
          description: '产品设计和规划',
          status: 'completed' as const,
          tasks: [
            {
              id: 'design-task-1',
              name: '需求分析',
              description: '分析用户需求',
              status: 'completed' as const,
            },
          ],
        },
        {
          id: 'stage-2',
          name: '任务列表',
          description: 'AI 生成的动态任务',
          status: 'pending' as const,
          tasks: [],
        },
        {
          id: 'stage-3',
          name: '测试阶段',
          description: '质量保证和测试',
          status: 'pending' as const,
          tasks: [
            {
              id: 'test-task-1',
              name: '单元测试',
              description: '编写和执行单元测试',
              status: 'pending' as const,
            },
          ],
        },
      ],
      sessionId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await act(async () => {
      workflowStore.setCurrentSession(sessionId);
      workflowStore.setWorkflow(complexWorkflow);
    });

    // Sync todos to the middle stage
    const todos: Todo[] = [
      { content: '实现API接口', status: 'completed', activeForm: '实现API接口' },
      { content: '集成前端', status: 'in_progress', activeForm: '正在集成前端' },
    ];

    await act(async () => {
      workflowStore.syncTodosToTasks(todos);
    });

    const workflow = workflowStore.currentWorkflow;

    // First stage should remain unchanged
    expect(workflow!.stages[0].tasks).toHaveLength(1);
    expect(workflow!.stages[0].tasks[0].name).toBe('需求分析');
    expect(workflow!.stages[0].status).toBe('completed');

    // Second stage (task list) should have synced todos
    expect(workflow!.stages[1].tasks).toHaveLength(2);
    expect(workflow!.stages[1].tasks[0].name).toBe('实现API接口');
    expect(workflow!.stages[1].tasks[1].name).toBe('正在集成前端');
    expect(workflow!.stages[1].status).toBe('in_progress');

    // Third stage should remain unchanged
    expect(workflow!.stages[2].tasks).toHaveLength(1);
    expect(workflow!.stages[2].tasks[0].name).toBe('单元测试');
    expect(workflow!.stages[2].status).toBe('pending');
  });
});