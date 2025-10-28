// Icon utilities for workflow tree nodes
// Based on spec.md FR-014: Workflow tree with status indicators

import {
  ClockCircleOutlined,
  LoadingOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  FileDoneOutlined,
} from '@ant-design/icons';
import { theme } from 'antd';
import type { ReactNode } from 'react';
import type { StageStatus, TaskStatus, DocumentStatus } from '@/types/models';

// Get Ant Design theme tokens
const { useToken } = theme;

// ============================================================================
// Stage Icon Components
// ============================================================================

/**
 * Stage Icon Component
 * @param status - Stage status (pending, in_progress, completed, failed)
 * @returns React icon component with theme colors
 */
export function StageIcon({ status }: { status: StageStatus }): ReactNode {
  const { token } = useToken();

  switch (status) {
    case 'pending':
      return <ClockCircleOutlined style={{ color: token.colorTextDisabled }} />;
    case 'in_progress':
      return <LoadingOutlined style={{ color: token.colorPrimary }} spin />;
    case 'completed':
      return <CheckCircleOutlined style={{ color: token.colorSuccess }} />;
    default:
      return <ClockCircleOutlined style={{ color: token.colorTextDisabled }} />;
  }
}

/**
 * Get color for stage status using theme tokens
 * @param status - Stage status
 * @param token - Ant Design theme token
 * @returns Color from theme
 */
export function getStageColor(status: StageStatus, token: { colorTextDisabled: string; colorPrimary: string; colorSuccess: string }): string {
  switch (status) {
    case 'pending':
      return token.colorTextDisabled;
    case 'in_progress':
      return token.colorPrimary;
    case 'completed':
      return token.colorSuccess;
    default:
      return token.colorTextDisabled;
  }
}

// Legacy function for backward compatibility (uses default theme)
export function getStageIcon(status: StageStatus): ReactNode {
  return <StageIcon status={status} />;
}

// ============================================================================
// Task Icon Components
// ============================================================================

/**
 * Task Icon Component
 * @param status - Task status (pending, in_progress, completed, failed)
 * @returns React icon component with theme colors
 */
export function TaskIcon({ status }: { status: TaskStatus }): ReactNode {
  const { token } = useToken();

  switch (status) {
    case 'pending':
      return <ClockCircleOutlined style={{ color: token.colorTextDisabled, fontSize: token.fontSizeSM }} />;
    case 'in_progress':
      return <LoadingOutlined style={{ color: token.colorPrimary, fontSize: token.fontSizeSM }} spin />;
    case 'completed':
      return <CheckCircleOutlined style={{ color: token.colorSuccess, fontSize: token.fontSizeSM }} />;
    default:
      return <ClockCircleOutlined style={{ color: token.colorTextDisabled, fontSize: token.fontSizeSM }} />;
  }
}

/**
 * Get color for task status using theme tokens
 * @param status - Task status
 * @param token - Ant Design theme token
 * @returns Color from theme
 */
export function getTaskColor(status: TaskStatus, token: { colorTextDisabled: string; colorPrimary: string; colorSuccess: string }): string {
  switch (status) {
    case 'pending':
      return token.colorTextDisabled;
    case 'in_progress':
      return token.colorPrimary;
    case 'completed':
      return token.colorSuccess;
    default:
      return token.colorTextDisabled;
  }
}

// Legacy function for backward compatibility (uses default theme)
export function getTaskIcon(status: TaskStatus): ReactNode {
  return <TaskIcon status={status} />;
}

// ============================================================================
// Document Icon Components
// ============================================================================

/**
 * Document Icon Component
 * @param status - Document status (draft, completed)
 * @returns React icon component with theme colors
 */
export function DocumentIcon({ status }: { status: DocumentStatus }): ReactNode {
  const { token } = useToken();

  switch (status) {
    case 'draft':
      return <FileTextOutlined style={{ color: token.colorWarning, fontSize: token.fontSizeSM }} />;
    case 'completed':
      return <FileDoneOutlined style={{ color: token.colorSuccess, fontSize: token.fontSizeSM }} />;
    default:
      return <FileTextOutlined style={{ color: token.colorTextDisabled, fontSize: token.fontSizeSM }} />;
  }
}

/**
 * Get color for document status using theme tokens
 * @param status - Document status
 * @param token - Ant Design theme token
 * @returns Color from theme
 */
export function getDocumentColor(status: DocumentStatus, token: { colorWarning: string; colorSuccess: string; colorTextDisabled: string }): string {
  switch (status) {
    case 'draft':
      return token.colorWarning;
    case 'completed':
      return token.colorSuccess;
    default:
      return token.colorTextDisabled;
  }
}

/**
 * Get badge text for document status
 * @param status - Document status
 * @returns Chinese text label
 */
export function getDocumentBadgeText(status: DocumentStatus): string {
  switch (status) {
    case 'draft':
      return '草稿';
    case 'completed':
      return '已完成';
    default:
      return '未知';
  }
}

// Legacy function for backward compatibility (uses default theme)
export function getDocumentIcon(status: DocumentStatus): ReactNode {
  return <DocumentIcon status={status} />;
}
