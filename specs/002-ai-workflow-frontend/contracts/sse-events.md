# SSE Events Specification

**Feature**: AI-Driven Workflow Execution Frontend
**Date**: 2025-10-25
**Version**: 1.0.0

本文档定义 AI 对话流式响应的 Server-Sent Events (SSE) 事件格式。

---

## 1. SSE 连接说明

### 1.1 连接端点
```
GET /api/projects/{projectId}/dialog/stream?messageId={messageId}
```

### 1.2 请求头
```http
Accept: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
```

### 1.3 响应头
```http
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
X-Accel-Buffering: no
```

### 1.4 连接生命周期
1. 客户端发送消息到 `POST /api/projects/{projectId}/dialog/messages`
2. 服务端返回 `messageId` 和 `streamUrl`
3. 客户端打开 SSE 连接到 `streamUrl`
4. 服务端流式推送事件
5. 推送完成后发送 `complete` 事件
6. 客户端关闭连接

---

## 2. 事件格式

所有 SSE 事件遵循以下格式：

```
event: <event_type>
data: <json_payload>

```

**注意**：每个事件以两个换行符 `\n\n` 结束。

---

## 3. 事件类型

### 3.1 `message` - AI 文本流式响应

**用途**: AI 生成的文本内容，逐字或逐句推送

**Payload**:
```json
{
  "type": "message",
  "data": {
    "delta": "这是",
    "accumulated": "这是",
    "messageId": "msg-ai-123"
  },
  "timestamp": "2025-10-25T10:30:00Z"
}
```

**字段说明**:
- `delta`: 本次新增的文本片段
- `accumulated`: 累积的完整文本（可选，前端可自行累积）
- `messageId`: AI 消息ID

**示例事件流**:
```
event: message
data: {"type":"message","data":{"delta":"您好","messageId":"msg-ai-123"},"timestamp":"2025-10-25T10:30:00.100Z"}

event: message
data: {"type":"message","data":{"delta":"，我","messageId":"msg-ai-123"},"timestamp":"2025-10-25T10:30:00.200Z"}

event: message
data: {"type":"message","data":{"delta":"来帮","messageId":"msg-ai-123"},"timestamp":"2025-10-25T10:30:00.300Z"}

event: message
data: {"type":"message","data":{"delta":"您创建","messageId":"msg-ai-123"},"timestamp":"2025-10-25T10:30:00.400Z"}

event: message
data: {"type":"message","data":{"delta":"项目。","messageId":"msg-ai-123"},"timestamp":"2025-10-25T10:30:00.500Z"}
```

---

### 3.2 `status` - 任务状态更新

**用途**: AI 执行后台任务时的状态通知（如生成文档、调用 API）

**Payload**:
```json
{
  "type": "status",
  "data": {
    "taskName": "生成 spec.md",
    "status": "in_progress",
    "progress": 50,
    "message": "正在分析需求..."
  },
  "timestamp": "2025-10-25T10:30:05Z"
}
```

**字段说明**:
- `taskName`: 任务名称
- `status`: 任务状态 (`pending`, `in_progress`, `completed`, `failed`)
- `progress`: 进度百分比（0-100，可选）
- `message`: 状态描述

**示例事件流**:
```
event: status
data: {"type":"status","data":{"taskName":"生成 spec.md","status":"in_progress","progress":0,"message":"开始生成文档"},"timestamp":"2025-10-25T10:30:05Z"}

event: status
data: {"type":"status","data":{"taskName":"生成 spec.md","status":"in_progress","progress":30,"message":"正在分析功能需求"},"timestamp":"2025-10-25T10:30:10Z"}

event: status
data: {"type":"status","data":{"taskName":"生成 spec.md","status":"in_progress","progress":60,"message":"正在编写用户故事"},"timestamp":"2025-10-25T10:30:15Z"}

event: status
data: {"type":"status","data":{"taskName":"生成 spec.md","status":"completed","progress":100,"message":"文档生成完成"},"timestamp":"2025-10-25T10:30:20Z"}
```

---

### 3.3 `document_update` - 文档更新通知

**用途**: AI 生成或修改文档时的通知

**Payload**:
```json
{
  "type": "document_update",
  "data": {
    "documentId": "doc-456",
    "name": "spec.md",
    "action": "created",
    "content": "# 功能规格说明\n\n...",
    "version": 1,
    "metadata": {
      "author": "AI Assistant",
      "createdBy": "user-123",
      "lastModifiedBy": "user-123",
      "wordCount": 1500
    }
  },
  "timestamp": "2025-10-25T10:30:20Z"
}
```

