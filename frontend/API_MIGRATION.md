# API 集成文档 - Claude Agent Service

本文档说明如何将前端项目的 API 从原设计迁移到 Claude Agent Service 后端。

## 概述

我们已经创建了适配层，将 Claude Agent Service 的 API 映射到前端原有的数据模型，使前端代码可以无缝切换到新的后端服务。

## 核心映射关系

| 前端概念 | 后端概念 | 说明 |
|---------|---------|-----|
| Project | Session | 项目映射为会话，每个会话有独立工作区 |
| Conversation | Session Messages | 对话消息存储在会话中 |
| Document | File | 文档映射为工作区文件 |
| Dialog Stream | Chat Stream | 流式对话使用 SSE (Server-Sent Events) |

---

## 1. Session API (会话管理)

### 文件位置
- `/src/services/api/session.ts` - Session API
- `/src/services/api/project.ts` - Project API (适配器)
- `/src/services/api/adapters.ts` - 数据映射工具

### API 端点

#### 创建会话
```typescript
import { createSession } from '@/services/api/session';

const response = await createSession({
  workspace_name: 'my-project'
});
```

**后端端点**: `POST /api/sessions`

#### 获取会话列表
```typescript
import { getSessions } from '@/services/api/session';

const response = await getSessions({
  skip: 0,
  limit: 20,
  active_only: true
});
```

**后端端点**: `GET /api/sessions`

#### 获取单个会话
```typescript
import { getSession } from '@/services/api/session';

const response = await getSession(sessionId);
```

**后端端点**: `GET /api/sessions/{session_id}`

#### 删除会话
```typescript
import { deleteSession } from '@/services/api/session';

const response = await deleteSession(sessionId);
```

**后端端点**: `DELETE /api/sessions/{session_id}`

#### 获取会话消息历史
```typescript
import { getSessionMessages } from '@/services/api/session';

const response = await getSessionMessages(sessionId, {
  skip: 0,
  limit: 100
});
```

**后端端点**: `GET /api/sessions/{session_id}/messages`

---

## 2. Chat API (流式对话)

### 文件位置
- `/src/services/api/chat.ts` - Chat API
- `/src/services/api/dialog.ts` - Dialog API (适配器)
- `/src/services/api/sse.ts` - SSE 连接管理器

### 流式对话

#### 方式 1: 使用 SSEConnection (推荐)

```typescript
import { SSEConnection } from '@/services/api/sse';
import { getChatStreamUrl } from '@/services/api/chat';
import type { ChatStreamEvent } from '@/services/api/chat';

const url = getChatStreamUrl({
  session_id: 'session-123',
  message: 'Hello, Claude!',
  permission_mode: 'acceptEdits'
});

const connection = new SSEConnection({
  url: url,
  onMessage: (event: ChatStreamEvent) => {
    console.log('Event type:', event.type);

    switch (event.type) {
      case 'connected':
        console.log('Connected to session:', event.session_id);
        break;

      case 'text_delta':
        console.log('Text chunk:', event.content);
        // 追加文本到 UI
        break;

      case 'tool_use':
        console.log('Tool called:', event.tool.name);
        break;

      case 'tool_result':
        console.log('Tool result:', event.content);
        break;

      case 'done':
        console.log('Conversation complete');
        break;

      case 'error':
        console.error('Error:', event.error);
        break;
    }
  },
  onError: (error) => {
    console.error('SSE error:', error);
  },
  onOpen: () => {
    console.log('SSE connection opened');
  }
});

connection.connect();

// 关闭连接
// connection.close();
```

#### 方式 2: 使用 EventSource

```typescript
import { startChatStream } from '@/services/api/chat';

const eventSource = await startChatStream(
  {
    session_id: 'session-123',
    message: 'Hello, Claude!',
    permission_mode: 'acceptEdits'
  },
  (event) => {
    console.log('Event:', event);
  },
  (error) => {
    console.error('Error:', error);
  }
);

// 关闭连接
// eventSource.close();
```

