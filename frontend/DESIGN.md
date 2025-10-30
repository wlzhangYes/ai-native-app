# AI 驱动流程自动化执行系统 - 前端设计文档

**项目名称**: AI-Driven Workflow Execution Frontend
**版本**: v1.0.0
**最后更新**: 2025-10-30
**文档类型**: 架构设计与技术规范

---

## 1. 项目概述

### 1.1 项目目标

构建一个 AI 驱动的流程自动化执行系统前端，通过自然语言对话引导用户完成软件开发全流程，包括需求澄清、方案构建、实施计划和任务构造等阶段。系统采用三栏布局设计，实现 AI 对话、流程可视化和结果预览的协同交互。

### 1.2 核心特性

- **AI 对话交互**：支持文本、语音、文件上传的多模态输入
- **实时流式响应**：基于 SSE 的流式 AI 回复，实时显示生成内容
- **流程可视化**：5 阶段工作流树，实时显示进度和状态
- **文档生成与预览**：Markdown 文档实时生成、编辑、版本对比
- **会话持久化**：IndexedDB + Zustand 持久化存储，支持离线访问
- **任务状态管理**：实时显示任务执行状态、暂停/恢复功能

### 1.3 用户价值

- **降低沟通成本**：AI 对话替代传统文档编写，自然语言交互
- **提升开发效率**：自动生成规范化文档，减少重复劳动
- **保障质量一致性**：标准化流程和模板，确保输出质量
- **支持团队协作**：实时同步、权限管理、文档版本控制

---

## 2. 技术选型

### 2.1 核心技术栈

| 技术 | 版本 | 选型理由 |
|------|------|---------|
| React | 18.x | 成熟的组件化框架，丰富的生态系统 |
| TypeScript | 5.x | 类型安全，提升代码质量和可维护性 |
| Vite | 7.x | 快速的开发服务器和构建工具 |

### 2.2 UI 组件库

| 技术 | 版本 | 用途 |
|------|------|------|
| Ant Design | 5.x | 企业级 UI 组件库，设计规范统一 |
| Ant Design X | 1.6.1 | AI 对话专用组件（Bubble, Sender, Attachments） |
| @ant-design/icons | 5.x | 图标库，与 Ant Design 配套 |

**选型理由**：
- Ant Design 提供丰富的企业级组件，开箱即用
- Ant Design X 是官方 AI 组件库，专为对话场景优化
- 两者风格一致，无需额外设计适配

### 2.3 状态管理

| 技术 | 版本 | 用途 |
|------|------|------|
| Zustand | 4.x | 轻量级全局状态管理 |
| Immer | 10.x | 不可变数据更新 |

**选型理由**：
- Zustand API 简洁，学习成本低，性能优秀
- Immer 简化不可变更新，避免深拷贝
- 内置 persist 中间件，支持状态持久化

### 2.4 数据持久化

| 技术 | 用途 | 容量限制 |
|------|------|---------|
| IndexedDB | 工作流、文档、会话数据 | 无限制（受磁盘空间限制） |
| LocalStorage | 用户偏好设置、轻量状态 | 5-10MB |

**选型理由**：
- IndexedDB 支持大容量存储，适合文档和历史数据
- LocalStorage 读写速度快，适合小数据量

### 2.5 网络通信

| 技术 | 用途 |
|------|------|
| Axios | HTTP 请求（RESTful API） |
| EventSource | SSE 流式响应（AI 对话） |

**选型理由**：
- Axios 支持拦截器、请求取消、超时控制
- EventSource 是原生 SSE 客户端，无需第三方库

### 2.6 代码编辑器

| 技术 | 版本 | 用途 |
|------|------|------|
| Monaco Editor | @monaco-editor/react | VSCode 风格代码编辑器，支持 50+ 语言语法高亮 |
| React Markdown | 9.x | Markdown 渲染 |
| remark-gfm | 4.x | GitHub Flavored Markdown 支持（表格、任务列表） |
| React Diff Viewer | 3.x | 文档版本对比视图 |

**选型理由**：
- Monaco Editor 是 VSCode 同款编辑器，提供专业级代码编辑体验
- 支持 JavaScript, TypeScript, Python, Java, C/C++, Go, Rust 等 50+ 语言
- 内置语法高亮、智能缩进、自动补全等功能
- 暗色主题（vs-dark）统一代码编辑体验

### 2.7 测试框架

| 技术 | 版本 | 用途 |
|------|------|------|
| Vitest | 1.x | 单元测试运行器 |
| React Testing Library | 14.x | React 组件测试 |
| MSW | 2.x | API Mock（开发和测试环境） |

**测试策略**：
- **单元测试**: Hooks 层 100% 覆盖率
- **集成测试**: SSE 流式通信、工作流同步测试
- **组件测试**: 关键 UI 组件交互测试
- **Mock 服务**: MSW 提供稳定的 API 模拟

### 2.8 开发工具

| 技术 | 版本 | 用途 |
|------|------|------|
| TypeScript | 5.x | 类型安全开发 |
| ESLint | 8.x | 代码质量检查 |
| Prettier | 3.x | 代码格式化 |
| clsx | 2.x | 条件样式类名管理 |

---

## 3. 架构设计

### 3.1 项目目录结构

```
frontend/
├── src/
│   ├── components/              # UI 组件
│   │   ├── layout/              # 布局组件
│   │   │   ├── ThreeColumnLayout.tsx   # 三栏布局容器
│   │   │   ├── LeftPanel.tsx           # 左栏：AI 对话
│   │   │   ├── MiddlePanel.tsx         # 中栏：流程/数据/文件
│   │   │   └── RightPanel.tsx          # 右栏：运行记录/结果预览
│   │   ├── dialog/              # 对话组件
│   │   │   ├── ChatInterface.tsx       # 对话主界面
│   │   │   └── TaskStatusIndicator.tsx # 任务状态指示器
│   │   ├── workflow/            # 工作流组件
│   │   │   └── WorkflowTree.tsx        # 工作流树
│   │   └── preview/             # 预览组件
│   │       ├── DocumentPreview.tsx     # 文档预览
│   │       ├── DocumentMetadata.tsx    # 文档元数据
│   │       ├── MarkdownRenderer.tsx    # Markdown 渲染器
│   │       ├── DocumentDiffView.tsx    # 文档对比视图
│   │       └── ExecutionLog.tsx        # 执行日志
│   ├── stores/                  # Zustand 状态管理
│   │   ├── useDialogStore.ts           # 对话状态
│   │   ├── useWorkflowStore.ts         # 工作流状态
│   │   └── useDocumentStore.ts         # 文档状态
│   ├── hooks/                   # 四层 Hooks 架构
│   │   ├── utility/             # 工具函数层
│   │   │   ├── useDebounce.ts          # 防抖钩子
│   │   │   ├── useToggle.ts            # 开关状态管理
│   │   │   ├── useLocalStorage.ts      # 本地存储管理
│   │   │   └── useWindowSize.ts        # 窗口尺寸响应
│   │   ├── infrastructure/      # 基础设施层
│   │   │   ├── useApiClient.ts         # HTTP 客户端
│   │   │   ├── useSSE.ts               # SSE 连接管理
│   │   │   ├── useIndexedDB.ts         # IndexedDB 操作
│   │   │   └── usePersistence.ts       # 数据持久化
│   │   ├── business/            # 业务逻辑层
│   │   │   ├── useMessages.ts          # 消息业务逻辑
│   │   │   ├── useTodos.ts             # 任务业务逻辑
│   │   │   ├── useWorkflowSync.ts      # 工作流同步逻辑
│   │   │   └── useDocuments.ts         # 文档业务逻辑
│   │   └── composite/           # 组合逻辑层
│   │       ├── useChat.ts              # AI 对话组合功能
│   │       ├── useWorkflow.ts          # 工作流组合功能
│   │       └── useAIWorkflow.ts        # AI 工作流集成
│   ├── services/                # 服务层
│   │   ├── api/
│   │   │   ├── http.ts                 # Axios 实例配置
│   │   │   ├── dialog.ts               # 对话 API
│   │   │   └── sse.ts                  # SSE 连接管理
│   │   └── mocks/                      # MSW Mock 数据
│   ├── types/                   # TypeScript 类型定义
│   │   ├── models.ts                   # 数据模型
│   │   └── api.ts                      # API 类型
│   ├── utils/                   # 工具函数
│   │   ├── format.ts                   # 格式化工具
│   │   └── persistence.ts              # IndexedDB 工具
│   ├── App.tsx                  # 应用入口
│   └── main.tsx                 # 挂载入口
├── public/                      # 静态资源
│   └── mockServiceWorker.js     # MSW Service Worker
├── .env.development             # 开发环境配置
├── .env.production              # 生产环境配置
├── vite.config.ts               # Vite 配置
├── tsconfig.json                # TypeScript 配置
└── package.json                 # 依赖配置
```

