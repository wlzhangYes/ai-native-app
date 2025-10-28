# 流式 API 文档

本文档详细说明 Claude Agent Service 的流式响应机制。

## 概述

服务使用 **Server-Sent Events (SSE)** 协议实现流式响应,客户端可以实时接收 Claude 的响应内容,而不需要等待整个响应完成。

## 启用流式响应

在初始化 Claude SDK 时,必须设置 `include_partial_messages=True`:

```python
options = ClaudeAgentOptions(
    env=get_claude_env(),
    cwd=workspace_path,
    include_partial_messages=True  # 启用流式响应
)
```

## 事件类型总览

前端需要处理的所有事件类型:

| 事件类型 | 描述 | 前端处理建议 |
|---------|------|---------|
| `text_delta` | AI 回复的文本片段 | 实时追加显示 |
| `tool_input_delta` | 工具参数的流式输入 | 显示构建中的参数 |
| `content_block_start` | 内容块开始(文本/工具) | 显示类型标记 |
| `tool_use` | 工具调用完成 | 显示工具名称和完整参数 |
| `tool_result` | 工具执行结果 | 显示执行结果(成功/失败) |
| `system` | 系统消息 | 捕获 Claude session ID |
| `result` | 统计信息 | 显示成本/耗时/token数 |
| `stream_event` | 其他流式事件 | 可选,用于调试 |
| `done` | 对话完成 | 结束标记 |

## 消息类型详解

### 1. StreamEvent (流式事件)

Claude SDK 返回的实时流式事件,包含以下类型:

#### 1.1 content_block_delta (文本增量)

**描述**: 实时的文本片段,逐字/逐句返回

**SDK 格式**:
```python
StreamEvent(
    event={
        'type': 'content_block_delta',
        'index': 0,
        'delta': {
            'type': 'text_delta',
            'text': '我来帮你'  # 文本片段
        }
    }
)
```

**SSE 响应**:
```json
{
  "type": "stream",
  "content": "我来帮你",
  "session_id": "uuid",
  "conversation_id": "uuid"
}
```

#### 1.2 message_start (消息开始)

**描述**: 消息开始,包含模型信息和初始 token 使用量

**SDK 格式**:
```python
StreamEvent(
    event={
        'type': 'message_start',
        'message': {
            'model': 'claude-sonnet-4-5-20250929',
            'id': 'msg_bdrk_xxx',
            'usage': {
                'input_tokens': 3,
                'cache_read_input_tokens': 15157,
                'output_tokens': 2
            }
        }
    }
)
```

**SSE 响应**:
```json
{
  "type": "event",
  "event_type": "message_start",
  "data": { ... },
  "session_id": "uuid",
  "conversation_id": "uuid"
}
```

#### 1.3 content_block_start (内容块开始)

**描述**: 内容块开始(文本或工具调用)

```python
StreamEvent(
    event={
        'type': 'content_block_start',
        'index': 0,
        'content_block': {
            'type': 'text',
            'text': ''
        }
    }
)
```

#### 1.4 content_block_stop (内容块结束)

**描述**: 内容块结束

```python
StreamEvent(
    event={
        'type': 'content_block_stop',
        'index': 0
    }
)
```

#### 1.5 message_delta (消息增量)

**描述**: 消息级别的更新(如停止原因)

```python
StreamEvent(
    event={
        'type': 'message_delta',
        'delta': {
            'stop_reason': 'end_turn',
            'stop_sequence': None
        },
        'usage': {
            'output_tokens': 459
        }
    }
)
```

#### 1.6 message_stop (消息结束)

**描述**: 消息完全结束,包含最终指标

```python
StreamEvent(
    event={
        'type': 'message_stop',
        'amazon-bedrock-invocationMetrics': {
            'inputTokenCount': 6,
            'outputTokenCount': 459,
            'invocationLatency': 15956,
            'firstByteLatency': 2906
        }
    }
)
```

### 2. SystemMessage (系统消息)

**描述**: 系统初始化信息,包含 Claude session ID

**SDK 格式**:
```python
SystemMessage(
    subtype='init',
    data={
        'session_id': '7c89996c-e45f-4790-b473-30910aa090af',
        'cwd': '/workspace/project',
        'tools': ['Bash', 'Read', 'Write', ...],
        'model': 'claude-sonnet-4-5-20250929',
        'permissionMode': 'acceptEdits'
    }
)
```

