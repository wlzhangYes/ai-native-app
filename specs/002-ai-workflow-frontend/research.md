# Phase 0: Technical Research

**Feature**: AI-Driven Workflow Execution Frontend
**Date**: 2025-10-25
**Status**: Complete

本文档记录了项目技术选型的研究过程和决策依据，解决 plan.md 中所有标记为 "NEEDS CLARIFICATION" 的技术问题。

---

## 1. Request.js 封装最佳实践

### Decision
使用 **Axios 拦截器模式** 封装统一的 HTTP 请求处理，包含请求/响应拦截、错误分类处理、自动重试、取消请求和 loading 状态管理。

### Rationale
1. **拦截器架构**：Axios 的拦截器机制允许在请求发出前和响应返回后统一处理逻辑（如添加 token、错误处理、logging）
2. **错误分类处理**：
   - **4xx 错误**：客户端错误（401 未授权 → 跳转登录，403 无权限 → 提示权限不足，404 资源不存在 → 提示资源未找到）
   - **5xx 错误**：服务端错误（500/502/503 → 提示服务器异常，建议稍后重试）
   - **网络错误**：`ERR_NETWORK` → 检测网络连接，提示用户检查网络
   - **超时错误**：`ECONNABORTED` → 提示请求超时，建议重试
3. **请求取消**：使用 `AbortController` API（Axios 0.22+ 支持）实现请求取消，防止组件卸载后继续处理响应
4. **Token 管理**：
   - IAM token 从 httpOnly cookie 自动发送（无需手动添加）
   - 401 响应触发 token 刷新逻辑（调用 `/auth/refresh` 接口）
   - 刷新失败则清除 session 并重定向到登录页
5. **Loading 状态**：通过 Zustand store 管理全局 loading 状态，请求拦截器自动更新

### Implementation Pattern
```typescript
// services/api/request.ts
import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { message } from 'antd';
import { useLoadingStore } from '@/stores/useLoadingStore';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 30000,
  withCredentials: true, // 发送 httpOnly cookies
});

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    useLoadingStore.getState().setLoading(true);
    return config;
  },
  (error) => {
    useLoadingStore.getState().setLoading(false);
    return Promise.reject(error);
  }
);

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => {
    useLoadingStore.getState().setLoading(false);
    return response.data;
  },
  async (error: AxiosError) => {
    useLoadingStore.getState().setLoading(false);

    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 401:
          // 尝试刷新 token
          const refreshed = await refreshToken();
          if (refreshed) {
            // 重试原请求
            return apiClient.request(error.config!);
          }
          // 刷新失败，跳转登录
          window.location.href = '/login';
          break;
        case 403:
          message.error('您没有权限访问此资源');
          break;
        case 404:
          message.error('请求的资源不存在');
          break;
        case 500:
        case 502:
        case 503:
          message.error('服务器异常，请稍后重试');
          break;
        default:
          message.error(data?.message || '请求失败');
      }
    } else if (error.code === 'ECONNABORTED') {
      message.error('请求超时，请重试');
    } else if (error.message === 'Network Error') {
      message.error('网络连接失败，请检查网络');
    }

    return Promise.reject(error);
  }
);

export default apiClient;
```

### Alternatives Considered
- **Fetch API**: 原生但缺少拦截器、自动 JSON 解析、超时配置等高级特性，需手动实现
- **ky**: 现代轻量级 HTTP 客户端，但社区规模较小，文档和示例不如 Axios 丰富
- **Rejected Reason**: Axios 生态成熟，与 React 和 TypeScript 集成良好，团队熟悉度高

---

## 2. SSE 流式响应处理

### Decision
使用 **原生 EventSource API** 处理 SSE 连接，配合自定义 `useSSE` Hook 实现连接管理、断线重连（指数退避）和事件解析。

### Rationale
1. **原生 API 优势**：
   - 浏览器原生支持，无需额外依赖
   - 自动处理连接保持和重连
   - 标准化的事件流解析
2. **断线重连策略**：
   - 初始重连延迟：1秒
   - 指数退避：每次失败后延迟 × 2（最大 30秒）
   - 最大重连次数：10次（超过后提示用户手动刷新）
3. **内存泄漏防护**：
   - useEffect cleanup 中关闭 EventSource 连接
   - 组件卸载时清理事件监听器
   - 使用 `AbortController` 取消相关异步操作

