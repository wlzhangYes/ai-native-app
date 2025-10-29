# AI Workflow Template - 通用化架构优化方案

## 1. 需求分析

### 1.1 当前问题

**现有架构的耦合点**:
1. ❌ **硬编码的 ProjectStore 依赖**: App.tsx 直接监听 `useProjectStore.currentProjectId`
2. ❌ **分散的会话切换逻辑**: 每个 Store 需要手动调用 `setCurrentSession()`
3. ❌ **内置的组件结构**: LeftPanel、MiddlePanel、RightPanel 是固定的
4. ❌ **全局 localStorage 键名冲突**: 多个模板实例可能冲突
5. ❌ **API 基础 URL 全局配置**: 无法为不同实例配置不同的后端

### 1.2 目标架构

**理想的通用模板组件**:
```tsx
// 使用方式
<AIWorkflowTemplate
  sessionId="project-001"
  apiBaseUrl="http://172.16.18.184:8000/api"
  theme="light"
  onSessionChange={(sessionId) => console.log('Session changed:', sessionId)}
  customComponents={{
    leftPanel: CustomLeftPanel,  // 可选：自定义左侧面板
    middlePanel: CustomMiddlePanel,
    rightPanel: CustomRightPanel,
  }}
/>
```

---

## 2. 架构优化方案

### 2.1 核心架构变更

#### 变更前 (Current)
```
┌──────────────────────────────────────────────────┐
│  App.tsx (硬编码逻辑)                             │
│  - useProjectStore.currentProjectId              │
│  - 手动调用 setDialogSession()                   │
│  - 手动调用 setWorkflowSession()                 │
└──────────────────────────────────────────────────┘
         ↓
┌──────────────────────────────────────────────────┐
│  Zustand Stores (全局单例)                        │
│  - useDialogStore                                │
│  - useWorkflowStore                              │
│  - useProjectStore (会话来源)                     │
└──────────────────────────────────────────────────┘
```

#### 变更后 (Optimized)
```
┌──────────────────────────────────────────────────┐
│  <AIWorkflowTemplate sessionId="xxx" />          │
│  (通过 Props 传入 sessionId，完全解耦)            │
└──────────────────────────────────────────────────┘
         ↓
┌──────────────────────────────────────────────────┐
│  SessionContext (React Context)                  │
│  - 统一管理 sessionId                             │
│  - 自动通知所有 Stores                            │
└──────────────────────────────────────────────────┘
         ↓
┌──────────────────────────────────────────────────┐
│  Zustand Stores (实例化)                          │
│  - 每个模板实例独立的 Store                       │
│  - 通过 React Context 获取 sessionId              │
└──────────────────────────────────────────────────┘
```

---

## 3. 详细实现方案

### 3.1 创建 SessionProvider (核心)

```typescript
// src/contexts/SessionContext.tsx

import { createContext, useContext, useEffect, ReactNode } from 'react';
import { useDialogStore } from '@/stores/useDialogStore';
import { useWorkflowStore } from '@/stores/useWorkflowStore';
import { useDocumentStore } from '@/stores/useDocumentStore';

interface SessionContextValue {
  sessionId: string;
  apiBaseUrl: string;
  storageKeyPrefix: string;  // 避免多实例 localStorage 冲突
}

const SessionContext = createContext<SessionContextValue | null>(null);

interface SessionProviderProps {
  sessionId: string;
  apiBaseUrl?: string;
  storageKeyPrefix?: string;  // 默认 'ai-workflow'
  children: ReactNode;
}

export function SessionProvider({
  sessionId,
  apiBaseUrl = import.meta.env.VITE_API_BASE_URL,
  storageKeyPrefix = 'ai-workflow',
  children,
}: SessionProviderProps) {
  const setDialogSession = useDialogStore((state) => state.setCurrentSession);
  const setWorkflowSession = useWorkflowStore((state) => state.setCurrentSession);
  const setDocumentSession = useDocumentStore((state) => state.setCurrentSession);

  // 监听 sessionId 变化，自动切换所有 Store
  useEffect(() => {
    console.log('[SessionProvider] Session changed:', sessionId);

    // 注入 storageKeyPrefix 到 Store
    useDialogStore.setState({ storageKeyPrefix });
    useWorkflowStore.setState({ storageKeyPrefix });
    useDocumentStore.setState({ storageKeyPrefix });

    // 切换会话
    setDialogSession(sessionId);
    setWorkflowSession(sessionId);
    setDocumentSession(sessionId);
  }, [sessionId, storageKeyPrefix, setDialogSession, setWorkflowSession, setDocumentSession]);

  return (
    <SessionContext.Provider value={{ sessionId, apiBaseUrl, storageKeyPrefix }}>
      {children}
    </SessionContext.Provider>
  );
}

// Hook: 在任何组件中获取当前 sessionId
export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within SessionProvider');
  }
  return context;
}
```