**字段说明**:
- `documentId`: 文档ID
- `name`: 文档名称
- `action`: 操作类型 (`created`, `updated`, `deleted`)
- `content`: 文档完整内容
- `version`: 版本号
- `metadata`: 元数据

**示例**:
```
event: document_update
data: {"type":"document_update","data":{"documentId":"doc-456","name":"spec.md","action":"created","content":"# 功能规格说明\n\n## 概述\n本文档定义...","version":1,"metadata":{"author":"AI Assistant","createdBy":"user-123","lastModifiedBy":"user-123","wordCount":1500}},"timestamp":"2025-10-25T10:30:20Z"}
```

---

### 3.4 `workflow_update` - 工作流状态更新

**用途**: 工作流阶段或任务状态变化通知

**Payload**:
```json
{
  "type": "workflow_update",
  "data": {
    "stageId": "stage-1",
    "stageNumber": 1,
    "stageName": "需求澄清",
    "status": "completed",
    "completedAt": "2025-10-25T10:35:00Z"
  },
  "timestamp": "2025-10-25T10:35:00Z"
}
```

**字段说明**:
- `stageId`: 阶段ID
- `stageNumber`: 阶段编号 (0-4)
- `stageName`: 阶段名称
- `status`: 阶段状态 (`pending`, `in_progress`, `completed`)
- `completedAt`: 完成时间（可选）

**示例**:
```
event: workflow_update
data: {"type":"workflow_update","data":{"stageId":"stage-0","stageNumber":0,"stageName":"项目初始化","status":"completed","completedAt":"2025-10-25T10:25:00Z"},"timestamp":"2025-10-25T10:25:00Z"}

event: workflow_update
data: {"type":"workflow_update","data":{"stageId":"stage-1","stageNumber":1,"stageName":"需求澄清","status":"in_progress"},"timestamp":"2025-10-25T10:25:05Z"}
```

---

### 3.5 `command_result` - 命令执行结果

**用途**: AI 执行系统命令的结果通知（成功或失败）

**Payload** (成功):
```json
{
  "type": "command_result",
  "data": {
    "command": "create_document",
    "status": "success",
    "result": {
      "documentId": "doc-456",
      "name": "spec.md"
    },
    "message": "文档创建成功"
  },
  "timestamp": "2025-10-25T10:30:22Z"
}
```

**Payload** (失败):
```json
{
  "type": "command_result",
  "data": {
    "command": "sync_to_feishu",
    "status": "failure",
    "error": {
      "code": "FEISHU_API_ERROR",
      "message": "飞书 API 调用失败",
      "details": "网络超时"
    },
    "message": "飞书同步失败，文档已保存到本地"
  },
  "timestamp": "2025-10-25T10:30:25Z"
}
```

**字段说明**:
- `command`: 命令类型
- `status`: 执行状态 (`success`, `failure`)
- `result`: 成功结果（可选）
- `error`: 错误信息（失败时）
- `message`: 用户友好的消息

---

### 3.6 `error` - 错误通知

**用途**: 流处理过程中发生的错误

**Payload**:
```json
{
  "type": "error",
  "data": {
    "code": "AI_GENERATION_ERROR",
    "message": "AI 生成内容时发生错误",
    "details": "模型响应超时",
    "recoverable": true
  },
  "timestamp": "2025-10-25T10:30:30Z"
}
```

**字段说明**:
- `code`: 错误代码
- `message`: 错误消息
- `details`: 错误详情
- `recoverable`: 是否可恢复（true = 可重试）

**示例**:
```
event: error
data: {"type":"error","data":{"code":"RATE_LIMIT","message":"请求过于频繁，请稍后重试","details":"每分钟最多10次请求","recoverable":true},"timestamp":"2025-10-25T10:30:30Z"}
```

---

### 3.7 `complete` - 流式传输完成

**用途**: 标记 SSE 流结束，客户端可关闭连接

**Payload**:
```json
{
  "type": "complete",
  "data": {
    "messageId": "msg-ai-123",
    "totalDuration": 5200,
    "summary": "对话完成，共生成 1500 字"
  },
  "timestamp": "2025-10-25T10:30:35Z"
}
```

