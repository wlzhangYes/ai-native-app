// WorkflowTree Component - Refactored using useAIWorkflow hook
// Based on spec.md FR-014: Workflow tree with 5 stages
// 支持混合显示：平铺任务用 ThoughtChain，多阶段工作流用 Tree

import { useEffect, useMemo, useRef } from 'react';
import { Tree, Flex, Empty } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import type { DataNode } from 'antd/es/tree';
import { useAIWorkflow } from '@/hooks/composite/useAIWorkflow';
import { useProjectStore } from '@/stores/useProjectStore';
import { TodoThoughtChain } from './TodoThoughtChain';
import { StageNode } from './StageNode';
import { TaskNode } from './TaskNode';
import { StageStatus } from '@/types/models';

export function WorkflowTreeRefactored() {
  const currentProjectId = useProjectStore((state) => state.currentProjectId);

  // 🌟 使用 useAIWorkflow 组合 hook（替代直接使用多个 stores 和 hooks）
  const {
    workflow,
    todos,
    expandedKeys,
    selectedKeys,
    setExpandedKeys,
    setSelectedKeys,
    selectStage,
    selectTask,
    selectDocument,
    shouldUseThoughtChain: checkShouldUseThoughtChain,
  } = useAIWorkflow({
    sessionId: currentProjectId || '',
    autoSyncTodos: true,
  });

  // Track manual expand/collapse to prevent auto-override
  const manuallyExpandedKeys = useRef<Set<string>>(new Set());
  const initializedRef = useRef(false);

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
            isActive={stage.id === workflow.stages.find(s => s.id === stage.id)?.id}
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

      stageNode.children = children;
      return stageNode;
    });
  }, [workflow]);

  // Initialize expanded keys based on stage status (only on first load)
  useEffect(() => {
    if (!workflow || initializedRef.current) return;

    // Calculate which keys should be expanded based on stage status
    const keysToExpand: string[] = [];

    workflow.stages.forEach((stage) => {
      const stageKey = `stage-${stage.id}`;

      // Auto-expand in-progress and completed stages
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

    // Track manual expand/collapse for stage nodes
    const nodeKey = info.node.key as string;
    if (nodeKey.startsWith('stage-')) {
      manuallyExpandedKeys.current.add(nodeKey);
    }
  };

  // Handle tree node selection
  const handleSelect = (keys: React.Key[]) => {
    const key = keys[0] as string;
    if (!key) return;

    setSelectedKeys([key]);

    // Parse key and delegate to useAIWorkflow selection methods
    if (key.startsWith('stage-')) {
      const stageId = key.replace('stage-', '');
      selectStage(stageId);
    } else if (key.startsWith('doc-')) {
      const docId = key.replace('doc-', '');
      selectDocument(docId);
    } else if (key.startsWith('task-')) {
      const taskId = key.replace('task-', '');
      selectTask('', taskId); // stageId not needed for simple task selection
    }
  };

  // 🌟 判断是否使用 ThoughtChain 展示（使用 hook 提供的方法）
  const useThoughtChain = checkShouldUseThoughtChain();

  // 如果使用 ThoughtChain，直接返回 ThoughtChain 组件
  if (useThoughtChain && todos.length > 0) {
    console.log('[WorkflowTreeRefactored] Using ThoughtChain for flat todos:', todos);
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
  console.log('[WorkflowTreeRefactored] Using Tree for multi-stage workflow');
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
