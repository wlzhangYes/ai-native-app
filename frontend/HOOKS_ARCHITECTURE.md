# AI Workflow Frontend - Hooks 分层架构

## 1. 现状分析

### 1.1 当前 Hooks 结构

```
src/hooks/
├── useSSE.ts          # SSE 连接管理 (160 行)
├── useTodos.ts        # TodoWrite 数据提取 (53 行)
└── useDebounce.ts     # 防抖工具 (67 行)
```

**存在的问题**:
- ❌ **缺乏分层**: 所有 hooks 平铺在同一目录
- ❌ **职责混杂**: 基础工具 hooks 与业务 hooks 混在一起
- ❌ **可发现性差**: 新同学不知道有哪些可用的 hooks
- ❌ **缺少组合 hooks**: 复杂业务逻辑重复在组件中实现
- ❌ **缺少文档**: 没有统一的 hooks 使用规范

---

## 2. Hooks 分层架构设计

### 2.1 分层原则

```
┌─────────────────────────────────────────────┐
│  Layer 4: 组合层 (Composite Hooks)          │  ← 高层业务逻辑
│  - 组合多个业务 hooks                        │
│  - 封装复杂交互流程                          │
│  - useChat, useWorkflowManager              │
└─────────────────────────────────────────────┘
                    ↓ 依赖
┌─────────────────────────────────────────────┐
│  Layer 3: 业务层 (Business Hooks)           │  ← 领域业务逻辑
│  - 特定业务领域逻辑                          │
│  - 依赖 Store 和 API                        │
│  - useTodos, useDocuments, useMessages      │
└─────────────────────────────────────────────┘
                    ↓ 依赖
┌─────────────────────────────────────────────┐
│  Layer 2: 基础设施层 (Infrastructure Hooks) │  ← 技术基础设施
│  - 网络、存储、通信                          │
│  - 不依赖业务逻辑                            │
│  - useSSE, useAPI, useLocalStorage          │
└─────────────────────────────────────────────┘
                    ↓ 依赖
┌─────────────────────────────────────────────┐
│  Layer 1: 工具层 (Utility Hooks)            │  ← 通用工具
│  - 纯函数式工具                              │
│  - 无任何依赖                                │
│  - useDebounce, useThrottle, useMount       │
└─────────────────────────────────────────────┘
```

### 2.2 推荐的目录结构

```
src/hooks/
├── index.ts                      # 统一导出所有 hooks
│
├── utility/                      # Layer 1: 工具层
│   ├── index.ts                  # 导出所有工具 hooks
│   ├── useDebounce.ts            # ✅ 已存在
│   ├── useThrottle.ts            # 🆕 节流
│   ├── useMount.ts               # 🆕 组件挂载生命周期
│   ├── useUnmount.ts             # 🆕 组件卸载生命周期
│   ├── useUpdateEffect.ts        # 🆕 跳过首次渲染的 useEffect
│   ├── usePrevious.ts            # 🆕 获取上一次的值
│   ├── useToggle.ts              # 🆕 布尔值切换
│   ├── useCounter.ts             # 🆕 计数器
│   └── useLocalStorageState.ts   # 🆕 localStorage 同步状态
│
├── infrastructure/               # Layer 2: 基础设施层
│   ├── index.ts
│   ├── useSSE.ts                 # ✅ 已存在 - SSE 连接
│   ├── useApiClient.ts           # 🆕 获取 axios 实例
│   ├── useSession.ts             # 🆕 获取当前 sessionId
│   ├── useWebSocket.ts           # 🆕 WebSocket 连接 (未来)
│   ├── useIndexedDB.ts           # 🆕 IndexedDB 操作 (未来)
│   └── useFileUpload.ts          # 🆕 文件上传
│
├── business/                     # Layer 3: 业务层
│   ├── index.ts
│   ├── dialog/                   # 对话相关业务 hooks
│   │   ├── useTodos.ts           # ✅ 已存在 - TodoWrite 提取
│   │   ├── useMessages.ts        # 🆕 消息管理
│   │   ├── useChatStream.ts      # 🆕 流式对话
│   │   └── useToolCalls.ts       # 🆕 工具调用管理
│   ├── workflow/                 # 工作流相关业务 hooks
│   │   ├── useWorkflowStages.ts  # 🆕 工作流阶段管理
│   │   ├── useTaskNodes.ts       # 🆕 任务节点管理
│   │   └── useWorkflowSync.ts    # 🆕 工作流同步
│   └── document/                 # 文档相关业务 hooks
│       ├── useDocuments.ts       # 🆕 文档列表管理
│       ├── useDocumentEditor.ts  # 🆕 文档编辑器状态
│       └── useDocumentDiff.ts    # 🆕 文档对比
│
└── composite/                    # Layer 4: 组合层
    ├── index.ts
    ├── useChat.ts                # 🆕 完整对话功能 (组合多个 hooks)
    ├── useWorkflowManager.ts     # 🆕 工作流管理器
    └── useAIWorkflow.ts          # 🆕 AI Workflow 完整功能 (Headless 模式)
```

