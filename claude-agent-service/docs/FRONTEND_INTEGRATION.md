# 前端集成指南

本文档说明前端如何集成 Claude Agent Service 的流式 API。

## 核心概念

前端需要接收和展示三类信息:

1. **AI 回复的消息** - 文本内容
2. **工具调用信息** - 调用了什么工具,参数是什么
3. **工具执行结果** - 工具返回了什么结果

## 事件处理流程

### 完整事件流

```
[系统初始化]
system (init) → 保存 Claude session ID

[AI 思考并回复]
text_delta ×N → 实时显示文本

[工具调用]
content_block_start (tool_use) → 显示 "正在调用工具: Bash"
tool_input_delta ×N → 显示 "构建参数中..."
tool_use → 显示完整的工具和参数

[工具执行]
tool_result → 显示执行结果

[AI 继续回复]
text_delta ×N → 继续显示文本

[完成]
result → 显示统计信息
done → 对话结束
```

## 前端数据结构

### TypeScript 类型定义

```typescript
// 消息类型
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolCalls: ToolCall[];
  stats?: Statistics;
  timestamp: Date;
}

// 工具调用
interface ToolCall {
  id: string;
  name: string;
  input: Record<string, any>;
  inputPartial?: string;
  result?: string;
  isError?: boolean;
  status: 'building' | 'executing' | 'success' | 'failed';
}

// 统计信息
interface Statistics {
  cost: number;
  duration: number;
  turns: number;
  tokens: {
    input: number;
    output: number;
    cacheRead: number;
  };
}

// SSE 事件
type SSEEvent =
  | TextDeltaEvent
  | ToolInputDeltaEvent
  | ContentBlockStartEvent
  | ToolUseEvent
  | ToolResultEvent
  | SystemEvent
  | ResultEvent
  | DoneEvent;

interface TextDeltaEvent {
  type: 'text_delta';
  content: string;
  session_id: string;
  conversation_id: string;
}

interface ToolInputDeltaEvent {
  type: 'tool_input_delta';
  partial_json: string;
  session_id: string;
  conversation_id: string;
}

interface ContentBlockStartEvent {
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

interface ToolUseEvent {
  type: 'tool_use';
  tool: {
    id: string;
    name: string;
    input: Record<string, any>;
  };
  session_id: string;
  conversation_id: string;
}

interface ToolResultEvent {
  type: 'tool_result';
  tool_use_id: string;
  content: string;
  is_error: boolean;
  session_id: string;
  conversation_id: string;
}

interface SystemEvent {
  type: 'system';
  subtype: string;
  data: any;
  session_id: string;
  conversation_id: string;
}

interface ResultEvent {
  type: 'result';
  data: {
    subtype: string;
    is_error: boolean;
    duration_ms: number;
    total_cost_usd: number;
    num_turns: number;
    usage: any;
  };
  session_id: string;
  conversation_id: string;
}

interface DoneEvent {
  type: 'done';
  session_id: string;
  conversation_id: string;
  claude_session_id: string;
}
```

## React 实现示例

### 事件处理 Hook

