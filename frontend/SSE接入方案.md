# SSE 流式响应接入方案

基于 `claude-agent-service` 项目的 SSE 实现，为当前 AI 工作流前端项目提供完整的接入方案。

---

## 一、claude-agent-service SSE 架构解析

### 1.1 后端 SSE 实现 (FastAPI)

**文件**: `/backend/app/api/chat.py`

**核心流程**:
```python
@router.post("/stream")
async def chat_stream(request: ChatRequest, db: AsyncSession):
    async def generate():
        # 1. 发送连接事件
        yield f"data: {json.dumps({'type': 'connected', 'session_id': session_id})}\n\n"

        # 2. 流式处理 Claude SDK 响应
        async with ClaudeSDKClient(options=options) as client:
            await client.query(request.message)

            async for message in client.receive_response():
                # 2.1 实时文本增量 (StreamEvent)
                if event_type == "content_block_delta":
                    if delta.get("type") == "text_delta":
                        yield f"data: {json.dumps({'type': 'text_delta', 'content': text})}\n\n"

                # 2.2 工具调用流式参数
                elif event_type == "content_block_start" and block_type == "tool_use":
                    yield f"data: {json.dumps({'type': 'content_block_start', 'tool': {...}})}\n\n"

                # 2.3 工具执行结果
                elif isinstance(message, UserMessage):
                    yield f"data: {json.dumps({'type': 'tool_result', ...})}\n\n"

                # 2.4 最终统计信息
                elif isinstance(message, ResultMessage):
                    yield f"data: {json.dumps({'type': 'result', 'data': {...}})}\n\n"

        # 3. 发送完成事件
        yield f"data: {json.dumps({'type': 'done', ...})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )
```

**SSE 事件类型**:
1. **connected** - 连接建立
2. **text_delta** - AI 回复文本增量（逐字显示）
3. **content_block_start** - 内容块开始（文本或工具调用）
4. **tool_input_delta** - 工具参数流式输入
5. **tool_use** - 工具调用完成
6. **tool_result** - 工具执行结果
7. **result** - 对话统计信息
8. **done** - 对话完成

---

### 1.2 前端 SSE 消费实现 (React Hook)

**文件**: `/frontend/src/hooks/useChatStream.ts`

**核心 Hook**:
```typescript
export function useChatStream() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentText, setCurrentText] = useState('');  // 当前流式文本
  const [currentToolCalls, setCurrentToolCalls] = useState<Map<string, ToolCall>>(new Map());
  const [statistics, setStatistics] = useState<Statistics | null>(null);

  const processEvent = useCallback((event: SSEEvent) => {
    switch (event.type) {
      case 'text_delta':
        setCurrentText((prev) => prev + event.content);  // 逐字追加
        break;

      case 'content_block_start':
        if (event.block_type === 'tool_use') {
          setCurrentToolCalls((prev) => {
            const newMap = new Map(prev);
            newMap.set(event.tool!.id, { ...event.tool, status: 'building' });
            return newMap;
          });
        }
        break;

      case 'tool_result':
        setCurrentToolCalls((prev) => {
          const newMap = new Map(prev);
          const toolCall = newMap.get(event.tool_use_id);
          if (toolCall) {
            newMap.set(event.tool_use_id, {
              ...toolCall,
              result: event.content,
              status: event.is_error ? 'failed' : 'success'
            });
          }
          return newMap;
        });
        break;

      case 'result':
        setStatistics({ cost, duration, turns, tokens });
        break;

      case 'done':
        // 将当前流式内容固化为消息
        setMessages((prev) => [...prev, {
          id: event.conversation_id,
          role: 'assistant',
          content: currentText,
          toolCalls: Array.from(currentToolCalls.values()),
          stats: statistics
        }]);
        setCurrentText('');
        setCurrentToolCalls(new Map());
        setIsStreaming(false);
        break;
    }
  }, []);

  const sendMessage = useCallback(async (message: string, sessionId?: string) => {
    setIsStreaming(true);

    const stream = await chatApi.streamWithFetch({ message, session_id: sessionId });
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const event = JSON.parse(line.slice(6));
          processEvent(event);
        }
      }
    }
  }, [processEvent]);

  return { messages, isStreaming, currentText, currentToolCalls, sendMessage };
}
```

