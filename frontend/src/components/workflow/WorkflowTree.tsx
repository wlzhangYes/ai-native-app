// WorkflowTree Component - Main Workflow Tree View
// Based on spec.md FR-014: Workflow tree with 5 stages
// 支持混合显示：平铺任务用 ThoughtChain，多阶段工作流用 Tree

import { useEffect, useMemo, useRef } from 'react';
import { Tree, Flex, Empty } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import type { DataNode } from 'antd/es/tree';
import { useWorkflowStore } from '@/stores/useWorkflowStore';
import { useDialogStore } from '@/stores/useDialogStore';
import { useTodos } from '@/hooks/business/dialog/useTodos';
import { TodoThoughtChain } from './TodoThoughtChain';
import { StageNode } from './StageNode';
import { TaskNode } from './TaskNode';
import { DocumentNode } from './DocumentNode';
import { StageStatus } from '@/types/models';
import type { Stage, Task, Document, Workflow } from '@/types/models';
import type { Todo } from '@/types/models';

/**
 * 判断是否应该使用 ThoughtChain 展示
 *
 * 使用 ThoughtChain 的条件：
 * 1. 有 todos 且没有复杂工作流
 * 2. 工作流只有一个阶段（说明是从 todos 自动生成的平铺结构）
 *
 * 使用 Tree 的条件：
 * 1. 多阶段工作流（需要展示层级关系）
 * 2. 没有 todos（用户手动创建的工作流）
 */
function shouldUseThoughtChain(todos: Todo[], workflow: Workflow | null): boolean {
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
}