### 3.2 三栏布局架构

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       ThreeColumnLayout (3:2:5)                         │
├──────────────────┬──────────────────┬───────────────────────────────────┤
│   LeftPanel      │   MiddlePanel    │         RightPanel                │
│   (30%)          │   (20%)          │         (50%)                     │
├──────────────────┼──────────────────┼───────────────────────────────────┤
│                  │ ┌──────────────┐ │ ┌───────────────────────────────┐ │
│ ┌──────────────┐ │ │流程│数据│文件│ │ │运行记录│结果预览              │ │
│ │ ChatInterface│ │ └──────────────┘ │ └───────────────────────────────┘ │
│ └──────────────┘ │                  │                                   │
│                  │ WorkflowTree     │ ExecutionLog / DocumentPreview    │
│ ┌──────────────┐ │                  │                                   │
│ │对话气泡列表   │ │ 阶段0: 项目初始化│ ┌─────────────────────────────┐   │
│ │              │ │ ├─ spec.md      │ │时间线日志                    │   │
│ │ [User]       │ │ ├─ plan.md      │ │- 2025-10-27 10:00 开始      │   │
│ │ Hello AI     │ │ ├─ tasks.md     │ │- 2025-10-27 10:05 完成规格  │   │
│ │              │ │                  │ └─────────────────────────────┘   │
│ │ [AI]         │ │ 阶段1: 需求澄清  │                                   │
│ │ 你好...      │ │ ├─ clarify.md   │ ┌─────────────────────────────┐   │
│ │ [操作按钮]   │ │ └─ questions.md │ │文档预览                      │   │
│ │              │ │                  │ │# 功能规格说明                │   │
│ └──────────────┘ │ 阶段2: 方案构建  │ │## 概述                       │   │
│                  │                  │ │...                           │   │
│ ┌──────────────┐ │ 阶段3: 实施计划  │ │                              │   │
│ │任务状态       │ │                  │ │[导出][编辑][确认]           │   │
│ │⭐ 执行中     │ │ 阶段4: 任务构造  │ └─────────────────────────────┘   │
│ │进度: 60%     │ │                  │                                   │
│ │[暂停][恢复]  │ │                  │                                   │
│ └──────────────┘ │                  │                                   │
│                  │                  │                                   │
│ ┌──────────────┐ │                  │                                   │
│ │📎附件列表    │ │                  │                                   │
│ │- image.png   │ │                  │                                   │
│ └──────────────┘ │                  │                                   │
│                  │                  │                                   │
│ Sender           │                  │                                   │
│ ┌──────────────┐ │                  │                                   │
│ │输入框...     │ │                  │                                   │
│ │📎 🎤 ➤      │ │                  │                                   │
│ └──────────────┘ │                  │                                   │
└──────────────────┴──────────────────┴───────────────────────────────────┘
```

### 3.3 数据流架构

```
┌─────────────────────────────────────────────────────────────────┐
│                           User Input                            │
│              (Text / Voice / File Upload)                       │
└───────────────────────────┬─────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                      Frontend Components                        │
│  - ChatInterface: 处理用户输入                                  │
│  - WorkflowTree: 展示工作流状态                                 │
│  - DocumentPreview: 预览生成的文档                              │
└───────────────────────────┬─────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                       State Management                          │
│  - useDialogStore: 管理对话消息、流式状态                       │
│  - useWorkflowStore: 管理工作流阶段、任务状态                   │
│  - useDocumentStore: 管理文档内容、编辑状态                     │
└─────────────┬──────────────────────────────────┬────────────────┘
              ↓                                  ↓
┌─────────────────────────┐    ┌────────────────────────────────┐
│   Local Persistence     │    │      Backend API               │
│   - LocalStorage        │    │   - RESTful API (HTTP)         │
│   - IndexedDB           │    │   - SSE Stream (EventSource)   │
└─────────────────────────┘    └────────────────────────────────┘
```

### 3.4 四层 Hooks 架构

本项目采用分层 Hooks 架构设计，将复杂的业务逻辑按职责分层，提升代码可维护性和可测试性：

```
┌─────────────────────────────────────┐
│  Composite Hooks (组合逻辑层)        │  ← useChat, useWorkflow
│  - 业务场景组合，跨域协调             │
└─────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────┐
│  Business Hooks (业务逻辑层)         │  ← useMessages, useTodos
│  - 特定业务逻辑封装                  │
└─────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────┐
│  Infrastructure Hooks (基础设施层)   │  ← useApiClient, useSSE
│  - HTTP/SSE/存储等基础能力            │
└─────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────┐
│  Utility Hooks (工具函数层)          │  ← useDebounce, useToggle
│  - 通用工具函数，可复用               │
└─────────────────────────────────────┘
```

#### 3.4.1 工具函数层 (Utility Layer)

提供可复用的通用工具钩子：

- **useDebounce**: 防抖处理，优化搜索和输入体验
- **useToggle**: 布尔状态管理，简化开关逻辑
- **useLocalStorage**: 本地存储封装，提供类型安全的读写接口
- **useWindowSize**: 窗口尺寸响应，支持响应式设计

#### 3.4.2 基础设施层 (Infrastructure Layer)

封装底层技术细节，提供稳定的基础能力：

- **useApiClient**: Axios 实例管理，统一错误处理和请求拦截
- **useSSE**: EventSource 连接管理，处理重连和错误恢复
- **useIndexedDB**: IndexedDB 操作封装，提供 Promise 化接口
- **usePersistence**: 数据持久化策略，支持多种存储方式

#### 3.4.3 业务逻辑层 (Business Layer)

实现特定业务领域的逻辑：

- **useMessages**: 消息管理，处理用户/AI/系统消息的 CRUD 操作
- **useTodos**: 任务管理，从 Tool Calls 中提取和管理 TodoWrite 数据
- **useWorkflowSync**: 工作流同步，处理 Todos 到 Workflow Tree 的映射
- **useDocuments**: 文档管理，处理文档的创建、编辑、版本控制

#### 3.4.4 组合逻辑层 (Composite Layer)

协调多个业务逻辑，实现复杂的用户场景：

- **useChat**: AI 对话功能集成，整合消息、SSE 流、Tool Calls 处理
- **useWorkflow**: 工作流管理，协调阶段状态、任务执行、UI 交互
- **useAIWorkflow**: AI 工作流集成，连接对话和工作流，实现端到端体验

#### 架构优势

1. **关注点分离**: 每层专注于特定职责，降低复杂度
2. **可测试性**: 单一职责便于编写单元测试
3. **可复用性**: 底层 hooks 可在多个场景中复用
4. **可维护性**: 分层结构便于定位问题和功能扩展
5. **类型安全**: 全链路 TypeScript 类型支持

---

## 4. 组件设计

### 4.1 布局组件

#### ThreeColumnLayout
- **职责**：三栏自适应布局容器，支持拖拽调整列宽
- **功能**：
  - 默认比例 3:2:5（可配置）
  - 拖拽分隔条调整列宽
  - 响应式设计：桌面端三栏，移动端警告
- **状态**：列宽（px）
- **子组件**：LeftPanel, MiddlePanel, RightPanel

#### LeftPanel
- **职责**：AI 对话面板容器
- **功能**：包裹 ChatInterface 组件

#### MiddlePanel
- **职责**：流程/数据/文件多 tab 面板
- **功能**：
  - Tab 1（流程）：显示 5 阶段工作流树
  - Tab 2（数据）：数据视图（待实现）
  - Tab 3（文件）：文件管理（待实现）
- **Tab 图标**：
  - 流程：UnorderedListOutlined
  - 数据：DatabaseOutlined
  - 文件：FileOutlined

#### RightPanel
- **职责**：运行记录/结果预览双 tab 面板
- **功能**：
  - Tab 1（运行记录）：显示执行日志时间线
  - Tab 2（结果预览）：显示文档预览
- **自动切换逻辑**：
  - 选择文档时 → 自动切换到"结果预览"
  - 选择阶段时 → 自动切换到"运行记录"

---

### 4.2 对话组件

#### ChatInterface
- **职责**：AI 对话主界面，支持文本、语音、文件输入和流式响应
- **核心功能**：
  - 消息列表展示（用户、AI、系统消息）
  - 文本/语音/文件输入
  - SSE 流式响应实时显示
  - 文件附件上传和预览
  - 消息操作（复制、重新生成）
- **消息类型**：
  - `user`: 用户消息（右对齐、蓝色填充背景）
  - `ai`: AI 消息（左对齐、白色边框背景）
  - `system`: 系统消息（左对齐、灰色边框背景）
- **附件支持**：图片、PDF、Markdown、文本文件
- **语音输入**：Web Speech API（待实现）

#### TaskStatusIndicator
- **职责**：显示当前任务执行状态，支持暂停/恢复
- **状态类型**：
  - `pending`: 待执行（蓝色 loading 图标）
  - `in_progress`: 执行中（黄色闪烁星形图标）
  - `completed`: 已完成（绿色 checkmark）
  - `failed`: 失败（红色错误图标）
  - `paused`: 已暂停（灰色暂停图标）
- **显示内容**：任务名称、状态标签、进度条、暂停/恢复按钮

---

### 4.3 工作流组件

#### WorkflowTree
- **职责**：5 阶段工作流树，展示文档和任务
- **工作流阶段**：
  - 阶段 0：项目初始化
  - 阶段 1：需求澄清
  - 阶段 2：方案构建
  - 阶段 3：实施计划
  - 阶段 4：任务构造
- **树形结构**：
  ```
  阶段0：项目初始化 ✓ (3)
  ├─ spec.md (已完成)
  ├─ plan.md (已完成)
  └─ constitution.md (草稿)
  阶段1：需求澄清 ⭐ (2)
  ├─ clarify.md (执行中)
  └─ questions.md (待处理)
  阶段2：方案构建 ⏸ (1)
  阶段3：实施计划 (0)
  阶段4：任务构造 (0)
  ```
- **节点类型**：
  - 阶段节点：显示阶段名称、状态图标、任务计数
  - 文档节点：显示文档名称、状态标签
  - 任务节点：显示任务名称、状态图标
- **交互行为**：
  - 点击阶段 → 切换到"运行记录" tab
  - 点击文档 → 切换到"结果预览" tab
  - 展开/折叠 → 保存状态到 Store

---

### 4.4 预览组件

#### DocumentPreview
- **职责**：文档预览，支持查看、编辑、版本对比
- **视图模式**：
  - `preview`: 预览模式（Markdown 渲染）
  - `edit`: 编辑模式（TextArea）
  - `diff`: 对比模式（Diff Viewer）
- **编辑流程**：
  1. 点击"编辑" → 进入编辑模式
  2. 修改内容
  3. 点击"保存" → 进入对比模式（显示 Diff）
  4. 点击"确认" → 保存新版本，退出编辑
  5. 点击"拒绝" → 返回编辑模式
- **操作按钮**（吸底右对齐）：
  - 预览模式：导出、编辑、确认
  - 编辑模式：保存、取消

#### DocumentMetadata
- **职责**：显示文档元数据
- **显示内容**：
  - 文档名称、状态标签（草稿/已完成）
  - 版本号
  - 作者、字数
  - 创建时间、更新时间

#### MarkdownRenderer
- **职责**：Markdown 渲染器
- **支持特性**：
  - GFM 语法（表格、任务列表、删除线）
  - 代码高亮
  - 自定义组件（表格样式、代码块样式）

#### DocumentDiffView
- **职责**：文档版本对比视图
- **显示方式**：左右分屏对比
- **对比粒度**：按单词对比（WORDS 模式）
- **操作按钮**：确认、拒绝

#### ExecutionLog
- **职责**：执行日志时间线
- **日志类型**：
  - `info`: 信息日志（蓝色圆点）
  - `success`: 成功日志（绿色 checkmark）
  - `error`: 错误日志（红色错误图标）
  - `warning`: 警告日志（黄色警告图标）
- **显示内容**：时间戳、日志内容、相关文档链接

---

## 5. 交互流程设计

### 5.1 首次进入流程

#### 5.1.1 欢迎界面
- **触发时机**：用户首次打开应用或创建新会话
- **显示内容**：
  - 使用 Ant Design X 的 `<Welcome />` 组件
  - 欢迎语："Hi！我是AI产研教练，很高兴为您服务。让我们开始创建您的软件项目吧。 请告诉我项目名称是什么？"
  - Welcome 组件作为第一条消息，永久保留在对话历史中

#### 5.1.2 初始状态
- **左栏**：显示 Welcome 消息
- **中栏**：空工作流树，显示占位提示
- **右栏**：显示"结果预览" tab，空状态提示"请从工作流树中选择一个文档查看"

---

### 5.2 工作流阶段展开/折叠逻辑

#### 5.2.1 自动展开规则
- **进行中阶段**：自动展开，显示所有子任务
- **已完成阶段**：默认展开，显示所有子任务
- **未开始阶段**：默认折叠，只显示阶段名称和任务计数

#### 5.2.2 手动展开/折叠
- **用户操作**：点击阶段节点的展开/折叠图标
- **状态保存**：展开/折叠状态保存到 `useWorkflowStore.expandedKeys`
- **持久化**：状态持久化到 LocalStorage，刷新后保留

#### 5.2.3 展开状态示例
```
阶段0：项目初始化 ✓ (7)          ← 已完成，默认展开
├─ 编定项目归属 ✓
├─ 确立完整 ✓
└─ ...