---

## 3. 各层 Hooks 详解

### 3.1 Layer 1: 工具层 (Utility Hooks)

**特点**:
- ✅ 纯函数式，无副作用（除了 React state）
- ✅ 不依赖任何业务逻辑
- ✅ 可以在任何 React 项目中复用
- ✅ 单一职责，功能简单

#### 示例：useThrottle (新增)

```typescript
// src/hooks/utility/useThrottle.ts

import { useState, useEffect, useRef } from 'react';

/**
 * Throttle a value
 * @param value - The value to throttle
 * @param delay - The delay in milliseconds (default: 500ms)
 * @returns The throttled value
 */
export function useThrottle<T>(value: T, delay = 500): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastRun = useRef(Date.now());

  useEffect(() => {
    const now = Date.now();
    const timeSinceLastRun = now - lastRun.current;

    if (timeSinceLastRun >= delay) {
      setThrottledValue(value);
      lastRun.current = now;
    } else {
      const handler = setTimeout(() => {
        setThrottledValue(value);
        lastRun.current = Date.now();
      }, delay - timeSinceLastRun);

      return () => clearTimeout(handler);
    }
  }, [value, delay]);

  return throttledValue;
}
```

#### 示例：usePrevious (新增)

```typescript
// src/hooks/utility/usePrevious.ts

import { useRef, useEffect } from 'react';

/**
 * Get the previous value of a variable
 * @param value - The current value
 * @returns The previous value
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

// 使用示例
function Counter() {
  const [count, setCount] = useState(0);
  const prevCount = usePrevious(count);

  return (
    <div>
      <p>Current: {count}</p>
      <p>Previous: {prevCount}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
}
```

#### 示例：useToggle (新增)

```typescript
// src/hooks/utility/useToggle.ts

import { useState, useCallback } from 'react';

/**
 * Toggle a boolean value
 * @param initialValue - The initial boolean value (default: false)
 * @returns [value, toggle, setTrue, setFalse]
 */
export function useToggle(initialValue = false) {
  const [value, setValue] = useState(initialValue);

  const toggle = useCallback(() => setValue((v) => !v), []);
  const setTrue = useCallback(() => setValue(true), []);
  const setFalse = useCallback(() => setValue(false), []);

  return [value, toggle, setTrue, setFalse] as const;
}

// 使用示例
function Modal() {
  const [isOpen, toggle, open, close] = useToggle(false);

  return (
    <>
      <button onClick={open}>Open Modal</button>
      {isOpen && (
        <div>
          <p>Modal Content</p>
          <button onClick={close}>Close</button>
        </div>
      )}
    </>
  );
}
```

---

### 3.2 Layer 2: 基础设施层 (Infrastructure Hooks)

**特点**:
- ✅ 封装技术基础设施（网络、存储、通信）
- ✅ 不依赖业务逻辑
- ✅ 可以在其他项目中复用（稍作修改）