export function WorkflowTree() {
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

  // Get tool calls from DialogStore and extract todos
  const toolCalls = useDialogStore((state) => state.toolCalls);
  const { todos } = useTodos(toolCalls);

  // Track manual expand/collapse to prevent auto-override
  const manuallyExpandedKeys = useRef<Set<string>>(new Set());
  const initializedRef = useRef(false);
  const lastTodosRef = useRef<string>('');

  // Sync todos to workflow tasks when todos change
  useEffect(() => {
    console.log('[WorkflowTree] Todo sync check:', {
      todosLength: todos.length,
      hasWorkflow: !!workflow,
      activeStageId,
      todos,
    });

    if (todos.length > 0) {
      // Compare todos by JSON string to avoid infinite loops
      const todosKey = JSON.stringify(todos);
      if (todosKey !== lastTodosRef.current) {
        console.log('[WorkflowTree] Syncing todos to tasks:', todos);
        syncTodosToTasks(todos);
        lastTodosRef.current = todosKey;
      }
    } else {
      console.log('[WorkflowTree] No todos to sync');
    }
  }, [todos, syncTodosToTasks]);

  // Convert workflow to tree data structure
  const treeData = useMemo<DataNode[]>(() => {
    if (!workflow) return [];

    return workflow.stages.map((stage) => {
      // Count task statistics
      const taskCount = stage.tasks.length;
      const completedTaskCount = stage.tasks.filter((t) => t.status === 'completed').length;

      // Create stage node
      const stageNode: DataNode = {
        key: `stage-${stage.id}`,
        title: (
          <StageNode
            stage={stage}
            isActive={stage.id === activeStageId}
            taskCount={taskCount}
            completedTaskCount={completedTaskCount}
          />
        ),
        children: [],
        isLeaf: false,
      };

      // Add task nodes as children
      const children: DataNode[] = [];

      stage.tasks.forEach((task) => {
        children.push({
          key: `task-${task.id}`,
          title: <TaskNode task={task} />,
          isLeaf: true,
        });
      });

      // Document nodes are now shown in the "文件" tab, not in workflow tree
      // stage.documents.forEach((doc) => {
      //   children.push({
      //     key: `doc-${doc.id}`,
      //     title: <DocumentNode document={doc} />,
      //     isLeaf: true,
      //   });
      // });

      stageNode.children = children;
      return stageNode;
    });
  }, [workflow, activeStageId]);

  // Initialize expanded keys based on stage status (only on first load)
  useEffect(() => {
    if (!workflow || initializedRef.current) return;

    // Calculate which keys should be expanded based on stage status
    const keysToExpand: string[] = [];

    workflow.stages.forEach((stage) => {
      const stageKey = `stage-${stage.id}`;

      // Auto-expand in-progress and completed stages
      // Collapse pending stages by default
      if (
        stage.status === StageStatus.InProgress ||
        stage.status === StageStatus.Completed
      ) {
        keysToExpand.push(stageKey);
      }
    });

    setExpandedKeys(keysToExpand);
    initializedRef.current = true;
  }, [workflow, setExpandedKeys]);

  // Auto-expand stages when they transition to in_progress (runtime updates)
  useEffect(() => {
    if (!workflow || !initializedRef.current) return;

    const keysToAutoExpand: string[] = [];

    workflow.stages.forEach((stage) => {
      const stageKey = `stage-${stage.id}`;

      // Auto-expand in-progress stages (unless manually collapsed)
      if (stage.status === StageStatus.InProgress && !manuallyExpandedKeys.current.has(stageKey)) {
        if (!expandedKeys.includes(stageKey)) {
          keysToAutoExpand.push(stageKey);
        }
      }
    });

    if (keysToAutoExpand.length > 0) {
      setExpandedKeys([...expandedKeys, ...keysToAutoExpand]);
    }
  }, [workflow, expandedKeys, setExpandedKeys]);

  // Handle tree node expand/collapse
  const handleExpand = (keys: React.Key[], info: { expanded: boolean; node: DataNode }) => {
    const newKeys = keys as string[];
    setExpandedKeys(newKeys);

    // Track manual expand/collapse for stage nodes to prevent auto-override
    const nodeKey = info.node.key as string;
    if (nodeKey.startsWith('stage-')) {
      if (info.expanded) {
        // User manually expanded - track it
        manuallyExpandedKeys.current.add(nodeKey);
      } else {
        // User manually collapsed - track it (prevent auto-expand)
        manuallyExpandedKeys.current.add(nodeKey);
      }
    }
  };

  // Handle tree node selection
  const handleSelect = (keys: React.Key[]) => {
    const key = keys[0] as string;
    if (!key) return;

    setSelectedKeys([key]);

    // Parse key to determine node type and update right panel content
    if (key.startsWith('stage-')) {
      const stageId = key.replace('stage-', '');
      setActiveStage(stageId);
      setSelectedDocument(null); // Clear document selection
      setSelectedTask(null); // Clear task selection
      // Right panel will auto-switch to "运行记录" tab
    } else if (key.startsWith('doc-')) {
      const docId = key.replace('doc-', '');
      setSelectedDocument(docId);
      setSelectedTask(null); // Clear task selection when document is selected
      // Right panel will auto-switch to "结果预览" tab
    } else if (key.startsWith('task-')) {
      const taskId = key.replace('task-', '');
      setSelectedTask(taskId);
      setSelectedDocument(null); // Clear document selection when task is selected
      // Right panel can show task-specific UI (e.g., template selection)
    }
  };

  // 判断是否使用 ThoughtChain 展示
  const useThoughtChain = shouldUseThoughtChain(todos, workflow);

  // 如果使用 ThoughtChain，直接返回 ThoughtChain 组件
  if (useThoughtChain && todos.length > 0) {
    console.log('[WorkflowTree] Using ThoughtChain for flat todos:', todos);
    return (
      <div className="h-full overflow-auto">
        <TodoThoughtChain todos={todos} />
      </div>
    );
  }

  if (!workflow) {
    return (
      <Flex align="center" justify="center" className="h-full">
        <Empty description="暂无工作流数据" />
      </Flex>
    );
  }

  // 使用 Tree 展示多阶段工作流
  console.log('[WorkflowTree] Using Tree for multi-stage workflow');
  return (
    <div className="p-4 h-full overflow-auto">
      <Tree
        showLine
        switcherIcon={<DownOutlined />}
        treeData={treeData}
        expandedKeys={expandedKeys}
        selectedKeys={selectedKeys}
        onExpand={handleExpand}
        onSelect={handleSelect}
        showIcon={false}
        blockNode
        className="bg-transparent text-sm workflow-tree"
      />
      <style>{`
        .workflow-tree .ant-tree-treenode {
          align-items: center;
        }
        .workflow-tree .ant-tree-node-content-wrapper {
          display: flex;
          align-items: center;
          line-height: 1.5;
        }
        .workflow-tree .ant-tree-title {
          display: flex;
          align-items: center;
        }
      `}</style>
    </div>
  );
}