阶段1：需求澄清 🔄 (6)           ← 进行中，自动展开
├─ 功能规格说明 🔄
├─ 需求澄清 ⏸
└─ ...

阶段2：方案构建 (6)              ← 未开始，默认折叠
阶段3：实施计划 (0)              ← 未开始，默认折叠
阶段4：任务构造 (0)              ← 未开始，默认折叠
```

---

### 5.3 右栏内容切换逻辑

#### 5.3.1 内容显示规则
右栏根据当前执行节点实时显示内容：

| 执行节点类型 | 右栏显示内容 | Tab 自动切换 |
|-------------|-------------|--------------|
| 阶段节点 | 该阶段的执行日志时间线 | "运行记录" |
| 文档节点 | 文档预览/编辑界面 | "结果预览" |
| 任务节点（自动执行） | 任务输出内容（流式显示） | "运行记录" |
| 任务节点（需确认） | 人工确认界面（如模板选择） | "结果预览" |

#### 5.3.2 需人工确认的任务
某些任务需要用户确认后才能继续执行：

**示例：确立宪章任务**
1. **AI 提示**："请选择项目宪章模板"
2. **右栏显示**：
   - 自动切换到"结果预览" tab
   - 显示模板选择界面：
     - 单选框：标准完整模板（默认选中）
     - 单选框：敏捷模板
     - 单选框：自定义模板
   - 模板预览区域：显示选中模板的内容
   - 底部按钮：确认、编辑
3. **用户确认**：点击"确认"按钮
4. **流程继续**：AI 生成文档，右栏实时显示生成内容

#### 5.3.3 实时内容更新
- **SSE 流式传输**：AI 生成文档时，右栏实时显示增量内容
- **状态同步**：工作流树节点状态同步更新（pending → in_progress → completed）
- **进度显示**：左栏 TaskStatusIndicator 显示当前任务进度

---

### 5.4 模板选择与文档生成流程

#### 5.4.1 完整流程图
```
┌─────────────────────────────────────────────────────────────┐
│  1. AI 询问选择模板                                         │
│     左栏："请选择项目宪章模板"                               │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│  2. 右栏显示模板选择界面                                    │
│     - 自动切换到"结果预览" tab                              │
│     - 显示模板单选框 + 预览                                 │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│  3. 用户选择模板（两种方式）                                │
│     方式A：右栏点击单选框 → 右栏显示选中状态                │
│     方式B：对话输入"选择敏捷模板" → 右栏自动切换选中状态    │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│  4. 用户点击右栏"确认"按钮                                  │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│  5. AI 开始生成文档                                         │
│     - SSE 流式传输文档内容                                  │
│     - 右栏实时显示生成的 Markdown                           │
│     - 工作流树节点状态：pending → in_progress               │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│  6. 文档生成完成                                            │
│     - 右栏显示完整文档 + 底部操作按钮                       │
│     - 工作流树节点状态：in_progress → completed             │
│     - AI 回复："项目宪章已生成，请查看右侧预览"             │
└─────────────────────────────────────────────────────────────┘
```

#### 5.4.2 对话与 UI 双向同步
**场景 1：对话输入驱动 UI 更新**
- 用户在对话框中输入："我要选择敏捷模板"
- 系统行为：
  1. 右栏单选框自动切换到"敏捷模板"
  2. 右栏预览区域显示敏捷模板内容
  3. AI 回复："已为您选择敏捷模板，请确认"

**场景 2：UI 操作生成系统消息**
- 用户点击右栏的"标准完整模板"单选框
- 系统行为：
  1. 右栏单选框切换选中状态
  2. 右栏预览区域显示标准模板内容
  3. 左栏生成系统消息（灰色气泡）："已选择标准完整模板"

---

### 5.5 任务状态管理与显示

#### 5.5.1 任务状态机
```
┌─────────┐      开始执行      ┌─────────────┐
│ pending │ ────────────────→ │ in_progress │
└─────────┘                    └──────┬──────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    │                 │                 │
                 暂停 ↓           完成 ↓           失败 ↓
              ┌────────┐      ┌───────────┐    ┌────────┐
              │ paused │      │ completed │    │ failed │
              └────┬───┘      └───────────┘    └────────┘
                   │
                恢复 │
                   ↓
            ┌─────────────┐
            │ in_progress │
            └─────────────┘
