# 待办清单 (TODO List)

**项目**: AI Native Workflow Frontend - 架构重构
**最后更新**: 2025-10-29
**当前分支**: `main`
**最新提交**: `850b1eb - fix: 更新 useTodos 导入路径以适配新的 Hooks 架构`

---

## ✅ 已完成 (Phase 1 - Completed)

### 1. Hooks 四层架构实现
- ✅ **Layer 1: Utility** (4 个 hooks)
  - `useDebounce.ts` - 防抖
  - `useThrottle.ts` - 节流
  - `useToggle.ts` - 布尔值切换
  - `usePrevious.ts` - 获取上一次的值

- ✅ **Layer 2: Infrastructure** (4 个 hooks)
  - `useSSE.ts` - SSE 流式连接
  - `useApiClient.ts` - HTTP 请求客户端
  - `useSession.ts` - 会话管理
  - `useLocalStorage.ts` - LocalStorage 同步

- ✅ **Layer 3: Business** (4 个 hooks)
  - `dialog/useMessages.ts` - 对话消息管理
  - `dialog/useTodos.ts` - TodoWrite 提取
  - `workflow/useWorkflowStages.ts` - 工作流阶段管理
  - `document/useDocuments.ts` - 文档管理

- ✅ **Layer 4: Composite** (2 个 hooks)
  - `useChat.ts` - 整合对话功能
  - `useAIWorkflow.ts` - 整合工作流功能

### 2. 动态 UI 组件系统
- ✅ `EventBus.ts` - 事件总线
- ✅ `ComponentRegistry.ts` - 组件注册表
- ✅ `DynamicUIRenderer.tsx` - 动态渲染器
- ✅ `FormRenderer.tsx` - 表单渲染器

### 3. 文档
- ✅ `REFACTORING_GUIDE.md` - 重构指南（390 行）
- ✅ `ARCHITECTURE.md` - 整体架构说明（已存在）
- ✅ `HOOKS_ARCHITECTURE.md` - Hooks 架构（已存在）
- ✅ `TEMPLATE_ARCHITECTURE.md` - 模板组件化（已存在）
- ✅ `DYNAMIC_UI_SYSTEM.md` - 动态 UI 系统（已存在）

### 4. Bug 修复
- ✅ 修复 `WorkflowTree.tsx` 导入路径（useTodos）
- ✅ 清理后台进程，重启开发服务器
- ✅ 验证项目正常运行（http://localhost:3000/）

---

## 🔄 进行中 (In Progress)

**当前无进行中的任务**

---

## 📋 待办事项 (TODO - 按优先级排序)

### 🔴 高优先级 (明天优先完成)

#### 阶段二：补充业务组件

**位置**: `src/dynamic-ui/renderers/`

1. **CardRenderer.tsx** - 卡片渲染器
   - 功能：展示信息卡片，支持标题、描述、操作按钮
   - 配置接口：
     ```typescript
     interface CardConfig {
       title?: string;
       description?: string;
       imageUrl?: string;
       actions?: Array<{ label: string; type: 'primary' | 'default' }>;
     }
     ```
   - 参考：Ant Design Card 组件
   - 预计时间：30 分钟

2. **ImageGalleryRenderer.tsx** - 图片画廊渲染器
   - 功能：展示多张图片，支持预览、下载
   - 配置接口：
     ```typescript
     interface ImageGalleryConfig {
       images: Array<{
         url: string;
         alt?: string;
         caption?: string;
       }>;
       columns?: number; // 每行显示几张
     }
     ```
   - 参考：Ant Design Image.PreviewGroup
   - 预计时间：45 分钟

3. **TableRenderer.tsx** - 表格渲染器
   - 功能：展示表格数据，支持排序、筛选
   - 配置接口：
     ```typescript
     interface TableConfig {
       columns: Array<{ title: string; dataIndex: string; sorter?: boolean }>;
       dataSource: Array<Record<string, any>>;
       pagination?: boolean;
     }
     ```
   - 参考：Ant Design Table 组件
   - 预计时间：1 小时