**SSE 响应**:
```json
{
  "type": "system",
  "data": {
    "subtype": "init",
    "message_data": { ... }
  },
  "session_id": "uuid",
  "conversation_id": "uuid"
}
```

### 3. AssistantMessage (助手消息)

**描述**: 完整的助手响应(当收到 StreamEvent 时可以忽略)

```python
AssistantMessage(
    content=[
        TextBlock(text='完整的响应文本')
    ]
)
```

### 4. ResultMessage (结果消息)

**描述**: 对话结束,包含统计信息

**SDK 格式**:
```python
ResultMessage(
    subtype='success',
    duration_ms=24087,
    total_cost_usd=0.036676,
    is_error=False,
    usage={
        'input_tokens': 9,
        'cache_read_input_tokens': 30415,
        'output_tokens': 566
    }
)
```

**SSE 响应**:
```json
{
  "type": "result",
  "data": {
    "subtype": "success",
    "is_error": false,
    "duration_ms": 24087,
    "total_cost_usd": 0.036676,
    "usage": { ... }
  },
  "session_id": "uuid",
  "conversation_id": "uuid"
}
```

## 完整的流式响应示例

### 示例 1: 纯文本响应

#### 请求

```bash
POST /api/chat/stream
Content-Type: application/json

{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "你好"
}
```

#### 响应 (SSE 流)

```
data: {"type":"system","subtype":"init","data":{"session_id":"7c89996c..."},"session_id":"550e8400...","conversation_id":"661f9511..."}

data: {"type":"stream_event","event_type":"message_start","data":{...}}

data: {"type":"content_block_start","block_type":"text","index":0}

data: {"type":"text_delta","content":"你好"}

data: {"type":"text_delta","content":"！"}

data: {"type":"text_delta","content":"我是"}

data: {"type":"text_delta","content":" Claude"}

data: {"type":"stream_event","event_type":"content_block_stop","data":{...}}

data: {"type":"result","data":{"subtype":"success","is_error":false,"duration_ms":1500}}

data: {"type":"done","session_id":"550e8400...","conversation_id":"661f9511...","claude_session_id":"7c89996c..."}
```

### 示例 2: 带工具调用的响应

#### 请求

```bash
POST /api/chat/stream
Content-Type: application/json

{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "帮我看看当前目录下有什么文件"
}
```

#### 响应 (SSE 流)

```
# 1. 系统初始化
data: {"type":"system","subtype":"init","data":{"session_id":"7c89996c...","tools":["Bash","Read","Write",...]}}

# 2. AI 回复文本
data: {"type":"content_block_start","block_type":"text","index":0}

data: {"type":"text_delta","content":"我"}

data: {"type":"text_delta","content":"来帮你"}

data: {"type":"text_delta","content":"查看当前目录"}

data: {"type":"text_delta","content":"的内容。"}

# 3. 工具调用开始
data: {"type":"content_block_start","block_type":"tool_use","index":1,"tool":{"id":"toolu_xxx","name":"Bash"}}

data: {"type":"tool_input_delta","partial_json":""}

data: {"type":"tool_input_delta","partial_json":"{\"command"}

data: {"type":"tool_input_delta","partial_json":"\":"}

data: {"type":"tool_input_delta","partial_json":" \"ls -la\""}

data: {"type":"tool_input_delta","partial_json":", \"de"}

data: {"type":"tool_input_delta","partial_json":"scription\": \"List"}

data: {"type":"tool_input_delta","partial_json":" files\"}"}

# 4. 工具调用完成
data: {"type":"tool_use","tool":{"id":"toolu_xxx","name":"Bash","input":{"command":"ls -la","description":"List files"}}}

# 5. 工具执行结果
data: {"type":"tool_result","tool_use_id":"toolu_xxx","content":"total 48\ndrwxr-xr-x  10 user  staff   320 Oct 24 16:00 .\ndrwxr-xr-x   5 user  staff   160 Oct 24 15:00 ..\n-rw-r--r--   1 user  staff  1024 Oct 24 16:00 file.txt","is_error":false}

# 6. AI 分析结果的回复
data: {"type":"content_block_start","block_type":"text","index":2}

data: {"type":"text_delta","content":"当前"}

data: {"type":"text_delta","content":"目录下"}

data: {"type":"text_delta","content":"有以下文件："}

data: {"type":"text_delta","content":"\n- file.txt"}

# 7. 完成
data: {"type":"result","data":{"subtype":"success","total_cost_usd":0.0367,"duration_ms":24087,"num_turns":4}}

data: {"type":"done","session_id":"550e8400...","conversation_id":"661f9511...","claude_session_id":"7c89996c..."}
```

