# 工具调用事件详解

本文档详细说明工具调用相关的所有流式事件,帮助前端正确处理和展示 Claude 的工具调用过程。

## 工具调用完整流程

```
1. AI 回复文本
   ↓
2. 工具调用开始 (content_block_start)
   ↓
3. 工具参数流式输入 (tool_input_delta) ×N
   ↓
4. 工具调用完成 (tool_use)
   ↓
5. 工具执行结果 (tool_result)
   ↓
6. AI 分析结果并回复
```

## 事件详解

### 1. text_delta - AI 回复文本

**触发时机**: AI 开始回复时

**事件格式**:
```json
{
  "type": "text_delta",
  "content": "我来帮你",
  "session_id": "uuid",
  "conversation_id": "uuid"
}
```

**前端处理**:
```javascript
if (event.type === 'text_delta') {
    // 追加到当前消息
    currentMessage.content += event.content;
    updateUI(currentMessage);
}
```

### 2. content_block_start - 内容块开始

**触发时机**:
- 文本块开始
- 工具调用开始

**事件格式**:
```json
// 文本块
{
  "type": "content_block_start",
  "block_type": "text",
  "index": 0,
  "session_id": "uuid",
  "conversation_id": "uuid"
}

// 工具调用块
{
  "type": "content_block_start",
  "block_type": "tool_use",
  "index": 1,
  "tool": {
    "id": "toolu_bdrk_017RHJpzHsPFdjWwV5WbhQEH",
    "name": "Bash"
  },
  "session_id": "uuid",
  "conversation_id": "uuid"
}
```

**前端处理**:
```javascript
if (event.type === 'content_block_start') {
    if (event.block_type === 'text') {
        // 创建新的文本块
        currentBlock = { type: 'text', content: '' };
    } else if (event.block_type === 'tool_use') {
        // 创建工具调用块
        currentBlock = {
            type: 'tool',
            tool_id: event.tool.id,
            tool_name: event.tool.name,
            input: '',
            status: 'building'  // building -> complete -> executed
        };
        showToolCallStart(event.tool.name);
    }
}
```

### 3. tool_input_delta - 工具参数流式输入

**触发时机**: 工具参数构建过程中

**事件格式**:
```json
{
  "type": "tool_input_delta",
  "partial_json": "{\"command",
  "session_id": "uuid",
  "conversation_id": "uuid"
}

{
  "type": "tool_input_delta",
  "partial_json": "\":\"ls -la\"",
  "session_id": "uuid",
  "conversation_id": "uuid"
}
```

**前端处理**:
```javascript
if (event.type === 'tool_input_delta') {
    // 累积 JSON 片段
    currentBlock.input += event.partial_json;

    // 尝试解析(可能不完整)
    try {
        const parsed = JSON.parse(currentBlock.input);
        updateToolInput(parsed);
    } catch {
        // JSON 还未完整,继续累积
        showPartialInput(currentBlock.input);
    }
}
```

### 4. tool_use - 工具调用完成

**触发时机**: 工具参数构建完成,准备执行

**事件格式**:
```json
{
  "type": "tool_use",
  "tool": {
    "id": "toolu_bdrk_017RHJpzHsPFdjWwV5WbhQEH",
    "name": "Bash",
    "input": {
      "command": "ls -la /Users/anker",
      "description": "List contents of /Users/anker directory"
    }
  },
  "session_id": "uuid",
  "conversation_id": "uuid"
}
```

**前端处理**:
```javascript
if (event.type === 'tool_use') {
    const tool = event.tool;

    // 显示工具调用
    addToolCall({
        id: tool.id,
        name: tool.name,
        input: tool.input,
        status: 'executing'
    });

    // UI 示例:
    // 🔧 Calling: Bash
    //    Command: ls -la /Users/anker
    //    Description: List contents of /Users/anker directory
    //    Status: ⏳ Executing...
}
```

### 5. tool_result - 工具执行结果

**触发时机**: 工具执行完成

**事件格式**:
```json
{
  "type": "tool_result",
  "tool_use_id": "toolu_bdrk_017RHJpzHsPFdjWwV5WbhQEH",
  "content": "total 48\ndrwxr-xr-x  10 user  staff   320 Oct 24\n...",
  "is_error": false,
  "session_id": "uuid",
  "conversation_id": "uuid"
}
```