4. **renderers/index.ts** - 统一注册
   - 批量注册所有渲染器到 ComponentRegistry
   - 导出所有渲染器
   - 预计时间：15 分钟

**总计**: 约 2.5 小时

---

#### 阶段三：SessionProvider 和模板组件

**位置**: `src/template/`

1. **providers/SessionProvider.tsx** - 会话管理 Provider
   - 功能：
     - 管理当前 sessionId
     - 自动切换 stores 数据源
     - 提供 SessionContext
   - 核心逻辑：
     - 使用 useSession hook
     - 监听 sessionId 变化
     - 触发 stores 切换
   - 参考：`TEMPLATE_ARCHITECTURE.md` 第 3.1 节
   - 预计时间：1 小时

2. **components/AIWorkflowTemplate.tsx** - AI 工作流模板组件
   - 功能：
     - 封装三栏布局
     - 自动管理会话
     - 提供可配置的 UI
   - Props：
     ```typescript
     interface AIWorkflowTemplateProps {
       sessionId: string;
       apiBaseUrl?: string;
       storageKeyPrefix?: string;
       customComponents?: Record<string, DynamicUIComponent>;
       layoutConfig?: LayoutConfig;
       onSessionChange?: (sessionId: string) => void;
     }
     ```
   - 参考：`TEMPLATE_ARCHITECTURE.md` 第 3.2 节
   - 预计时间：1.5 小时

**总计**: 约 2.5 小时

---

### 🟡 中优先级

#### 阶段四：重构现有组件使用新架构

1. **ChatInterface.tsx** - 使用 `useChat` hook
   - 简化组件逻辑
   - 移除直接的 SSE、API 调用
   - 参考：`REFACTORING_GUIDE.md` 第 4.2 节
   - 预计时间：1 小时

2. **WorkflowTree.tsx** - 使用 `useAIWorkflow` hook
   - 简化多个 hooks 调用
   - 统一工作流管理
   - 参考：`REFACTORING_GUIDE.md` 第 4.2 节
   - 预计时间：45 分钟

3. **App.tsx** - 使用 `AIWorkflowTemplate`（最终形态）
   - 替换现有的手动布局
   - 简化顶层组件
   - 参考：`REFACTORING_GUIDE.md` 第 4.2 节
   - 预计时间：30 分钟

**总计**: 约 2 小时

---

#### 阶段五：更新 Stores 支持 sessionId 隔离

**位置**: `src/stores/`

1. **useDialogStore.ts** - 支持多会话
   - 改造为工厂函数：`createDialogStore(sessionId)`
   - 使用 Map 存储多个实例
   - 参考：`REFACTORING_GUIDE.md` 第 5.1 节
   - 预计时间：1 小时

2. **useWorkflowStore.ts** - 支持多会话
   - 同上
   - 预计时间：1 小时

3. **useDocumentStore.ts** - 支持多会话
   - 同上
   - 预计时间：45 分钟

4. **useUIActionStore.ts** - 支持多会话
   - 同上
   - 预计时间：45 分钟

5. **useProjectStore.ts** - 添加会话管理
   - 保持全局唯一
   - 添加 `currentSessionId` 状态
   - 提供 `switchSession(sessionId)` 方法
   - 预计时间：30 分钟

**总计**: 约 4 小时

---

### 🟢 低优先级

#### 阶段六：测试

1. **单元测试** - 为核心 hooks 编写测试
   - useDebounce, useThrottle, useToggle
   - useApiClient, useSession
   - useChat, useAIWorkflow
   - ComponentRegistry
   - 预计时间：4 小时

2. **集成测试** - 测试关键场景
   - 多会话切换（数据隔离）
   - SSE 流式响应
   - TodoWrite → WorkflowTree 同步
   - 动态组件渲染
   - EventBus 通信
   - 预计时间：3 小时

3. **手动测试** - 全流程验证
   - 发送消息，查看 SSE 流式响应
   - 切换项目，验证数据隔离
   - 查看工作流树，验证 TodoWrite 同步
   - 触发动态表单，填写并提交
   - 查看执行记录中的动态组件
   - 预计时间：2 小时

