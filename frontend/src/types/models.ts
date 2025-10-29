// Core Data Models for AI Workflow System
// Based on data-model.md specification

// ============================================================================
// Project Models
// ============================================================================

export interface Project {
  id: string;
  name: string;
  description?: string;
  category: ProjectCategory;
  currentStage: WorkflowStage;
  status: ProjectStatus;
  owner: User;
  permissions: ProjectPermission[];
  conversationCount?: number; // 会话消息数量（来自后端Session）
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

export interface ProjectCategory {
  virtualOrg: string; // 虚拟组织
  strategicOpportunity: string; // 战略机会
  jobFamily: string; // 岗位族
}

export enum ProjectStatus {
  Active = 'active',
  Paused = 'paused',
  Completed = 'completed',
  Archived = 'archived',
}

export enum WorkflowStage {
  Stage0 = 0, // 项目初始化
  Stage1 = 1, // 需求澄清
  Stage2 = 2, // 方案构建
}

// ============================================================================
// Workflow Models
// ============================================================================

export interface Workflow {
  id: string;
  projectId: string;
  stages: Stage[];
  currentStageIndex: number; // 0-4
}

export interface Stage {
  id: string;
  stageNumber: number; // 0-4
  name: string; // 中文名称
  status: StageStatus;
  tasks: Task[];
  startedAt?: string;
  completedAt?: string;
}

export enum StageStatus {
  Pending = 'pending',
  InProgress = 'in_progress',
  Completed = 'completed',
}

export interface Task {
  id: string;
  stageId: string;
  name: string;
  description?: string;
  status: TaskStatus;
  createdAt: string;
  completedAt?: string;
  metadata?: TaskMetadata;
}

export interface TaskMetadata {
  uiComponentType?: string; // 指定任务需要的UI组件类型 (e.g., 'template-selection', 'file-upload')
  uiProps?: Record<string, any>; // 传递给UI组件的额外属性
  [key: string]: any; // 其他自定义元数据
}

export enum TaskStatus {
  Pending = 'pending',
  InProgress = 'in_progress',
  Completed = 'completed',
  Failed = 'failed',
  Paused = 'paused',
}

export interface ExecutionLog {
  id: string;
  stageId: string;
  timestamp: string;
  level: LogLevel;
  message: string;
  type: ExecutionLogType; // 日志类型：普通日志、UI组件、文档链接、任务状态更新
  metadata?: Record<string, unknown>;

  // UI组件相关字段 (当 type === 'ui_component' 时)
  uiComponent?: {
    type: string; // 'template-selection' | 'confirmation' | 'form-input' | 'file-upload' | etc.
    props?: Record<string, any>; // 传递给UI组件的属性
    taskId?: string; // 关联的任务ID
  };

  // 文档链接相关字段 (当 type === 'document_link' 时)
  documentLink?: {
    documentId: string;
    documentName: string;
  };

  // 任务状态更新相关字段 (当 type === 'task_status' 时)
  taskStatus?: {
    taskId: string;
    taskName: string;
    status: TaskStatus;
  };
}

export enum LogLevel {
  Info = 'info',
  Success = 'success',
  Warning = 'warning',
  Error = 'error',
}

export enum ExecutionLogType {
  Log = 'log', // 普通文本日志
  UIComponent = 'ui_component', // 需要用户交互的UI组件
  DocumentLink = 'document_link', // 文档链接
  TaskStatus = 'task_status', // 任务状态更新
}

// ============================================================================
// Document Models
// ============================================================================

export interface Document {
  id: string;
  projectId: string;
  stageId: string;
  name: string; // e.g. spec.md
  content: string; // Markdown content
  version: number;
  status: DocumentStatus;
  metadata: DocumentMetadata;
  feishuDocId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentMetadata {
  author: string;
  createdBy: string; // user ID
  lastModifiedBy: string; // user ID
  wordCount: number;
}

export enum DocumentStatus {
  Draft = 'draft',
  Completed = 'completed',
}

// ============================================================================
// Conversation Models
// ============================================================================

export interface Conversation {
  id: string;
  projectId: string;
  stageId: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  sender: MessageSender;
  content: string;
  type: MessageType;
  timestamp: string;
  metadata?: MessageMetadata;
}

export enum MessageSender {
  User = 'user',
  AI = 'ai',
  System = 'system',
}

export enum MessageType {
  Text = 'text',
  Voice = 'voice',
  SystemNotification = 'system_notification',
}

export interface MessageMetadata {
  isStreaming?: boolean;
  isWelcome?: boolean; // 是否为欢迎消息
  voiceDuration?: number; // seconds
  relatedTaskId?: string;
  relatedDocumentId?: string;
  attachments?: AttachmentInfo[]; // 附件信息
  toolCalls?: Array<{
    id: string;
    name: string;
    input: Record<string, unknown>;
    result: unknown;
    is_error: boolean;
  }>; // AI工具调用信息
}

export interface AttachmentInfo {
  id: string;
  name: string;
  size?: number;
  url?: string;
  type?: string; // MIME type
}

// ============================================================================
// User & Permission Models
// ============================================================================

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface ProjectPermission {
  userId: string;
  role: ProjectRole;
  grantedAt: string;
  grantedBy: string; // user ID
}

export enum ProjectRole {
  Owner = 'owner',
  Editor = 'editor',
  Viewer = 'viewer',
}

// ============================================================================
// Async Task Models (Background Jobs)
// ============================================================================

export interface AsyncTask {
  id: string;
  projectId: string;
  type: AsyncTaskType;
  status: AsyncTaskStatus;
  progress: number; // 0-100
  result?: unknown;
  error?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

export enum AsyncTaskType {
  DocumentGeneration = 'document_generation',
  FeishuSync = 'feishu_sync',
  WorkflowExecution = 'workflow_execution',
}

export enum AsyncTaskStatus {
  Pending = 'pending',
  Running = 'running',
  Completed = 'completed',
  Failed = 'failed',
  Cancelled = 'cancelled',
}

// ============================================================================
// UI State Models
// ============================================================================

export interface ColumnWidths {
  left: number; // percentage
  middle: number; // percentage
  right: number; // percentage
}

export interface UserPreferences {
  theme: 'light' | 'dark';
  language: 'zh-CN' | 'en-US';
  columnWidths: ColumnWidths;
  autoSave: boolean;
}

// ============================================================================
// Tool Call & Todo Models (Claude Code Integration)
// ============================================================================

export interface ToolCall {
  id: string;
  name: string;
  input?: Record<string, any>;
  result?: any; // 工具执行结果
  status?: 'pending' | 'running' | 'completed' | 'failed';
}

export interface Todo {
  content: string; // 任务描述（祈使句）
  activeForm: string; // 任务进行时描述
  status: 'pending' | 'in_progress' | 'completed';
}
