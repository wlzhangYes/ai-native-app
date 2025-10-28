// Session API Service (Claude Agent Service Backend)
// 替换原有的 Project API，使用 Session 概念

import { get, post, del } from './request';
import type { ApiResponse } from '@/types/api';

// ============================================================================
// Session Types (Backend Schema)
// ============================================================================

export interface SessionResponse {
  id: string;
  claude_session_id?: string;
  workspace_path: string;
  workspace_name?: string;
  created_at: string;
  updated_at: string;
  last_activity: string;
  conversation_count: number;
  is_active: boolean;
}

export interface SessionCreateRequest {
  session_id?: string;
  workspace_name?: string;
}

export interface SessionListResponse {
  sessions: SessionResponse[];
  total: number;
  skip: number;
  limit: number;
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  tool_calls?: Array<{
    id: string;
    name: string;
    input: Record<string, unknown>;
    result: unknown;
    is_error: boolean;
  }>;
  timestamp: string;
}

export interface MessageHistoryResponse {
  messages: ConversationMessage[];
  total: number;
}

// ============================================================================
// Session API Functions
// ============================================================================

/**
 * 创建新的会话
 * 注意：后端需要空的 JSON 对象 {} 作为请求体
 */
export async function createSession(
  data?: SessionCreateRequest
): Promise<ApiResponse<SessionResponse>> {
  console.log('[createSession] Creating session with empty body');
  const result = await post<SessionResponse>('/sessions', {});
  console.log('[createSession] Full response:', JSON.stringify(result, null, 2));
  console.log('[createSession] response.data exists?:', !!result.data);
  console.log('[createSession] response.success:', result.success);
  return result;
}

/**
 * 获取会话列表
 */
export async function getSessions(params?: {
  skip?: number;
  limit?: number;
  active_only?: boolean;
}): Promise<ApiResponse<SessionListResponse>> {
  return get<SessionListResponse>('/sessions', { params });
}

/**
 * 获取单个会话详情
 */
export async function getSession(sessionId: string): Promise<ApiResponse<SessionResponse>> {
  return get<SessionResponse>(`/sessions/${sessionId}`);
}

/**
 * 删除会话
 */
export async function deleteSession(sessionId: string): Promise<ApiResponse<{ message: string }>> {
  return del<{ message: string }>(`/sessions/${sessionId}`);
}

/**
 * 获取会话的消息历史
 */
export async function getSessionMessages(
  sessionId: string,
  params?: {
    skip?: number;
    limit?: number;
  }
): Promise<ApiResponse<MessageHistoryResponse>> {
  return get<MessageHistoryResponse>(`/sessions/${sessionId}/messages`, { params });
}
