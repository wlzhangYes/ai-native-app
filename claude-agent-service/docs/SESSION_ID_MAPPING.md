# Session ID Mapping 说明

## 概述

系统维护两种 Session ID 的映射关系:

1. **系统 Session ID** (`session.id`): UUID 格式,用于系统内部标识会话
2. **Claude Session ID** (`session.claude_session_id`): Claude SDK 返回的 session ID,用于恢复 Claude 对话上下文

## 数据流程

### 1. 创建会话

```
客户端 -> POST /api/sessions
         ↓
    创建 Session 记录
    - id: UUID (系统生成)
    - claude_session_id: null (初始为空)
    - workspace_path: /workspace/{workspace_name}
         ↓
    返回 session.id 给客户端
```

### 2. 第一次对话

```
客户端 -> POST /api/chat/stream
         {session_id: "系统UUID"}
         ↓
    查询 Session 记录
    - session.claude_session_id = null
         ↓
    初始化 Claude SDK (无 resume 参数)
         ↓
    Claude SDK 返回 SystemMessage
    - message.data.session_id = "Claude-Session-ID"
         ↓
    更新 Session 记录
    - session.claude_session_id = "Claude-Session-ID"
         ↓
    返回给客户端:
    {
      type: "done",
      session_id: "系统UUID",
      claude_session_id: "Claude-Session-ID"
    }
```

### 3. 后续对话 (上下文延续)

```
客户端 -> POST /api/chat/stream
         {session_id: "系统UUID"}
         ↓
    查询 Session 记录
    - session.claude_session_id = "Claude-Session-ID"
         ↓
    初始化 Claude SDK
    options.resume = "Claude-Session-ID"
         ↓
    Claude 恢复之前的对话上下文
         ↓
    继续对话...
```

## 代码实现

### 数据库模型

```python
# app/models/session.py
class Session(Base):
    id = Column(String(36), primary_key=True)  # 系统 UUID
    claude_session_id = Column(String(100), nullable=True, index=True)  # Claude session ID
    workspace_path = Column(String(500), nullable=False)
    # ...
```

### API 处理

```python
# app/api/chat.py
async def chat_stream():
    # 1. 获取 session
    session = await session_service.get_session(db, session_id)

    # 2. 使用已有的 Claude session ID (如果存在)
    options = get_claude_options(
        workspace_path=workspace_path,
        claude_session_id=session.claude_session_id  # 从数据库读取
    )

    # 3. 捕获 Claude 返回的 session ID
    if message.subtype == "session_info":
        claude_session_id_from_sdk = message.data.get("session_id")

    # 4. 更新映射关系
    await session_service.update_session_activity(
        db,
        session_id,
        claude_session_id=claude_session_id_from_sdk
    )
```

## API 响应格式

### 创建会话响应

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "claude_session_id": null,
  "workspace_path": "/workspace/my-project",
  "created_at": "2024-10-24T00:00:00",
  "conversation_count": 0
}
```

### 对话完成响应 (SSE)

```
data: {"type": "done", "session_id": "550e8400-...", "claude_session_id": "f0871530-..."}
```

### 查询会话响应

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "claude_session_id": "f0871530-6f32-485c-b0dd-b1f2dfc68327",
  "workspace_path": "/workspace/my-project",
  "conversation_count": 5
}
```

## 使用场景

### 场景 1: 新会话

```python
# 创建会话
response = requests.post("http://localhost:8000/api/sessions")
session_id = response.json()["id"]

# 第一次对话
for event in chat_stream(session_id, "Hello"):
    if event["type"] == "done":
        claude_session_id = event["claude_session_id"]
        print(f"Claude Session ID: {claude_session_id}")
```

### 场景 2: 恢复会话

```python
# 使用之前的系统 session_id
# Claude session ID 会自动从数据库读取
for event in chat_stream(session_id, "继续之前的对话"):
    # Claude 会自动恢复上下文
    pass
```

### 场景 3: 手动恢复 (使用 resume 参数)

```python
# 可以通过 resume 参数显式指定 Claude session ID
chat_data = {
    "session_id": session_id,
    "message": "Hello",
    "resume": "specific-claude-session-id"  # 优先级高于数据库中的值
}
```

## 缓存策略

Session 信息会同时缓存在 Redis 中:

```python
{
    "id": "550e8400-...",
    "claude_session_id": "f0871530-...",  # 包含 Claude session ID
    "workspace_path": "/workspace/my-project",
    # ...
}
```

缓存 TTL: 默认 1 小时 (可配置)

## 注意事项

1. **自动恢复**: 系统会自动使用数据库中存储的 `claude_session_id` 来恢复对话
2. **首次对话**: 第一次对话后,Claude SDK 会返回 session ID,系统会自动保存
3. **手动覆盖**: 可以通过 `resume` 参数手动指定 Claude session ID,优先级高于数据库
4. **会话隔离**: 每个系统 session 对应一个独立的工作空间和 Claude 对话上下文
5. **数据持久化**: Claude session ID 同时存储在 PostgreSQL 和 Redis 中

## 故障处理

### Claude session ID 丢失

如果数据库中的 `claude_session_id` 丢失或失效:

1. 系统会创建新的 Claude 对话
2. 上下文会丢失(需要重新开始对话)
3. 新的 Claude session ID 会被重新保存

### 恢复失败

如果 Claude SDK 拒绝恢复(session 过期等):

1. 捕获错误
2. 清除数据库中的 `claude_session_id`
3. 重新开始对话
4. 保存新的 session ID

## 数据库查询

### 查找特定 Claude session

```sql
SELECT * FROM sessions WHERE claude_session_id = 'f0871530-6f32-485c-b0dd-b1f2dfc68327';
```

### 查找活跃会话

```sql
SELECT id, claude_session_id, conversation_count, last_activity
FROM sessions
WHERE is_active = true
ORDER BY last_activity DESC;
```

### 统计会话使用情况

```sql
SELECT
    COUNT(*) as total_sessions,
    COUNT(claude_session_id) as sessions_with_claude_id,
    AVG(conversation_count) as avg_conversations
FROM sessions
WHERE is_active = true;
```