```

#### 5.5.2 状态图标与颜色
| 状态 | 图标 | 颜色 | 描述 |
|------|------|------|------|
| pending | `⏳` | 灰色 | 待执行 |
| in_progress | `🔄` | 黄色（闪烁） | 执行中 |
| completed | `✓` | 绿色 | 已完成 |
| failed | `✗` | 红色 | 失败 |
| paused | `⏸` | 灰色 | 已暂停 |

#### 5.5.3 左栏任务状态指示器
**显示位置**：对话区域上方，输入框上方
**显示内容**：
- 任务名称："确立完整"
- 状态标签：执行中 / 已暂停 / 已完成
- 进度条：0-100%
- 操作按钮：暂停 / 恢复

**示例**：
```
┌─────────────────────────────────┐
│ ⭐ 确立完整                     │
│ 状态：执行中                    │
│ ━━━━━━━━━━━━━━━━━━━ 60%       │
│ [暂停] [取消]                   │
└─────────────────────────────────┘
```

---

### 5.6 文档导出流程

#### 5.6.1 导出飞书文档
**触发方式**：点击右栏底部"导出成飞书文档"按钮

**流程**：
1. 用户点击"导出成飞书文档"按钮
2. 前端调用导出 API：`GET /api/projects/:projectId/documents/:documentId/export?format=feishu`
3. 后端将文档导出到飞书（通过飞书开放平台 API）
4. 前端显示 loading 状态
5. 导出成功后，按钮恢复正常状态
6. **暂不**在对话框中提示导出成功消息

**错误处理**：
- 导出失败时，显示 Ant Design Message 错误提示
- 重试机制：用户可再次点击按钮重试

---

### 5.7 工作流执行的完整用户旅程

#### 5.7.1 项目创建阶段（阶段 0：项目初始化）

**步骤 1：输入项目名称**
```
[User]: 促销活动管理系统
[AI]: 好的，项目名称已确定为"促销活动管理系统"。现在让我们确定项目归属，请问项目属于哪个团队？选择：ADT / 其他
```

**步骤 2：确定项目归属**
```
[User]: ADT
[AI]: 项目【促销活动管理系统】创建成功！项目已转到 ATIT-禁售ADT 下。
    现在让我们进入第一阶段：确立宪章。请选择一个宪章模板，或者告诉我您想自定义的内容。
```
- 右栏自动切换到"结果预览" tab
- 显示模板选择界面

**步骤 3：选择模板**
- 用户在右栏选择"标准完整模板"
- 点击"确认"按钮
- AI 开始生成宪章文档（SSE 流式传输）
- 右栏实时显示生成的 Markdown 内容

**步骤 4：确认宪章**
```
[AI]: 项目宪章已生成，请查看右侧预览。如果您满意，请点击"确认"按钮进入下一阶段。
```
- 用户查看文档内容
- 点击右栏底部"确认"按钮
- 工作流进入下一阶段

#### 5.7.2 需求阶段（阶段 1：需求澄清）

**步骤 1：AI 主动询问需求**
```
[AI]: 请告诉我这个促销活动管理系统的核心功能需求。
```

**步骤 2：用户描述需求**
```
[User]: 我们需要一个系统来管理各种促销活动，包括秒杀、满减、优惠券等。
[AI]: 好的，我了解了。我还有几个问题需要澄清：
     1. 促销活动是否需要支持多商户？
     2. 是否需要与现有订单系统集成？
     3. ...
```

**步骤 3：生成需求文档**
- AI 根据对话生成 `需求规格说明.md`
- 右栏实时显示生成的文档
- 用户确认后进入下一阶段

#### 5.7.3 方案阶段（阶段 2：方案构建）

**步骤 1：技术方案设计**
```
[AI]: 基于您的需求，我为您生成了技术方案，请查看右侧预览。
```
- 右栏显示生成的技术方案文档
- 包含：系统架构、技术栈选型、数据模型等

**步骤 2：任务拆解**
```
[AI]: 技术方案已确认。现在让我为您拆解实施任务...
```
- 工作流进入"任务拆解"子阶段
- 生成任务列表文档

---

### 5.8 边界情况处理

#### 5.8.1 用户在文档生成过程中编辑
**场景**：AI 正在流式生成文档，用户点击"编辑"按钮

**处理方式**：
1. 禁用"编辑"按钮，显示 tooltip："文档生成中，请稍候"
2. 等待流式传输完成后，启用"编辑"按钮

#### 5.8.2 多个任务同时执行
**场景**：某些任务可以并行执行（如前端和后端任务）

**处理方式**：
1. 左栏 TaskStatusIndicator 显示主任务进度
2. 工作流树中多个节点同时显示 `in_progress` 状态
3. 右栏显示当前选中节点的内容

#### 5.8.3 网络断开重连
**场景**：SSE 连接断开

**处理方式**：
1. 检测到断开时，显示重连提示
2. 自动尝试重连（最多 3 次）
3. 重连成功后，从上次断点继续接收数据
4. 重连失败时，显示错误提示，允许用户手动重试

#### 5.8.4 文档版本冲突
**场景**：用户编辑文档时，AI 同时更新了文档

**处理方式**：
1. 检测到冲突时，保留用户编辑内容
2. 将 AI 更新的内容标记为"新版本"
3. 提示用户："文档已被更新，是否查看差异？"
4. 用户可选择：
   - 查看 Diff 对比
   - 保留自己的编辑
   - 接受新版本

---

### 5.9 关键交互时序图

#### 5.9.1 模板选择到文档生成时序图
```
User           Frontend        Backend         AI Service
 │                │               │                │
 │ 选择模板       │               │                │
 │───────────────→│               │                │
 │                │               │                │
 │ 点击确认       │               │                │
 │───────────────→│               │                │
 │                │ POST send     │                │
 │                │──────────────→│                │
 │                │               │ SSE Stream     │
 │                │               │───────────────→│
 │                │               │                │
 │                │     ← chunk 1 (header)         │
 │                │←──────────────────────────────│
 │    更新右栏     │               │                │
 │←───────────────│               │                │
 │                │     ← chunk 2 (content)        │
 │                │←──────────────────────────────│
 │    实时显示     │               │                │
 │←───────────────│               │                │
 │                │     ...       │                │
 │                │     ← complete                 │
 │                │←──────────────────────────────│
 │    显示完整文档 │               │                │
 │←───────────────│               │                │
```

#### 5.9.2 工作流阶段切换时序图
```
User           Frontend        WorkflowStore    Backend
 │                │                 │             │
 │ 确认文档       │                 │             │
 │───────────────→│                 │             │
 │                │ updateTask      │             │
 │                │────────────────→│             │
 │                │                 │ PUT task    │
 │                │                 │────────────→│
 │                │                 │             │
 │                │                 │ Response    │
 │                │                 │←────────────│
 │                │ updateStage     │             │
 │                │────────────────→│             │
 │                │                 │             │
 │    更新UI       │                 │             │
 │←───────────────│                 │             │
 │  - 工作流树更新  │                 │             │
 │  - 右栏切换内容  │                 │             │
 │  - AI 提示下阶段 │                 │             │
```

---

## 6. 状态管理设计

### 5.1 Store 架构

```
┌─────────────────────────────────────────────────────────────┐
│                     Global State (Zustand)                  │
├──────────────────┬──────────────────┬───────────────────────┬─────────────────────┤
│ useDialogStore   │ useWorkflowStore │ useDocumentStore      │ useUIActionStore    │
├──────────────────┼──────────────────┼───────────────────────┼─────────────────────┤
│ - messages       │ - workflow       │ - documents           │ - actionHistory     │
│ - isStreaming    │ - activeStageId  │ - editingDocId        │ - userPreferences   │
│ - toolCalls      │ - selectedDocId  │ - isDiffMode          │ - uiState          │
│ - currentSession │ - expandedKeys   │ - previousContent     │ - sessionId        │
└──────────────────┴──────────────────┴───────────────────────┴─────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              Persistence Middleware                         │
│  - Zustand persist (localStorage)                           │
│  - IndexedDB (persistence.ts)                               │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 useDialogStore

**状态**：
- `messages`: 对话消息列表（按 sessionId 隔离）
- `isStreaming`: 是否正在流式传输
- `toolCalls`: Tool Calls 调用记录（TodoWrite 等）
- `currentSession`: 当前活跃的会话 ID

**操作**：
- `addMessage`: 添加消息到当前会话
- `updateMessage`: 更新消息内容（用于流式更新）
- `appendToStreamingMessage`: 追加内容到流式消息
- `setStreaming`: 设置流式状态
- `addToolCall`: 添加工具调用记录
- `updateToolCall`: 更新工具调用状态
- `clearMessages`: 清空当前会话消息
- `loadMessages`: 加载指定会话的历史消息
- `setCurrentSession`: 切换当前活跃会话