**字段说明**:
- `messageId`: 完成的消息ID
- `totalDuration`: 总耗时（毫秒）
- `summary`: 总结信息（可选）

**示例**:
```
event: complete
data: {"type":"complete","data":{"messageId":"msg-ai-123","totalDuration":5200,"summary":"对话完成"},"timestamp":"2025-10-25T10:30:35Z"}
```

---

## 4. 完整示例：创建项目并生成文档

```
event: message
data: {"type":"message","data":{"delta":"好的","messageId":"msg-ai-001"},"timestamp":"2025-10-25T10:00:00Z"}

event: message
data: {"type":"message","data":{"delta":"，让我","messageId":"msg-ai-001"},"timestamp":"2025-10-25T10:00:00.1Z"}

event: message
data: {"type":"message","data":{"delta":"帮您","messageId":"msg-ai-001"},"timestamp":"2025-10-25T10:00:00.2Z"}

event: message
data: {"type":"message","data":{"delta":"创建项目。","messageId":"msg-ai-001"},"timestamp":"2025-10-25T10:00:00.3Z"}

event: status
data: {"type":"status","data":{"taskName":"初始化项目","status":"in_progress","progress":0,"message":"正在创建项目结构"},"timestamp":"2025-10-25T10:00:01Z"}

event: workflow_update
data: {"type":"workflow_update","data":{"stageId":"stage-0","stageNumber":0,"stageName":"项目初始化","status":"in_progress"},"timestamp":"2025-10-25T10:00:02Z"}

event: status
data: {"type":"status","data":{"taskName":"初始化项目","status":"completed","progress":100,"message":"项目创建完成"},"timestamp":"2025-10-25T10:00:05Z"}

event: command_result
data: {"type":"command_result","data":{"command":"create_project","status":"success","result":{"projectId":"proj-789","name":"用户登录功能"},"message":"项目创建成功"},"timestamp":"2025-10-25T10:00:05Z"}

event: message
data: {"type":"message","data":{"delta":"\n\n现在","messageId":"msg-ai-001"},"timestamp":"2025-10-25T10:00:06Z"}

event: message
data: {"type":"message","data":{"delta":"让我为","messageId":"msg-ai-001"},"timestamp":"2025-10-25T10:00:06.1Z"}

event: message
data: {"type":"message","data":{"delta":"您生成","messageId":"msg-ai-001"},"timestamp":"2025-10-25T10:00:06.2Z"}

event: message
data: {"type":"message","data":{"delta":"初步的","messageId":"msg-ai-001"},"timestamp":"2025-10-25T10:00:06.3Z"}

event: message
data: {"type":"message","data":{"delta":"规格说明。","messageId":"msg-ai-001"},"timestamp":"2025-10-25T10:00:06.4Z"}

event: status
data: {"type":"status","data":{"taskName":"生成 spec.md","status":"in_progress","progress":0,"message":"开始生成文档"},"timestamp":"2025-10-25T10:00:07Z"}

event: status
data: {"type":"status","data":{"taskName":"生成 spec.md","status":"in_progress","progress":50,"message":"正在编写功能需求"},"timestamp":"2025-10-25T10:00:12Z"}

event: status
data: {"type":"status","data":{"taskName":"生成 spec.md","status":"completed","progress":100,"message":"文档生成完成"},"timestamp":"2025-10-25T10:00:18Z"}

event: document_update
data: {"type":"document_update","data":{"documentId":"doc-001","name":"spec.md","action":"created","content":"# 功能规格说明：用户登录功能\n\n## 概述\n...","version":1,"metadata":{"author":"AI Assistant","createdBy":"user-123","lastModifiedBy":"user-123","wordCount":1200}},"timestamp":"2025-10-25T10:00:18Z"}

event: command_result
data: {"type":"command_result","data":{"command":"create_document","status":"success","result":{"documentId":"doc-001","name":"spec.md"},"message":"文档创建成功"},"timestamp":"2025-10-25T10:00:18Z"}

event: workflow_update
data: {"type":"workflow_update","data":{"stageId":"stage-0","stageNumber":0,"stageName":"项目初始化","status":"completed","completedAt":"2025-10-25T10:00:20Z"},"timestamp":"2025-10-25T10:00:20Z"}

event: complete
data: {"type":"complete","data":{"messageId":"msg-ai-001","totalDuration":20000,"summary":"项目初始化完成，已生成 spec.md"},"timestamp":"2025-10-25T10:00:20Z"}
```