#### 示例：useApiClient (新增)

```typescript
// src/hooks/infrastructure/useApiClient.ts

import { useContext } from 'react';
import { ApiClientContext } from '@/contexts/ApiClientContext';
import type { AxiosInstance } from 'axios';

/**
 * Get the configured Axios client from context
 * @returns Axios instance
 */
export function useApiClient(): AxiosInstance {
  const client = useContext(ApiClientContext);
  if (!client) {
    throw new Error('useApiClient must be used within ApiClientProvider');
  }
  return client;
}

// 使用示例
function ChatInterface() {
  const apiClient = useApiClient();

  const sendMessage = async (content: string) => {
    const response = await apiClient.post('/sessions/xxx/chat', { content });
    return response.data;
  };
}
```

#### 示例：useSession (新增)

```typescript
// src/hooks/infrastructure/useSession.ts

import { useContext } from 'react';
import { SessionContext } from '@/contexts/SessionContext';

/**
 * Get current session information
 * @returns { sessionId, apiBaseUrl, storageKeyPrefix }
 */
export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within SessionProvider');
  }
  return context;
}

// 使用示例
function ChatInterface() {
  const { sessionId, apiBaseUrl } = useSession();
  console.log('Current session:', sessionId);
}
```

#### 示例：useFileUpload (新增)

```typescript
// src/hooks/infrastructure/useFileUpload.ts

import { useState, useCallback } from 'react';
import { useApiClient } from './useApiClient';
import { useSession } from './useSession';
import { message } from 'antd';

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export function useFileUpload() {
  const apiClient = useApiClient();
  const { sessionId } = useSession();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);

  const upload = useCallback(
    async (file: File) => {
      setUploading(true);
      setProgress({ loaded: 0, total: file.size, percentage: 0 });

      const formData = new FormData();
      formData.append('file', file);
      formData.append('sessionId', sessionId);

      try {
        const response = await apiClient.post('/files/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentage = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setProgress({
                loaded: progressEvent.loaded,
                total: progressEvent.total,
                percentage,
              });
            }
          },
        });

        setUploading(false);
        setProgress(null);
        message.success('文件上传成功');
        return response.data;
      } catch (error) {
        setUploading(false);
        setProgress(null);
        message.error('文件上传失败');
        throw error;
      }
    },
    [apiClient, sessionId]
  );

  return { upload, uploading, progress };
}

// 使用示例
function FileUploadButton() {
  const { upload, uploading, progress } = useFileUpload();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await upload(file);
    }
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} disabled={uploading} />
      {uploading && <Progress percent={progress?.percentage || 0} />}
    </div>
  );
}
```

---

### 3.3 Layer 3: 业务层 (Business Hooks)

**特点**:
- ✅ 封装特定业务领域逻辑
- ✅ 依赖 Store 和 API Service
- ✅ 提供业务语义化接口

#### 示例：useMessages (新增)

