// Workflow Tree Types for Ant Design Tree Component
// Based on data-model.md and Ant Design Tree component API

import type { DataNode } from 'antd/es/tree';
import type { Stage, Task, Document, StageStatus, TaskStatus } from './models';

// ============================================================================
// Workflow Tree Node Types
// ============================================================================

export interface WorkflowTreeNode extends DataNode {
  key: string; // Unique identifier: stage-{id}, task-{id}, doc-{id}
  title: string;
  type: WorkflowNodeType;
  status?: StageStatus | TaskStatus;
  data?: Stage | Task | Document; // Original data reference
  children?: WorkflowTreeNode[];
  isLeaf?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
}

export enum WorkflowNodeType {
  Stage = 'stage',
  Task = 'task',
  Document = 'document',
}

// ============================================================================
// Tree State Types
// ============================================================================

export interface TreeState {
  expandedKeys: string[]; // Keys of expanded nodes
  selectedKeys: string[]; // Keys of selected nodes
  checkedKeys: string[]; // Keys of checked nodes (if checkable)
}

// ============================================================================
// Tree Event Handlers
// ============================================================================

export interface TreeEventHandlers {
  onExpand: (expandedKeys: string[]) => void;
  onSelect: (selectedKeys: string[], info: { node: WorkflowTreeNode }) => void;
  onCheck?: (checkedKeys: string[]) => void;
}

// ============================================================================
// Tree Node Badge (for task count display)
// ============================================================================

export interface TreeNodeBadge {
  count: number;
  color?: 'default' | 'processing' | 'success' | 'error' | 'warning';
}

// ============================================================================
// Helper Functions for Tree Construction
// ============================================================================

export interface TreeBuilder {
  buildTree: (stages: Stage[]) => WorkflowTreeNode[];
  findNodeByKey: (tree: WorkflowTreeNode[], key: string) => WorkflowTreeNode | null;
  updateNodeStatus: (tree: WorkflowTreeNode[], key: string, status: StageStatus | TaskStatus) => WorkflowTreeNode[];
  getNodePath: (tree: WorkflowTreeNode[], key: string) => string[];
}