### Implementation Pattern
```typescript
// hooks/useSSE.ts
import { useEffect, useState, useRef } from 'react';

interface UseSSEOptions {
  url: string;
  onMessage: (data: any) => void;
  onError?: (error: Event) => void;
  maxRetries?: number;
}

export function useSSE({ url, onMessage, onError, maxRetries = 10 }: UseSSEOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const eventSourceRef = useRef<EventSource | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    function connect() {
      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setIsConnected(true);
        setRetryCount(0); // 重置重试计数
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage(data);
        } catch (error) {
          console.error('SSE message parse error:', error);
        }
      };

      eventSource.onerror = (event) => {
        setIsConnected(false);
        eventSource.close();

        onError?.(event);

        // 指数退避重连
        if (retryCount < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);
          retryTimeoutRef.current = setTimeout(() => {
            setRetryCount((prev) => prev + 1);
            connect();
          }, delay);
        } else {
          console.error('SSE max retries exceeded');
        }
      };
    }

    connect();

    return () => {
      eventSourceRef.current?.close();
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [url, maxRetries]);

  return { isConnected, retryCount };
}
```

### MSW Mock for SSE
```typescript
// mocks/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/ai/stream', () => {
    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        let index = 0;
        const messages = ['Hello', ' ', 'world', '!'];

        const interval = setInterval(() => {
          if (index < messages.length) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: messages[index] })}\n\n`));
            index++;
          } else {
            controller.close();
            clearInterval(interval);
          }
        }, 100);
      },
    });

    return new HttpResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  }),
];
```

### Alternatives Considered
- **eventsource-parser**: 第三方解析库，但浏览器原生 EventSource 已足够强大
- **WebSocket**: 双向通信协议，但本项目仅需单向流式传输（服务器 → 客户端），SSE 更简单
- **Rejected Reason**: EventSource 原生支持重连，API 简洁，符合项目需求

---

## 3. Mock Service Worker (MSW) 集成

### Decision
使用 **MSW 2.x** 在浏览器 Service Worker 层拦截 API 请求，返回 mock 数据。支持开发环境和测试环境，能模拟网络延迟、错误场景和 SSE 流式响应。

### Rationale
1. **浏览器层拦截**：MSW 使用 Service Worker 拦截网络请求，无需修改业务代码，前端代码与真实 API 调用一致
2. **开发/测试双模式**：
   - 开发环境：在 `main.tsx` 中启动 MSW worker
   - 测试环境：在 `vitest.setup.ts` 中启动 MSW server
3. **场景模拟**：
   - **网络延迟**：使用 `ctx.delay()` 模拟慢速网络
   - **错误场景**：返回 4xx/5xx 响应测试错误处理
   - **SSE 流式**：使用 `ReadableStream` 模拟流式响应
4. **Mock 数据组织**：
   - 按业务模块分类（projects, workflows, documents, conversations）
   - 使用工厂函数生成可复用的 mock 数据
   - 支持状态管理（如模拟 CRUD 操作后的数据变化）

### Implementation Pattern
```typescript
// mocks/server.ts
import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

export const worker = setupWorker(...handlers);

// main.tsx
if (import.meta.env.DEV) {
  const { worker } = await import('./mocks/server');
  worker.start();
}

// mocks/handlers.ts
import { http, HttpResponse, delay } from 'msw';
import { projects } from './data/projects';