```typescript
import { useState, useCallback } from 'react';

export function useChatStream(sessionId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentMessage, setCurrentMessage] = useState<Message | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    // 添加用户消息
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      toolCalls: [],
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    // 创建 AI 消息
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      toolCalls: [],
      timestamp: new Date()
    };
    setCurrentMessage(assistantMessage);
    setIsStreaming(true);

    try {
      const response = await fetch('http://localhost:8000/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, message: content })
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let currentTool: ToolCall | null = null;

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;

          const event = JSON.parse(line.slice(6)) as SSEEvent;

          switch (event.type) {
            case 'text_delta':
              // 追加文本
              setCurrentMessage(prev => ({
                ...prev!,
                content: prev!.content + event.content
              }));
              break;

            case 'content_block_start':
              if (event.block_type === 'tool_use') {
                // 创建新的工具调用
                currentTool = {
                  id: event.tool!.id,
                  name: event.tool!.name,
                  input: {},
                  inputPartial: '',
                  status: 'building'
                };
                setCurrentMessage(prev => ({
                  ...prev!,
                  toolCalls: [...prev!.toolCalls, currentTool!]
                }));
              }
              break;

            case 'tool_input_delta':
              // 累积参数
              if (currentTool) {
                currentTool.inputPartial! += event.partial_json;
                try {
                  currentTool.input = JSON.parse(currentTool.inputPartial);
                } catch {
                  // 还未完整
                }
                setCurrentMessage(prev => ({ ...prev! }));
              }
              break;

            case 'tool_use':
              // 工具调用完成
              const toolCall = assistantMessage.toolCalls.find(
                t => t.id === event.tool.id
              );
              if (toolCall) {
                toolCall.input = event.tool.input;
                toolCall.status = 'executing';
                setCurrentMessage(prev => ({ ...prev! }));
              }
              break;

            case 'tool_result':
              // 工具执行结果
              const tool = assistantMessage.toolCalls.find(
                t => t.id === event.tool_use_id
              );
              if (tool) {
                tool.result = event.content;
                tool.isError = event.is_error;
                tool.status = event.is_error ? 'failed' : 'success';
                setCurrentMessage(prev => ({ ...prev! }));
              }
              break;

            case 'result':
              // 统计信息
              setCurrentMessage(prev => ({
                ...prev!,
                stats: {
                  cost: event.data.total_cost_usd,
                  duration: event.data.duration_ms,
                  turns: event.data.num_turns,
                  tokens: {
                    input: event.data.usage.input_tokens,
                    output: event.data.usage.output_tokens,
                    cacheRead: event.data.usage.cache_read_input_tokens || 0
                  }
                }
              }));
              break;

            case 'done':
              // 完成
              setMessages(prev => [...prev, assistantMessage]);
              setCurrentMessage(null);
              setIsStreaming(false);
              break;
          }
        }
      }
    } catch (error) {
      console.error('Stream error:', error);
      setIsStreaming(false);
    }
  }, [sessionId]);

  return { messages, currentMessage, isStreaming, sendMessage };
}
```

### 消息组件

```typescript
import React from 'react';
import ReactMarkdown from 'react-markdown';

export function ChatMessage({ message }: { message: Message }) {
  return (
    <div className={`message message-${message.role}`}>
      {/* 消息内容 */}
      <div className="message-content">
        <ReactMarkdown>{message.content}</ReactMarkdown>
      </div>

      {/* 工具调用 */}
      {message.toolCalls.map(tool => (
        <ToolCallCard key={tool.id} tool={tool} />
      ))}

      {/* 统计信息 */}
      {message.stats && <StatisticsBar stats={message.stats} />}
    </div>
  );
}

function ToolCallCard({ tool }: { tool: ToolCall }) {
  return (
    <div className="tool-call-card">
      <div className="tool-header">
        <span className="tool-icon">🔧</span>
        <span className="tool-name">{tool.name}</span>
        <StatusBadge status={tool.status} />
      </div>

      <div className="tool-body">
        <div className="tool-input">
          <h4>Input:</h4>
          <pre>{JSON.stringify(tool.input, null, 2)}</pre>
        </div>

        {tool.result && (
          <div className={`tool-result ${tool.isError ? 'error' : 'success'}`}>
            <h4>{tool.isError ? 'Error:' : 'Result:'}</h4>
            <pre>{tool.result}</pre>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const icons = {
    building: '🔨',
    executing: '⏳',
    success: '✅',
    failed: '❌'
  };

  const labels = {
    building: 'Building',
    executing: 'Executing',
    success: 'Success',
    failed: 'Failed'
  };

  return (
    <span className={`status-badge status-${status}`}>
      {icons[status]} {labels[status]}
    </span>
  );
}

function StatisticsBar({ stats }: { stats: Statistics }) {
  return (
    <div className="statistics-bar">
      <div className="stat">
        <span className="stat-icon">💰</span>
        <span className="stat-value">${stats.cost.toFixed(4)}</span>
      </div>
      <div className="stat">
        <span className="stat-icon">⏱</span>
        <span className="stat-value">{stats.duration}ms</span>
      </div>
      <div className="stat">
        <span className="stat-icon">🔄</span>
        <span className="stat-value">{stats.turns} turns</span>
      </div>
      <div className="stat">
        <span className="stat-icon">📝</span>
        <span className="stat-value">
          {stats.tokens.input}↓ / {stats.tokens.output}↑
        </span>
      </div>
    </div>
  );
}
```

