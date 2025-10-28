// Chat API Service (Claude Agent Service Backend)
// 替换原有的 Dialog API，使用流式对话

// ============================================================================
// Chat Types (Backend Schema)
// ============================================================================

export interface ChatRequest {
  session_id?: string; // 可选，自动创建会话
  message: string; // 用户消息
  resume?: string; // 恢复对话 ID
  max_turns?: number; // 最大轮次
  permission_mode?: string; // 默认 "acceptEdits"
}

// SSE 流式事件类型
export interface ChatStreamEvent {
  type: ChatEventType;
  session_id?: string;
  conversation_id?: string;
  [key: string]: unknown;
}

export type ChatEventType =
  | 'connected' // 连接成功
  | 'text_delta' // 文本流式输出
  | 'content_block_start' // 内容块开始
  | 'tool_input_delta' // 工具输入流式输出
  | 'tool_use' // 工具调用
  | 'tool_result' // 工具执行结果
  | 'stream_event' // 其他流式事件
  | 'system' // 系统消息
  | 'result' // 完成消息
  | 'done' // 对话结束
  | 'error'; // 错误消息

// 连接成功事件
export interface ConnectedEvent extends ChatStreamEvent {
  type: 'connected';
  session_id: string;
}

// 文本流式输出事件
export interface TextDeltaEvent extends ChatStreamEvent {
  type: 'text_delta';
  content: string; // 增量文本
  session_id: string;
  conversation_id: string;
}

// 内容块开始事件
export interface ContentBlockStartEvent extends ChatStreamEvent {
  type: 'content_block_start';
  block_type: 'text' | 'tool_use';
  index: number;
  tool?: {
    id: string;
    name: string;
  };
  session_id: string;
  conversation_id: string;
}

// 工具输入流式事件
export interface ToolInputDeltaEvent extends ChatStreamEvent {
  type: 'tool_input_delta';
  partial_json: string;
  session_id: string;
  conversation_id: string;
}

// 工具调用事件
export interface ToolUseEvent extends ChatStreamEvent {
  type: 'tool_use';
  tool: {
    id: string;
    name: string;
    input: Record<string, unknown>;
  };
  session_id: string;
  conversation_id: string;
}

// 工具执行结果事件
export interface ToolResultEvent extends ChatStreamEvent {
  type: 'tool_result';
  tool_use_id: string;
  content: unknown;
  is_error: boolean;
  session_id: string;
  conversation_id: string;
}

// 系统消息事件
export interface SystemEvent extends ChatStreamEvent {
  type: 'system';
  subtype: string;
  data: unknown;
  session_id: string;
  conversation_id: string;
}

// 完成消息事件
export interface ResultEvent extends ChatStreamEvent {
  type: 'result';
  data: {
    subtype: string;
    is_error: boolean;
    duration_ms: number;
    total_cost_usd: number;
    num_turns: number;
    usage: unknown;
    result: string;
  };
  session_id: string;
  conversation_id: string;
}

// 对话结束事件
export interface DoneEvent extends ChatStreamEvent {
  type: 'done';
  session_id: string;
  conversation_id: string;
  claude_session_id?: string;
}

// 错误事件
export interface ErrorEvent extends ChatStreamEvent {
  type: 'error';
  error: string;
  detail: string;
  session_id: string;
  conversation_id: string;
  suggestion?: string;
}

// ============================================================================
// Chat API Functions
// ============================================================================

/**
 * 获取流式对话的 URL
 * 注意：实际 SSE 连接由 SSEConnection 类处理
 */
export function getChatStreamUrl(request: ChatRequest): string {
  const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

  // 构建查询参数
  const params = new URLSearchParams();
  if (request.session_id) params.append('session_id', request.session_id);
  if (request.message) params.append('message', request.message);
  if (request.resume) params.append('resume', request.resume);
  if (request.max_turns) params.append('max_turns', request.max_turns.toString());
  if (request.permission_mode) params.append('permission_mode', request.permission_mode);

  return `${baseURL}/chat/stream?${params.toString()}`;
}

/**
 * 使用 POST 方式发起流式对话
 * 返回 EventSource 对象，由调用方处理 SSE 事件
 */
export async function startChatStream(
  request: ChatRequest,
  onEvent: (event: ChatStreamEvent) => void,
  onError?: (error: Event) => void
): Promise<EventSource> {
  const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

  // 注意：EventSource 本身不支持 POST，所以我们需要使用 fetch + EventSource 组合
  // 或者使用第三方库如 eventsource-parser

  // 这里我们直接使用 GET 方式（通过 query parameters）
  const url = getChatStreamUrl(request);

  const eventSource = new EventSource(url);

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data) as ChatStreamEvent;
      onEvent(data);
    } catch (error) {
      console.error('[Chat] Failed to parse SSE event:', error);
    }
  };

  if (onError) {
    eventSource.onerror = onError;
  }

  return eventSource;
}

/**
 * 使用 fetch + EventSource API 进行 POST 流式对话
 * 这是一个更通用的实现，支持 POST 请求体
 */
export async function startChatStreamWithFetch(
  request: ChatRequest,
  onEvent: (event: ChatStreamEvent) => void,
  onError?: (error: Error) => void
): Promise<AbortController> {
  const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
  const url = `${baseURL}/chat/stream`;

  const controller = new AbortController();

  console.log('[Chat] Starting fetch stream to:', url);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error('Response body is null');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    // 读取流
    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // 处理 SSE 格式 (data: {...}\n\n)
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || ''; // 保留不完整的行

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const jsonStr = line.slice(6); // 移除 "data: " 前缀
          try {
            const event = JSON.parse(jsonStr) as ChatStreamEvent;
            onEvent(event);
          } catch (error) {
            console.error('[Chat] Failed to parse SSE event:', error, 'data:', jsonStr);
          }
        }
      }
    }
  } catch (error) {
    if (onError && error instanceof Error) {
      onError(error);
    }
  }

  return controller;
}
