# 重构指南 (Refactoring Guide)

本文档记录了前端项目基于三大架构方案的重构进度和后续步骤。

## 三大架构方案

1. **HOOKS_ARCHITECTURE.md** - 四层 Hooks 分层架构
2. **TEMPLATE_ARCHITECTURE.md** - SessionProvider + AIWorkflowTemplate 模板组件化
3. **DYNAMIC_UI_SYSTEM.md** - 动态 UI 组件渲染系统

## 重构进度

### ✅ 阶段一：新架构实现（已完成）

**Hooks 四层架构**：
- ✅ Layer 1: Utility (useDebounce, useThrottle, useToggle, usePrevious)
- ✅ Layer 2: Infrastructure (useSSE, useApiClient, useSession, useLocalStorage)
- ✅ Layer 3: Business (useMessages, useWorkflowStages, useTodos, useDocuments)
- ✅ Layer 4: Composite (useChat, useAIWorkflow)

**动态 UI 组件系统**：
- ✅ EventBus - 事件总线
- ✅ ComponentRegistry - 组件注册表
- ✅ DynamicUIRenderer - 动态渲染器
- ✅ FormRenderer - 表单渲染器（示例）

**提交**：`6f8598d - refactor: 实现分层 Hooks 架构和动态 UI 组件系统（阶段一）`

---

### 🔄 阶段二：补充业务组件（进行中）

需要实现以下动态 UI 组件：

1. **CardRenderer** - 卡片渲染器
   - 位置：`src/dynamic-ui/renderers/CardRenderer.tsx`
   - 功能：展示信息卡片，支持标题、描述、操作按钮
   - 配置：`{ title, description, actions: [{ label, onClick }] }`

2. **ImageGalleryRenderer** - 图片画廊渲染器
   - 位置：`src/dynamic-ui/renderers/ImageGalleryRenderer.tsx`
   - 功能：展示多张图片，支持预览、下载
   - 配置：`{ images: [{ url, alt, caption }] }`

3. **TableRenderer** - 表格渲染器
   - 位置：`src/dynamic-ui/renderers/TableRenderer.tsx`
   - 功能：展示表格数据，支持排序、筛选
   - 配置：`{ columns: [...], dataSource: [...] }`

4. **ChartRenderer** - 图表渲染器
   - 位置：`src/dynamic-ui/renderers/ChartRenderer.tsx`
   - 功能：展示图表（柱状图、折线图等）
   - 配置：`{ type: 'bar' | 'line', data: [...] }`

5. **renderers/index.ts** - 统一导出和注册
   ```tsx
   import { componentRegistry } from '../registry';
   import { FormRenderer } from './FormRenderer';
   import { CardRenderer } from './CardRenderer';
   // ... 其他渲染器

   // 批量注册
   componentRegistry.registerBatch({
     Form: FormRenderer,
     Card: CardRenderer,
     ImageGallery: ImageGalleryRenderer,
     Table: TableRenderer,
     Chart: ChartRenderer,
   });

   export * from './FormRenderer';
   export * from './CardRenderer';
   // ...
   ```

---

### 📋 阶段三：SessionProvider 和模板组件

#### 3.1 SessionProvider

**位置**：`src/template/providers/SessionProvider.tsx`

**功能**：
- 管理当前会话 ID
- 自动切换 stores 数据源
- 提供 SessionContext

**实现要点**：
```tsx
interface SessionProviderProps {
  sessionId: string;
  children: React.ReactNode;
  storageKeyPrefix?: string;
}

export const SessionProvider: React.FC<SessionProviderProps> = ({
  sessionId,
  children,
  storageKeyPrefix = 'app'
}) => {
  // 1. 使用 useSession hook
  // 2. 监听 sessionId 变化
  // 3. 切换 stores 的数据源
  // 4. 提供 SessionContext
};
```

#### 3.2 AIWorkflowTemplate

**位置**：`src/template/components/AIWorkflowTemplate.tsx`

**功能**：
- 封装三栏布局
- 自动管理会话
- 提供可配置的 UI

**实现要点**：
```tsx
interface AIWorkflowTemplateProps {
  sessionId: string;
  apiBaseUrl?: string;
  storageKeyPrefix?: string;
  customComponents?: Record<string, DynamicUIComponent>;
  layoutConfig?: LayoutConfig;
  onSessionChange?: (sessionId: string) => void;
}

export const AIWorkflowTemplate: React.FC<AIWorkflowTemplateProps> = ({
  sessionId,
  ...props
}) => {
  return (
    <SessionProvider sessionId={sessionId} {...props}>
      <ThreeColumnLayout>
        {/* 左侧：对话 */}
        {/* 中间：工作流 */}
        {/* 右侧：文档+执行记录 */}
      </ThreeColumnLayout>
    </SessionProvider>
  );
};
```

---

### 🔧 阶段四：更新现有组件使用新架构

#### 4.1 更新导入路径

需要更新以下文件的导入路径：

**受影响的文件**：
- `src/components/workflow/WorkflowTree.tsx` - 导入 useTodos
- `src/components/dialog/ChatInterface.tsx` - 导入 useSSE, useDebounce
- 其他使用了 `useDebounce`, `useSSE`, `useTodos` 的文件

**修改示例**：
```tsx
// 旧的导入
import { useDebounce } from '../../hooks/useDebounce';
import { useSSE } from '../../hooks/useSSE';
import { useTodos } from '../../hooks/useTodos';

// 新的导入（推荐）
import { useDebounce, useSSE, useTodos } from '../../hooks';

// 或者分层导入
import { useDebounce } from '../../hooks/utility';
import { useSSE } from '../../hooks/infrastructure';
import { useTodos } from '../../hooks/business/dialog';
```