**会话隔离**：
- 每个项目拥有独立的 sessionId
- messages 和 toolCalls 按 sessionId 分别存储
- 支持多项目会话快速切换

**持久化**：
- 持久化：`messages`（按 sessionId）, `toolCalls`
- 不持久化：`isStreaming`, 流式状态

### 5.3 useWorkflowStore

**状态**：
- `workflow`: 工作流对象（包含所有阶段）（按 sessionId 隔离）
- `activeStageId`: 当前激活的阶段 ID
- `selectedDocumentId`: 当前选中的文档 ID
- `expandedKeys`: 展开的树节点 key 列表
- `selectedKeys`: 选中的树节点 key 列表
- `currentSession`: 当前活跃的会话 ID

**操作**：
- `setWorkflow`: 设置工作流
- `updateStage`: 更新阶段信息
- `updateStageStatus`: 更新阶段状态
- `addTask`: 添加任务到阶段
- `updateTask`: 更新任务信息
- `setActiveStage`: 设置激活阶段
- `setSelectedDocument`: 设置选中文档
- `toggleExpanded`: 切换节点展开状态
- `syncTodosToTasks`: 同步 TodoWrite 数据到工作流树
- `setCurrentSession`: 切换当前活跃会话
- `clearWorkflow`: 清空当前会话工作流

**TodoWrite 集成**：
- 自动从 AI Tool Calls 中提取 TodoWrite 数据
- 平铺任务结构：所有 todo 项作为独立任务展示
- 实时状态同步：pending/in_progress/completed 状态实时更新
- 自动创建工作流：首次 todo 出现时自动创建默认"任务列表"阶段

**会话隔离**：
- 每个项目的工作流数据完全独立
- 支持多项目工作流状态并存

**持久化**：
- 全部持久化到 LocalStorage（按 sessionId）

### 5.4 useDocumentStore

**状态**：
- `documents`: 文档 Map（key: documentId, value: Document）
- `editingDocumentId`: 当前正在编辑的文档 ID
- `isDiffMode`: 是否处于 Diff 模式
- `previousDocumentContent`: 编辑前的文档内容（用于对比）

**操作**：
- `setDocument`: 设置单个文档
- `setDocuments`: 批量设置文档
- `updateDocument`: 更新文档信息
- `removeDocument`: 删除文档
- `startEditing`: 开始编辑文档
- `stopEditing`: 停止编辑
- `enterDiffMode`: 进入对比模式
- `exitDiffMode`: 退出对比模式

**持久化**：
- 持久化：`documents`
- 不持久化：编辑状态和临时内容

### 5.5 useUIActionStore

**状态**：
- `actionHistory`: 用户操作历史记录
- `userPreferences`: 用户偏好设置（主题、语言等）
- `uiState`: UI 交互状态（侧边栏折叠状态等）
- `sessionId`: 当前会话标识

**操作**：
- `recordAction`: 记录用户操作
- `updatePreferences`: 更新用户偏好
- `setUIState`: 设置 UI 状态
- `clearActionHistory`: 清空操作历史

**用途**：
- 用户行为分析和体验优化
- 个性化设置持久化
- UI 状态恢复（折叠状态、窗口位置等）

**持久化**：
- 全部持久化到 LocalStorage

---

## 7. 数据持久化架构

### 6.1 IndexedDB 设计

**数据库名称**：`ai-workflow-db`
**版本**：1

**Object Stores**：

| Store 名称 | Key Path | 索引 | 用途 |
|-----------|----------|------|------|
| workflow | projectId | updatedAt | 存储工作流对象 |
| documents | id | projectId, updatedAt | 存储文档内容 |
| session | key | timestamp | 存储会话数据 |
| tasks | taskId | projectId, status, createdAt | 存储任务信息 |

### 6.2 持久化策略

**数据分层**：
```
LocalStorage (Zustand persist)
- 会话状态（当前对话、工作流树状态）
- 用户偏好设置（主题、语言）
- 轻量级数据（< 5MB）

IndexedDB (persistence.ts)
- 大量文档数据
- 历史会话记录
- 后台任务状态
- 重量级数据（无限制）
```

**同步时机**：
- **立即同步**：用户操作（发送消息、编辑文档）
- **延迟同步**：流式响应完成后批量更新
- **后台同步**：页面空闲时同步 IndexedDB 到服务器

---

## 8. API 接口设计

### 7.1 RESTful API 端点

#### 对话接口

| 方法 | 端点 | 描述 |
|------|------|------|
| POST | `/api/projects/:projectId/dialog/send` | 发送消息 |
| GET | `/api/projects/:projectId/dialog/history` | 获取对话历史 |
| DELETE | `/api/projects/:projectId/dialog` | 清空对话 |

#### 工作流接口

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/api/projects/:projectId/workflow` | 获取工作流 |
| PUT | `/api/projects/:projectId/workflow/stages/:stageId` | 更新阶段状态 |
| POST | `/api/projects/:projectId/workflow/stages/:stageId/tasks` | 添加任务 |
| PUT | `/api/projects/:projectId/workflow/stages/:stageId/tasks/:taskId` | 更新任务 |
| POST | `/api/projects/:projectId/workflow/tasks/:taskId/pause` | 暂停任务 |
| POST | `/api/projects/:projectId/workflow/tasks/:taskId/resume` | 恢复任务 |

#### 文档接口

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/api/projects/:projectId/documents` | 获取所有文档 |
| GET | `/api/projects/:projectId/documents/:documentId` | 获取文档详情 |
| PUT | `/api/projects/:projectId/documents/:documentId` | 更新文档内容 |
| GET | `/api/projects/:projectId/documents/:documentId/versions` | 获取版本历史 |
| GET | `/api/projects/:projectId/documents/:documentId/export` | 导出文档 |

#### 附件接口

| 方法 | 端点 | 描述 |
|------|------|------|
| POST | `/api/projects/:projectId/attachments/upload` | 上传附件 |
| GET | `/api/projects/:projectId/attachments/:attachmentId` | 下载附件 |
| DELETE | `/api/projects/:projectId/attachments/:attachmentId` | 删除附件 |

### 7.2 SSE 流式接口

#### 对话流式响应

**端点**：`GET /api/projects/:projectId/dialog/stream`

**事件类型**：

| 事件类型 | data 字段 | 描述 |
|---------|----------|------|
| `message` | `{ accumulated: string }` | AI 消息内容增量更新 |
| `status` | `{ taskName: string, status: string, progress?: number }` | 任务状态更新 |
| `document_update` | `{ documentId: string, content: string }` | 文档内容更新 |
| `workflow_update` | `{ stageId: string, status: string }` | 工作流阶段更新 |
| `complete` | `{}` | 流式传输完成 |
| `error` | `{ message: string }` | 错误信息 |

### 7.3 数据模型

#### Message（消息）

| 字段 | 类型 | 描述 |
|------|------|------|
| id | string | 消息 ID |
| conversationId | string | 对话 ID |
| sender | 'user' \| 'ai' \| 'system' | 发送者类型 |
| content | string | 消息内容 |
| type | 'text' \| 'voice' \| 'system_notification' | 消息类型 |
| timestamp | string | 时间戳 |
| metadata | object | 元数据（isStreaming, attachments） |

#### Workflow（工作流）

| 字段 | 类型 | 描述 |
|------|------|------|
| id | string | 工作流 ID |
| projectId | string | 项目 ID |
| stages | Stage[] | 阶段列表（5个） |
| currentStageIndex | number | 当前阶段索引 |

#### Stage（阶段）

| 字段 | 类型 | 描述 |
|------|------|------|
| id | string | 阶段 ID |
| name | string | 阶段名称 |
| status | 'pending' \| 'in_progress' \| 'completed' \| 'paused' \| 'failed' | 状态 |
| documents | Document[] | 文档列表 |
| tasks | Task[] | 任务列表 |

#### Document（文档）

| 字段 | 类型 | 描述 |
|------|------|------|
| id | string | 文档 ID |
| name | string | 文档名称（spec.md, plan.md 等） |
| content | string | Markdown 内容 |
| status | 'draft' \| 'completed' | 状态 |
| version | number | 版本号 |
| author | string | 作者 |
| createdAt | string | 创建时间 |
| updatedAt | string | 更新时间 |

#### Task（任务）

| 字段 | 类型 | 描述 |
|------|------|------|
| id | string | 任务 ID |
| name | string | 任务名称 |
| status | 'pending' \| 'in_progress' \| 'completed' \| 'paused' \| 'failed' | 状态 |
| progress | number | 进度（0-100） |
| startTime | string | 开始时间 |
| endTime | string | 结束时间 |

#### AttachmentInfo（附件）

| 字段 | 类型 | 描述 |
|------|------|------|
| id | string | 附件 ID |
| name | string | 文件名 |
| size | number | 文件大小（字节） |
| url | string | 下载 URL |
| type | string | MIME 类型 |