**前端处理**:
```javascript
if (event.type === 'tool_result') {
    // 更新工具执行状态
    updateToolResult({
        tool_use_id: event.tool_use_id,
        content: event.content,
        is_error: event.is_error,
        status: event.is_error ? 'failed' : 'success'
    });

    // UI 示例:
    // 🔧 Bash
    //    Command: ls -la /Users/anker
    //    Status: ✅ Success
    //    Result:
    //    total 48
    //    drwxr-xr-x  10 user  staff   320 Oct 24
    //    ...
}
```

### 6. system - 系统消息

**触发时机**: 会话初始化

**事件格式**:
```json
{
  "type": "system",
  "subtype": "init",
  "data": {
    "session_id": "7c89996c-e45f-4790-b473-30910aa090af",
    "cwd": "/workspace/project",
    "tools": ["Bash", "Read", "Write", "Edit", ...],
    "model": "claude-sonnet-4-5-20250929",
    "permissionMode": "acceptEdits"
  },
  "session_id": "uuid",
  "conversation_id": "uuid"
}
```

**前端处理**:
```javascript
if (event.type === 'system' && event.subtype === 'init') {
    // 保存 Claude session ID
    claudeSessionId = event.data.session_id;

    // 显示可用工具
    console.log('Available tools:', event.data.tools);
}
```

### 7. result - 统计信息

**触发时机**: 对话完成

**事件格式**:
```json
{
  "type": "result",
  "data": {
    "subtype": "success",
    "is_error": false,
    "duration_ms": 24087,
    "total_cost_usd": 0.036676,
    "num_turns": 4,
    "usage": {
      "input_tokens": 9,
      "cache_read_input_tokens": 30415,
      "output_tokens": 566
    },
    "result": "完整的响应文本"
  },
  "session_id": "uuid",
  "conversation_id": "uuid"
}
```

**前端处理**:
```javascript
if (event.type === 'result') {
    // 显示统计信息
    showStats({
        cost: event.data.total_cost_usd,
        duration: event.data.duration_ms,
        turns: event.data.num_turns,
        tokens: event.data.usage
    });
}
```

### 8. done - 完成标记

**触发时机**: SSE 流结束

**事件格式**:
```json
{
  "type": "done",
  "session_id": "uuid",
  "conversation_id": "uuid",
  "claude_session_id": "7c89996c..."
}
```

**前端处理**:
```javascript
if (event.type === 'done') {
    // 标记对话完成
    conversationComplete = true;
    closeEventStream();
}
```

## 前端 UI 建议

### 消息展示结构

```
┌─────────────────────────────────────────────┐
│ User: 帮我看看当前目录下有什么文件             │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Claude:                                     │
│                                             │
│ 我来帮你查看当前目录的内容。                  │
│                                             │
│ ┌─────────────────────────────────────┐   │
│ │ 🔧 Tool Call: Bash                   │   │
│ │ ─────────────────────────────────── │   │
│ │ Command: ls -la                      │   │
│ │ Description: List directory contents │   │
│ │ Status: ✅ Success                   │   │
│ │                                       │   │
│ │ Output:                               │   │
│ │ total 48                              │   │
│ │ drwxr-xr-x  10 user  staff   320     │   │
│ │ -rw-r--r--   1 user  staff  1024     │   │
│ │ file.txt                              │   │
│ └─────────────────────────────────────┘   │
│                                             │
│ 当前目录下有以下文件：                       │
│ - file.txt                                 │
│                                             │
│ ──────────────────────────────────────    │
│ 💰 Cost: $0.0367 | ⏱ 24.1s | 🔄 4 turns │
└─────────────────────────────────────────────┘
```

### React 组件示例

```typescript
interface Message {
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: ToolCall[];
  stats?: Stats;
}

interface ToolCall {
  id: string;
  name: string;
  input: Record<string, any>;
  result?: string;
  isError?: boolean;
  status: 'building' | 'executing' | 'success' | 'failed';
}

function ChatMessage({ message }: { message: Message }) {
  return (
    <div className={`message ${message.role}`}>
      {/* 文本内容 */}
      <div className="content">{message.content}</div>

      {/* 工具调用 */}
      {message.toolCalls?.map(tool => (
        <ToolCallBlock key={tool.id} tool={tool} />
      ))}

      {/* 统计信息 */}
      {message.stats && <StatsBar stats={message.stats} />}
    </div>
  );
}

function ToolCallBlock({ tool }: { tool: ToolCall }) {
  return (
    <div className="tool-call">
      <div className="tool-header">
        🔧 {tool.name}
        <StatusBadge status={tool.status} />
      </div>

      <div className="tool-input">
        <pre>{JSON.stringify(tool.input, null, 2)}</pre>
      </div>

      {tool.result && (
        <div className={`tool-result ${tool.isError ? 'error' : 'success'}`}>
          <pre>{tool.result}</pre>
        </div>
      )}
    </div>
  );
}
```