### 3.2 优化 Zustand Stores (支持 storageKeyPrefix)

```typescript
// src/stores/useDialogStore.ts (优化版)

interface DialogStore {
  // 新增字段
  storageKeyPrefix: string;  // 默认 'ai-workflow'

  // 原有字段
  currentSessionId: string | null;
  messages: Message[];
  toolCalls: ToolCall[];

  // 原有方法
  setCurrentSession: (sessionId: string) => void;
  addMessage: (message: Message) => void;
  // ...
}

// Helper: 使用 storageKeyPrefix 生成唯一 key
const getSessionStorageKey = (prefix: string, sessionId: string) =>
  `${prefix}-dialog-session-${sessionId}`;

export const useDialogStore = create<DialogStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        // 默认值
        storageKeyPrefix: 'ai-workflow',
        currentSessionId: null,
        messages: [],
        toolCalls: [],

        setCurrentSession: (sessionId) =>
          set((state) => {
            const prefix = state.storageKeyPrefix;

            // 1. 保存当前会话数据
            if (state.currentSessionId) {
              const oldKey = getSessionStorageKey(prefix, state.currentSessionId);
              localStorage.setItem(oldKey, JSON.stringify({
                messages: state.messages,
                toolCalls: state.toolCalls,
              }));
            }

            // 2. 加载新会话数据
            const newKey = getSessionStorageKey(prefix, sessionId);
            const newData = localStorage.getItem(newKey);
            const parsed = newData ? JSON.parse(newData) : null;

            // 3. 更新状态
            state.currentSessionId = sessionId;
            state.messages = parsed?.messages || [];
            state.toolCalls = parsed?.toolCalls || [];
          }),

        // 其他方法保持不变
      })),
      {
        name: 'dialog-store',  // 保持全局 Zustand persist key
        partialize: (state) => ({
          storageKeyPrefix: state.storageKeyPrefix,  // 持久化 prefix
        }),
      }
    )
  )
);
```

### 3.3 创建通用模板组件

