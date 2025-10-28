// API Request/Response Types
// Based on contracts/openapi.yaml specification

// ============================================================================
// Generic API Response Wrapper
// ============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  timestamp: string; // ISO 8601
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// ============================================================================
// Paginated Response
// ============================================================================

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ============================================================================
// SSE Event Types
// ============================================================================

export interface SSEEvent {
  type: SSEEventType;
  data: SSEEventData;
}

export enum SSEEventType {
  Message = 'message', // AI text streaming
  Status = 'status', // Task status update
  DocumentUpdate = 'document_update', // Document change
  WorkflowUpdate = 'workflow_update', // Workflow state change
  UIAction = 'ui_action', // UI action instruction (dialog-driven)
  Error = 'error', // Error notification
  Complete = 'complete', // Stream completion
  Heartbeat = 'heartbeat', // Keep-alive signal
}

// SSE Event Data Types

export type SSEEventData =
  | MessageEventData
  | StatusEventData
  | DocumentUpdateEventData
  | WorkflowUpdateEventData
  | UIActionEventData
  | ErrorEventData
  | CompleteEventData
  | HeartbeatEventData;

export interface MessageEventData {
  delta: string; // Incremental text
  accumulated: string; // Full text so far
  messageId: string;
}

export interface StatusEventData {
  taskId: string; // Task ID for API calls
  taskName: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'paused';
  progress?: number; // 0-100
  message?: string;
}

export interface DocumentUpdateEventData {
  documentId: string;
  name: string;
  action: 'created' | 'updated' | 'deleted';
  content?: string;
  version?: number;
}

export interface WorkflowUpdateEventData {
  workflowId: string;
  stageId?: string;
  action: 'stage_started' | 'stage_completed' | 'task_added' | 'task_updated';
  data?: Record<string, unknown>;
}

export interface UIActionEventData {
  actionType: 'select-template' | 'select-task' | 'fill-form' | 'upload-file' | 'navigate-to' | 'open-document';
  payload: Record<string, any>; // Action-specific data
  description?: string; // Human-readable description
}

export interface ErrorEventData {
  code: string;
  message: string;
  recoverable: boolean;
}

export interface CompleteEventData {
  messageId: string;
  totalDuration: number; // milliseconds
}

export interface HeartbeatEventData {
  timestamp: string;
}

// ============================================================================
// Auth API Types
// ============================================================================

export interface LoginRequest {
  redirectUri?: string;
}

export interface LoginResponse {
  redirectUrl: string; // IAM SSO redirect URL
}

export interface AuthMeResponse {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

// ============================================================================
// Project API Types
// ============================================================================

export interface CreateProjectRequest {
  name: string;
  description?: string;
  category: {
    virtualOrg: string;
    strategicOpportunity: string;
    jobFamily: string;
  };
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  status?: 'active' | 'paused' | 'completed' | 'archived';
}

export interface ProjectListQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: 'active' | 'paused' | 'completed' | 'archived';
  category?: string;
}

export interface SetPermissionRequest {
  userId: string;
  role: 'owner' | 'editor' | 'viewer';
}

// ============================================================================
// Dialog API Types
// ============================================================================

export interface SendMessageRequest {
  content: string;
  type: 'text' | 'voice';
  voiceFileKey?: string; // For voice messages
}

export interface SendMessageResponse {
  messageId: string;
  streamUrl: string; // SSE endpoint URL
}

export interface MessagesQuery {
  page?: number;
  pageSize?: number;
  since?: string; // ISO timestamp
}

// ============================================================================
// Document API Types
// ============================================================================

export interface CreateDocumentRequest {
  name: string;
  stageId: string;
  content?: string;
}

export interface UpdateDocumentRequest {
  content: string;
}

export interface DocumentVersionQuery {
  version?: number;
}

export interface ExportDocumentQuery {
  format: 'md' | 'pdf' | 'html';
}

// ============================================================================
// Workflow API Types
// ============================================================================

export interface SwitchStageRequest {
  stageNumber: number; // 0-4
}

// ============================================================================
// Async Task API Types
// ============================================================================

export interface CreateAsyncTaskRequest {
  type: 'document_generation' | 'feishu_sync' | 'workflow_execution';
  params?: Record<string, unknown>;
}

export interface AsyncTaskListQuery {
  status?: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  page?: number;
  pageSize?: number;
}

// ============================================================================
// Feishu API Types
// ============================================================================

export interface SyncFeishuRequest {
  documentId: string;
  createNewDoc?: boolean;
}

export interface SyncFeishuResponse {
  feishuDocId: string;
  feishuUrl: string;
}

export interface FetchFeishuRequest {
  feishuDocId: string;
}
