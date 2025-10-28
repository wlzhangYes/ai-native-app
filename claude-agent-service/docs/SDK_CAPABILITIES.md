# Claude Agent SDK 能力边界

## 1. SDK 工作原理

```
Python 应用 → claude-agent-sdk → Claude Code CLI → Claude API
```

SDK 通过启动 Claude Code CLI 子进程来工作,因此容器内必须安装:
- Node.js 18+
- `@anthropic-ai/claude-code` (全局安装)

## 2. 基础 API

### 2.1 初始化和查询

```python
from claude_agent_sdk import ClaudeSDKClient, ClaudeAgentOptions

options = ClaudeAgentOptions(
    env={'ANTHROPIC_AUTH_TOKEN': 'xxx', ...},
    cwd='/workspace/project',
    permission_mode='acceptEdits',
    include_partial_messages=True
)

async with ClaudeSDKClient(options=options) as client:
    # 发送查询
    await client.query("帮我创建一个项目")

    # 接收响应流
    async for message in client.receive_response():
        # 处理消息
        pass
```

### 2.2 关键配置项

| 参数 | 说明 | 推荐值 |
|------|------|--------|
| `cwd` | 工作目录 | 每个会话独立目录 |
| `permission_mode` | 权限模式 | `acceptEdits` |
| `resume` | 恢复 session | 保存的 session_id |
| `include_partial_messages` | 启用流式 | `True` |
| `max_turns` | 最大轮次 | 5-20 |

## 3. 响应消息类型

### 3.1 SystemMessage (系统消息)

**触发**: 对话开始时

**关键数据**:
```python
SystemMessage(
    subtype='init',
    data={
        'session_id': '91263e1e-...',  # ⭐ 保存用于恢复上下文
        'tools': ['Bash', 'Read', 'Write', 'TodoWrite', ...],
        'model': 'claude-sonnet-4-5-20250929'
    }
)
```

**用途**: 保存 `session_id` 用于下次对话恢复上下文

### 3.2 AssistantMessage (AI 回复)

**数据结构**:
```python
AssistantMessage(
    content=[
        TextBlock(text='回复文本'),           # 文本块
        ToolUseBlock(                         # 工具调用块
            id='toolu_xxx',
            name='Bash',  # 或 'TodoWrite', 'Read', 'Write' 等
            input={'command': 'ls -la'}       # 工具参数
        )
    ],
    model='claude-sonnet-4-5-20250929'
)
```

**处理方式**:
```python
for block in message.content:
    if isinstance(block, TextBlock):
        text = block.text
    elif isinstance(block, ToolUseBlock):
        tool_name = block.name
        tool_input = block.input
```

### 3.3 UserMessage (工具结果)

**数据结构**:
```python
UserMessage(
    content=[
        ToolResultBlock(
            tool_use_id='toolu_xxx',
            content='total 48\n...',  # 工具执行结果
            is_error=False
        )
    ]
)
```

**用途**: 通过 `tool_use_id` 关联工具调用和执行结果

### 3.4 ResultMessage (完成统计)

**数据结构**:
```python
ResultMessage(
    subtype='success',
    duration_ms=4845,
    total_cost_usd=0.0568,
    num_turns=1,
    usage={
        'input_tokens': 3,
        'output_tokens': 124,
        'cache_read_input_tokens': 14406
    },
    result='完整的对话文本'  # ⭐ 最可靠的文本来源
)
```

**⭐ 重要**: `result` 字段包含完整的对话文本,推荐作为最终文本来源

## 4. TodoWrite 工具详解

### 4.1 触发 TodoWrite

Claude 在执行复杂任务时会自动调用 TodoWrite 工具来规划任务。

**触发条件**:
- 用户要求执行多步骤任务
- 任务比较复杂需要规划
- 用户明确要求使用 todo

### 4.2 数据结构

```python
ToolUseBlock(
    id='toolu_xxx',
    name='TodoWrite',
    input={
        'todos': [
            {
                'content': '分析当前代码结构',        # 任务内容
                'activeForm': '正在分析当前代码结构',  # 进行中的描述
                'status': 'completed'                # 状态
            },
            {
                'content': '创建新的目录结构',
                'activeForm': '正在创建新的目录结构',
                'status': 'in_progress'
            },
            {
                'content': '迁移代码文件',
                'activeForm': '迁移代码文件',
                'status': 'pending'
            }
        ]
    }
)
```