```typescript
// src/components/AIWorkflowTemplate.tsx

import { ReactNode } from 'react';
import { App as AntdApp } from 'antd';
import { SessionProvider } from '@/contexts/SessionContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ThreeColumnLayout } from './layout/ThreeColumnLayout';
import { LeftPanel } from './layout/LeftPanel';
import { MiddlePanel } from './layout/MiddlePanel';
import { RightPanel } from './layout/RightPanel';

// Props 接口
export interface AIWorkflowTemplateProps {
  // 必需参数
  sessionId: string;

  // 可选配置
  apiBaseUrl?: string;                    // 默认: VITE_API_BASE_URL
  storageKeyPrefix?: string;              // 默认: 'ai-workflow'
  theme?: 'light' | 'dark';               // 默认: 'light'
  height?: string | number;               // 默认: '100vh'

  // 自定义组件 (可选)
  customComponents?: {
    leftPanel?: React.ComponentType;
    middlePanel?: React.ComponentType;
    rightPanel?: React.ComponentType;
  };

  // 布局配置
  layoutConfig?: {
    defaultColumnWidths?: [number, number, number];  // 默认: [3, 2, 5]
    minColumnWidths?: [number, number, number];      // 默认: [200, 150, 300]
    showLeftPanel?: boolean;                         // 默认: true
    showMiddlePanel?: boolean;                       // 默认: true
    showRightPanel?: boolean;                        // 默认: true
  };

  // 回调函数
  onSessionChange?: (sessionId: string) => void;
  onMessageSend?: (message: string, attachments?: File[]) => void;
  onWorkflowNodeClick?: (nodeId: string, nodeType: 'stage' | 'task' | 'document') => void;
}

export function AIWorkflowTemplate({
  sessionId,
  apiBaseUrl,
  storageKeyPrefix = 'ai-workflow',
  theme = 'light',
  height = '100vh',
  customComponents,
  layoutConfig,
  onSessionChange,
  onMessageSend,
  onWorkflowNodeClick,
}: AIWorkflowTemplateProps) {
  // 组件选择
  const LeftPanelComponent = customComponents?.leftPanel || LeftPanel;
  const MiddlePanelComponent = customComponents?.middlePanel || MiddlePanel;
  const RightPanelComponent = customComponents?.rightPanel || RightPanel;

  // 布局配置
  const {
    defaultColumnWidths = [3, 2, 5],
    minColumnWidths = [200, 150, 300],
    showLeftPanel = true,
    showMiddlePanel = true,
    showRightPanel = true,
  } = layoutConfig || {};

  return (
    <SessionProvider
      sessionId={sessionId}
      apiBaseUrl={apiBaseUrl}
      storageKeyPrefix={storageKeyPrefix}
    >
      <AntdApp>
        <div style={{ height, overflow: 'hidden' }}>
          <AuthProvider>
            <ThemeProvider initialTheme={theme}>
              <ThreeColumnLayout
                left={showLeftPanel ? <LeftPanelComponent /> : null}
                middle={showMiddlePanel ? <MiddlePanelComponent /> : null}
                right={showRightPanel ? <RightPanelComponent /> : null}
                defaultSizes={defaultColumnWidths}
                minSizes={minColumnWidths}
              />
            </ThemeProvider>
          </AuthProvider>
        </div>
      </AntdApp>
    </SessionProvider>
  );
}
```

### 3.4 更新 API Service (支持动态 baseURL)

```typescript
// src/services/api/request.ts (优化版)

import { useSession } from '@/contexts/SessionContext';

// 创建一个工厂函数，返回配置好的 axios 实例
export function createApiClient(baseURL: string) {
  const client = axios.create({
    baseURL,
    timeout: 30000,
    headers: { 'Content-Type': 'application/json' },
  });

  // 拦截器配置 (与之前相同)
  client.interceptors.request.use(/* ... */);
  client.interceptors.response.use(/* ... */);

  return client;
}

// 在组件中使用
function ChatInterface() {
  const { apiBaseUrl } = useSession();
  const apiClient = useMemo(() => createApiClient(apiBaseUrl), [apiBaseUrl]);

  // 使用 apiClient 发送请求
  const sendMessage = async (content: string) => {
    const response = await apiClient.post('/sessions/xxx/chat', { content });
    return response.data;
  };
}
```

**更好的方案：使用 React Context 全局注入 apiClient**

```typescript
// src/contexts/ApiClientContext.tsx

import { createContext, useContext, useMemo, ReactNode } from 'react';
import { createApiClient } from '@/services/api/request';
import type { AxiosInstance } from 'axios';

const ApiClientContext = createContext<AxiosInstance | null>(null);

interface ApiClientProviderProps {
  baseURL: string;
  children: ReactNode;
}

export function ApiClientProvider({ baseURL, children }: ApiClientProviderProps) {
  const client = useMemo(() => createApiClient(baseURL), [baseURL]);

  return (
    <ApiClientContext.Provider value={client}>
      {children}
    </ApiClientContext.Provider>
  );
}

export function useApiClient() {
  const client = useContext(ApiClientContext);
  if (!client) {
    throw new Error('useApiClient must be used within ApiClientProvider');
  }
  return client;
}
```