## 客户端实现

### Python 客户端 (完整版)

```python
import requests
import json


class StreamingChatClient:
    """流式聊天客户端"""

    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url

    def chat_stream(self, session_id: str, message: str):
        """流式聊天"""
        url = f"{self.base_url}/api/chat/stream"
        data = {
            "session_id": session_id,
            "message": message
        }

        response = requests.post(
            url,
            json=data,
            stream=True,
            headers={"Accept": "text/event-stream"}
        )

        for line in response.iter_lines():
            if line:
                line = line.decode('utf-8')
                if line.startswith('data: '):
                    event = json.loads(line[6:])
                    yield event

    def display_stream(self, session_id: str, message: str):
        """显示流式响应"""
        print(f"User: {message}\n")
        print("Claude: ", end="", flush=True)

        for event in self.chat_stream(session_id, message):
            event_type = event.get("type")

            # 实时显示文本
            if event_type == "text_delta":
                print(event["content"], end="", flush=True)

            # 工具调用开始
            elif event_type == "content_block_start":
                if event.get("block_type") == "tool_use":
                    tool_name = event.get("tool", {}).get("name")
                    print(f"\n\n🔧 Calling tool: {tool_name}")

            # 工具调用完成
            elif event_type == "tool_use":
                tool = event["tool"]
                print(f"   Tool: {tool['name']}")
                print(f"   Input: {json.dumps(tool['input'], indent=2)}")

            # 工具执行结果
            elif event_type == "tool_result":
                content = event["content"]
                is_error = event["is_error"]
                status = "❌ Error" if is_error else "✅ Success"
                print(f"\n{status} Tool result:")
                # 限制输出长度
                if len(content) > 500:
                    print(f"   {content[:500]}...")
                else:
                    print(f"   {content}")
                print("\nClaude: ", end="", flush=True)

            # 系统消息
            elif event_type == "system":
                if event.get("subtype") == "init":
                    claude_session = event["data"]["session_id"]
                    print(f"\n[Claude Session: {claude_session}]")
                    print("Claude: ", end="", flush=True)

            # 结果统计
            elif event_type == "result":
                data = event["data"]
                print(f"\n\n📊 Statistics:")
                print(f"   Cost: ${data['total_cost_usd']:.4f}")
                print(f"   Duration: {data['duration_ms']}ms")
                print(f"   Turns: {data['num_turns']}")

            # 完成
            elif event_type == "done":
                print("\n✓ Done\n")
                break


# 使用示例
client = StreamingChatClient()
client.display_stream(
    "550e8400-e29b-41d4-a716-446655440000",
    "帮我看看当前目录下有什么文件"
)
```

### JavaScript/TypeScript 客户端

```typescript
async function chatStream(sessionId: string, message: string) {
  const response = await fetch('http://localhost:8000/api/chat/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId, message })
  });

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader!.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const event = JSON.parse(line.slice(6));

        switch (event.type) {
          case 'stream':
            // 实时显示文本
            process.stdout.write(event.content);
            break;

          case 'system':
            if (event.data.subtype === 'init') {
              console.log(`\nClaude Session: ${event.data.message_data.session_id}`);
            }
            break;

          case 'result':
            console.log(`\n\nCost: $${event.data.total_cost_usd.toFixed(4)}`);
            console.log(`Duration: ${event.data.duration_ms}ms`);
            break;

          case 'done':
            console.log('\n✓ Done');
            return;
        }
      }
    }
  }
}

// 使用示例
chatStream('550e8400-e29b-41d4-a716-446655440000', '帮我看看当前目录');
```

### cURL 示例