```typescript
// src/hooks/business/dialog/useMessages.ts

import { useCallback } from 'react';
import { useDialogStore } from '@/stores/useDialogStore';
import { useSession } from '@/hooks/infrastructure/useSession';
import type { Message } from '@/types/models';

export function useMessages() {
  const { sessionId } = useSession();
  const {
    messages,
    addMessage,
    updateMessage,
    deleteMessage,
    clearMessages,
    loadMessages,
  } = useDialogStore();

  // 发送消息 (包装 Store 方法，添加业务逻辑)
  const sendMessage = useCallback(
    async (content: string, attachments?: File[]) => {
      // 1. 添加用户消息到 Store
      const userMessage: Message = {
        id: `msg-${Date.now()}`,
        content,
        sender: 'user',
        type: 'input',
        timestamp: new Date().toISOString(),
        metadata: { attachments: attachments?.map((f) => f.name) },
      };
      addMessage(userMessage);

      // 2. 调用 API 发送消息 (这里简化，实际应调用 API Service)
      // const response = await chatService.sendMessage(sessionId, content, attachments);

      // 3. 添加 AI 响应消息
      // addMessage(response);
    },
    [sessionId, addMessage]
  );

  // 编辑消息
  const editMessage = useCallback(
    (messageId: string, newContent: string) => {
      updateMessage(messageId, { content: newContent });
    },
    [updateMessage]
  );

  // 重新生成消息
  const regenerateMessage = useCallback(
    async (messageId: string) => {
      const message = messages.find((m) => m.id === messageId);
      if (!message) return;

      // 调用 API 重新生成
      // const response = await chatService.regenerate(sessionId, messageId);
      // updateMessage(messageId, { content: response.content });
    },
    [messages, sessionId, updateMessage]
  );

  return {
    messages,
    sendMessage,
    editMessage,
    regenerateMessage,
    deleteMessage,
    clearMessages,
    loadMessages,
  };
}

// 使用示例
function ChatInterface() {
  const { messages, sendMessage } = useMessages();

  const handleSend = (content: string) => {
    sendMessage(content);
  };

  return (
    <div>
      {messages.map((msg) => (
        <div key={msg.id}>{msg.content}</div>
      ))}
      <input onKeyPress={(e) => e.key === 'Enter' && handleSend(e.target.value)} />
    </div>
  );
}
```

#### 示例：useWorkflowStages (新增)

```typescript
// src/hooks/business/workflow/useWorkflowStages.ts

import { useCallback } from 'react';
import { useWorkflowStore } from '@/stores/useWorkflowStore';
import { useSession } from '@/hooks/infrastructure/useSession';
import type { WorkflowStage } from '@/types/models';

export function useWorkflowStages() {
  const { sessionId } = useSession();
  const {
    workflows,
    addStage,
    updateStage,
    selectedNodeId,
    setSelectedNode,
  } = useWorkflowStore();

  // 获取当前激活的阶段
  const activeStage = workflows.find((stage) => stage.status === 'in_progress');

  // 前进到下一个阶段
  const advanceToNextStage = useCallback(
    (currentStageId: string) => {
      const currentIndex = workflows.findIndex((s) => s.id === currentStageId);
      if (currentIndex === -1 || currentIndex === workflows.length - 1) return;

      // 标记当前阶段完成
      updateStage(currentStageId, { status: 'completed' });

      // 激活下一个阶段
      const nextStage = workflows[currentIndex + 1];
      updateStage(nextStage.id, { status: 'in_progress' });
    },
    [workflows, updateStage]
  );

  // 返回到之前的阶段
  const goBackToStage = useCallback(
    (stageId: string) => {
      // 将该阶段之后的所有阶段重置为 pending
      const targetIndex = workflows.findIndex((s) => s.id === stageId);
      workflows.forEach((stage, index) => {
        if (index > targetIndex) {
          updateStage(stage.id, { status: 'pending' });
        }
      });

      // 激活目标阶段
      updateStage(stageId, { status: 'in_progress' });
    },
    [workflows, updateStage]
  );

  return {
    workflows,
    activeStage,
    selectedNodeId,
    setSelectedNode,
    advanceToNextStage,
    goBackToStage,
  };
}

// 使用示例
function WorkflowTree() {
  const { workflows, activeStage, advanceToNextStage } = useWorkflowStages();

  return (
    <div>
      {workflows.map((stage) => (
        <div key={stage.id} className={stage.id === activeStage?.id ? 'active' : ''}>
          <span>{stage.name}</span>
          {stage.id === activeStage?.id && (
            <button onClick={() => advanceToNextStage(stage.id)}>下一步</button>
          )}
        </div>
      ))}
    </div>
  );
}
```

---

### 3.4 Layer 4: 组合层 (Composite Hooks)

**特点**:
- ✅ 组合多个业务 hooks
- ✅ 封装复杂交互流程
- ✅ 提供高层业务能力

#### 示例：useChat (新增)