---

## 9. UI 设计规范

### 8.1 颜色系统

**主色调**：
| 颜色 | 色值 | 用途 |
|------|------|------|
| Primary | `#1677ff` | 主要操作、链接 |
| Success | `#52c41a` | 成功状态 |
| Warning | `#faad14` | 警告状态 |
| Error | `#ff4d4f` | 错误状态 |

**中性色**：
| 颜色 | 色值 | 用途 |
|------|------|------|
| Text Primary | `rgba(0, 0, 0, 0.88)` | 主要文本 |
| Text Secondary | `rgba(0, 0, 0, 0.65)` | 次要文本 |
| Text Disabled | `rgba(0, 0, 0, 0.45)` | 禁用文本 |
| Border | `#d9d9d9` | 边框 |
| Background Container | `#ffffff` | 容器背景 |
| Background Layout | `#fafafa` | 布局背景 |

### 8.2 布局规范

**间距系统**：
| 级别 | 值 | 用途 |
|------|-----|------|
| XS | 4px | 图标与文字间距 |
| S | 8px | 按钮内部 padding |
| M | 12px | 卡片内部 padding |
| L | 16px | 卡片间距、面板 padding |
| XL | 24px | 区块间距 |

**圆角**：
| 级别 | 值 | 用途 |
|------|-----|------|
| Small | 4px | 按钮、输入框 |
| Medium | 8px | 卡片 |
| Large | 12px | 面板 |

### 8.3 排版规范

**字体大小**：
| 级别 | 值 | 用途 |
|------|-----|------|
| XS | 12px | 辅助文字 |
| S | 14px | 正文 |
| M | 16px | 标题 |
| L | 18px | 一级标题 |
| XL | 20px | 页面标题 |

**字重**：
| 级别 | 值 | 用途 |
|------|-----|------|
| Regular | 400 | 正文 |
| Medium | 500 | 强调文字 |
| Semibold | 600 | 标题 |
| Bold | 700 | 重要标题 |

**行高**：
| 级别 | 值 | 用途 |
|------|-----|------|
| Tight | 1.2 | 标题 |
| Normal | 1.5 | 正文 |
| Relaxed | 1.8 | 长文本 |

### 8.4 交互规范

**气泡样式**：
- **用户消息**：右对齐、蓝色填充背景、无头像、最大宽度 600px
- **AI 消息**：左对齐、白色边框背景、无头像、最大宽度 600px
- **系统消息**：左对齐、灰色边框背景、无头像

**按钮样式**：
- **主要操作**：蓝色背景、白色文字
- **次要操作**：白色背景、灰色边框
- **危险操作**：红色文字、红色边框
- **文本按钮**：无背景、无边框

**加载状态**：
- **骨架屏**：首次加载使用 Skeleton
- **Spin**：局部加载使用 Spin 组件
- **进度条**：任务执行使用 Progress 组件
- **Typing 动画**：AI 流式响应显示 typing 动画（三个跳动的点）

---

## 10. 部署架构

### 9.1 构建流程

```
┌─────────────────┐
│  Source Code    │
│  (TypeScript)   │
└────────┬────────┘
         ↓
┌─────────────────┐
│   Vite Build    │
│   (Rollup)      │
└────────┬────────┘
         ↓
┌─────────────────┐
│   dist/         │
│   - index.html  │
│   - assets/     │
└────────┬────────┘
         ↓
┌─────────────────┐
│  Docker Image   │
│  (Nginx)        │
└────────┬────────┘
         ↓
┌─────────────────┐
│   Deployment    │
│  (K8s/ECS/VM)   │
└─────────────────┘
```

### 9.2 Docker 部署

**多阶段构建**：
1. **Stage 1 (Builder)**：使用 Node.js 镜像编译 TypeScript 和打包
2. **Stage 2 (Production)**：使用 Nginx 镜像部署静态文件

**Nginx 配置要点**：
- SPA 路由：`try_files $uri $uri/ /index.html`
- API 代理：`proxy_pass http://backend:3000`
- SSE 支持：`proxy_http_version 1.1` + `Connection 'keep-alive'`
- Gzip 压缩：开启文本、CSS、JS 压缩

### 9.3 CI/CD 流程

```
┌─────────────────┐
│   Git Push      │
│   (main branch) │
└────────┬────────┘
         ↓
┌─────────────────┐
│  CI Pipeline    │
│  - npm ci       │
│  - npm run lint │
│  - npm test     │
│  - npm run build│
└────────┬────────┘
         ↓
┌─────────────────┐
│ Docker Build    │
│ & Push Registry │
└────────┬────────┘
         ↓
┌─────────────────┐
│ CD Pipeline     │
│ - K8s Apply     │
│ - Health Check  │
│ - Rollback      │
└─────────────────┘
```

---

## 11. 性能优化策略

### 10.1 代码分割

- **Route-based Splitting**：按路由分割代码（如果有多页面）
- **Vendor Splitting**：分离第三方库（React, Ant Design, Markdown）
- **Dynamic Import**：组件懒加载（DocumentPreview, ExecutionLog）

### 10.2 渲染优化

- **虚拟滚动**：长列表（消息列表、日志列表）使用虚拟滚动
- **Memo 优化**：高频渲染组件使用 React.memo
- **Debounce/Throttle**：输入框搜索、窗口 resize 事件

### 10.3 网络优化

- **HTTP/2**：Nginx 开启 HTTP/2
- **Gzip/Brotli**：压缩文本资源
- **CDN 加速**：静态资源使用 CDN
- **Service Worker**：离线缓存和资源预加载

### 10.4 IndexedDB 优化

- **批量写入**：使用事务批量更新
- **索引优化**：为常用查询字段添加索引
- **定期清理**：清理过期数据

---

## 12. 已实现的高级特性 (2025-10-27更新)

### 12.1 扩展的任务UI组件系统

#### 12.1.1 设计理念

为了支持不同任务类型的交互需求（如模板选择、文件上传、表单填写等），我们实现了一个**可扩展的任务UI组件注册架构**。

#### 12.1.2 核心组件

**TaskUIRegistry.tsx** - 组件注册表

```typescript
// 支持的UI类型
export type TaskUIType =
  | 'template-selection'  // 模板选择
  | 'file-upload'         // 文件上传
  | 'confirmation'        // 确认对话框
  | 'form-input'          // 表单输入
  | 'default';            // 默认详情展示

// 组件注册表
export const TASK_UI_REGISTRY: Record<TaskUIType, TaskUIComponent> = {
  'template-selection': TemplateSelectionUI,
  'file-upload': DefaultTaskUI,
  'confirmation': DefaultTaskUI,
  'default': DefaultTaskUI,
};

// 智能类型推断
export function inferTaskUIType(task: Task): TaskUIType {
  // 1. 优先使用显式指定的类型
  if (task.metadata?.uiComponentType) {
    return task.metadata.uiComponentType as TaskUIType;
  }

  // 2. 根据任务名称推断
  const taskName = task.name.toLowerCase();
  if (taskName.includes('模板') || taskName.includes('宪章')) {
    return 'template-selection';
  }
  if (taskName.includes('上传')) {
    return 'file-upload';
  }

  // 3. 默认UI
  return 'default';
}
```

#### 12.1.3 添加新UI组件的步骤

**步骤 1**：定义UI类型
```typescript
export type TaskUIType = /* ... */ | 'my-new-ui';
```

**步骤 2**：创建UI组件
```typescript
// MyNewUI.tsx
export function MyNewUI({ task, onComplete, onCancel }: TaskUIComponentProps) {
  return (
    <div>
      <h3>{task.name}</h3>
      {/* 自定义UI逻辑 */}
      <button onClick={() => onComplete({ result: 'success' })}>
        完成
      </button>
    </div>
  );
}
```

**步骤 3**：注册组件
```typescript
export const TASK_UI_REGISTRY: Record<TaskUIType, TaskUIComponent> = {
  // ... existing
  'my-new-ui': MyNewUI,
};
```

**步骤 4**：添加推断规则（可选）
```typescript
export function inferTaskUIType(task: Task): TaskUIType {
  // ... existing
  if (taskName.includes('关键词')) {
    return 'my-new-ui';
  }
  return 'default';
}
```

#### 12.1.4 已实现的UI组件

**TemplateSelectionUI** - 模板选择界面

特性：
- Radio单选界面
- 实时模板预览
- 支持自定义模板列表（通过 `task.metadata.uiProps.templates`）
- 对话驱动自动选择（通过UIActionStore）

使用示例：
```typescript
const task: Task = {
  // ...
  metadata: {
    uiComponentType: 'template-selection',
    uiProps: {
      templates: [
        { id: 'agile', name: '敏捷宪章模板', description: '...' },
        { id: 'waterfall', name: '瀑布式宪章模板', description: '...' },
      ]
    }
  }
};
```