---

### 1.3 前端 UI 渲染 (ChatPanel)

**文件**: `/frontend/src/components/ChatPanel.tsx`

**流式文本显示**:
```tsx
{isStreaming && (
  <div className="streaming-message">
    {/* 文本流式显示 */}
    {currentText && (
      <StreamingText text={currentText} />  {/* 逐字渲染，带打字机效果 */}
    )}

    {/* 工具调用卡片 */}
    {currentToolCalls.map((toolCall) => (
      <ToolCallCard key={toolCall.id} toolCall={toolCall} />
    ))}
  </div>
)}
```

---

### 1.4 文件查询与预览实现

**文件**: `/frontend/src/components/FileExplorer.tsx`

**核心功能**:
```typescript
export default function FileExplorer({ sessionId }: FileExplorerProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');

  // 加载文件列表
  const loadFiles = async (path: string = '/') => {
    const data = await fileApi.list(sessionId, path);
    setFiles(data);
  };

  // 加载文件内容
  const loadFileContent = async (filePath: string) => {
    setSelectedFile(filePath);
    const content = await fileApi.getContent(sessionId, filePath);
    setFileContent(content);
  };

  return (
    <div>
      {/* 文件树 */}
      {files.map((file) => (
        <button onClick={() => loadFileContent(file.path)}>
          {file.name}
        </button>
      ))}

      {/* 文件预览 */}
      {selectedFile && (
        <pre className="file-preview">{fileContent}</pre>
      )}
    </div>
  );
}
```

**后端 API** (FastAPI):
```python
# 文件列表 API
@router.get("/api/sessions/{session_id}/files")
async def list_files(session_id: str, path: str = "/"):
    workspace_path = session.workspace_path
    full_path = os.path.join(workspace_path, path.lstrip("/"))
    files = []
    for item in os.listdir(full_path):
        item_path = os.path.join(full_path, item)
        files.append({
            "name": item,
            "path": os.path.relpath(item_path, workspace_path),
            "type": "directory" if os.path.isdir(item_path) else "file",
            "size": os.path.getsize(item_path) if os.path.isfile(item_path) else None
        })
    return {"files": files}

# 文件内容 API
@router.get("/api/sessions/{session_id}/files/content")
async def get_file_content(session_id: str, path: str):
    workspace_path = session.workspace_path
    full_path = os.path.join(workspace_path, path.lstrip("/"))
    with open(full_path, 'r', encoding='utf-8') as f:
        content = f.read()
    return {"content": content}
```

---

## 二、当前项目接入方案

### 2.1 项目结构映射

| claude-agent-service | 当前项目 (ai-workflow-frontend) | 说明 |
|---------------------|-------------------------------|------|
| ChatPanel | ChatInterface (左侧对话框) | SSE 流式聊天 |
| FileExplorer | DocumentPreview (右侧文件预览) | 文件查询与渲染 |
| useChatStream | 待实现 Hook | SSE 流式处理逻辑 |
| api.ts | 待实现 API 层 | HTTP + SSE 请求封装 |

---

### 2.2 需要创建的文件