```typescript
// src/hooks/composite/useChat.ts

import { useCallback, useState } from 'react';
import { useMessages } from '../business/dialog/useMessages';
import { useSSE } from '../infrastructure/useSSE';
import { useSession } from '../infrastructure/useSession';
import { useFileUpload } from '../infrastructure/useFileUpload';

/**
 * Complete chat functionality (composite hook)
 * Combines: useMessages + useSSE + useFileUpload
 */
export function useChat() {
  const { sessionId, apiBaseUrl } = useSession();
  const { messages, sendMessage } = useMessages();
  const { upload, uploading, progress } = useFileUpload();
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);

  // SSE 消息处理
  const handleSSEMessage = useCallback((event: any) => {
    switch (event.type) {
      case 'text_delta':
        // 更新流式消息内容
        if (streamingMessageId) {
          // appendToMessage(streamingMessageId, event.content);
        }
        break;
      case 'tool_use':
        // 处理工具调用
        break;
    }
  }, [streamingMessageId]);

  // SSE 连接
  const { isConnected, reconnect } = useSSE({
    url: `${apiBaseUrl}/sessions/${sessionId}/chat`,
    onMessage: handleSSEMessage,
    enabled: !!sessionId,
  });

  // 发送消息（支持附件）
  const send = useCallback(
    async (content: string, files?: File[]) => {
      // 1. 上传附件（如果有）
      const attachmentUrls = files ? await Promise.all(files.map((f) => upload(f))) : [];

      // 2. 发送消息
      await sendMessage(content, attachmentUrls);

      // 3. 开始 SSE 流式接收
      setStreamingMessageId(`msg-${Date.now()}`);
    },
    [upload, sendMessage]
  );

  return {
    // 状态
    messages,
    isConnected,
    uploading,
    uploadProgress: progress,

    // 方法
    send,
    reconnect,
  };
}

// 使用示例 (简化组件逻辑)
function ChatInterface() {
  const { messages, send, isConnected } = useChat();
  const [input, setInput] = useState('');

  return (
    <div>
      <div>连接状态: {isConnected ? '已连接' : '未连接'}</div>
      {messages.map((msg) => (
        <div key={msg.id}>{msg.content}</div>
      ))}
      <input value={input} onChange={(e) => setInput(e.target.value)} />
      <button onClick={() => send(input)}>发送</button>
    </div>
  );
}
```

#### 示例：useAIWorkflow (Headless 模式)

```typescript
// src/hooks/composite/useAIWorkflow.ts

import { useMessages } from '../business/dialog/useMessages';
import { useWorkflowStages } from '../business/workflow/useWorkflowStages';
import { useDocuments } from '../business/document/useDocuments';
import { useTodos } from '../business/dialog/useTodos';
import { useDialogStore } from '@/stores/useDialogStore';

/**
 * Complete AI Workflow functionality (Headless)
 * Provides all necessary state and methods for building custom UI
 */
export function useAIWorkflow() {
  const { messages, sendMessage } = useMessages();
  const { workflows, activeStage, advanceToNextStage } = useWorkflowStages();
  const { documents, selectedDocument, openDocument } = useDocuments();
  const toolCalls = useDialogStore((state) => state.toolCalls);
  const { todos, completedCount, totalCount } = useTodos(toolCalls);

  return {
    // Dialog
    messages,
    sendMessage,

    // Workflow
    workflows,
    activeStage,
    advanceToNextStage,

    // Documents
    documents,
    selectedDocument,
    openDocument,

    // Todos
    todos,
    progress: totalCount > 0 ? (completedCount / totalCount) * 100 : 0,
  };
}

// 使用示例 (完全自定义 UI)
function MyCustomUI() {
  const {
    messages,
    sendMessage,
    workflows,
    todos,
    progress,
  } = useAIWorkflow();

  return (
    <div className="my-custom-layout">
      <div className="chat">
        {messages.map((msg) => (
          <div key={msg.id}>{msg.content}</div>
        ))}
      </div>
      <div className="workflow">
        {workflows.map((stage) => (
          <div key={stage.id}>{stage.name}</div>
        ))}
      </div>
      <div className="progress">进度: {progress}%</div>
    </div>
  );
}
```