### Vue 组件示例

```vue
<template>
  <div class="chat-container">
    <div v-for="msg in messages" :key="msg.id" :class="`message-${msg.role}`">
      <!-- 文本内容 -->
      <div class="message-content" v-html="formatMarkdown(msg.content)"></div>

      <!-- 工具调用 -->
      <div v-for="tool in msg.toolCalls" :key="tool.id" class="tool-call-card">
        <div class="tool-header">
          <span class="tool-icon">🔧</span>
          <span class="tool-name">{{ tool.name }}</span>
          <span :class="`status-${tool.status}`">
            {{ getStatusIcon(tool.status) }}
          </span>
        </div>

        <div class="tool-input">
          <h4>Input:</h4>
          <pre>{{ JSON.stringify(tool.input, null, 2) }}</pre>
        </div>

        <div v-if="tool.result" :class="`tool-result ${tool.isError ? 'error' : 'success'}`">
          <h4>{{ tool.isError ? 'Error:' : 'Result:' }}</h4>
          <pre>{{ tool.result }}</pre>
        </div>
      </div>

      <!-- 统计 -->
      <div v-if="msg.stats" class="stats-bar">
        <span>💰 ${{ msg.stats.cost.toFixed(4) }}</span>
        <span>⏱ {{ msg.stats.duration }}ms</span>
        <span>🔄 {{ msg.stats.turns }} turns</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  methods: {
    getStatusIcon(status) {
      const icons = {
        building: '🔨',
        executing: '⏳',
        success: '✅',
        failed: '❌'
      };
      return icons[status] || '⚪';
    }
  }
};
</script>
```

## 完整事件序列示例

### 场景: "帮我看看当前目录下有什么文件"

```json
// 1. 系统初始化
{"type":"system","subtype":"init","data":{"session_id":"7c89996c..."}}

// 2. 开始回复
{"type":"content_block_start","block_type":"text","index":0}

// 3. 文本流式输出
{"type":"text_delta","content":"我"}
{"type":"text_delta","content":"来帮你"}
{"type":"text_delta","content":"查看"}
{"type":"text_delta","content":"当前目录"}
{"type":"text_delta","content":"的内容。"}

// 4. 工具调用开始
{"type":"content_block_start","block_type":"tool_use","index":1,"tool":{"id":"toolu_xxx","name":"Bash"}}

// 5. 工具参数流式构建
{"type":"tool_input_delta","partial_json":""}
{"type":"tool_input_delta","partial_json":"{\"command"}
{"type":"tool_input_delta","partial_json":"\":"}
{"type":"tool_input_delta","partial_json":" \"ls -la\""}
{"type":"tool_input_delta","partial_json":", \"description\""}
{"type":"tool_input_delta","partial_json":": \"List"}
{"type":"tool_input_delta","partial_json":" files\"}"}

// 6. 工具调用完成
{"type":"tool_use","tool":{"id":"toolu_xxx","name":"Bash","input":{"command":"ls -la","description":"List files"}}}

// 7. 工具执行结果
{"type":"tool_result","tool_use_id":"toolu_xxx","content":"total 48\ndrwxr-xr-x  10 user  staff   320 Oct 24 16:00 .\ndrwxr-xr-x   5 user  staff   160 Oct 24 15:00 ..\n-rw-r--r--   1 user  staff  1024 Oct 24 16:00 file.txt","is_error":false}

// 8. AI 继续回复
{"type":"content_block_start","block_type":"text","index":2}
{"type":"text_delta","content":"当前"}
{"type":"text_delta","content":"目录下"}
{"type":"text_delta","content":"有以下"}
{"type":"text_delta","content":"文件："}
{"type":"text_delta","content":"\n- file.txt"}

// 9. 统计信息
{"type":"result","data":{"subtype":"success","total_cost_usd":0.0367,"duration_ms":24087,"num_turns":4}}

// 10. 完成
{"type":"done","session_id":"550e8400...","conversation_id":"661f9511...","claude_session_id":"7c89996c..."}
```

## 前端状态管理

### 状态结构

```typescript
interface ConversationState {
  messages: Message[];
  currentMessage: Message | null;
  currentToolCall: ToolCall | null;
  isStreaming: boolean;
  claudeSessionId: string | null;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolCalls: ToolCall[];
  timestamp: Date;
  stats?: Stats;
}

interface ToolCall {
  id: string;
  name: string;
  input: Record<string, any>;
  inputPartial?: string;  // 用于显示构建中的参数
  result?: string;
  isError?: boolean;
  status: 'building' | 'executing' | 'success' | 'failed';
}

interface Stats {
  cost: number;
  duration: number;
  turns: number;
  tokens: {
    input: number;
    output: number;
    cache_read: number;
  };
}
```