export const handlers = [
  http.get('/api/projects', async () => {
    await delay(200); // 模拟网络延迟
    return HttpResponse.json(projects);
  }),

  http.post('/api/projects', async ({ request }) => {
    const body = await request.json();
    // 模拟创建项目
    return HttpResponse.json({ id: 'proj-123', ...body }, { status: 201 });
  }),

  // 错误场景
  http.get('/api/projects/:id', ({ params }) => {
    const { id } = params;
    const project = projects.find((p) => p.id === id);
    if (!project) {
      return HttpResponse.json({ message: 'Project not found' }, { status: 404 });
    }
    return HttpResponse.json(project);
  }),
];
```

### Alternatives Considered
- **JSON Server**: 需要单独运行后端进程，增加开发复杂度
- **Mirage JS**: 功能强大但学习曲线陡峭，配置繁琐
- **Rejected Reason**: MSW 设计理念先进（网络层拦截），对业务代码零侵入，配置简洁

---

## 4. IndexedDB vs LocalStorage 选择

### Decision
- **IndexedDB**：存储对话历史、文档内容、工作流状态（大容量结构化数据）
- **LocalStorage**：存储用户偏好（列宽、主题、语言）和短期缓存（小容量键值对）

### Rationale
1. **容量对比**：
   - LocalStorage：5-10MB（浏览器限制）
   - IndexedDB：50MB-250MB+（浏览器依赖，可申请更多配额）
2. **性能对比**：
   - LocalStorage：同步 API，阻塞主线程，不适合大数据
   - IndexedDB：异步 API，支持索引和事务，适合复杂查询
3. **数据类型**：
   - LocalStorage：仅支持字符串（需 JSON.stringify/parse）
   - IndexedDB：支持结构化对象、Blob、ArrayBuffer
4. **使用场景**：
   - 对话历史：500+ 条消息，需要分页查询 → IndexedDB
   - 文档内容：Markdown 文本（可能 >10KB）→ IndexedDB
   - 用户偏好：列宽、主题设置（<1KB）→ LocalStorage

### IndexedDB Schema Design
```typescript
// services/storage/indexeddb.ts
import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface WorkflowDB extends DBSchema {
  projects: {
    key: string;
    value: {
      id: string;
      name: string;
      createdAt: string;
      updatedAt: string;
      currentStage: number;
    };
    indexes: { 'by-updated': string };
  };
  conversations: {
    key: string;
    value: {
      id: string;
      projectId: string;
      sender: 'user' | 'ai';
      message: string;
      timestamp: string;
    };
    indexes: { 'by-project': string; 'by-timestamp': string };
  };
  documents: {
    key: string;
    value: {
      id: string;
      projectId: string;
      stageId: number;
      content: string;
      version: number;
      createdAt: string;
      updatedAt: string;
    };
    indexes: { 'by-project': string; 'by-stage': number };
  };
}

const dbPromise = openDB<WorkflowDB>('workflow-db', 1, {
  upgrade(db) {
    // Projects store
    const projectStore = db.createObjectStore('projects', { keyPath: 'id' });
    projectStore.createIndex('by-updated', 'updatedAt');

    // Conversations store
    const convStore = db.createObjectStore('conversations', { keyPath: 'id' });
    convStore.createIndex('by-project', 'projectId');
    convStore.createIndex('by-timestamp', 'timestamp');

    // Documents store
    const docStore = db.createObjectStore('documents', { keyPath: 'id' });
    docStore.createIndex('by-project', 'projectId');
    docStore.createIndex('by-stage', 'stageId');
  },
});

export async function getConversations(projectId: string) {
  const db = await dbPromise;
  return db.getAllFromIndex('conversations', 'by-project', projectId);
}
```

### Data Migration Strategy
- 版本号管理：使用 `openDB` 的 `version` 参数
- 升级处理：在 `upgrade` 回调中执行 schema 变更
- 向后兼容：读取旧版本数据时提供默认值

### Alternatives Considered
- **全部使用 LocalStorage**：容量限制和性能问题无法满足需求
- **全部使用 IndexedDB**：小数据（如用户偏好）使用 IndexedDB 过度工程化
- **Rejected Reason**: 混合方案最优，根据数据特征选择合适的存储方案

---

## 5. Zustand vs Redux 状态管理对比

### Decision
使用 **Zustand** 作为本地状态管理方案，配合 **React Context** 处理全局认证和主题状态。

### Rationale
1. **简洁性**：Zustand API 极简（create + useStore），无需 actions/reducers/dispatch 模板代码
2. **性能**：基于 React 原生 hooks，自动优化渲染，仅订阅的组件重渲染
3. **TypeScript 支持**：类型推断完整，无需额外配置
4. **中间件生态**：
   - `persist`：状态持久化到 LocalStorage/IndexedDB
   - `devtools`：集成 Redux DevTools 进行调试
   - `immer`：不可变数据更新（可选）
5. **适用场景**：
   - **Zustand Store**：模块化的业务状态（dialog, workflow, document, project）
   - **React Context**：应用级全局状态（auth, theme），不频繁变化

### Implementation Pattern
```typescript
// stores/useDialogStore.ts
import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  content: string;
  timestamp: string;
  type: 'input' | 'response' | 'success' | 'error' | 'executing';
}

interface DialogStore {
  messages: Message[];
  isStreaming: boolean;
  addMessage: (message: Message) => void;
  clearMessages: () => void;
  setStreaming: (streaming: boolean) => void;
}

export const useDialogStore = create<DialogStore>()(
  devtools(
    persist(
      (set) => ({
        messages: [],
        isStreaming: false,
        addMessage: (message) =>
          set((state) => ({ messages: [...state.messages, message] })),
        clearMessages: () => set({ messages: [] }),
        setStreaming: (streaming) => set({ isStreaming: streaming }),
      }),
      { name: 'dialog-store' }
    )
  )
);