### 12.2 对话驱动UI操作系统

#### 12.2.1 UIActionStore 状态管理

**功能**：管理由AI对话触发的UI操作指令

**核心接口**：
```typescript
export interface UIAction {
  id: string;
  type: UIActionType;        // 'select-template' | 'select-task' | 'fill-form' | ...
  payload: any;              // 操作数据
  timestamp: number;
  executed: boolean;
  source: 'dialog' | 'sse' | 'manual';
}
```

**使用场景**：
1. AI通过SSE发送 `ui_action` 事件
2. ChatInterface 接收事件，添加到 UIActionStore
3. 目标UI组件通过 `useUIAction` Hook 消费操作
4. 组件执行操作后标记为已执行

#### 12.2.2 useUIAction Hook

**用法**：
```typescript
// 在UI组件中监听特定类型的操作
useUIAction<{ templateId: string }>(
  'select-template',
  (payload) => {
    const template = templates.find(t => t.id === payload.templateId);
    if (template) {
      setSelectedTemplate(template.id);
      message.success(`已自动选择模板：${template.name}`);
    }
  }
);
```

**工作流程**：
```
AI对话: "我要选择敏捷模板"
     ↓
SSE事件: { type: 'ui_action', data: { actionType: 'select-template', payload: { templateName: '敏捷' }}}
     ↓
UIActionStore: 添加待执行操作
     ↓
TemplateSelectionUI: useUIAction 监听并执行
     ↓
UI更新: 自动选中敏捷模板
```

### 12.3 任务状态管理增强

#### 12.3.1 新增 Paused 状态

**TaskStatus 枚举**：
```typescript
export enum TaskStatus {
  Pending = 'pending',
  InProgress = 'in_progress',
  Completed = 'completed',
  Failed = 'failed',
  Paused = 'paused',          // 新增
}
```

#### 12.3.2 API 集成

**updateTaskStatus** - 更新任务状态

```typescript
// src/services/api/workflow.ts
export async function updateTaskStatus(
  projectId: string,
  taskId: string,
  status: TaskStatus
): Promise<ApiResponse<Task>> {
  return patch<Task>(`/projects/${projectId}/workflow/tasks/${taskId}`, { status });
}
```

**API 端点**：`PATCH /projects/{projectId}/workflow/tasks/{taskId}`

#### 12.3.3 UI 实现

**TaskStatusIndicator** - 任务状态指示器

特性：
- 显示当前任务名称、状态、进度条
- 暂停/恢复按钮（根据状态动态显示）
- 闪烁动画效果（执行中状态）

**ChatInterface 集成**：
```typescript
const handlePauseTask = async () => {
  if (!currentTaskStatus) return;

  try {
    await updateTaskStatus(projectId, currentTaskStatus.taskId, TaskStatus.Paused);
    setTaskStatus(currentTaskStatus.taskId, currentTaskStatus.taskName, TaskStatus.Paused, currentTaskStatus.progress);
    message.success('任务已暂停');
  } catch (error) {
    message.error('暂停任务失败，请重试');
  }
};
```

### 12.4 飞书文档同步

#### 12.4.1 syncToFeishu API

**功能**：将本地文档同步到飞书，支持创建新文档或更新已有文档

**API 端点**：`POST /projects/{projectId}/documents/{documentId}/feishu/sync`

**请求参数**：
```typescript
{
  createNewDoc?: boolean;  // 是否强制创建新文档
}
```

**响应数据**：
```typescript
{
  feishuDocId: string;     // 飞书文档ID
  feishuUrl: string;       // 飞书文档访问链接
}
```

#### 12.4.2 UI 集成

**DocumentPreview 组件**：
- 添加"导出到飞书"按钮
- 直接导出，无需确认对话框（符合spec要求）
- 成功后显示飞书文档链接
- 失败时显示"文档已保存在本地"提示

**实现代码**：
```typescript
const handleExportToFeishu = async () => {
  try {
    const response = await syncToFeishu(projectId, documentId, {
      documentId,
      createNewDoc: false,
    });

    if (response.success && response.data) {
      updateDocument(documentId, {
        feishuDocId: response.data.feishuDocId,
      });

      message.success({
        content: (
          <span>
            文档已导出到飞书{' '}
            <a href={response.data.feishuUrl} target="_blank">
              点击查看
            </a>
          </span>
        ),
      });
    }
  } catch (error) {
    message.error('导出到飞书失败，文档已保存在本地');
  }
};
```

### 12.5 数据模型更新

#### 12.5.1 TaskMetadata 接口

**新增字段**：
```typescript
export interface TaskMetadata {
  uiComponentType?: string;           // UI组件类型
  uiProps?: Record<string, any>;      // 传递给UI组件的属性
  [key: string]: any;                 // 其他自定义元数据
}

export interface Task {
  id: string;
  stageId: string;
  name: string;
  description?: string;
  status: TaskStatus;
  createdAt: string;
  completedAt?: string;
  metadata?: TaskMetadata;            // 新增
}
```

#### 12.5.2 StatusEventData 更新

**新增 taskId 字段**：
```typescript
export interface StatusEventData {
  taskId: string;                     // 新增：用于API调用
  taskName: string;
  status: TaskStatus;
  progress?: number;
  message?: string;
}
```

### 12.6 工作流树智能展开逻辑

#### 12.6.1 自动展开规则

- **初始加载时**：
  - InProgress 阶段：自动展开
  - Completed 阶段：自动展开
  - Pending 阶段：默认折叠

- **运行时**：
  - 当阶段状态变为 InProgress：自动展开
  - 不覆盖用户手动操作的状态

#### 12.6.2 实现机制

使用 `useRef` 跟踪用户手动操作：
```typescript
const manuallyExpandedKeys = useRef<Set<string>>(new Set());

const handleExpand = (expandedKeys: string[], info: any) => {
  if (info.expanded) {
    manuallyExpandedKeys.current.add(info.node.key);
  } else {
    manuallyExpandedKeys.current.delete(info.node.key);
  }
  setExpandedKeys(expandedKeys);
};

// 运行时自动展开（不覆盖用户操作）
useEffect(() => {
  workflow?.stages.forEach((stage) => {
    if (stage.status === StageStatus.InProgress) {
      const key = `stage-${stage.id}`;
      if (!manuallyExpandedKeys.current.has(key)) {
        setExpandedKeys((prev) => [...prev, key]);
      }
    }
  });
}, [workflow]);
```

### 12.7 运行记录UI组件嵌入系统 (2025-10-27 新增)

#### 12.7.1 设计理念

**核心原则**：任务执行过程中的所有交互式UI组件（如模板选择、确认对话框等）应该**嵌入在运行记录（ExecutionLog）中**，而不是作为独立的面板区域。

**交互流程**：
```
用户输入 → AI处理 → 运行记录显示执行过程
                    ↓
              运行记录包含：
              - 时间线日志
              - 嵌入的UI组件 ← 用户在此交互
              - 任务状态更新
              - 文档链接
                    ↓
              点击文档链接 → 右侧"结果预览"显示文档
```

#### 12.7.2 扩展的ExecutionLog数据模型

**新增枚举和接口** (src/types/models.ts:96-138)

```typescript
export enum ExecutionLogType {
  Log = 'log',                    // 普通文本日志
  UIComponent = 'ui_component',   // 需要用户交互的UI组件
  DocumentLink = 'document_link', // 文档链接
  TaskStatus = 'task_status',     // 任务状态更新
}

export interface ExecutionLog {
  id: string;
  stageId: string;
  timestamp: string;
  level: LogLevel;
  message: string;
  type: ExecutionLogType; // 新增：日志类型
  metadata?: Record<string, unknown>;

  // UI组件相关字段 (当 type === 'ui_component' 时)
  uiComponent?: {
    type: string; // 'template-selection' | 'confirmation' | 'form-input'
    props?: Record<string, any>;
    taskId?: string; // 关联的任务ID
  };

  // 文档链接相关字段 (当 type === 'document_link' 时)
  documentLink?: {
    documentId: string;
    documentName: string;
  };

  // 任务状态更新相关字段 (当 type === 'task_status' 时)
  taskStatus?: {
    taskId: string;
    taskName: string;
    status: TaskStatus;
  };
}
```

#### 12.7.3 ExecutionLog组件的4种渲染模式

**实现位置**：`src/components/preview/ExecutionLog.tsx`

```typescript
const renderLogContent = (log: ExecutionLog) => {
  switch (log.type) {
    case 'ui_component':
      return renderUIComponent(log);    // 嵌入交互式组件
    case 'document_link':
      return renderDocumentLink(log);   // 文档链接按钮
    case 'task_status':
      return renderTaskStatus(log);     // 任务状态标签
    case 'log':
    default:
      return renderTextLog(log);        // 普通文本
  }
};
```