### 样式建议 (CSS)

```css
/* 消息容器 */
.message {
  margin-bottom: 20px;
  padding: 16px;
  border-radius: 8px;
}

.message-user {
  background: #e3f2fd;
  text-align: right;
}

.message-assistant {
  background: #f5f5f5;
}

/* 工具调用卡片 */
.tool-call-card {
  margin: 12px 0;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  overflow: hidden;
}

.tool-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: #fafafa;
  border-bottom: 1px solid #eee;
}

.tool-name {
  font-weight: 600;
  font-family: monospace;
}

.tool-body {
  padding: 12px;
}

.tool-input,
.tool-result {
  margin-bottom: 12px;
}

.tool-input h4,
.tool-result h4 {
  margin: 0 0 8px 0;
  font-size: 12px;
  text-transform: uppercase;
  color: #666;
}

.tool-input pre,
.tool-result pre {
  background: #f8f8f8;
  padding: 8px;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 13px;
  margin: 0;
}

.tool-result.success {
  border-left: 3px solid #4caf50;
  padding-left: 8px;
}

.tool-result.error {
  border-left: 3px solid #f44336;
  padding-left: 8px;
  background: #ffebee;
}

/* 状态标记 */
.status-badge {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
}

.status-building {
  background: #fff3e0;
  color: #e65100;
}

.status-executing {
  background: #e3f2fd;
  color: #1565c0;
}

.status-success {
  background: #e8f5e9;
  color: #2e7d32;
}

.status-failed {
  background: #ffebee;
  color: #c62828;
}

/* 统计信息栏 */
.statistics-bar {
  display: flex;
  gap: 16px;
  margin-top: 12px;
  padding: 8px 12px;
  background: #fafafa;
  border-radius: 6px;
  font-size: 13px;
}

.stat {
  display: flex;
  align-items: center;
  gap: 4px;
}

.stat-icon {
  font-size: 14px;
}

.stat-value {
  font-weight: 600;
  font-family: monospace;
}
```

## Vue 3 实现示例

### Composition API

```typescript
import { ref, computed } from 'vue';

export function useChatStream(sessionId: string) {
  const messages = ref<Message[]>([]);
  const currentMessage = ref<Message | null>(null);
  const isStreaming = ref(false);

  const sendMessage = async (content: string) => {
    // 添加用户消息
    messages.value.push({
      id: Date.now().toString(),
      role: 'user',
      content,
      toolCalls: [],
      timestamp: new Date()
    });

    // 创建 AI 消息
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      toolCalls: [],
      timestamp: new Date()
    };
    currentMessage.value = assistantMessage;
    isStreaming.value = true;

    try {
      const response = await fetch('http://localhost:8000/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, message: content })
      });

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let currentTool: ToolCall | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;

          const event = JSON.parse(line.slice(6));
          handleEvent(event, assistantMessage, currentTool);
        }
      }

      messages.value.push(assistantMessage);
      currentMessage.value = null;
      isStreaming.value = false;

    } catch (error) {
      console.error('Stream error:', error);
      isStreaming.value = false;
    }
  };

  const handleEvent = (event: any, message: Message, currentTool: ToolCall | null) => {
    switch (event.type) {
      case 'text_delta':
        message.content += event.content;
        break;

      case 'content_block_start':
        if (event.block_type === 'tool_use') {
          currentTool = {
            id: event.tool.id,
            name: event.tool.name,
            input: {},
            inputPartial: '',
            status: 'building'
          };
          message.toolCalls.push(currentTool);
        }
        break;

      case 'tool_input_delta':
        if (currentTool) {
          currentTool.inputPartial += event.partial_json;
          try {
            currentTool.input = JSON.parse(currentTool.inputPartial);
          } catch {
            // Not complete yet
          }
        }
        break;

      case 'tool_use':
        const toolCall = message.toolCalls.find(t => t.id === event.tool.id);
        if (toolCall) {
          toolCall.input = event.tool.input;
          toolCall.status = 'executing';
        }
        break;

      case 'tool_result':
        const tool = message.toolCalls.find(t => t.id === event.tool_use_id);
        if (tool) {
          tool.result = event.content;
          tool.isError = event.is_error;
          tool.status = event.is_error ? 'failed' : 'success';
        }
        break;

      case 'result':
        message.stats = {
          cost: event.data.total_cost_usd,
          duration: event.data.duration_ms,
          turns: event.data.num_turns,
          tokens: event.data.usage
        };
        break;
    }
  };

  return {
    messages,
    currentMessage,
    isStreaming,
    sendMessage
  };
}
```