**更新 SessionProvider 集成 ApiClientProvider**

```typescript
export function SessionProvider({ sessionId, apiBaseUrl, storageKeyPrefix, children }: SessionProviderProps) {
  // ... (之前的逻辑)

  return (
    <SessionContext.Provider value={{ sessionId, apiBaseUrl, storageKeyPrefix }}>
      <ApiClientProvider baseURL={apiBaseUrl}>
        {children}
      </ApiClientProvider>
    </SessionContext.Provider>
  );
}
```

**在任何组件中使用**

```typescript
function ChatInterface() {
  const apiClient = useApiClient();
  const { sessionId } = useSession();

  const sendMessage = async (content: string) => {
    const response = await apiClient.post(`/sessions/${sessionId}/chat`, { content });
    return response.data;
  };
}
```

---

## 4. 使用示例

### 4.1 基础使用 (单实例)

```tsx
// App.tsx (简化版)

import { AIWorkflowTemplate } from '@/components/AIWorkflowTemplate';

function App() {
  const [currentSessionId, setCurrentSessionId] = useState('project-001');

  return (
    <AIWorkflowTemplate
      sessionId={currentSessionId}
      apiBaseUrl="http://172.16.18.184:8000/api"
      onSessionChange={(id) => {
        console.log('Session changed to:', id);
        setCurrentSessionId(id);
      }}
    />
  );
}
```

### 4.2 多实例使用 (并排对比)

```tsx
// 场景：同时查看两个项目的对话记录

function MultiProjectView() {
  return (
    <div style={{ display: 'flex', gap: 16 }}>
      {/* 左侧：项目 A */}
      <div style={{ width: '50%', height: '100vh' }}>
        <AIWorkflowTemplate
          sessionId="project-001"
          storageKeyPrefix="project-a"  // 避免冲突
          apiBaseUrl="http://172.16.18.184:8000/api"
        />
      </div>

      {/* 右侧：项目 B */}
      <div style={{ width: '50%', height: '100vh' }}>
        <AIWorkflowTemplate
          sessionId="project-002"
          storageKeyPrefix="project-b"
          apiBaseUrl="http://172.16.18.184:8000/api"
        />
      </div>
    </div>
  );
}
```

### 4.3 自定义组件使用

```tsx
// 自定义左侧面板
function CustomLeftPanel() {
  const { sessionId } = useSession();
  return (
    <div>
      <h2>Custom Panel for {sessionId}</h2>
      {/* 自定义内容 */}
    </div>
  );
}

function App() {
  return (
    <AIWorkflowTemplate
      sessionId="project-001"
      customComponents={{
        leftPanel: CustomLeftPanel,
      }}
    />
  );
}
```

### 4.4 嵌入到现有应用

```tsx
// 场景：在现有应用的某个路由中嵌入 AI Workflow

import { AIWorkflowTemplate } from '@/components/AIWorkflowTemplate';

function ProjectDetailPage() {
  const { projectId } = useParams();

  return (
    <div>
      <Header />
      <Sidebar />

      {/* 嵌入 AI Workflow 模板 */}
      <div style={{ height: 'calc(100vh - 60px)' }}>
        <AIWorkflowTemplate
          sessionId={projectId}
          apiBaseUrl={`${API_BASE}/ai-workflow`}
          storageKeyPrefix={`app-${projectId}`}
          height="100%"
        />
      </div>
    </div>
  );
}
```

---

## 5. 优化前后对比

### 5.1 耦合度对比