// 组件中使用
import { useDialogStore } from '@/stores/useDialogStore';

function ChatPanel() {
  const messages = useDialogStore((state) => state.messages);
  const addMessage = useDialogStore((state) => state.addMessage);

  return <MessageList messages={messages} onSend={addMessage} />;
}
```

### Zustand vs Redux Comparison
| 特性 | Zustand | Redux |
|------|---------|-------|
| Boilerplate | 极少 | 大量（actions, reducers, types） |
| TypeScript | 原生支持 | 需要额外配置 |
| 学习曲线 | 平缓 | 陡峭 |
| 包大小 | ~1KB | ~50KB (with toolkit) |
| DevTools | 支持 | 原生支持 |
| 中间件生态 | 精选核心 | 丰富但复杂 |

### When to Use Context vs Zustand
- **Context**：全局单例状态（Auth, Theme），跨应用共享，不频繁变化
- **Zustand**：模块化业务状态（Dialog, Workflow），频繁变化，需要精细控制重渲染

### Alternatives Considered
- **Redux Toolkit**: 功能强大但过度复杂，本项目不需要时间旅行调试和严格的 Flux 架构
- **Jotai**: Atom 模式优雅，但社区规模小于 Zustand，文档和示例较少
- **Rejected Reason**: Zustand 在简洁性、性能和生态之间达到最佳平衡

---

## 6. 虚拟滚动性能优化

### Decision
使用 **react-window** 实现虚拟滚动，配合 **VariableSizeList** 支持动态高度的消息列表和工作流树。

### Rationale
1. **性能提升**：仅渲染可视区域的 DOM 节点，支持 10,000+ 条消息无卡顿
2. **动态高度**：`VariableSizeList` 支持每个 item 不同高度（消息长度不同）
3. **Ant Design Tree 集成**：
   - Ant Design Tree 原生不支持虚拟滚动
   - 自定义 `virtual` prop，使用 `rc-virtual-list` 包装 Tree 节点
   - 仅在节点数 >50 时启用虚拟滚动
4. **滚动到底部/顶部**：
   - 使用 `scrollToItem(index)` 实现滚动到最新消息
   - 使用 `IntersectionObserver` 监听顶部触发"加载更多"

### Implementation Pattern
```typescript
// components/dialog/MessageList.tsx
import { VariableSizeList as List } from 'react-window';
import { useRef, useEffect } from 'react';

interface MessageListProps {
  messages: Message[];
}

function MessageList({ messages }: MessageListProps) {
  const listRef = useRef<List>(null);
  const rowHeights = useRef<number[]>([]);

  function getRowHeight(index: number) {
    return rowHeights.current[index] || 80; // 默认高度 80px
  }

  function setRowHeight(index: number, height: number) {
    rowHeights.current[index] = height;
    listRef.current?.resetAfterIndex(index);
  }

  useEffect(() => {
    // 新消息到达时滚动到底部
    if (listRef.current) {
      listRef.current.scrollToItem(messages.length - 1, 'end');
    }
  }, [messages.length]);

  return (
    <List
      ref={listRef}
      height={800}
      itemCount={messages.length}
      itemSize={getRowHeight}
      width="100%"
    >
      {({ index, style }) => (
        <MessageItem
          message={messages[index]}
          style={style}
          onHeightChange={(height) => setRowHeight(index, height)}
        />
      )}
    </List>
  );
}
```

### Ant Design Tree Virtualization
```typescript
// components/workflow/WorkflowTree.tsx
import { Tree } from 'antd';
import VirtualList from 'rc-virtual-list';

function WorkflowTree({ treeData }) {
  const shouldVirtualize = treeData.length > 50;

  return (
    <Tree
      treeData={treeData}
      virtual={shouldVirtualize}
      height={shouldVirtualize ? 600 : undefined}
    />
  );
}
```

### Alternatives Considered
- **react-virtualized**: react-window 的前身，功能更多但包体积大（~30KB vs ~3KB）
- **自定义虚拟滚动**: 实现复杂，维护成本高，容易出现边界情况 bug
- **Rejected Reason**: react-window 轻量高效，API 简洁，满足项目需求

---

## 7. Markdown 渲染和 Diff 对比

### Decision
- **Markdown 渲染**：react-markdown + remark-gfm
- **Diff 对比**：diff-match-patch (Google)

### Rationale

#### Markdown 渲染
1. **react-markdown**: 基于 unified/remark 生态，安全、可扩展、React 友好
2. **remark-gfm**: 支持 GitHub Flavored Markdown（表格、任务列表、删除线、自动链接）
3. **自定义组件**: 可自定义渲染组件（如代码高亮、图片懒加载）
4. **安全性**: 默认过滤 XSS，不渲染 `<script>` 标签

#### Diff 对比
1. **diff-match-patch**: Google 开源，算法成熟，支持字符级、单词级、行级 diff
2. **输出格式**: 返回 diff 数组（操作类型 + 文本），易于渲染为红绿对比视图
3. **性能**: 对 10,000 字文档 diff 耗时 <100ms

### Implementation Pattern
```typescript
// components/preview/MarkdownRenderer.tsx
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';