#### 文件 1: `/src/hooks/useChatStream.ts`
```typescript
import { useState, useCallback, useRef } from 'react';
import { Message, ExecutionLog } from '@/types/models';

export function useChatStream() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentText, setCurrentText] = useState('');  // 当前流式文本
  const [currentLogs, setCurrentLogs] = useState<ExecutionLog[]>([]);  // 当前执行日志

  const processEvent = useCallback((event: SSEEvent) => {
    switch (event.type) {
      case 'text_delta':
        // 逐字追加 AI 回复
        setCurrentText((prev) => prev + event.content);
        break;

      case 'tool_result':
        // 添加工具执行日志
        setCurrentLogs((prev) => [...prev, {
          id: event.id,
          timestamp: new Date().toISOString(),
          level: event.is_error ? 'error' : 'success',
          message: event.content,
          type: 'log'
        }]);
        break;

      case 'document_link':
        // 文档生成完成，添加链接日志
        setCurrentLogs((prev) => [...prev, {
          id: event.id,
          timestamp: new Date().toISOString(),
          level: 'info',
          message: `文档已生成: ${event.document_name}`,
          type: 'document_link',
          documentLink: {
            documentId: event.document_id,
            documentName: event.document_name
          }
        }]);
        break;

      case 'done':
        // 对话完成，固化消息
        setMessages((prev) => [...prev, {
          id: event.conversation_id,
          sender: 'ai',
          content: currentText,
          type: 'text',
          timestamp: new Date().toISOString()
        }]);
        setCurrentText('');
        setIsStreaming(false);
        break;
    }
  }, [currentText]);

  const sendMessage = useCallback(async (content: string, stageId: string) => {
    // 添加用户消息
    setMessages((prev) => [...prev, {
      id: `user-${Date.now()}`,
      sender: 'user',
      content,
      type: 'text',
      timestamp: new Date().toISOString()
    }]);

    setIsStreaming(true);
    setCurrentText('');
    setCurrentLogs([]);

    // 发起 SSE 请求
    const stream = await chatApi.streamWithFetch({
      message: content,
      stage_id: stageId
    });

    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const event = JSON.parse(line.slice(6));
          processEvent(event);
        }
      }
    }
  }, [processEvent]);

  return {
    messages,
    isStreaming,
    currentText,
    currentLogs,
    sendMessage
  };
}
```

---

#### 文件 2: `/src/services/api/chat.ts`
```typescript
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const chatApi = {
  /**
   * 流式聊天请求 (SSE)
   */
  streamWithFetch: async (params: {
    message: string;
    stage_id: string;
    project_id?: string;
  }): Promise<ReadableStream<Uint8Array>> => {
    const response = await fetch(`${API_BASE_URL}/api/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error('Failed to start chat stream');
    }

    if (!response.body) {
      throw new Error('No response body');
    }

    return response.body;
  },

  /**
   * 获取对话历史
   */
  getHistory: async (stageId: string): Promise<Message[]> => {
    const response = await axios.get(`${API_BASE_URL}/api/stages/${stageId}/messages`);
    return response.data.messages;
  }
};
```

---

#### 文件 3: `/src/services/api/document.ts` (已存在，需增强)
```typescript
export const documentApi = {
  // ... 现有方法 ...

  /**
   * 获取文档内容 (用于右侧预览)
   */
  getContent: async (documentId: string): Promise<string> => {
    const response = await axios.get(`${API_BASE_URL}/api/documents/${documentId}/content`);
    return response.data.content;
  },

  /**
   * 获取文档列表 (支持阶段筛选)
   */
  list: async (projectId: string, stageId?: string): Promise<Document[]> => {
    const params = stageId ? { stage_id: stageId } : {};
    const response = await axios.get(`${API_BASE_URL}/api/projects/${projectId}/documents`, { params });
    return response.data.documents;
  }
};
```

---

### 2.3 ChatInterface 组件改造

**文件**: `/src/components/dialog/ChatInterface.tsx`

**核心改动**:
```tsx
import { useChatStream } from '@/hooks/useChatStream';
import { MessageList } from './MessageList';
import { ExecutionLogList } from './ExecutionLogList';

export function ChatInterface() {
  const activeStageId = useWorkflowStore((state) => state.activeStageId);
  const { messages, isStreaming, currentText, currentLogs, sendMessage } = useChatStream();

  const handleSendMessage = async (content: string) => {
    if (!activeStageId) return;
    await sendMessage(content, activeStageId);
  };

  return (
    <div className="chat-interface">
      {/* 历史消息 */}
      <MessageList messages={messages} />

      {/* 流式消息 */}
      {isStreaming && (
        <div className="streaming-message">
          <div className="ai-text">{currentText}</div>
          <ExecutionLogList logs={currentLogs} />
        </div>
      )}

      {/* 输入框 */}
      <ChatInput onSend={handleSendMessage} disabled={isStreaming} />
    </div>
  );
}
```

---

### 2.4 DocumentPreview 组件改造 (右侧文件预览)

**文件**: `/src/components/document/DocumentPreview.tsx`

**核心改动**:
```tsx
import { useState, useEffect } from 'react';
import { useDocumentStore } from '@/stores/useDocumentStore';
import { documentApi } from '@/services/api/document';
import ReactMarkdown from 'react-markdown';