---

## 4. Hooks 使用规范

### 4.1 命名规范

| 类型 | 命名模式 | 示例 |
|------|----------|------|
| 工具 Hook | `use{功能}` | `useDebounce`, `useToggle` |
| 基础设施 Hook | `use{技术名称}` | `useSSE`, `useApiClient` |
| 业务 Hook | `use{领域名词}` | `useMessages`, `useDocuments` |
| 组合 Hook | `use{完整功能}` | `useChat`, `useWorkflowManager` |

### 4.2 依赖规则

```typescript
// ✅ 正确：业务 hook 依赖基础设施 hook
function useMessages() {
  const { sessionId } = useSession();  // 基础设施 hook
  const apiClient = useApiClient();     // 基础设施 hook
  // ...
}

// ❌ 错误：基础设施 hook 依赖业务 hook
function useSSE() {
  const { messages } = useMessages();  // ❌ 不应该依赖业务 hook
  // ...
}

// ✅ 正确：组合 hook 依赖业务 hook
function useChat() {
  const { messages, sendMessage } = useMessages();  // 业务 hook
  const { workflows } = useWorkflowStages();        // 业务 hook
  // ...
}
```

### 4.3 返回值规范

**单一返回值**:
```typescript
// ✅ 简单 hook 返回单个值
function useDebounce<T>(value: T, delay: number): T {
  return debouncedValue;
}
```

**对象返回值** (推荐):
```typescript
// ✅ 复杂 hook 返回对象
function useChat() {
  return {
    messages,
    sendMessage,
    isConnected,
    reconnect,
  };
}
```

**元组返回值** (useState 风格):
```typescript
// ✅ 类似 useState 的 hook 返回元组
function useToggle(initialValue: boolean) {
  return [value, toggle, setTrue, setFalse] as const;
}
```

### 4.4 性能优化

**使用 useCallback 包裹函数**:
```typescript
function useMessages() {
  const sendMessage = useCallback(async (content: string) => {
    // ...
  }, [sessionId]);  // 明确依赖项

  return { sendMessage };
}
```

**使用 useMemo 缓存计算结果**:
```typescript
function useTodos(toolCalls: ToolCall[]) {
  const todos = useMemo(() => {
    // 昂贵的计算
    return extractTodos(toolCalls);
  }, [toolCalls]);  // 仅在 toolCalls 变化时重新计算

  return { todos };
}
```

---

## 5. 迁移计划

### 5.1 Phase 1: 创建新目录结构

```bash
mkdir -p src/hooks/{utility,infrastructure,business/{dialog,workflow,document},composite}
```

### 5.2 Phase 2: 移动现有 hooks

```bash
# useDebounce → utility/
mv src/hooks/useDebounce.ts src/hooks/utility/

# useSSE → infrastructure/
mv src/hooks/useSSE.ts src/hooks/infrastructure/

# useTodos → business/dialog/
mv src/hooks/useTodos.ts src/hooks/business/dialog/
```

### 5.3 Phase 3: 创建新 hooks

按优先级逐个创建新 hooks：

**P0 (立即需要)**:
- ✅ `useApiClient` - 获取 axios 实例
- ✅ `useSession` - 获取 sessionId

**P1 (近期需要)**:
- 🔄 `useMessages` - 消息管理
- 🔄 `useWorkflowStages` - 工作流阶段
- 🔄 `useFileUpload` - 文件上传

**P2 (未来需要)**:
- 🔜 `useChat` - 完整对话功能
- 🔜 `useAIWorkflow` - Headless 模式
- 🔜 其他工具 hooks (useToggle, usePrevious, etc.)

### 5.4 Phase 4: 更新组件使用方式