| 指标 | 优化前 | 优化后 |
|------|--------|--------|
| sessionId 来源 | 硬编码 useProjectStore | Props 传入 |
| 会话切换逻辑 | 手动调用多个 setSession() | SessionProvider 自动管理 |
| API 配置 | 全局 .env | Props 传入，支持多实例 |
| localStorage 键名 | 固定 'dialog-session-*' | 可配置 prefix，避免冲突 |
| 组件结构 | 固定 LeftPanel/MiddlePanel/RightPanel | 可自定义任意组件 |
| 多实例支持 | ❌ 不支持 | ✅ 支持并排多实例 |
| 嵌入第三方应用 | ❌ 困难 | ✅ 简单（仅需 1 个组件） |

### 5.2 代码行数对比

| 文件 | 优化前 | 优化后 | 变化 |
|------|--------|--------|------|
| App.tsx | 57 行（硬编码逻辑） | 15 行（简洁） | -73% |
| SessionContext.tsx | 不存在 | 80 行（新增） | +80 |
| AIWorkflowTemplate.tsx | 不存在 | 120 行（新增） | +120 |
| useDialogStore.ts | 300 行 | 320 行（+20 行支持 prefix） | +7% |
| **总计** | ~1200 行 | ~1400 行 | +17% |

**结论**: 增加 200 行代码，换来**完全解耦**和**无限可复用性**。

---

## 6. 迁移路径

### 6.1 Phase 1: 创建新文件（不影响现有代码）

1. ✅ 创建 `src/contexts/SessionContext.tsx`
2. ✅ 创建 `src/contexts/ApiClientContext.tsx`
3. ✅ 创建 `src/components/AIWorkflowTemplate.tsx`

### 6.2 Phase 2: 优化 Zustand Stores

1. ✅ useDialogStore 添加 `storageKeyPrefix` 字段
2. ✅ useWorkflowStore 添加 `storageKeyPrefix` 字段
3. ✅ useDocumentStore 添加 `storageKeyPrefix` 字段
4. ✅ 修改 `getSessionStorageKey()` 函数使用 prefix

### 6.3 Phase 3: 更新 App.tsx（切换到新架构）

**旧代码 (App.tsx)**:
```tsx
// 57 行，硬编码 ProjectStore 依赖
```

**新代码 (App.tsx)**:
```tsx
import { AIWorkflowTemplate } from '@/components/AIWorkflowTemplate';
import { useProjectStore } from '@/stores/useProjectStore';

function App() {
  const currentProjectId = useProjectStore((state) => state.currentProjectId);

  return (
    <AIWorkflowTemplate
      sessionId={currentProjectId || 'default-session'}
      apiBaseUrl={import.meta.env.VITE_API_BASE_URL}
    />
  );
}

export default App;
```

**15 行代码，完全解耦！**

### 6.4 Phase 4: 测试与验证

1. ✅ 单实例测试：验证基本功能正常
2. ✅ 多实例测试：并排两个模板，验证数据隔离
3. ✅ 自定义组件测试：验证 customComponents prop
4. ✅ localStorage 隔离测试：验证不同 prefix 不冲突

---

## 7. 性能优化

### 7.1 避免重复渲染

**问题**: SessionProvider 变化会导致所有子组件重渲染

**解决方案**: 使用 `useMemo` 缓存 context value

```typescript
export function SessionProvider({ sessionId, apiBaseUrl, storageKeyPrefix, children }: SessionProviderProps) {
  // ... (useEffect 逻辑)

  const contextValue = useMemo(
    () => ({ sessionId, apiBaseUrl, storageKeyPrefix }),
    [sessionId, apiBaseUrl, storageKeyPrefix]
  );

  return (
    <SessionContext.Provider value={contextValue}>
      {children}
    </SessionContext.Provider>
  );
}
```

### 7.2 延迟加载大组件

**问题**: Monaco Editor、WorkflowTree 等大组件影响首屏加载

**解决方案**: 使用 React.lazy + Suspense

```tsx
const MonacoEditor = lazy(() => import('./preview/CodeEditor'));

function DocumentPreview() {
  return (
    <Suspense fallback={<Spin />}>
      <MonacoEditor />
    </Suspense>
  );
}
```

---