### 事件处理器

```typescript
class StreamEventHandler {
  private state: ConversationState;
  private currentMessage: Message;
  private currentToolCall: ToolCall | null = null;

  handleEvent(event: any) {
    switch (event.type) {
      case 'system':
        this.handleSystemMessage(event);
        break;

      case 'content_block_start':
        this.handleBlockStart(event);
        break;

      case 'text_delta':
        this.handleTextDelta(event);
        break;

      case 'tool_input_delta':
        this.handleToolInputDelta(event);
        break;

      case 'tool_use':
        this.handleToolUse(event);
        break;

      case 'tool_result':
        this.handleToolResult(event);
        break;

      case 'result':
        this.handleResult(event);
        break;

      case 'done':
        this.handleDone(event);
        break;
    }
  }

  handleSystemMessage(event: any) {
    if (event.subtype === 'init') {
      this.state.claudeSessionId = event.data.session_id;
    }
  }

  handleBlockStart(event: any) {
    if (event.block_type === 'text') {
      // 开始新的文本块(可能在工具调用后)
      // 不需要特殊处理
    } else if (event.block_type === 'tool_use') {
      // 创建新的工具调用
      this.currentToolCall = {
        id: event.tool.id,
        name: event.tool.name,
        input: {},
        inputPartial: '',
        status: 'building'
      };
      this.currentMessage.toolCalls.push(this.currentToolCall);
    }
  }

  handleTextDelta(event: any) {
    // 追加文本
    this.currentMessage.content += event.content;
    this.updateUI();
  }

  handleToolInputDelta(event: any) {
    if (this.currentToolCall) {
      // 累积参数
      this.currentToolCall.inputPartial += event.partial_json;

      // 尝试解析
      try {
        this.currentToolCall.input = JSON.parse(this.currentToolCall.inputPartial);
      } catch {
        // 还未完整
      }
      this.updateUI();
    }
  }

  handleToolUse(event: any) {
    // 工具调用完成
    const toolCall = this.currentMessage.toolCalls.find(t => t.id === event.tool.id);
    if (toolCall) {
      toolCall.input = event.tool.input;
      toolCall.status = 'executing';
      this.updateUI();
    }
  }

  handleToolResult(event: any) {
    // 工具执行结果
    const toolCall = this.currentMessage.toolCalls.find(t => t.id === event.tool_use_id);
    if (toolCall) {
      toolCall.result = event.content;
      toolCall.isError = event.is_error;
      toolCall.status = event.is_error ? 'failed' : 'success';
      this.updateUI();
    }
  }

  handleResult(event: any) {
    // 统计信息
    this.currentMessage.stats = {
      cost: event.data.total_cost_usd,
      duration: event.data.duration_ms,
      turns: event.data.num_turns,
      tokens: event.data.usage
    };
    this.updateUI();
  }

  handleDone(event: any) {
    // 完成
    this.state.isStreaming = false;
    this.state.messages.push(this.currentMessage);
    this.updateUI();
  }
}
```

## Python 客户端完整示例

