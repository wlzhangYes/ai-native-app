# 组件迁移总结 - Claude Agent Service 集成

## ✅ 已完成的组件修改

### 1. ChatInterface 组件 (`src/components/dialog/ChatInterface.tsx`)

#### 主要变更
- **移除**: 旧的 `useSSE` hook
- **移除**: 旧的 SSE 事件类型 (`SSEEvent`)
- **移除**: Task 相关的状态和处理（不再需要）
- **新增**: 使用 `SSEConnection` 类管理连接
- **新增**: 使用 `getChatStreamUrl()` 构建流式 URL
- **新增**: 工具调用状态显示
- **更新**: SSE 事件处理逻辑

####  新的 SSE 事件处理

```typescript
switch (event.type) {
  case 'connected':
    // 连接成功
    break;

  case 'text_delta':
    // 实时文本流式输出
    appendToStreamingMessage(msgId, event.content);
    break;

  case 'content_block_start':
    // 工具调用开始
    setToolCalls([...]);
    break;

  case 'tool_use':
    // 工具调用完成
    break;

  case 'tool_result':
    // 工具执行结果
    break;

  case 'result':
    // 完成消息（包含统计信息）
    break;

  case 'done':
    // 对话结束，关闭连接
    break;

  case 'error':
    // 错误处理
    break;
}
```

#### 新的发送消息流程

```typescript
const handleSend = async (message: string) => {
  // 1. 检查是否有当前项目（Session ID）
  if (!currentProjectId) {
    antdMessage.error('请先选择或创建一个项目');
    return;
  }

  // 2. 添加用户消息和占位 AI 消息
  addMessage(userMessage);
  addMessage(aiMessage);

  // 3. 构建流式对话 URL
  const url = getChatStreamUrl({
    session_id: currentProjectId,
    message: message,
    permission_mode: 'acceptEdits',
  });

  // 4. 创建并连接 SSE
  const connection = new SSEConnection({
    url: url,
    onMessage: handleSSEMessage,
    onError: (error) => { /*...*/ },
    onOpen: () => { /*...*/ },
  });

  connection.connect();
  sseConnectionRef.current = connection;
};
```

#### 工具调用显示

在消息气泡的 footer 中显示工具调用状态：

```tsx
{toolCalls.map((tool) => (
  <Tag
    key={tool.id}
    icon={<ToolOutlined />}
    color={
      tool.status === 'running' ? 'processing' :
      tool.status === 'completed' ? 'success' : 'error'
    }
  >
    {tool.name} - {tool.status === 'running' ? '执行中...' : ...}
  </Tag>
))}
```

---

### 2. DialogStore (`src/stores/useDialogStore.ts`)

#### 状态确认
- ✅ 已有 `appendToStreamingMessage()` 方法
- ✅ 已有 `setStreaming()` 方法
- ✅ 已有 `updateMessage()` 方法
- ✅ 无需修改

---

### 3. ProjectStore (`src/stores/useProjectStore.ts`)

#### 主要变更
- **新增**: Session API 集成
- **新增**: 异步方法获取/创建/删除项目
- **使用**: `mapSessionToProject()` 适配器转换数据

#### 新增的 API 方法

```typescript
// 从后端获取项目列表
fetchProjects: async (params?: {
  skip?: number;
  limit?: number;
  activeOnly?: boolean;
}) => Promise<void>

// 创建新项目（Session）
createNewProject: async (data?: SessionCreateRequest) => Promise<Project | null>

// 删除项目
deleteProjectById: async (projectId: string) => Promise<void>

// 刷新当前项目详情
refreshCurrentProject: async () => Promise<void>
```

#### 使用示例

```typescript
// 组件中使用
const { projects, fetchProjects, createNewProject } = useProjectStore();

// 获取项目列表
useEffect(() => {
  fetchProjects({ activeOnly: true });
}, []);

// 创建新项目
const handleCreate = async () => {
  const project = await createNewProject({
    workspace_name: 'my-project'
  });
  if (project) {
    console.log('Created:', project.id);
  }
};
```

---

### 4. DocumentList (`src/components/document/DocumentList.tsx`)

#### 主要变更
- **移除**: `getDocuments` API (Document API)
- **新增**: `getFiles` API (Files API)
- **新增**: `mapFilesToDocuments` 适配器
- **新增**: 使用 `currentProjectId` (从 ProjectStore)
- **更新**: 本地状态管理 `selectedDocumentId`

#### 新的获取文件流程

```typescript
const currentProjectId = useProjectStore((state) => state.currentProjectId);

useEffect(() => {
  const fetchFiles = async () => {
    if (!currentProjectId) return;

    const response = await getFiles(currentProjectId, '/');

    if (response.data) {
      const docs = mapFilesToDocuments(response.data.files, currentProjectId);
      setDocuments(docs);
    }
  };

  fetchFiles();
}, [currentProjectId]);
```

#### 错误处理更新

```typescript
const errorMsg = typeof response.error === 'string'
  ? response.error
  : response.error?.message || '获取文件列表失败';
message.error(errorMsg);
```

---

### 5. API 服务层

#### session.ts (`src/services/api/session.ts`)
- ✅ 创建所有 Session API
- ✅ 类型定义完整

#### chat.ts (`src/services/api/chat.ts`)
- ✅ 创建所有 Chat API
- ✅ SSE 事件类型定义
- ✅ `getChatStreamUrl()` 函数
- ✅ `startChatStream()` 函数
- ✅ `startChatStreamWithFetch()` 函数

#### files.ts (`src/services/api/files.ts`)
- ✅ 创建所有 Files API
- ✅ 辅助函数（格式化、判断文件类型等）