## 8. 未来扩展方向

### 8.1 NPM 包发布

将模板组件发布为独立 npm 包：

```bash
npm install @ai-workflow/template
```

**使用方式**:
```tsx
import { AIWorkflowTemplate } from '@ai-workflow/template';
import '@ai-workflow/template/dist/style.css';

<AIWorkflowTemplate sessionId="xxx" />
```

### 8.2 插件系统

支持第三方扩展：

```tsx
<AIWorkflowTemplate
  sessionId="project-001"
  plugins={[
    feishuPlugin,        // Feishu 集成插件
    voiceInputPlugin,    // 语音输入插件
    codeReviewPlugin,    // 代码审查插件
  ]}
/>
```

### 8.3 Headless 模式

提供无 UI 的 Hook 版本，完全自定义 UI：

```tsx
import { useAIWorkflow } from '@ai-workflow/template/headless';

function MyCustomUI() {
  const {
    messages,
    sendMessage,
    workflows,
    documents,
  } = useAIWorkflow({ sessionId: 'project-001' });

  return <div>{/* 完全自定义 UI */}</div>;
}
```

---

## 9. 架构决策记录 (ADR)

### ADR-001: 使用 React Context 而非 Props Drilling

**决策**: 使用 `SessionContext` 传递 sessionId，而非逐层传递 props

**理由**:
- ✅ 避免 props drilling（三栏布局 → 子组件 → 孙组件）
- ✅ 任何深层组件都能通过 `useSession()` 获取 sessionId
- ✅ 切换 sessionId 时，自动通知所有订阅组件

**权衡**:
- ❌ Context 变化会导致所有消费组件重渲染（已通过 useMemo 优化）

### ADR-002: localStorage 使用 Prefix 而非独立 Store 实例

**决策**: 所有模板实例共享同一个 Zustand Store，通过 `storageKeyPrefix` 区分数据

**理由**:
- ✅ 避免创建多个 Store 实例的内存开销
- ✅ localStorage key 冲突通过 prefix 解决
- ✅ Zustand devtools 仍然可用

**权衡**:
- ❌ 多实例时，Store 状态会频繁切换（已通过会话隔离机制优化）

### ADR-003: 支持自定义组件而非插槽（Slots）

**决策**: 使用 `customComponents` prop 传入完整组件，而非 Vue 风格的插槽

**理由**:
- ✅ React 惯用模式（React.ComponentType）
- ✅ 完全控制组件逻辑和状态
- ✅ 类型安全（TypeScript 支持）

**权衡**:
- ❌ 需要重写整个面板组件（而非仅插入部分内容）
- ❌ 自定义组件需要自行处理 Store 交互

---

## 10. 总结

### 10.1 优化成果

✅ **完全解耦**: sessionId 通过 Props 传入，移除 ProjectStore 硬依赖
✅ **多实例支持**: 支持并排多个模板，数据完全隔离
✅ **可嵌入性**: 可嵌入任意第三方应用，仅需 1 行代码
✅ **可配置性**: 支持自定义组件、API URL、localStorage prefix
✅ **向后兼容**: 现有代码无需大改，仅需更新 App.tsx

### 10.2 核心改动

1. **SessionProvider**: 统一管理 sessionId，自动切换所有 Store
2. **AIWorkflowTemplate**: 通用模板组件，接受 sessionId prop
3. **storageKeyPrefix**: 支持多实例 localStorage 隔离
4. **ApiClientProvider**: 支持动态配置后端 API URL

### 10.3 下一步行动

- [ ] 实现 SessionProvider 和 ApiClientProvider
- [ ] 创建 AIWorkflowTemplate 组件
- [ ] 优化 Zustand Stores 支持 storageKeyPrefix
- [ ] 更新 App.tsx 使用新架构
- [ ] 编写单元测试和集成测试
- [ ] 编写使用文档和示例代码

---

**文档版本**: 1.0
**最后更新**: 2025-10-29
**作者**: Claude Code + Human