```python
import requests
import json


class ClaudeStreamClient:
    """Claude 流式客户端"""

    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url

    def chat(self, session_id: str, message: str):
        """发送消息并处理流式响应"""
        url = f"{self.base_url}/api/chat/stream"
        data = {"session_id": session_id, "message": message}

        response = requests.post(
            url,
            json=data,
            stream=True,
            headers={"Accept": "text/event-stream"}
        )

        print(f"User: {message}\n")
        print("Claude: ", end="", flush=True)

        current_tool = None
        tool_input_buffer = ""

        for line in response.iter_lines():
            if not line:
                continue

            line = line.decode('utf-8')
            if not line.startswith('data: '):
                continue

            event = json.loads(line[6:])
            event_type = event.get("type")

            # 文本增量
            if event_type == "text_delta":
                print(event["content"], end="", flush=True)

            # 内容块开始
            elif event_type == "content_block_start":
                if event.get("block_type") == "tool_use":
                    tool_name = event.get("tool", {}).get("name")
                    tool_id = event.get("tool", {}).get("id")
                    current_tool = {"id": tool_id, "name": tool_name}
                    tool_input_buffer = ""
                    print(f"\n\n🔧 Calling tool: {tool_name}")
                    print("   Building parameters...", end="", flush=True)

            # 工具参数流式输入
            elif event_type == "tool_input_delta":
                tool_input_buffer += event["partial_json"]
                # 可以显示构建过程
                print(".", end="", flush=True)

            # 工具调用完成
            elif event_type == "tool_use":
                tool = event["tool"]
                print(f"\n   Tool: {tool['name']}")
                print(f"   Input: {json.dumps(tool['input'], indent=6)}")
                print("   Status: ⏳ Executing...")

            # 工具执行结果
            elif event_type == "tool_result":
                content = event["content"]
                is_error = event["is_error"]

                if is_error:
                    print(f"   Status: ❌ Failed")
                    print(f"   Error: {content}")
                else:
                    print(f"   Status: ✅ Success")
                    print(f"   Result:")
                    # 限制显示长度
                    lines = content.split('\n')
                    for i, line in enumerate(lines[:20]):  # 只显示前20行
                        print(f"      {line}")
                    if len(lines) > 20:
                        print(f"      ... ({len(lines) - 20} more lines)")

                print("\nClaude: ", end="", flush=True)

            # 系统消息
            elif event_type == "system":
                if event.get("subtype") == "init":
                    claude_session = event["data"]["session_id"]
                    print(f"[Session: {claude_session[:8]}...]")
                    print("Claude: ", end="", flush=True)

            # 统计信息
            elif event_type == "result":
                data = event["data"]
                print(f"\n\n{'='*50}")
                print(f"📊 Statistics:")
                print(f"   💰 Cost: ${data['total_cost_usd']:.4f}")
                print(f"   ⏱  Duration: {data['duration_ms']}ms")
                print(f"   🔄 Turns: {data['num_turns']}")
                print(f"   📝 Tokens: {data['usage']['input_tokens']} in / {data['usage']['output_tokens']} out")
                if data['usage'].get('cache_read_input_tokens'):
                    print(f"   💾 Cache: {data['usage']['cache_read_input_tokens']} tokens")
                print('='*50)

            # 完成
            elif event_type == "done":
                print("\n✓ Done\n")
                break


# 使用示例
if __name__ == "__main__":
    client = ClaudeStreamClient()

    # 创建会话
    response = requests.post("http://localhost:8000/api/sessions")
    session_id = response.json()["id"]

    # 发送消息
    client.chat(session_id, "帮我看看当前目录下有什么文件")
```

## 输出示例

```
User: 帮我看看当前目录下有什么文件

[Session: 7c89996c...]
Claude: 我来帮你查看当前目录的内容。

🔧 Calling tool: Bash
   Building parameters.....
   Tool: Bash
   Input: {
      "command": "ls -la",
      "description": "List directory contents"
   }
   Status: ⏳ Executing...
   Status: ✅ Success
   Result:
      total 48
      drwxr-xr-x  10 user  staff   320 Oct 24 16:00 .
      drwxr-xr-x   5 user  staff   160 Oct 24 15:00 ..
      -rw-r--r--   1 user  staff  1024 Oct 24 16:00 file.txt
      -rw-r--r--   1 user  staff  2048 Oct 24 16:00 README.md

Claude: 当前目录下有以下文件：
- file.txt (1KB)
- README.md (2KB)

==================================================
📊 Statistics:
   💰 Cost: $0.0367
   ⏱  Duration: 24087ms
   🔄 Turns: 4
   📝 Tokens: 9 in / 566 out
   💾 Cache: 30415 tokens
==================================================

✓ Done
```

## 关键事件流

### 单轮对话(无工具)

```
system → text_delta ×N → result → done
```

### 单轮对话(带工具)

```
system → text_delta ×N → tool_input_delta ×N → tool_use → tool_result → text_delta ×N → result → done
```

### 多轮对话(多个工具)

```
system →
  text_delta ×N →
  [tool_input_delta ×N → tool_use → tool_result] ×M →
  text_delta ×N →
  result → done
```

## 注意事项

1. **顺序保证**: 事件按顺序发送,前端应按顺序处理
2. **缓冲处理**: `tool_input_delta` 需要累积后解析
3. **错误处理**: 检查 `tool_result.is_error` 字段
4. **UI 更新**: 每个事件到达时都应更新 UI
5. **长内容**: 工具结果可能很长,注意截断显示
6. **重连机制**: SSE 断开时需要重连

## 参考资源

- [Claude SDK 文档](https://github.com/anthropics/claude-agent-sdk)
- [SSE 规范](https://html.spec.whatwg.org/multipage/server-sent-events.html)
- Session ID 映射: `docs/SESSION_ID_MAPPING.md`
- 流式 API: `docs/STREAMING_API.md`