**总计**: 约 9 小时

---

#### 阶段七：完善文档

1. **更新 ARCHITECTURE.md**
   - 添加新的 Hooks 架构说明
   - 更新数据流图
   - 预计时间：1 小时

2. **更新 HOOKS_ARCHITECTURE.md**
   - 补充实际实现的代码示例
   - 添加迁移指南
   - 预计时间：1 小时

3. **更新 DYNAMIC_UI_SYSTEM.md**
   - 更新已实现的组件列表
   - 添加业务方扩展指南
   - 预计时间：30 分钟

4. **更新 README.md**
   - 更新技术栈说明
   - 添加新架构的亮点
   - 预计时间：30 分钟

**总计**: 约 3 小时

---

## 📊 进度统计

### 已完成工作量
- **Hooks 架构**: 14 个 hooks，约 2000 行代码
- **动态 UI 系统**: 4 个核心文件，约 700 行代码
- **文档**: 5 份架构文档，约 3500 行
- **Bug 修复**: 1 个导入路径问题

**总计已完成**: 约 6200 行代码/文档，约 20 小时工作量

### 待完成工作量（估算）
- **高优先级**: 约 5 小时
- **中优先级**: 约 6 小时
- **低优先级**: 约 12 小时

**总计待完成**: 约 23 小时工作量

### 完成度
- **阶段一（新架构实现）**: ✅ 100%
- **阶段二（业务组件）**: 🔄 25%（1/4 完成）
- **阶段三（模板组件）**: ⬜ 0%
- **阶段四（重构组件）**: ⬜ 0%
- **阶段五（Stores 隔离）**: ⬜ 0%
- **阶段六（测试）**: ⬜ 0%
- **阶段七（文档）**: ⬜ 0%

**整体完成度**: 约 35%

---

## 🚀 明天的工作计划（建议）

### 上午（3-4 小时）
1. ✅ 实现 CardRenderer（30 分钟）
2. ✅ 实现 ImageGalleryRenderer（45 分钟）
3. ✅ 实现 TableRenderer（1 小时）
4. ✅ 创建 renderers/index.ts 并注册（15 分钟）
5. ✅ 测试动态组件渲染（30 分钟）

### 下午（3-4 小时）
1. ✅ 实现 SessionProvider（1 小时）
2. ✅ 实现 AIWorkflowTemplate（1.5 小时）
3. ✅ 在 App.tsx 中集成 AIWorkflowTemplate（30 分钟）
4. ✅ 测试会话切换和数据隔离（30 分钟）

### 如果时间充裕
- 开始重构 ChatInterface 使用 useChat
- 开始更新 stores 支持 sessionId 隔离

---

## 📝 注意事项

### 开发环境
- **开发服务器**: http://localhost:3000/
- **当前运行状态**: ✅ 正常运行
- **后台进程 ID**: 21b9d3

### 重要文件路径
```
src/
├── hooks/                    # Hooks 四层架构
│   ├── utility/
│   ├── infrastructure/
│   ├── business/
│   └── composite/
├── dynamic-ui/               # 动态 UI 系统
│   ├── event-bus/
│   ├── registry/
│   └── renderers/           ← 明天重点
├── template/                 ← 明天新建
│   ├── providers/
│   └── components/
├── stores/                   # 需要重构
└── components/               # 需要重构
```

### 参考文档
- `REFACTORING_GUIDE.md` - 详细实施步骤
- `HOOKS_ARCHITECTURE.md` - Hooks 设计
- `TEMPLATE_ARCHITECTURE.md` - 模板组件设计
- `DYNAMIC_UI_SYSTEM.md` - 动态 UI 设计

### Git 提交规范
- feat: 新功能
- refactor: 重构
- fix: Bug 修复
- docs: 文档更新
- test: 测试相关

每个阶段完成后提交一次。

---

## ❓ 待确认问题

**无**

---

**记录人**: Claude Code
**下次更新**: 2025-10-30