#### 方式 3: 使用 fetch + 手动解析 (完全控制)

```typescript
import { startChatStreamWithFetch } from '@/services/api/chat';

const controller = await startChatStreamWithFetch(
  {
    session_id: 'session-123',
    message: 'Hello, Claude!',
    permission_mode: 'acceptEdits'
  },
  (event) => {
    console.log('Event:', event);
  },
  (error) => {
    console.error('Error:', error);
  }
);

// 终止请求
// controller.abort();
```

### SSE 事件类型

| 事件类型 | 说明 | 关键字段 |
|---------|------|---------|
| `connected` | 连接成功 | `session_id` |
| `text_delta` | 文本流式输出 | `content` (增量文本) |
| `content_block_start` | 内容块开始 | `block_type`, `tool` |
| `tool_input_delta` | 工具输入流式 | `partial_json` |
| `tool_use` | 工具调用 | `tool.id`, `tool.name`, `tool.input` |
| `tool_result` | 工具执行结果 | `tool_use_id`, `content`, `is_error` |
| `stream_event` | 其他流式事件 | `event_type`, `data` |
| `system` | 系统消息 | `subtype`, `data` |
| `result` | 完成消息 | `data.result`, `data.duration_ms`, `data.usage` |
| `done` | 对话结束 | `claude_session_id` |
| `error` | 错误消息 | `error`, `detail`, `suggestion` |

---

## 3. Files API (文件浏览)

### 文件位置
- `/src/services/api/files.ts` - Files API
- `/src/services/api/document.ts` - Document API (待适配)

### API 端点

#### 列出文件和目录
```typescript
import { getFiles } from '@/services/api/files';

const response = await getFiles(sessionId, '/path/to/dir');
```

**后端端点**: `GET /api/sessions/{session_id}/files?path=/path/to/dir`

**响应示例**:
```typescript
{
  success: true,
  data: {
    files: [
      {
        name: 'README.md',
        path: 'README.md',
        type: 'file',
        size: 1024,
        modified: '1234567890.123'
      },
      {
        name: 'src',
        path: 'src',
        type: 'directory'
      }
    ],
    path: '/path/to/dir',
    total: 2
  }
}
```

#### 获取文件内容
```typescript
import { getFileContent } from '@/services/api/files';

const response = await getFileContent(sessionId, 'README.md');
```

**后端端点**: `GET /api/sessions/{session_id}/files/content?path=README.md`

**响应示例**:
```typescript
{
  success: true,
  data: {
    path: 'README.md',
    content: '# My Project\n\nThis is a sample project.',
    size: 1024
  }
}
```

**限制**:
- 最大文件大小: 1MB
- 仅支持文本文件 (UTF-8)
- 路径必须在工作区内

---

## 4. 环境配置

### .env 文件

创建 `/frontend/.env.local` 文件：

```bash
# Claude Agent Service Backend URL
VITE_API_BASE_URL=http://localhost:8000/api
```

### 开发环境
- 前端: `http://localhost:5173`
- 后端: `http://localhost:8000`

### 生产环境
修改 `.env.production`:
```bash
VITE_API_BASE_URL=https://api.your-domain.com/api
```

---

## 5. Store 适配 (可选)

前端的 Zustand Store 无需修改，因为我们使用了适配层。但如果需要访问 Session 特定字段，可以扩展 Project 模型：

```typescript
// stores/useProjectStore.ts
interface ProjectStore {
  // 现有字段...

  // 新增 Session 特定字段
  sessionClaudeId: string | null; // Claude SDK 会话 ID
  workspacePath: string | null;   // 工作区路径

  // 新增方法
  setSessionInfo: (claudeId: string, workspacePath: string) => void;
}
```

---

## 6. 常见问题

### Q1: 如何处理工具调用事件？

