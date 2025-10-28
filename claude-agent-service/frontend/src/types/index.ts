// Session types
export interface Session {
  id: string;
  claude_session_id?: string;
  workspace_path: string;
  workspace_name?: string;
  created_at: string;
  last_activity: string;
  conversation_count: number;
  is_active: boolean;
}

// Message types
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolCalls: ToolCall[];
  stats?: Statistics;
  timestamp: Date;
}

// Tool call types
export interface ToolCall {
  id: string;
  name: string;
  input: Record<string, any>;
  inputPartial?: string;
  result?: string;
  isError?: boolean;
  status: 'building' | 'executing' | 'success' | 'failed';
}

// Statistics
export interface Statistics {
  cost: number;
  duration: number;
  turns: number;
  tokens: {
    input: number;
    output: number;
    cacheRead: number;
  };
}

// Todo types
export interface Todo {
  content: string;
  activeForm: string;
  status: 'pending' | 'in_progress' | 'completed';
}

// File types
export interface FileItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  modified?: string;
}

// SSE Event types
export type SSEEvent =
  | ConnectedEvent
  | TextDeltaEvent
  | ToolInputDeltaEvent
  | ContentBlockStartEvent
  | ToolUseEvent
  | ToolResultEvent
  | SystemEvent
  | ResultEvent
  | DoneEvent;

export interface ConnectedEvent {
  type: 'connected';
  session_id: string;
}

export interface TextDeltaEvent {
  type: 'text_delta';
  content: string;
  session_id: string;
  conversation_id: string;
}

export interface ToolInputDeltaEvent {
  type: 'tool_input_delta';
  partial_json: string;
  session_id: string;
  conversation_id: string;
}

export interface ContentBlockStartEvent {
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

export interface ToolUseEvent {
  type: 'tool_use';
  tool: {
    id: string;
    name: string;
    input: Record<string, any>;
  };
  session_id: string;
  conversation_id: string;
}

export interface ToolResultEvent {
  type: 'tool_result';
  tool_use_id: string;
  content: string;
  is_error: boolean;
  session_id: string;
  conversation_id: string;
}

export interface SystemEvent {
  type: 'system';
  subtype: string;
  data: any;
  session_id: string;
  conversation_id: string;
}

export interface ResultEvent {
  type: 'result';
  data: {
    subtype: string;
    is_error: boolean;
    duration_ms: number;
    total_cost_usd: number;
    num_turns: number;
    usage: any;
    result: string;
  };
  session_id: string;
  conversation_id: string;
}

export interface DoneEvent {
  type: 'done';
  session_id: string;
  conversation_id: string;
  claude_session_id?: string;
}