**Before**:
```tsx
function ChatInterface() {
  const { messages, addMessage } = useDialogStore();
  const { sessionId } = useSession();
  const apiClient = useApiClient();

  const sendMessage = async (content: string) => {
    // 重复的业务逻辑...
    addMessage(userMessage);
    const response = await apiClient.post('/chat', { content });
    addMessage(response);
  };

  return <div>...</div>;
}
```

**After**:
```tsx
function ChatInterface() {
  const { messages, sendMessage } = useMessages();  // 封装好的业务逻辑

  return <div>...</div>;
}
```

---

## 6. 统一导出 (src/hooks/index.ts)

```typescript
// src/hooks/index.ts

// ============================================================================
// Layer 1: Utility Hooks
// ============================================================================
export * from './utility';

// ============================================================================
// Layer 2: Infrastructure Hooks
// ============================================================================
export * from './infrastructure';

// ============================================================================
// Layer 3: Business Hooks
// ============================================================================
export * from './business/dialog';
export * from './business/workflow';
export * from './business/document';

// ============================================================================
// Layer 4: Composite Hooks
// ============================================================================
export * from './composite';
```

**使用方式**:
```typescript
// 统一从 @/hooks 导入
import {
  useDebounce,        // Utility
  useSSE,             // Infrastructure
  useSession,         // Infrastructure
  useMessages,        // Business
  useWorkflowStages,  // Business
  useChat,            // Composite
} from '@/hooks';
```

---

## 7. 文档和示例

### 7.1 Storybook 集成 (可选)

为每个 hook 创建 Storybook 文档和交互示例：

```typescript
// src/hooks/utility/useDebounce.stories.tsx

export default {
  title: 'Hooks/Utility/useDebounce',
  component: DebounceExample,
};

function DebounceExample() {
  const [input, setInput] = useState('');
  const debouncedInput = useDebounce(input, 500);

  return (
    <div>
      <input value={input} onChange={(e) => setInput(e.target.value)} />
      <p>实时值: {input}</p>
      <p>防抖值: {debouncedInput}</p>
    </div>
  );
}
```

### 7.2 单元测试

为每个 hook 编写单元测试：

```typescript
// src/hooks/utility/useDebounce.test.ts

import { renderHook, act } from '@testing-library/react';
import { useDebounce } from './useDebounce';

describe('useDebounce', () => {
  it('should debounce value', async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );

    expect(result.current).toBe('initial');

    // Update value
    rerender({ value: 'updated', delay: 500 });

    // Value should not change immediately
    expect(result.current).toBe('initial');

    // Wait for debounce delay
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 600));
    });

    // Value should update after delay
    expect(result.current).toBe('updated');
  });
});
```

---

## 8. 总结

### 8.1 优化成果

| 维度 | 优化前 | 优化后 |
|------|--------|--------|
| **Hooks 数量** | 3 个 | 20+ 个 (分 4 层) |
| **目录结构** | 平铺 | 分层 (4 层) |
| **职责分离** | 混杂 | 清晰 |
| **可复用性** | 低 | 高 (分层设计) |
| **可测试性** | 一般 | 优秀 (单一职责) |
| **文档完善度** | 无 | 完善 (规范 + 示例) |

### 8.2 核心改进

1. **分层架构**: 4 层清晰职责（工具 → 基础设施 → 业务 → 组合）
2. **目录组织**: 按层级和领域分组，易于发现和维护
3. **统一导出**: 通过 `@/hooks` 统一导入所有 hooks
4. **使用规范**: 命名、依赖、返回值、性能优化规范
5. **文档完善**: Storybook + 单元测试 + 使用示例

### 8.3 未来扩展

- **Hooks 库发布**: 将通用 hooks 发布为独立 npm 包 `@ai-workflow/hooks`
- **Headless 模式**: 提供完全自定义 UI 的 hook (`useAIWorkflow`)
- **插件化**: 支持通过 hooks 扩展功能（如 `useFeishuIntegration`）

---

**文档版本**: 1.0
**最后更新**: 2025-10-29
**作者**: Claude Code + Human