interface MarkdownRendererProps {
  content: string;
}

function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code({ node, inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '');
          return !inline && match ? (
            <SyntaxHighlighter language={match[1]} PreTag="div" {...props}>
              {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
          ) : (
            <code className={className} {...props}>
              {children}
            </code>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

// utils/diff.ts
import { diff_match_patch } from 'diff-match-patch';

export function computeDiff(oldText: string, newText: string) {
  const dmp = new diff_match_patch();
  const diffs = dmp.diff_main(oldText, newText);
  dmp.diff_cleanupSemantic(diffs); // 优化 diff 结果
  return diffs;
}

// components/preview/DocumentDiffView.tsx
function DocumentDiffView({ oldContent, newContent }) {
  const diffs = computeDiff(oldContent, newContent);

  return (
    <div className="diff-view">
      {diffs.map(([op, text], index) => (
        <span
          key={index}
          className={
            op === 1 ? 'diff-insert' : op === -1 ? 'diff-delete' : ''
          }
        >
          {text}
        </span>
      ))}
    </div>
  );
}

// CSS
.diff-insert {
  background-color: #d4edda;
  color: #155724;
}
.diff-delete {
  background-color: #f8d7da;
  color: #721c24;
  text-decoration: line-through;
}
```

### GFM Features Supported
- ✅ Tables
- ✅ Task lists
- ✅ Strikethrough
- ✅ Autolinks
- ✅ Footnotes
- ✅ Syntax highlighting (via react-syntax-highlighter)

### Alternatives Considered
- **marked**: 渲染速度快但不是 React 组件，需手动 `dangerouslySetInnerHTML`
- **jsdiff**: diff 库轻量，但 diff-match-patch 算法更优（Myers' diff algorithm）
- **Rejected Reason**: react-markdown 更安全，diff-match-patch 更成熟

---

## Summary: Technology Stack

| 层级 | 技术选型 | 版本 | 用途 |
|------|---------|------|------|
| **框架** | React | 18.x | UI 框架 |
| **语言** | TypeScript | 5.x | 类型安全 |
| **构建工具** | Vite | 5.x | 开发服务器和构建 |
| **状态管理** | Zustand | 4.x | 本地状态 |
| **状态管理** | React Context | - | 全局状态 |
| **UI 组件** | Ant Design | 5.x | 通用组件 |
| **UI 组件** | AIOS-Design | - | 企业组件 |
| **HTTP 客户端** | Axios | 1.6+ | API 请求 |
| **SSE** | EventSource (原生) | - | 流式响应 |
| **API Mock** | MSW | 2.x | 开发/测试 mock |
| **Markdown** | react-markdown | 9.0.1 | Markdown 渲染 |
| **Markdown** | remark-gfm | 4.0.0 | GFM 支持 |
| **虚拟滚动** | react-window | 1.8.10 | 性能优化 |
| **自适应输入** | react-textarea-autosize | 8.5.4 | 文本输入 |
| **Diff 算法** | diff-match-patch | 1.0.5 | 文档对比 |
| **存储** | IndexedDB (idb) | 8.x | 结构化数据 |
| **存储** | LocalStorage | - | 键值对 |
| **测试** | Vitest | 1.x | 单元测试 |
| **测试** | React Testing Library | 14.x | 组件测试 |
| **测试** | Playwright | 1.x | E2E 测试 |

---

## Next Steps

所有技术决策已完成，可以进入 **Phase 1: Design & Contracts**：
1. ✅ 生成 `data-model.md`（前端数据模型和状态结构）
2. ✅ 生成 `contracts/openapi.yaml`（API 契约规范）
3. ✅ 生成 `contracts/sse-events.md`（SSE 事件定义）
4. ✅ 生成 `contracts/mock-data/`（Mock 数据示例）
5. ✅ 生成 `quickstart.md`（开发环境搭建指南）

---

**Status**: ✅ Complete - All technical decisions documented and justified