## 关键实现要点

### 1. 文本流式显示

```typescript
// ✅ 正确: 逐字追加
message.content += event.content;

// ❌ 错误: 替换内容
message.content = event.content;
```

### 2. 工具参数累积

```typescript
// ✅ 正确: 累积 JSON 片段
currentTool.inputPartial += event.partial_json;
try {
  currentTool.input = JSON.parse(currentTool.inputPartial);
} catch {
  // 继续累积
}

// ❌ 错误: 直接替换
currentTool.input = event.partial_json;
```

### 3. 工具状态管理

```typescript
// 工具调用生命周期
'building'   // 参数构建中
  ↓
'executing'  // 执行中
  ↓
'success'    // 成功
'failed'     // 失败
```

### 4. 错误处理

```typescript
try {
  // 处理流式响应
} catch (error) {
  if (error instanceof TypeError) {
    // 网络错误
    showError('Network error');
  } else if (error instanceof SyntaxError) {
    // JSON 解析错误
    showError('Invalid response format');
  } else {
    // 其他错误
    showError('Unknown error');
  }
}
```

### 5. 重连机制

```typescript
async function connectWithRetry(maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await sendMessage(content);
      return;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await sleep(1000 * (i + 1)); // 指数退避
    }
  }
}
```

## 测试建议

### 单元测试

```typescript
import { describe, it, expect, vi } from 'vitest';

describe('ChatStream', () => {
  it('should handle text delta events', () => {
    const handler = new StreamEventHandler();
    handler.handleEvent({
      type: 'text_delta',
      content: 'Hello'
    });
    expect(handler.currentMessage.content).toBe('Hello');
  });

  it('should accumulate tool input deltas', () => {
    const handler = new StreamEventHandler();
    handler.handleEvent({
      type: 'content_block_start',
      block_type: 'tool_use',
      tool: { id: 'tool1', name: 'Bash' }
    });
    handler.handleEvent({
      type: 'tool_input_delta',
      partial_json: '{"cmd"'
    });
    handler.handleEvent({
      type: 'tool_input_delta',
      partial_json: ':"ls"}'
    });

    const tool = handler.currentMessage.toolCalls[0];
    expect(tool.input).toEqual({ cmd: 'ls' });
  });
});
```

## 性能优化

### 1. 防抖更新

```typescript
import { debounce } from 'lodash';

const updateUI = debounce(() => {
  setCurrentMessage({ ...currentMessage });
}, 50); // 50ms 批量更新
```

### 2. 虚拟滚动

对于长输出结果,使用虚拟滚动:

```typescript
import { VirtualScroller } from 'primevue/virtualscroller';

<VirtualScroller :items="toolResult.split('\n')" :itemSize="20">
  <template #item="{ item }">
    <div class="result-line">{{ item }}</div>
  </template>
</VirtualScroller>
```

### 3. 延迟渲染

```typescript
// 工具结果太长时,延迟完整渲染
if (result.length > 10000) {
  showPreview(result.slice(0, 1000));
  setTimeout(() => showFull(result), 100);
}
```

## 参考实现

完整的客户端示例代码:
- Python: `examples/streaming_client.py`
- 基础客户端: `examples/client_example.py`

相关文档:
- 工具调用事件: `docs/TOOL_CALLING_EVENTS.md`
- 流式 API: `docs/STREAMING_API.md`
- Session 映射: `docs/SESSION_ID_MAPPING.md`