**1. 普通文本日志** (`renderTextLog`)
```tsx
💭 项目「促销活动管理系统」创建成功！
时间：2025-10-27 09:05:00
```

**2. 嵌入式UI组件** (`renderUIComponent`)
```tsx
请选择一个宪章模板，或者告诉我您想要自定义的宪章内容
时间：2025-10-27 09:05:30

┌─────────────────────────────────────┐
│  [模板选择组件直接嵌入在这里]       │
│  ○ 敏捷开发宪章                     │
│  ○ 瀑布式开发宪章                   │
│  ○ 精益创业宪章                     │
│  [确定] [取消]                      │
└─────────────────────────────────────┘
```

实现代码：
```typescript
const renderUIComponent = (log: ExecutionLog) => {
  const task = workflow?.stages
    .flatMap((s) => s.tasks)
    .find((t) => t.id === log.uiComponent?.taskId);

  const TaskUIComponent = getTaskUIComponent(task);

  return (
    <div>
      <div>{log.message}</div>
      <div>{formatDate(log.timestamp, { includeTime: true })}</div>
      {/* 嵌入的UI组件 */}
      <div style={{ padding: '16px', backgroundColor: '#fafafa' }}>
        <TaskUIComponent
          task={task}
          onComplete={(result) => {
            // 发送结果到后端
          }}
          onCancel={() => {}}
        />
      </div>
    </div>
  );
};
```

**3. 文档链接** (`renderDocumentLink`)
```tsx
✅ 宪章文档已生成
时间：2025-10-27 09:10:00
📄 [constitution.md] ← 点击跳转到结果预览
```

实现代码：
```typescript
const renderDocumentLink = (log: ExecutionLog) => {
  const handleDocumentClick = () => {
    setSelectedDocument(log.documentLink!.documentId);
  };

  return (
    <div>
      <div>{log.message}</div>
      <div>{formatDate(log.timestamp, { includeTime: true })}</div>
      <Button
        type="link"
        icon={<FileTextOutlined />}
        onClick={handleDocumentClick}
      >
        {log.documentLink.documentName}
      </Button>
    </div>
  );
};
```

**4. 任务状态标签** (`renderTaskStatus`)
```tsx
任务完成：创建宪章
时间：2025-10-27 09:10:30
[创建宪章: 已完成] ← 绿色标签
```

#### 12.7.4 RightPanel简化

移除了独立的任务UI显示逻辑（之前在"结果预览"标签中显示）。

**更新后的逻辑** (src/components/layout/RightPanel.tsx):
```typescript
const items = [
  {
    key: 'logs',
    label: '运行记录',
    children: <ExecutionLog stageId={activeStageId} />
    // ↑ 包含所有UI组件交互
  },
  {
    key: 'preview',
    label: '结果预览',
    children: selectedDocumentId ? (
      <DocumentPreview documentId={selectedDocumentId} />
    ) : (
      <Empty description="请从工作流树中选择一个文档查看" />
    )
    // ↑ 仅显示文档内容，不再显示任务UI
  },
];
```

#### 12.7.5 完整交互示例

**场景**：用户创建项目"促销活动管理系统"

**运行记录时间线**：
```
Timeline
├─ 💭 开始执行阶段0：项目初始化 (09:00:00)
├─ [蓝色标签] 开始执行任务：确定项目归属 (09:01:00)
├─ 💭 项目推荐归属于渠道ADT，确认是否合适？ (09:02:00)
├─ [绿色标签] 任务完成：确定项目归属 (09:03:00)
├─ [蓝色标签] 开始执行任务：创建宪章 (09:04:00)
├─ 💭 项目创建成功！现在撰写宪章 (09:05:00)
│
├─ 📋 请选择一个宪章模板... (09:05:30)
│   ┌─────────────────────────────┐
│   │ ○ 敏捷开发宪章              │
│   │ ○ 瀑布式开发宪章            │
│   │ ○ 精益创业宪章              │
│   │ [确定] [取消]               │
│   └─────────────────────────────┘
│       ↑ 用户在此选择并点击确定
│
├─ ✅ 已选择模板：敏捷开发宪章 (09:08:00)
├─ 正在生成宪章文档... (09:09:00)
├─ ✅ 宪章文档已生成 (09:10:00)
│   📄 [constitution.md] ← 点击跳转到结果预览
│       ↑ 点击后自动切换到"结果预览"标签
└─ [绿色标签] 任务完成：创建宪章 (09:10:30)
```

#### 12.7.6 Mock数据示例

**位置**：`src/mocks/data/workflows.ts:91-209`

```typescript
executionLogs: [
  {
    id: 'log-007',
    stageId: 'stage-0-001',
    timestamp: '2025-10-27T09:05:30Z',
    level: 'info',
    type: 'ui_component', // ← UI组件类型
    message: '请选择一个宪章模板，或者告诉我您想要自定义的宪章内容',
    uiComponent: {
      type: 'template-selection',
      taskId: 'task-002',
      props: {},
    },
  },
  {
    id: 'log-010',
    stageId: 'stage-0-001',
    timestamp: '2025-10-27T09:10:00Z',
    level: 'success',
    type: 'document_link', // ← 文档链接类型
    message: '✅ 宪章文档已生成',
    documentLink: {
      documentId: 'doc-001',
      documentName: 'constitution.md',
    },
  },
];
```

#### 12.7.7 优势和设计决策

**为什么采用这种设计？**

1. **符合用户心智模型**：用户期望在"运行记录"中看到执行过程，UI交互是过程的一部分
2. **减少面板切换**：用户不需要在"运行记录"和独立UI区域之间跳转
3. **保持时间线连贯性**：所有操作按时间顺序排列，清晰展示流程
4. **易于扩展**：添加新的日志类型只需扩展 `ExecutionLogType` 枚举
5. **UI组件复用**：使用 `TaskUIRegistry` 复用任务UI组件

**权衡考虑**：
- ❌ 运行记录可能变得很长（需要虚拟滚动优化）
- ✅ 但用户可以看到完整的执行历史
- ✅ 可以通过时间线折叠/展开来管理长度

---

## 13. 测试策略

### 11.1 单元测试

- **工具**：Vitest + React Testing Library
- **覆盖范围**：
  - 组件渲染测试
  - 状态管理测试（Store actions）
  - 工具函数测试（format, persistence）

### 11.2 集成测试

- **覆盖范围**：
  - 组件间交互（WorkflowTree → RightPanel）
  - API 调用流程
  - SSE 流式响应

### 11.3 E2E 测试

- **工具**：Playwright
- **测试场景**：
  - 完整对话流程
  - 文档编辑和保存
  - 任务暂停和恢复
  - 会话持久化

---

## 14. 开发规范

### 12.1 代码规范

- **ESLint**：使用 Airbnb 规范 + React Hooks 规则
- **Prettier**：统一代码格式
- **TypeScript**：严格模式，禁止 `any`

### 12.2 提交规范

- **Commit Message**：遵循 Conventional Commits
  - `feat`: 新功能
  - `fix`: 修复 bug
  - `docs`: 文档更新
  - `refactor`: 重构
  - `test`: 测试
  - `chore`: 构建/工具配置

### 12.3 分支管理

- `main`: 生产分支
- `develop`: 开发分支
- `feature/*`: 功能分支
- `bugfix/*`: 修复分支

---

## 15. 未来规划

### 13.1 待实现功能

- **数据视图 Tab**：项目数据统计、进度图表
- **文件管理 Tab**：上传/下载项目文件
- **多项目管理**：创建、切换、删除项目
- **协作功能**：实时协作、评论、通知
- **语音输入**：Web Speech API 语音转文字
- **导出功能**：导出完整项目报告（PDF、Word）
- **主题切换**：亮色/暗色主题

### 13.2 性能优化计划

- 增量式文档渲染（大文档分段加载）
- SSE 连接池管理
- 离线模式（Service Worker）
- 图片懒加载和压缩

### 13.3 用户体验优化

- 键盘快捷键支持
- 拖拽上传文件
- 消息搜索功能
- 自定义工作流模板

---

## 附录

### A. 环境变量配置

**开发环境** (`.env.development`)：
- `VITE_API_BASE_URL`: 后端 API 地址
- `VITE_SSE_BASE_URL`: SSE 服务地址
- `VITE_ENABLE_MOCK`: 是否启用 MSW Mock

**生产环境** (`.env.production`)：
- `VITE_API_BASE_URL`: 生产 API 地址
- `VITE_SSE_BASE_URL`: 生产 SSE 地址
- `VITE_ENABLE_MOCK`: `false`

### B. 依赖版本锁定

建议使用 `package-lock.json` 或 `pnpm-lock.yaml` 锁定依赖版本，确保团队一致性。

### C. 浏览器兼容性

- **目标浏览器**：Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Polyfill**：Vite 自动注入必要的 polyfill

---

**文档结束**
