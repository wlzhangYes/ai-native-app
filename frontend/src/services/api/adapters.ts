// API Adapters - 将 Claude Agent Service 的数据模型映射到前端模型
// 这样前端其他部分不需要大幅修改

import type { SessionResponse, ConversationMessage } from './session';
import type { FileItem } from './files';
import type {
  Project,
  Message,
  Document,
  User,
} from '@/types/models';
import {
  ProjectStatus,
  WorkflowStage,
  MessageSender,
  MessageType,
  DocumentStatus,
} from '@/types/models';

// ============================================================================
// Session → Project 映射
// ============================================================================

/**
 * 将后端 Session 映射为前端 Project
 */
export function mapSessionToProject(session: SessionResponse): Project {
  // 从 workspace_name 解析项目名称
  const projectName = session.workspace_name || `Project ${session.id.slice(0, 8)}`;

  // 创建默认用户
  const defaultUser: User = {
    id: 'system',
    name: 'System',
    email: 'system@example.com',
  };

  return {
    id: session.id,
    name: projectName,
    description: `Workspace: ${session.workspace_path}`,
    category: {
      virtualOrg: 'Default',
      strategicOpportunity: 'AI Workflow',
      jobFamily: 'Development',
    },
    currentStage: WorkflowStage.Stage0,
    status: session.is_active ? ProjectStatus.Active : ProjectStatus.Archived,
    owner: defaultUser,
    permissions: [],
    conversationCount: session.conversation_count,
    createdAt: session.created_at,
    updatedAt: session.updated_at,
  };
}

/**
 * 将多个 Session 批量映射为 Project 列表
 */
export function mapSessionsToProjects(sessions: SessionResponse[]): Project[] {
  return sessions.map(mapSessionToProject);
}

// ============================================================================
// ConversationMessage → Message 映射
// ============================================================================

/**
 * 将后端 ConversationMessage 映射为前端 Message
 */
export function mapConversationToMessage(
  conversationMessage: ConversationMessage,
  projectId: string
): Message {
  const message: Message = {
    id: conversationMessage.id,
    conversationId: projectId, // 使用 session_id 作为 conversation_id
    sender: conversationMessage.role === 'user' ? MessageSender.User : MessageSender.AI,
    content: conversationMessage.content,
    type: MessageType.Text,
    timestamp: conversationMessage.timestamp,
  };

  // 如果有工具调用，添加到 metadata
  if (conversationMessage.tool_calls && conversationMessage.tool_calls.length > 0) {
    message.metadata = {
      toolCalls: conversationMessage.tool_calls,
    };
  }

  return message;
}

/**
 * 将多个 ConversationMessage 批量映射为 Message 列表
 */
export function mapConversationsToMessages(
  conversations: ConversationMessage[],
  projectId: string
): Message[] {
  return conversations.map((conv) => mapConversationToMessage(conv, projectId));
}

// ============================================================================
// FileItem → Document 映射
// ============================================================================

/**
 * 将后端 FileItem 映射为前端 Document
 * 注意：FileItem 不包含文件内容，需要额外调用 getFileContent
 */
export function mapFileToDocument(
  file: FileItem,
  projectId: string,
  content: string = ''
): Document {
  return {
    id: file.path, // 使用文件路径作为 ID
    projectId: projectId,
    stageId: 'default', // 默认 stage
    name: file.name,
    content: content,
    version: 1,
    status: DocumentStatus.Completed,
    metadata: {
      author: 'Claude Agent',
      createdBy: 'system',
      lastModifiedBy: 'system',
      wordCount: content.split(/\s+/).length,
    },
    createdAt: file.modified || new Date().toISOString(),
    updatedAt: file.modified || new Date().toISOString(),
  };
}

/**
 * 将多个 FileItem 批量映射为 Document 列表
 * 注意：不包含文件内容
 */
export function mapFilesToDocuments(files: FileItem[], projectId: string): Document[] {
  return files
    .filter((file) => file.type === 'file') // 只映射文件，不映射目录
    .map((file) => mapFileToDocument(file, projectId));
}

// ============================================================================
// 辅助函数
// ============================================================================

/**
 * 从 Project 名称生成 workspace_name
 */
export function generateWorkspaceName(projectName: string): string {
  return projectName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // 移除特殊字符
    .replace(/\s+/g, '-') // 空格替换为连字符
    .slice(0, 50); // 限制长度
}

/**
 * 判断文件是否为 Markdown 文档
 */
export function isMarkdownFile(filename: string): boolean {
  return /\.(md|markdown)$/i.test(filename);
}

/**
 * 判断文件是否为文档类型
 */
export function isDocumentFile(filename: string): boolean {
  const docExtensions = ['.md', '.txt', '.pdf', '.docx', '.html'];
  return docExtensions.some((ext) => filename.toLowerCase().endsWith(ext));
}