### 4.3 Todo 状态

| 状态 | 说明 | 图标 |
|------|------|------|
| `pending` | 未开始 | ⭕ |
| `in_progress` | 进行中 | 🔧 |
| `completed` | 已完成 | ✅ |

**规则**:
- 同一时间只有一个 `in_progress`
- `completed` 的任务不会再改变
- `pending` 按顺序变为 `in_progress`

### 4.4 提取和展示 Todo

```python
todos_list = []

async for message in client.receive_response():
    if isinstance(message, AssistantMessage):
        for block in message.content:
            # 检测 TodoWrite 工具调用
            if isinstance(block, ToolUseBlock) and block.name == 'TodoWrite':
                # 提取 Todo 列表
                todos_list = block.input['todos']

                # 计算进度
                total = len(todos_list)
                completed = sum(1 for t in todos_list if t['status'] == 'completed')
                in_progress = sum(1 for t in todos_list if t['status'] == 'in_progress')

                print(f"进度: {completed}/{total} 完成")

                # 显示列表
                for todo in todos_list:
                    icon = {
                        'completed': '✅',
                        'in_progress': '🔧',
                        'pending': '⭕'
                    }[todo['status']]

                    # 进行中显示 activeForm,其他显示 content
                    text = todo['activeForm'] if todo['status'] == 'in_progress' else todo['content']
                    print(f"{icon} {text}")
```

### 4.5 Todo 更新机制

Claude 会**多次调用** TodoWrite 来更新进度:

```python
# 第一次调用 - 初始规划
TodoWrite(todos=[
    {'content': '任务1', 'status': 'in_progress'},
    {'content': '任务2', 'status': 'pending'},
    {'content': '任务3', 'status': 'pending'}
])

# 第二次调用 - 更新进度
TodoWrite(todos=[
    {'content': '任务1', 'status': 'completed'},    # 完成
    {'content': '任务2', 'status': 'in_progress'},  # 开始
    {'content': '任务3', 'status': 'pending'}
])

# 第三次调用 - 继续更新
TodoWrite(todos=[
    {'content': '任务1', 'status': 'completed'},
    {'content': '任务2', 'status': 'completed'},    # 完成
    {'content': '任务3', 'status': 'in_progress'}   # 开始
])
```

**实现建议**:
- 每次收到 TodoWrite 就**替换**整个列表(不是增量)
- 在 UI 上实时更新进度条
- 高亮当前 `in_progress` 的任务

## 5. 获取数据的最佳实践

### 5.1 获取完整文本

```python
full_text = ""

# 优先级 1: 流式文本(实时,但不一定可用)
if isinstance(message, StreamEvent):
    if message.event.get('delta', {}).get('type') == 'text_delta':
        full_text += message.event['delta']['text']

# 优先级 2: ResultMessage.result(最可靠)
if isinstance(message, ResultMessage):
    full_text = message.result  # ⭐ 推荐
```

### 5.2 关联工具调用和结果

```python
tool_calls = {}

# 记录调用
if isinstance(message, AssistantMessage):
    for block in message.content:
        if isinstance(block, ToolUseBlock):
            tool_calls[block.id] = {
                'name': block.name,
                'input': block.input,
                'result': None
            }

# 记录结果
if isinstance(message, UserMessage):
    for block in message.content:
        if isinstance(block, ToolResultBlock):
            tool_calls[block.tool_use_id]['result'] = block.content
            tool_calls[block.tool_use_id]['is_error'] = block.is_error
```

### 5.3 Session 管理

```python
# 首次对话 - 保存 session_id
if isinstance(message, SystemMessage) and message.subtype == 'init':
    claude_session_id = message.data['session_id']
    save_to_database(user_session_id, claude_session_id)

# 后续对话 - 恢复上下文
claude_session_id = get_from_database(user_session_id)
options = ClaudeAgentOptions(
    resume=claude_session_id,  # 恢复之前的对话
    cwd='/same/workspace'      # 必须是相同的工作目录
)
```

**注意**: Session 可能过期,需要处理恢复失败:
```python
try:
    async with ClaudeSDKClient(options) as client:
        await client.query(message)
except Exception as e:
    if "No conversation found" in str(e):
        # 清除过期的 session_id
        clear_session_id(user_session_id)
        # 提示用户重试
```

