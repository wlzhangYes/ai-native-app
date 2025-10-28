// Workflow Tree Data Converter
// Converts Workflow data model to Ant Design Tree structure

import type { Workflow, Stage, Task, Document, StageStatus, TaskStatus } from '@/types/models';
import type { WorkflowTreeNode, WorkflowNodeType } from '@/types/workflow';

// ============================================================================
// Main Conversion Function
// ============================================================================

/**
 * Convert Workflow to Ant Design Tree structure
 */
export function workflowToTreeData(workflow: Workflow): WorkflowTreeNode[] {
  return workflow.stages.map((stage) => stageToTreeNode(stage, workflow.currentStageIndex));
}

/**
 * Convert a Stage to a Tree Node
 */
function stageToTreeNode(stage: Stage, currentStageIndex: number): WorkflowTreeNode {
  const children: WorkflowTreeNode[] = [];

  // Add tasks as children
  stage.tasks.forEach((task) => {
    children.push(taskToTreeNode(task, stage.id));
  });

  // Add documents as children
  stage.documents.forEach((doc) => {
    children.push(documentToTreeNode(doc, stage.id));
  });

  // Determine if stage is active
  const isActive = stage.stageNumber === currentStageIndex;

  return {
    key: `stage-${stage.id}`,
    title: `阶段${stage.stageNumber}: ${stage.name}`,
    type: 'stage',
    status: stage.status,
    data: stage,
    children,
    isLeaf: false,
    disabled: false,
    icon: getStageIcon(stage.status, isActive),
  };
}

/**
 * Convert a Task to a Tree Node
 */
function taskToTreeNode(task: Task, stageId: string): WorkflowTreeNode {
  return {
    key: `task-${task.id}`,
    title: task.name,
    type: 'task',
    status: task.status,
    data: task,
    children: [],
    isLeaf: true,
    disabled: false,
    icon: getTaskIcon(task.status),
  };
}

/**
 * Convert a Document to a Tree Node
 */
function documentToTreeNode(doc: Document, stageId: string): WorkflowTreeNode {
  return {
    key: `doc-${doc.id}`,
    title: doc.name,
    type: 'document',
    data: doc,
    children: [],
    isLeaf: true,
    disabled: false,
    icon: getDocumentIcon(doc.status),
  };
}

// ============================================================================
// Icon Helpers (return React component or null)
// ============================================================================

/**
 * Get icon component for stage based on status
 */
function getStageIcon(status: StageStatus, isActive: boolean): React.ReactNode {
  // Icons can be implemented with Ant Design icons
  // For now, return null and handle in the component
  return null;
}

/**
 * Get icon component for task based on status
 */
function getTaskIcon(status: TaskStatus): React.ReactNode {
  return null;
}

/**
 * Get icon component for document
 */
function getDocumentIcon(status: string): React.ReactNode {
  return null;
}

// ============================================================================
// Tree Manipulation Utilities
// ============================================================================

/**
 * Find a node in the tree by key
 */
export function findNodeByKey(tree: WorkflowTreeNode[], key: string): WorkflowTreeNode | null {
  for (const node of tree) {
    if (node.key === key) {
      return node;
    }

    if (node.children && node.children.length > 0) {
      const found = findNodeByKey(node.children, key);
      if (found) return found;
    }
  }

  return null;
}

/**
 * Update node status in the tree
 */
export function updateNodeStatus(
  tree: WorkflowTreeNode[],
  key: string,
  status: StageStatus | TaskStatus
): WorkflowTreeNode[] {
  return tree.map((node) => {
    if (node.key === key) {
      return {
        ...node,
        status,
        icon: node.type === 'stage'
          ? getStageIcon(status as StageStatus, false)
          : getTaskIcon(status as TaskStatus),
      };
    }

    if (node.children && node.children.length > 0) {
      return {
        ...node,
        children: updateNodeStatus(node.children, key, status),
      };
    }

    return node;
  });
}

/**
 * Get the path to a node (list of keys from root to node)
 */
export function getNodePath(tree: WorkflowTreeNode[], key: string): string[] {
  for (const node of tree) {
    if (node.key === key) {
      return [node.key];
    }

    if (node.children && node.children.length > 0) {
      const childPath = getNodePath(node.children, key);
      if (childPath.length > 0) {
        return [node.key, ...childPath];
      }
    }
  }

  return [];
}

/**
 * Expand all nodes up to a certain depth
 */
export function getExpandedKeysUpToDepth(tree: WorkflowTreeNode[], depth: number): string[] {
  const keys: string[] = [];

  function traverse(nodes: WorkflowTreeNode[], currentDepth: number) {
    if (currentDepth > depth) return;

    nodes.forEach((node) => {
      keys.push(node.key);

      if (node.children && node.children.length > 0) {
        traverse(node.children, currentDepth + 1);
      }
    });
  }

  traverse(tree, 0);
  return keys;
}

/**
 * Get all keys in the tree
 */
export function getAllKeys(tree: WorkflowTreeNode[]): string[] {
  const keys: string[] = [];

  function traverse(nodes: WorkflowTreeNode[]) {
    nodes.forEach((node) => {
      keys.push(node.key);

      if (node.children && node.children.length > 0) {
        traverse(node.children);
      }
    });
  }

  traverse(tree);
  return keys;
}

/**
 * Filter tree nodes by type
 */
export function filterNodesByType(tree: WorkflowTreeNode[], type: WorkflowNodeType): WorkflowTreeNode[] {
  const filtered: WorkflowTreeNode[] = [];

  function traverse(nodes: WorkflowTreeNode[]) {
    nodes.forEach((node) => {
      if (node.type === type) {
        filtered.push(node);
      }

      if (node.children && node.children.length > 0) {
        traverse(node.children);
      }
    });
  }

  traverse(tree);
  return filtered;
}

/**
 * Count nodes by status
 */
export function countNodesByStatus(tree: WorkflowTreeNode[], status: StageStatus | TaskStatus): number {
  let count = 0;

  function traverse(nodes: WorkflowTreeNode[]) {
    nodes.forEach((node) => {
      if (node.status === status) {
        count++;
      }

      if (node.children && node.children.length > 0) {
        traverse(node.children);
      }
    });
  }

  traverse(tree);
  return count;
}
