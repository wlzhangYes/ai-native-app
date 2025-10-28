// Dialog (Conversation) API Service
// 适配 Claude Agent Service 的 Chat API

import type {
  ApiResponse,
  PaginatedResponse,
  SendMessageRequest,
  SendMessageResponse,
  MessagesQuery,
} from '@/types/api';
import type { Message } from '@/types/models';
import { getSessionMessages } from './session';
import { mapConversationsToMessages } from './adapters';
import { getChatStreamUrl } from './chat';
import type { ChatRequest } from './chat';

/**
 * Get conversation messages for a project (映射自 Session Messages)
 */
export async function getMessages(
  projectId: string, // 实际上是 session_id
  query?: MessagesQuery
): Promise<ApiResponse<PaginatedResponse<Message>>> {
  const response = await getSessionMessages(projectId, {
    skip: query?.page ? (query.page - 1) * (query.pageSize || 20) : 0,
    limit: query?.pageSize || 20,
  });

  if (!response.success || !response.data) {
    return response as ApiResponse<PaginatedResponse<Message>>;
  }

  const messages = mapConversationsToMessages(response.data.messages, projectId);

  // 根据时间戳过滤
  let filteredMessages = messages;
  if (query?.since) {
    const sinceDate = new Date(query.since);
    filteredMessages = filteredMessages.filter((m) => new Date(m.timestamp) >= sinceDate);
  }

  const pageSize = query?.pageSize || 20;
  const page = query?.page || 1;

  return {
    success: true,
    data: {
      items: filteredMessages,
      total: response.data.total,
      page: page,
      pageSize: pageSize,
      hasMore: (query?.page || 1) * pageSize < response.data.total,
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Send a message to AI and get stream URL
 * 注意：Claude Agent Service 使用流式响应，不返回 messageId
 */
export async function sendMessage(
  projectId: string,
  data: SendMessageRequest
): Promise<ApiResponse<SendMessageResponse>> {
  // 构建流式 URL
  const streamUrl = getChatStreamUrl({
    session_id: projectId,
    message: data.content,
    permission_mode: 'acceptEdits',
  });

  // Claude Agent Service 不支持预先创建 message，直接返回流式 URL
  return {
    success: true,
    data: {
      messageId: `msg_${Date.now()}`, // 临时 ID
      streamUrl: streamUrl,
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Get SSE stream URL for a project
 * 适配 Claude Agent Service 的 Chat Stream API
 */
export function getStreamUrl(projectId: string, message?: string): string {
  return getChatStreamUrl({
    session_id: projectId,
    message: message || '',
    permission_mode: 'acceptEdits',
  });
}

/**
 * 创建 Chat 请求对象
 */
export function createChatRequest(
  projectId: string,
  message: string,
  options?: {
    resume?: string;
    maxTurns?: number;
    permissionMode?: string;
  }
): ChatRequest {
  return {
    session_id: projectId,
    message: message,
    resume: options?.resume,
    max_turns: options?.maxTurns,
    permission_mode: options?.permissionMode || 'acceptEdits',
  };
}