---

## 5. 客户端处理建议

### 5.1 EventSource 基本用法

```typescript
const eventSource = new EventSource(
  `/api/projects/${projectId}/dialog/stream?messageId=${messageId}`
);

eventSource.addEventListener('message', (event) => {
  const data = JSON.parse(event.data);
  // 处理 AI 文本流
  appendTextToMessage(data.data.delta);
});

eventSource.addEventListener('status', (event) => {
  const data = JSON.parse(event.data);
  // 更新任务状态
  updateTaskStatus(data.data.taskName, data.data.status);
});

eventSource.addEventListener('document_update', (event) => {
  const data = JSON.parse(event.data);
  // 更新文档列表
  refreshDocument(data.data.documentId);
});

eventSource.addEventListener('workflow_update', (event) => {
  const data = JSON.parse(event.data);
  // 更新工作流状态
  updateWorkflowStage(data.data.stageId, data.data.status);
});

eventSource.addEventListener('command_result', (event) => {
  const data = JSON.parse(event.data);
  if (data.data.status === 'success') {
    // 显示成功提示
    showSuccessMessage(data.data.message);
  } else {
    // 显示错误提示
    showErrorMessage(data.data.error.message);
  }
});

eventSource.addEventListener('error', (event) => {
  const data = JSON.parse(event.data);
  // 处理错误
  showError(data.data.message);
});

eventSource.addEventListener('complete', (event) => {
  // 流结束，关闭连接
  eventSource.close();
});

eventSource.onerror = (error) => {
  console.error('SSE connection error:', error);
  // 实现自动重连逻辑
};
```

### 5.2 自定义 Hook 封装

```typescript
// hooks/useSSE.ts (参考 research.md)
const { isConnected, retryCount } = useSSE({
  url: `/api/projects/${projectId}/dialog/stream?messageId=${messageId}`,
  onMessage: (data) => {
    if (data.type === 'message') {
      // 处理文本流
    } else if (data.type === 'status') {
      // 处理状态更新
    }
    // ...
  },
  onError: (error) => {
    console.error('SSE error:', error);
  },
  maxRetries: 10,
});
```

---

## 6. MSW Mock 示例

```typescript
// mocks/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/projects/:projectId/dialog/stream', ({ params }) => {
    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        const events = [
          { type: 'message', data: { delta: '您好', messageId: 'msg-1' } },
          { type: 'message', data: { delta: '，我', messageId: 'msg-1' } },
          { type: 'message', data: { delta: '来帮您', messageId: 'msg-1' } },
          {
            type: 'status',
            data: {
              taskName: '生成文档',
              status: 'in_progress',
              progress: 50,
            },
          },
          {
            type: 'document_update',
            data: {
              documentId: 'doc-1',
              name: 'spec.md',
              action: 'created',
            },
          },
          { type: 'complete', data: { messageId: 'msg-1' } },
        ];

        let index = 0;
        const interval = setInterval(() => {
          if (index < events.length) {
            const event = events[index];
            const sseData = `event: ${event.type}\ndata: ${JSON.stringify({
              type: event.type,
              data: event.data,
              timestamp: new Date().toISOString(),
            })}\n\n`;
            controller.enqueue(encoder.encode(sseData));
            index++;
          } else {
            controller.close();
            clearInterval(interval);
          }
        }, 200);
      },
    });

    return new HttpResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  }),
];
```

---

## 7. 错误处理和重连策略

### 7.1 常见错误场景

| 错误类型 | 处理方式 |
|---------|---------|
| 网络断开 | 自动重连（指数退避） |
| Token 过期 | 刷新 token 后重连 |
| 服务器错误 | 显示错误提示，允许手动重试 |
| 流解析失败 | 记录错误日志，跳过该事件 |

### 7.2 重连逻辑

```typescript
let retryCount = 0;
const maxRetries = 10;

function connect() {
  const eventSource = new EventSource(url);

  eventSource.onerror = () => {
    eventSource.close();

    if (retryCount < maxRetries) {
      const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);
      setTimeout(() => {
        retryCount++;
        connect();
      }, delay);
    }
  };

  eventSource.onopen = () => {
    retryCount = 0; // 重置计数
  };
}
```

---

**Status**: ✅ Complete - SSE event specification fully defined