```bash
curl -X POST http://localhost:8000/api/chat/stream \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "550e8400-e29b-41d4-a716-446655440000",
    "message": "帮我看看当前目录"
  }' \
  --no-buffer
```

## 事件流程图

```
客户端发送请求
    ↓
[SystemMessage] init - Claude session 初始化
    ↓
[StreamEvent] message_start - 消息开始
    ↓
[StreamEvent] content_block_start - 内容块开始
    ↓
[StreamEvent] content_block_delta - 文本片段 1: "我"
[StreamEvent] content_block_delta - 文本片段 2: "来帮你"
[StreamEvent] content_block_delta - 文本片段 3: "查看"
[StreamEvent] content_block_delta - 文本片段 4: "目录。"
    ↓
[StreamEvent] content_block_stop - 内容块结束
    ↓
[AssistantMessage] - 完整消息(可选,已通过 delta 发送)
    ↓
[StreamEvent] message_delta - 停止原因
    ↓
[StreamEvent] message_stop - 消息结束
    ↓
[ResultMessage] - 统计信息
    ↓
{type: "done"} - 完成标记
```

## 消息类型优先级

在处理流式响应时,建议的优先级:

1. **StreamEvent.content_block_delta** - 最高优先级,实时显示
2. **SystemMessage** - 捕获 Claude session ID
3. **ResultMessage** - 统计信息
4. **StreamEvent** (其他类型) - 可选,用于调试或进度显示
5. **AssistantMessage** - 可忽略(内容已通过 delta 发送)

## 性能优化建议

### 1. 批量发送

如果 delta 更新太频繁,可以在客户端批量处理:

```python
import time
import asyncio

class StreamBuffer:
    def __init__(self, flush_interval=0.05):  # 50ms
        self.buffer = []
        self.flush_interval = flush_interval
        self.last_flush = time.time()

    def add(self, text: str):
        self.buffer.append(text)
        if time.time() - self.last_flush > self.flush_interval:
            self.flush()

    def flush(self):
        if self.buffer:
            print(''.join(self.buffer), end='', flush=True)
            self.buffer.clear()
            self.last_flush = time.time()
```

### 2. 压缩事件

对于生产环境,可以只发送必要的事件:

```python
# 只发送文本增量和结果
essential_events = ["content_block_delta", "result", "done"]
```

### 3. 超时设置

设置合理的超时时间:

```python
response = requests.post(
    url,
    json=data,
    stream=True,
    timeout=(30, 300)  # 连接超时30秒,读取超时300秒
)
```

## 错误处理

### 错误事件格式

```json
{
  "type": "error",
  "error": "Error message",
  "session_id": "uuid",
  "conversation_id": "uuid"
}
```

### 客户端错误处理

```python
try:
    for line in response.iter_lines():
        if line:
            event = json.loads(line[6:])
            if event["type"] == "error":
                print(f"Error: {event['error']}")
                break
except requests.exceptions.Timeout:
    print("Request timeout")
except requests.exceptions.ConnectionError:
    print("Connection error")
except json.JSONDecodeError:
    print("Invalid JSON response")
```

## 调试技巧

### 1. 查看所有事件

```python
for line in response.iter_lines():
    if line:
        event = json.loads(line[6:])
        print(f"[{event['type']}] {event}")
```

### 2. 记录事件时间

```python
import time

start_time = time.time()
for line in response.iter_lines():
    if line:
        event = json.loads(line[6:])
        elapsed = time.time() - start_time
        print(f"[{elapsed:.3f}s] {event['type']}")
```

### 3. 保存事件日志

```python
events = []
for line in response.iter_lines():
    if line:
        event = json.loads(line[6:])
        events.append(event)

# 保存到文件
with open('events.json', 'w') as f:
    json.dump(events, f, indent=2)
```

## 参考资源

- [Server-Sent Events 规范](https://html.spec.whatwg.org/multipage/server-sent-events.html)
- [Claude API 文档](https://docs.anthropic.com/claude/reference)
- [FastAPI StreamingResponse](https://fastapi.tiangolo.com/advanced/custom-response/#streamingresponse)
- 项目 README: `README.md`
- Session ID 映射: `docs/SESSION_ID_MAPPING.md`