export function DocumentPreview() {
  const selectedDocumentId = useDocumentStore((state) => state.selectedDocumentId);
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedDocumentId) {
      setContent('');
      return;
    }

    const loadContent = async () => {
      setLoading(true);
      try {
        const docContent = await documentApi.getContent(selectedDocumentId);
        setContent(docContent);
      } catch (error) {
        console.error('Failed to load document content:', error);
        setContent('加载文档失败');
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, [selectedDocumentId]);

  if (!selectedDocumentId) {
    return <div className="empty-state">请选择文档进行预览</div>;
  }

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div className="document-preview">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}
```

---

### 2.5 ExecutionLog 渲染 (运行记录面板)

**文件**: `/src/components/execution/ExecutionLogList.tsx`

```tsx
import { ExecutionLog } from '@/types/models';
import { useDocumentStore } from '@/stores/useDocumentStore';

interface ExecutionLogListProps {
  logs: ExecutionLog[];
}

export function ExecutionLogList({ logs }: ExecutionLogListProps) {
  const setSelectedDocument = useDocumentStore((state) => state.setSelectedDocument);

  const handleDocumentClick = (documentId: string) => {
    setSelectedDocument(documentId);
  };

  return (
    <div className="execution-log-list">
      {logs.map((log) => (
        <div key={log.id} className={`log-item log-level-${log.level}`}>
          <span className="timestamp">{new Date(log.timestamp).toLocaleTimeString()}</span>

          {/* 普通日志 */}
          {log.type === 'log' && <span className="message">{log.message}</span>}

          {/* 文档链接日志 - 点击切换右侧预览 */}
          {log.type === 'document_link' && log.documentLink && (
            <button
              className="document-link"
              onClick={() => handleDocumentClick(log.documentLink!.documentId)}
            >
              📄 {log.documentLink.documentName}
            </button>
          )}

          {/* 任务状态更新日志 */}
          {log.type === 'task_status' && log.taskStatus && (
            <div className="task-status-update">
              <span>任务: {log.taskStatus.taskName}</span>
              <span className={`status-badge status-${log.taskStatus.status}`}>
                {log.taskStatus.status}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
```

---

## 三、关键实现细节

### 3.1 SSE 事件流处理

**关键点**:
1. 使用 `ReadableStream` + `TextDecoder` 处理流式数据
2. 按 `\n` 分割事件，处理不完整行（buffer 机制）
3. 事件以 `data: ` 前缀开头，后接 JSON 数据

**代码示例**:
```typescript
const reader = stream.getReader();
const decoder = new TextDecoder();
let buffer = '';

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  buffer += decoder.decode(value, { stream: true });
  const lines = buffer.split('\n');
  buffer = lines.pop() || '';  // 保留不完整行

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const event = JSON.parse(line.slice(6));  // 去掉 "data: " 前缀
      processEvent(event);
    }
  }
}
```

---

### 3.2 流式文本逐字显示

**实现方式**:
```typescript
// 状态管理
const [currentText, setCurrentText] = useState('');

// 接收 text_delta 事件
case 'text_delta':
  setCurrentText((prev) => prev + event.content);  // 字符串拼接
  break;

// UI 渲染
<div className="streaming-text">{currentText}</div>
```

**打字机效果** (可选):
```tsx
function StreamingText({ text }: { text: string }) {
  return (
    <span className="typing-effect">
      {text}
      <span className="cursor">|</span>  {/* 闪烁光标 */}
    </span>
  );
}
```

---

### 3.3 文档链接点击 → 右侧预览切换

**交互流程**:
1. SSE 返回 `document_link` 事件 → 显示为可点击链接
2. 用户点击链接 → 更新 `selectedDocumentId` (Zustand Store)
3. DocumentPreview 监听 `selectedDocumentId` 变化 → 加载文档内容
4. 使用 `ReactMarkdown` 渲染 Markdown 内容

**代码流程**:
```tsx
// ExecutionLogList.tsx - 点击文档链接
<button onClick={() => setSelectedDocument(log.documentLink.documentId)}>
  📄 {log.documentLink.documentName}
</button>

// DocumentPreview.tsx - 监听文档变化
useEffect(() => {
  if (selectedDocumentId) {
    const content = await documentApi.getContent(selectedDocumentId);
    setContent(content);
  }
}, [selectedDocumentId]);

// 渲染 Markdown
<ReactMarkdown>{content}</ReactMarkdown>
```

---

### 3.4 工具调用日志显示

**日志类型**:
```typescript
export interface ExecutionLog {
  id: string;
  timestamp: string;
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
  type: 'log' | 'ui_component' | 'document_link' | 'task_status';

  // type === 'document_link'
  documentLink?: {
    documentId: string;
    documentName: string;
  };

  // type === 'task_status'
  taskStatus?: {
    taskId: string;
    taskName: string;
    status: TaskStatus;
  };
}
```

**渲染示例**:
```tsx
{log.type === 'log' && (
  <div className="log-message">
    <span className="level-icon">{getLevelIcon(log.level)}</span>
    <span>{log.message}</span>
  </div>
)}

{log.type === 'document_link' && (
  <button onClick={() => openDocument(log.documentLink.documentId)}>
    📄 {log.documentLink.documentName}
  </button>
)}

{log.type === 'task_status' && (
  <div className="task-update">
    任务 <strong>{log.taskStatus.taskName}</strong>
    状态更新为 <Badge status={log.taskStatus.status} />
  </div>
)}
```

---

## 四、后端 API 需求

### 4.1 聊天流式 API

**端点**: `POST /api/chat/stream`

**请求体**:
```json
{
  "message": "帮我生成功能规格说明文档",
  "stage_id": "stage-1-001",
  "project_id": "proj-001"
}
```

**SSE 响应流**:
```
data: {"type":"connected","session_id":"sess-123"}

data: {"type":"text_delta","content":"我","timestamp":"..."}
data: {"type":"text_delta","content":"将","timestamp":"..."}
data: {"type":"text_delta","content":"为","timestamp":"..."}

data: {"type":"tool_use","tool":{"name":"create_document","input":{"name":"spec.md"}}}
data: {"type":"tool_result","content":"文档已创建","is_error":false}

data: {"type":"document_link","document_id":"doc-001","document_name":"spec.md"}

data: {"type":"result","data":{"duration_ms":5000,"cost_usd":0.05}}
data: {"type":"done","conversation_id":"conv-456"}
```

---

### 4.2 文档内容 API

**端点**: `GET /api/documents/{document_id}/content`

**响应**:
```json
{
  "document_id": "doc-001",
  "name": "spec.md",
  "content": "# 功能规格说明\n\n## 概述\n...",
  "version": 1,
  "updated_at": "2025-10-27T12:00:00Z"
}
```

---

### 4.3 对话历史 API

**端点**: `GET /api/stages/{stage_id}/messages`

**响应**:
```json
{
  "messages": [
    {
      "id": "msg-001",
      "sender": "user",
      "content": "帮我生成功能规格说明",
      "timestamp": "2025-10-27T12:00:00Z"
    },
    {
      "id": "msg-002",
      "sender": "ai",
      "content": "已为您生成功能规格说明文档",
      "timestamp": "2025-10-27T12:00:05Z",
      "metadata": {
        "documents": ["doc-001"]
      }
    }
  ]
}
```

---

## 五、实施步骤

### 阶段 1: 基础 SSE 流式聊天 (2-3 天)
1. ✅ 分析 claude-agent-service 架构
2. 创建 `useChatStream` Hook
3. 创建 `chatApi.streamWithFetch` 方法
4. 改造 `ChatInterface` 组件支持流式显示
5. 实现 `text_delta` 逐字显示
6. 测试基础对话流式响应

### 阶段 2: 工具调用日志显示 (1-2 天)
1. 创建 `ExecutionLogList` 组件
2. 处理 `tool_use` 和 `tool_result` 事件
3. 显示工具调用状态（执行中、成功、失败）
4. 测试多工具调用场景

### 阶段 3: 文档预览联动 (1-2 天)
1. 处理 `document_link` 事件
2. 实现文档链接点击 → 右侧预览切换
3. 增强 `DocumentPreview` 组件加载文档内容
4. 使用 `ReactMarkdown` 渲染
5. 测试文档生成 + 点击预览流程

### 阶段 4: 优化与测试 (1 天)
1. 添加错误处理（连接断开、超时）
2. 添加 Loading 状态优化
3. 添加停止流式响应功能
4. 端到端测试全流程
5. 性能优化（防抖、节流）

---

## 六、技术要点总结

### 6.1 SSE vs WebSocket

| 特性 | SSE (Server-Sent Events) | WebSocket |
|------|-------------------------|-----------|
| 方向 | 单向（服务器 → 客户端） | 双向 |
| 协议 | HTTP | WS/WSS |
| 自动重连 | ✅ 内置 | ❌ 需手动实现 |
| 复杂度 | 简单 | 较复杂 |
| 适用场景 | 流式响应、实时推送 | 实时双向通信 |

**选择 SSE 的理由**:
- AI 对话是单向流式响应，不需要双向通信
- SSE 自动重连机制更稳定
- 实现简单，兼容性好

---

### 6.2 性能优化建议

1. **防抖输入框**: 避免频繁发送请求
2. **虚拟滚动**: 消息列表过长时使用虚拟列表
3. **Markdown 懒渲染**: 大文档分段渲染
4. **缓存文档内容**: 避免重复请求同一文档

---

### 6.3 错误处理

```typescript
try {
  const stream = await chatApi.streamWithFetch({ ... });
  // ... 处理流式数据
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('用户手动停止');
  } else if (error.message.includes('timeout')) {
    message.error('请求超时，请重试');
  } else {
    message.error('连接失败，请检查网络');
  }
} finally {
  setIsStreaming(false);
}
```

---

## 七、示例效果

### 左侧对话框 (流式显示)
```
👤 User: 帮我生成功能规格说明文档

🤖 AI: 我将为您生成功能规格说明文档...  [逐字显示]

📋 运行记录:
  ✅ [12:00:01] 创建文档: spec.md
  ✅ [12:00:03] 生成章节: 概述
  ✅ [12:00:05] 生成章节: 功能需求
  📄 [12:00:07] spec.md [点击预览]
```

### 右侧文档预览 (点击链接后)
```markdown
# 功能规格说明

## 概述
本文档描述了 XX 功能的详细规格...

## 功能需求
### FR-001: 用户登录
...
```

---

## 八、附录

### A. 完整类型定义

参考文件:
- `/Users/admin/Desktop/anker/ai-native-app/claude-agent-service/frontend/src/types/index.ts`
- `/Users/admin/Desktop/anker/ai-native-app/frontend/src/types/models.ts`

### B. 参考项目链接

- **后端实现**: `/Users/admin/Desktop/anker/ai-native-app/claude-agent-service/backend/app/api/chat.py`
- **前端 Hook**: `/Users/admin/Desktop/anker/ai-native-app/claude-agent-service/frontend/src/hooks/useChatStream.ts`
- **UI 组件**: `/Users/admin/Desktop/anker/ai-native-app/claude-agent-service/frontend/src/components/ChatPanel.tsx`
- **文件预览**: `/Users/admin/Desktop/anker/ai-native-app/claude-agent-service/frontend/src/components/FileExplorer.tsx`

---

**文档版本**: v1.0
**创建日期**: 2025-10-27
**作者**: Claude Code