**查找所有需要更新的文件**：
```bash
grep -r "from.*hooks/use" src/components/
grep -r "from.*hooks/use" src/App.tsx
```

#### 4.2 重构组件使用 Composite Hooks

**优先级高的组件**：

1. **ChatInterface** → 使用 `useChat`
   ```tsx
   // 旧的方式（多个独立 hooks）
   const { messages, addMessage } = useMessages();
   const { connect, disconnect } = useSSE(...);
   const { request } = useApiClient(...);

   // 新的方式（一个 composite hook）
   const { messages, sendMessage, isStreaming } = useChat({
     sessionId: 'project-001'
   });
   ```

2. **WorkflowTree** → 使用 `useAIWorkflow`
   ```tsx
   // 旧的方式
   const { stages, updateStage } = useWorkflowStages();
   const { documents } = useDocuments();
   const { todos } = useTodos();

   // 新的方式
   const {
     stages,
     documents,
     todos,
     addStageWithTasks,
     completeTask
   } = useAIWorkflow({ sessionId: 'project-001' });
   ```

3. **App.tsx** → 使用 `AIWorkflowTemplate`（最终形态）
   ```tsx
   // 旧的方式（手动管理所有组件）
   <ThreeColumnLayout>
     <ChatInterface />
     <WorkflowTree />
     <DocumentPreview />
   </ThreeColumnLayout>

   // 新的方式（使用模板组件）
   <AIWorkflowTemplate
     sessionId={currentProject}
     onSessionChange={handleProjectSwitch}
   />
   ```

---

### 🗄️ 阶段五：更新 Stores 支持 sessionId 隔离

需要修改以下 stores：

#### 5.1 useDialogStore

**文件**：`src/stores/useDialogStore.ts`

**修改要点**：
```tsx
interface DialogState {
  messages: Message[];
  toolCalls: ToolCall[];
  // ... 其他状态
}

// 旧的方式：全局唯一状态
export const useDialogStore = create<DialogState>(...);

// 新的方式：支持多会话隔离
const createDialogStore = (sessionId: string) => {
  return create<DialogState>(
    persist(
      (set) => ({
        messages: [],
        // ...
      }),
      {
        name: `dialog-${sessionId}`, // 基于 sessionId 的存储键
      }
    )
  );
};

// 存储所有会话的 store 实例
const storeInstances = new Map<string, ReturnType<typeof createDialogStore>>();

export const useDialogStore = (sessionId: string) => {
  if (!storeInstances.has(sessionId)) {
    storeInstances.set(sessionId, createDialogStore(sessionId));
  }
  return storeInstances.get(sessionId)!;
};
```

**类似修改**：
- `useWorkflowStore.ts`
- `useDocumentStore.ts`
- `useUIActionStore.ts`

#### 5.2 useProjectStore

**文件**：`src/stores/useProjectStore.ts`

**修改要点**：
- 保持全局唯一（不需要隔离）
- 添加 `currentSessionId` 状态
- 提供 `switchSession(sessionId)` 方法

---

### 🧪 阶段六：测试重构后的功能

#### 6.1 单元测试

创建测试文件：
- `src/hooks/utility/__tests__/useDebounce.test.ts`
- `src/hooks/infrastructure/__tests__/useApiClient.test.ts`
- `src/hooks/composite/__tests__/useChat.test.ts`
- `src/dynamic-ui/__tests__/ComponentRegistry.test.ts`

#### 6.2 集成测试

测试场景：
1. 多会话切换（数据隔离）
2. SSE 流式响应
3. TodoWrite → WorkflowTree 同步
4. 动态组件渲染（Form, Card, ImageGallery）
5. EventBus 事件通信

#### 6.3 手动测试清单

- [ ] 发送消息，查看 SSE 流式响应
- [ ] 切换项目，验证数据隔离
- [ ] 查看工作流树，验证 TodoWrite 同步
- [ ] 触发动态表单，填写并提交
- [ ] 查看执行记录中的动态组件

---

### 📚 阶段七：更新文档

需要更新的文档：

1. **ARCHITECTURE.md**
   - 添加新的 Hooks 架构说明
   - 更新数据流图

2. **HOOKS_ARCHITECTURE.md**
   - 补充实际实现的代码示例
   - 添加迁移指南

3. **DYNAMIC_UI_SYSTEM.md**
   - 更新已实现的组件列表
   - 添加业务方扩展指南

4. **README.md**
   - 更新技术栈说明
   - 添加新架构的亮点

---

## 下一步行动 (Next Steps)

**立即执行**：
1. 更新现有组件的导入路径（修复编译错误）
2. 实现 CardRenderer 和 ImageGalleryRenderer
3. 创建 SessionProvider

**短期目标**：
1. 完成 AIWorkflowTemplate 组件
2. 重构 ChatInterface 使用 useChat
3. 更新 stores 支持 sessionId 隔离

**长期目标**：
1. 完整的测试覆盖
2. 性能优化（memo, lazy loading）
3. 文档完善

---

## 重构原则

1. **向后兼容**：新旧架构并存，逐步迁移
2. **渐进式**：先实现新架构，再迁移旧代码
3. **测试驱动**：每个阶段都有测试保障
4. **文档同步**：代码和文档同步更新

---

## 遇到问题？

**编译错误**：
- 检查导入路径是否正确
- 确保所有依赖已安装

**类型错误**：
- 检查 `types/models.ts` 中的类型定义
- 使用 `// @ts-ignore` 临时跳过（但要添加 TODO）

**运行时错误**：
- 检查 stores 是否正确初始化
- 查看浏览器控制台的错误信息

---

**最后更新**：2025-10-29
**当前提交**：`6f8598d`
**负责人**：Claude Code