## 6. 核心限制

### 6.1 并发

- ❌ 单个 client 实例不支持并发
- ✅ 创建多个 client 实例实现并发

```python
# 为每个用户会话创建独立 client
user_clients = {
    'user1': ClaudeSDKClient(options1),
    'user2': ClaudeSDKClient(options2)
}
```

### 6.2 Session 生命周期

- Session 可能因超时而失效
- CLI 进程退出后 session 失效
- 需要处理 session 过期的情况

### 6.3 成本

**参考成本**:
- 简单对话: $0.007 - $0.02
- 带工具调用: $0.02 - $0.10
- 复杂任务: $0.10 - $1.00+

**优化建议**:
- 使用缓存(cache_read_input_tokens)
- 限制 max_turns
- 监控 total_cost_usd

## 7. 推荐架构

```python
class SessionManager:
    """为每个用户维护独立的 Claude session"""

    async def chat(self, user_session_id: str, message: str):
        # 1. 获取或创建 workspace
        workspace = f'/workspace/{user_session_id}'

        # 2. 尝试恢复 Claude session
        claude_session_id = get_saved_session_id(user_session_id)

        # 3. 配置选项
        options = ClaudeAgentOptions(
            cwd=workspace,
            resume=claude_session_id,
            permission_mode='acceptEdits'
        )

        # 4. 执行查询
        async with ClaudeSDKClient(options) as client:
            await client.query(message)

            # 5. 处理响应
            full_text = ""
            todos = []
            tool_calls = []

            async for msg in client.receive_response():
                # 保存 session_id
                if isinstance(msg, SystemMessage):
                    new_session_id = msg.data['session_id']
                    save_session_id(user_session_id, new_session_id)

                # 提取工具调用
                if isinstance(msg, AssistantMessage):
                    for block in msg.content:
                        if isinstance(block, ToolUseBlock):
                            # TodoWrite 特殊处理
                            if block.name == 'TodoWrite':
                                todos = block.input['todos']
                                yield {'type': 'todos', 'data': todos}
                            else:
                                tool_calls.append(block)

                # 获取完整文本
                if isinstance(msg, ResultMessage):
                    full_text = msg.result
                    metrics = {
                        'cost': msg.total_cost_usd,
                        'duration': msg.duration_ms
                    }

            return {
                'text': full_text,
                'todos': todos,
                'tool_calls': tool_calls,
                'metrics': metrics
            }
```

## 8. 关键要点

### ✅ 必须实现

1. **保存 Claude session_id**: 从 `SystemMessage.data['session_id']` 获取
2. **获取完整文本**: 从 `ResultMessage.result` 获取
3. **提取 Todo**: 监听 `ToolUseBlock(name='TodoWrite')`
4. **处理 session 过期**: 捕获错误,清除无效 session_id

### ⚠️ 注意限制

1. **一对一**: 一个 client 实例同时只能处理一个查询
2. **工作目录绑定**: Session 和 cwd 绑定,不能更改
3. **Session 过期**: 需要容错处理
4. **成本监控**: 记录 `total_cost_usd`

### 🎯 TodoWrite 关键点

- **自动触发**: Claude 执行复杂任务时自动调用
- **多次更新**: 一次对话可能多次调用 TodoWrite
- **完整替换**: 每次都是完整的 todo 列表,不是增量
- **状态规则**: 同时只有一个 `in_progress`
- **提取方式**: 检查 `ToolUseBlock.name == 'TodoWrite'`
- **数据位置**: `block.input['todos']`

## 9. 数据结构速查

### SystemMessage
```python
{
    'session_id': str,   # ⭐ 保存此ID用于恢复
    'tools': list,       # 可用工具列表
    'model': str         # 使用的模型
}
```

### ResultMessage
```python
{
    'result': str,           # ⭐ 完整文本
    'total_cost_usd': float, # ⭐ 成本
    'duration_ms': int,      # 耗时
    'num_turns': int,        # 轮次
    'session_id': str        # Claude session ID
}
```

### ToolUseBlock (TodoWrite)
```python
{
    'name': 'TodoWrite',
    'input': {
        'todos': [
            {
                'content': str,      # 任务描述
                'activeForm': str,   # 进行中的描述
                'status': str        # pending | in_progress | completed
            }
        ]
    }
}
```

---

**文档版本**: 1.0
**最后更新**: 2025-10-26