#### adapters.ts (`src/services/api/adapters.ts`)
- ✅ Session → Project 映射
- ✅ ConversationMessage → Message 映射
- ✅ FileItem → Document 映射
- ✅ 类型导入修复（枚举改为值导入）

#### sse.ts (`src/services/api/sse.ts`)
- ✅ 更新为使用 `ChatStreamEvent`
- ✅ 自动在 `done` 事件后关闭连接

---

## 🔧 修复的 TypeScript 错误

### 1. ChatInterface.tsx
- ✅ 修复 `event.tool` 的类型断言
- ✅ 修复 `event.data` 的类型断言
- ✅ 移除未使用的变量 `isWelcome`

### 2. adapters.ts
- ✅ 修复枚举类型的导入（从 `import type` 改为 `import`）
- ✅ 修复 `metadata` 的类型兼容问题

---

## 📋 任务完成状态

### ✅ 已完成
1. **ChatInterface** - ✅ 完成流式对话 API 集成
2. **DialogStore** - ✅ 确认无需修改，功能完整
3. **ProjectStore** - ✅ 集成 Session API，支持 CRUD 操作
4. **DocumentList** - ✅ 集成 Files API，显示工作区文件
5. **TypeScript 错误** - ✅ 修复所有核心组件编译错误
6. **API 服务层** - ✅ session.ts, chat.ts, files.ts 全部完成
7. **适配层** - ✅ adapters.ts 完成数据模型映射
8. **SSE 管理** - ✅ sse.ts 更新为 ChatStreamEvent

### 🔄 待完成

#### 高优先级
1. **端到端测试** - 测试完整的对话流程
   - 创建 Session
   - 发起流式对话
   - 查看文件列表
   - 查看消息历史

2. **App 初始化** - 在应用启动时自动创建或恢复 Session
   ```typescript
   useEffect(() => {
     // Check if there's a saved session ID
     if (!currentProjectId) {
       // Create new session or restore from localStorage
       createNewProject({ workspace_name: 'default' });
     } else {
       // Fetch existing session
       refreshCurrentProject();
     }
   }, []);
   ```

#### 中优先级
3. **修改 DocumentPreview** - 使用 Files API 获取文件内容
4. **修改 LeftPanel** - 调用 `fetchProjects()` 显示项目列表
5. **错误边界** - 添加全局错误处理和用户提示

#### 低优先级
6. **清理未使用的代码** - 移除 Task、Workflow 相关的旧代码（不影响核心功能）
7. **优化加载状态** - 更好的 Skeleton 占位符
8. **添加重试机制** - API 请求失败时自动重试

---

## 🎯 核心变更总结

### 移除的依赖
- ❌ `useSSE` hook (旧的)
- ❌ `SSEEvent` 类型
- ❌ `useUIActionStore`
- ❌ `TaskStatusIndicator` 组件
- ❌ `updateTaskStatus` API
- ❌ Task 相关的状态管理

### 新增的依赖
- ✅ `SSEConnection` 类
- ✅ `ChatStreamEvent` 类型
- ✅ `getChatStreamUrl()` 函数
- ✅ `useProjectStore` (获取 currentProjectId)
- ✅ 工具调用状态显示

### API 端点变更

| 旧端点 | 新端点 | 说明 |
|-------|-------|-----|
| `/projects/{id}/dialog/stream` | `/chat/stream` | 流式对话 |
| `/projects/{id}/dialog/messages` | `/sessions/{id}/messages` | 消息历史 |
| `/projects` | `/sessions` | 项目/会话列表 |

### 数据模型变更

| 前端模型 | 后端模型 | 映射函数 |
|---------|---------|---------|
| `Project` | `SessionResponse` | `mapSessionToProject()` |
| `Message` | `ConversationMessage` | `mapConversationToMessage()` |
| `Document` | `FileItem` | `mapFileToDocument()` |

---

## 🚀 使用示例

### 创建会话并发起对话

```typescript
// 1. 在 App 启动时创建会话
const initSession = async () => {
  const session = await createSession({
    workspace_name: 'my-project'
  });

  // 将 session.id 保存到 ProjectStore
  setCurrentProject(session.data!.id);
};

// 2. 用户发送消息时
// ChatInterface 会自动使用 currentProjectId 发起流式对话
handleSend('Hello, Claude!');

// 3. 实时接收 SSE 事件
// - text_delta: 文本流式输出
// - tool_use: Claude 调用工具（Read, Edit, Bash 等）
// - tool_result: 工具执行结果
// - done: 对话结束
```

---

## ⚠️ 注意事项

1. **Session ID 即 Project ID**: 前端使用 `currentProjectId` 存储 Session ID
2. **工具调用追踪**: 新增工具调用状态显示，用户可以看到 Claude 正在执行的操作
3. **连接管理**: SSE 连接在 `done` 事件后自动关闭，组件卸载时也会清理
4. **错误处理**: 连接失败时会显示友好的错误提示，包括建议信息
5. **类型安全**: 所有 API 都有完整的 TypeScript 类型定义

---

## 📊 编译状态

当前 TypeScript 编译状态：
- ✅ ChatInterface.tsx - 已修复所有错误
- ✅ adapters.ts - 已修复类型导入错误
- ⚠️ 其他组件 - 存在一些不影响核心功能的警告

---

## 🔗 相关文档

- [API Migration Guide](./API_MIGRATION.md) - API 迁移指南
- [API Integration Summary](./API_INTEGRATION_SUMMARY.md) - API 集成总结
- [Claude Agent Service Backend](../claude-agent-service/README.md) - 后端服务文档

---

**创建时间**: 2025-10-27
**最后更新**: 2025-10-27 (ProjectStore & DocumentList 集成完成)
**版本**: 2.0.0