```typescript
connection.onMessage = (event) => {
  if (event.type === 'tool_use') {
    console.log('Tool called:', event.tool.name);
    console.log('Input:', event.tool.input);

    // 显示工具调用状态
    setToolStatus({
      toolId: event.tool.id,
      toolName: event.tool.name,
      status: 'running'
    });
  }

  if (event.type === 'tool_result') {
    console.log('Tool completed:', event.tool_use_id);
    console.log('Result:', event.content);
    console.log('Is Error:', event.is_error);

    // 更新工具调用状态
    setToolStatus({
      toolId: event.tool_use_id,
      status: event.is_error ? 'failed' : 'completed',
      result: event.content
    });
  }
};
```

### Q2: 如何恢复之前的对话？

```typescript
// 使用 Claude SDK 的 session_id 恢复对话
const url = getChatStreamUrl({
  session_id: 'my-session-123',
  message: 'Continue our conversation',
  resume: claudeSessionId, // 从之前的 'done' 事件中获取
  permission_mode: 'acceptEdits'
});
```

### Q3: 如何限制 AI 执行轮次？

```typescript
const url = getChatStreamUrl({
  session_id: 'my-session-123',
  message: 'Quick question',
  max_turns: 3, // 最多执行 3 轮
  permission_mode: 'acceptEdits'
});
```

### Q4: 文件上传如何处理?

Claude Agent Service 不支持文件上传到工作区。文件由 Claude Agent 在执行工具调用时自动生成。

如果需要上传文件，需要：
1. 在会话创建时指定工作区路径
2. 直接将文件放入工作区目录
3. 通过 `getFiles` API 查看生成的文件

---

## 7. 测试示例

### 测试会话创建和对话

```typescript
import { createSession, getSession } from '@/services/api/session';
import { SSEConnection } from '@/services/api/sse';
import { getChatStreamUrl } from '@/services/api/chat';

async function testChat() {
  // 1. 创建会话
  const sessionRes = await createSession({
    workspace_name: 'test-project'
  });

  if (!sessionRes.success) {
    console.error('Failed to create session');
    return;
  }

  const sessionId = sessionRes.data!.id;
  console.log('Created session:', sessionId);

  // 2. 发起对话
  const url = getChatStreamUrl({
    session_id: sessionId,
    message: 'List files in the current directory',
    permission_mode: 'acceptEdits'
  });

  const connection = new SSEConnection({
    url: url,
    onMessage: (event) => {
      console.log('Event:', event.type, event);
    },
    onError: (error) => {
      console.error('Error:', error);
    }
  });

  connection.connect();
}

testChat();
```

---

## 8. 迁移清单

- [x] 创建 Session API 适配器
- [x] 创建 Chat API 适配器
- [x] 创建 Files API 适配器
- [x] 适配 SSE 事件类型和处理逻辑
- [x] 更新 TypeScript 类型定义
- [x] 创建 Project/Dialog 适配层
- [ ] 更新 ChatInterface 组件以使用新的 SSE 事件
- [ ] 更新 DocumentList 组件以使用 Files API
- [ ] 测试完整流程
- [ ] 更新环境配置文件

---

## 9. 注意事项

1. **Session 生命周期**: Session 在后端持久化，但需要定期清理不活跃的会话
2. **Claude Session ID**: 从 `done` 事件中获取并保存，用于恢复对话
3. **工具调用权限**: `permission_mode` 默认为 `acceptEdits`，允许 AI 执行文件操作
4. **错误处理**: SSE 连接可能因网络问题断开，需要实现重连逻辑（已在 SSEConnection 中实现）
5. **文件大小限制**: 文件预览限制为 1MB，超大文件需要分页或下载

---

## 10. 相关文档

- [Claude Agent Service Backend Documentation](../claude-agent-service/README.md)
- [SSE Events Specification](../claude-agent-service/docs/STREAMING_API.md)
- [Frontend Setup Guide](./README.md)

---

## 联系方式

如有问题，请联系开发团队或查阅后端服务文档。
