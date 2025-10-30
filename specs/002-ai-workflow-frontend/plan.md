# Implementation Plan: AI-Driven Workflow Execution Frontend

**Branch**: `002-ai-workflow-frontend` | **Date**: 2025-10-25 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-ai-workflow-frontend/spec.md`
**User Requirements**: 封装好request.js请求方法以及错误处理，设计好接口api,前端先mock数据，不需要后端

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

实现一个 AI 驱动的软件开发流程执行系统前端，采用三栏式布局（3:2:5），支持 AI 对话、工作流可视化（5个阶段）、文档实时预览和编辑。前端独立开发，通过封装的 request.js 统一处理 HTTP 请求和错误，使用 Mock Service Worker (MSW) 模拟后端 API，支持 SSE 流式响应。技术栈为 React + TypeScript + Zustand + Ant Design + AIOS-Design。

## Technical Context

**Language/Version**: TypeScript 5.x + React 18.x
**Primary Dependencies**:
- React 18.x (UI framework)
- TypeScript 5.x (type safety)
- Zustand (state management for local state)
- Context API (global state management)
- Ant Design 5.x (UI component library)
- AIOS-Design (企业级 UI 组件库)
- Axios (HTTP client for API calls)
- react-markdown 9.0.1 + remark-gfm 4.0.0 (Markdown rendering)
- react-window 1.8.10 (virtual scrolling)
- react-textarea-autosize 8.5.4 (adaptive text input)
- MSW (Mock Service Worker) 2.x (API mocking)

**Storage**: Browser IndexedDB (session persistence), LocalStorage (user preferences)
**Testing**: Vitest (unit tests), React Testing Library (component tests), Playwright (e2e tests)
**Target Platform**: 现代桌面浏览器 (Chrome, Firefox, Safari, Edge)，不支持移动端
**Project Type**: Web (frontend-only with mocked backend)
**Performance Goals**:
- 页面加载时间 < 2秒（标准宽带环境）
- AI 响应流式延迟 < 500ms
- 文档生成 < 30秒（5000字以内）
- 支持 100 并发用户无性能降级
- 虚拟滚动支持 >100 条对话消息
- 树组件支持 >50 节点时启用虚拟滚动

**Constraints**:
- 响应式设计仅支持桌面屏幕尺寸
- API 响应时间 p95 < 200ms
- SSE 连接断开时自动重连（指数退避）
- IAM SSO token 存储于 httpOnly cookie
- 文档版本控制采用"本地优先"策略（local → Feishu 单向同步）

**Scale/Scope**:
- 预计支持 1000+ 个项目
- 单个对话历史可达 500+ 条消息
- 单个项目可包含 20+ 个文档
- 工作流树最多 5 个阶段 × 10 个子任务 = 50 节点

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Constitution Status**: Constitution file is a template and has not been ratified yet. Proceeding with industry best practices and SpecKit methodology guidelines.

**Assumed Principles** (to be validated when constitution is established):

### ✅ 1. Component-First Architecture
- 每个功能模块构建为独立的 React 组件
- 组件必须自包含、可独立测试、有文档
- 清晰的职责划分：UI 组件、业务逻辑组件、布局组件

### ✅ 2. Type Safety (NON-NEGOTIABLE)
- TypeScript strict mode enabled
- 所有 API 响应必须有明确的类型定义
- Props 和 State 必须有类型注解
- 避免使用 `any` 类型

### ✅ 3. Test-First Development
- 单元测试覆盖率 > 80%
- 关键交互路径必须有端到端测试
- Mock 数据驱动开发，后端 API 独立

### ✅ 4. Frontend-Backend Contract
- API contracts 定义在 `/contracts/` 目录
- 使用 OpenAPI 3.0 规范
- Mock Service Worker (MSW) 实现 API mock
- Frontend 和 Backend 可独立开发

### ✅ 5. Simplicity & YAGNI
- 从简单方案开始，避免过度设计
- 状态管理使用 Zustand（轻量级）而非 Redux
- 优先使用浏览器原生 API（如 IndexedDB, Fetch API）

**Gate Decision**: ✅ PASS - 架构符合现代前端最佳实践，等待 constitution 正式确立后重新验证

## Project Structure

### Documentation (this feature)

```text
specs/002-ai-workflow-frontend/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (技术选型和最佳实践研究)
├── data-model.md        # Phase 1 output (前端数据模型和状态结构)
├── quickstart.md        # Phase 1 output (开发环境搭建指南)
├── contracts/           # Phase 1 output (API 契约和 Mock 规范)
│   ├── openapi.yaml     # OpenAPI 3.0 规范
│   ├── sse-events.md    # SSE 事件定义
│   └── mock-data/       # Mock 数据示例
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
frontend/
├── public/
│   └── index.html
├── src/
│   ├── components/           # React 组件
│   │   ├── layout/           # 布局组件 (三栏布局)
│   │   │   ├── ThreeColumnLayout.tsx
│   │   │   ├── LeftPanel.tsx
│   │   │   ├── MiddlePanel.tsx
│   │   │   └── RightPanel.tsx
│   │   ├── dialog/           # AI 对话组件
│   │   │   ├── ChatInputArea.tsx
│   │   │   ├── MessageList.tsx
│   │   │   ├── MessageItem.tsx
│   │   │   ├── VoiceInput.tsx
│   │   │   └── TaskStatusIndicator.tsx
│   │   ├── workflow/         # 工作流树组件
│   │   │   ├── WorkflowTree.tsx
│   │   │   ├── StageNode.tsx
│   │   │   ├── TaskNode.tsx
│   │   │   └── DocumentNode.tsx
│   │   ├── preview/          # 文档预览组件
│   │   │   ├── DocumentPreview.tsx
│   │   │   ├── MarkdownRenderer.tsx
│   │   │   ├── DocumentMetadata.tsx
│   │   │   ├── DocumentDiffView.tsx
│   │   │   └── ExecutionLog.tsx
│   │   └── shared/           # 共享组件
│   │       ├── Button.tsx
│   │       ├── Modal.tsx
│   │       └── Loading.tsx
│   ├── services/             # 业务逻辑和 API 调用
│   │   ├── api/              # API 接口封装
│   │   │   ├── request.ts    # Axios 封装和错误处理
│   │   │   ├── dialog.ts     # 对话相关 API
│   │   │   ├── workflow.ts   # 工作流相关 API
│   │   │   ├── document.ts   # 文档相关 API
│   │   │   ├── project.ts    # 项目管理 API
│   │   │   ├── auth.ts       # IAM 认证 API
│   │   │   └── sse.ts        # SSE 连接管理
│   │   └── storage/          # 本地存储
│   │       ├── indexeddb.ts  # IndexedDB 封装
│   │       └── localStorage.ts # LocalStorage 封装
│   ├── stores/               # Zustand 状态管理
│   │   ├── useDialogStore.ts
│   │   ├── useWorkflowStore.ts
│   │   ├── useDocumentStore.ts
│   │   └── useProjectStore.ts
│   ├── contexts/             # React Context (全局状态)
│   │   ├── AuthContext.tsx
│   │   └── ThemeContext.tsx
│   ├── types/                # TypeScript 类型定义
│   │   ├── api.ts            # API 响应类型
│   │   ├── models.ts         # 数据模型类型
│   │   ├── workflow.ts       # 工作流类型
│   │   └── document.ts       # 文档类型
│   ├── utils/                # 工具函数
│   │   ├── markdown.ts       # Markdown 处理
│   │   ├── diff.ts           # 文档对比
│   │   ├── validation.ts     # 数据验证
│   │   └── format.ts         # 格式化工具
│   ├── hooks/                # 自定义 React Hooks
│   │   ├── useSSE.ts         # SSE 连接 Hook
│   │   ├── useVirtualScroll.ts # 虚拟滚动 Hook
│   │   └── useDebounce.ts    # 防抖 Hook
│   ├── mocks/                # MSW Mock 数据
│   │   ├── handlers.ts       # MSW 请求处理器
│   │   ├── data/             # Mock 数据
│   │   │   ├── projects.ts
│   │   │   ├── workflows.ts
│   │   │   ├── documents.ts
│   │   │   └── conversations.ts
│   │   └── server.ts         # MSW 服务器配置
│   ├── App.tsx               # 根组件
│   ├── main.tsx              # 入口文件
│   └── vite-env.d.ts         # Vite 环境类型
├── tests/
│   ├── unit/                 # 单元测试
│   │   ├── components/
│   │   ├── services/
│   │   └── utils/
│   ├── integration/          # 集成测试
│   │   └── api/
│   └── e2e/                  # 端到端测试
│       └── workflows/
├── .env.development          # 开发环境配置
├── .env.production           # 生产环境配置
├── tsconfig.json             # TypeScript 配置
├── vite.config.ts            # Vite 构建配置
├── package.json              # 依赖管理
└── README.md                 # 项目说明
```

**Structure Decision**: 采用 Web 应用架构（Option 2 variant - frontend only）。由于用户明确要求"前端先 mock 数据，不需要后端"，仅构建 `frontend/` 目录。使用 MSW (Mock Service Worker) 在浏览器层面拦截 API 请求并返回 mock 数据，确保前端可独立开发和测试。

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | Constitution 尚未正式确立 | - |

## Phase 0: Research Tasks

### 1. Request.js 封装最佳实践 (NEEDS CLARIFICATION)
**Research Goal**: 确定 Axios 封装的最佳模式，包括拦截器、错误处理、取消请求、超时配置

**Key Questions**:
- 如何优雅地处理不同类型的 HTTP 错误（4xx, 5xx, 网络错误）？
- 如何实现请求取消（AbortController）？
- 如何处理 IAM token 过期和自动刷新？
- 如何集成 loading 状态和错误提示？

### 2. SSE 流式响应处理 (NEEDS CLARIFICATION)
**Research Goal**: 确定 Server-Sent Events 的最佳实现方案，包括连接管理、断线重连、事件解析

**Key Questions**:
- 如何使用原生 EventSource API 还是第三方库（如 `eventsource-parser`）？
- 如何实现指数退避的自动重连策略？
- 如何在 MSW 中 mock SSE 流式响应？
- 如何处理 SSE 连接的内存泄漏？

### 3. Mock Service Worker (MSW) 集成 (NEEDS CLARIFICATION)
**Research Goal**: 确定 MSW 的配置和使用模式，支持 REST API 和 SSE mock

**Key Questions**:
- 如何配置 MSW 以支持开发环境和测试环境？
- 如何模拟网络延迟和错误场景？
- 如何实现 SSE 流式响应的 mock？
- 如何组织 mock 数据以支持多种测试场景？

### 4. IndexedDB vs LocalStorage 选择 (NEEDS CLARIFICATION)
**Research Goal**: 确定前端持久化存储方案

**Key Questions**:
- 对话历史和文档内容存储在 IndexedDB 还是 LocalStorage？
- 如何处理存储配额限制？
- 如何设计 IndexedDB schema 以支持高效查询？
- 如何实现数据迁移和版本管理？

### 5. Zustand vs Redux 状态管理对比 (NEEDS CLARIFICATION)
**Research Goal**: 验证 Zustand 是否适合本项目的状态管理需求

**Key Questions**:
- Zustand 如何处理跨组件的复杂状态同步？
- 如何集成 Zustand DevTools 进行调试？
- 如何实现状态持久化（persist middleware）？
- 何时使用 Zustand store vs React Context？

### 6. 虚拟滚动性能优化 (NEEDS CLARIFICATION)
**Research Goal**: 确定 react-window 的最佳实践和性能调优方案

**Key Questions**:
- 如何为动态高度的消息列表实现虚拟滚动？
- 如何处理"滚动到底部"和"滚动到顶部加载更多"？
- 如何优化 Ant Design Tree 组件的虚拟滚动集成？

### 7. Markdown 渲染和 Diff 对比 (NEEDS CLARIFICATION)
**Research Goal**: 确定 Markdown 渲染方案和文档对比算法

**Key Questions**:
- react-markdown + remark-gfm 是否支持所有需要的 GFM 特性？
- 如何实现行级别的 diff 对比（红色删除、绿色新增）？
- 使用 diff-match-patch 还是其他 diff 库（如 jsdiff）？
- 如何高效渲染大型 Markdown 文档（>10,000 字）？

## Phase 1: Design Artifacts

*Will be generated after Phase 0 research completion:*
- `data-model.md`: 前端数据模型（stores, types, entities）
- `contracts/openapi.yaml`: API 契约规范
- `contracts/sse-events.md`: SSE 事件定义
- `contracts/mock-data/`: Mock 数据示例
- `quickstart.md`: 开发环境搭建指南

## Implementation Updates (2025-10-27)

### Phase 2 Completed: Core Features Implementation

**已实现的核心功能**:

1. **扩展的任务UI组件系统**
   - 组件注册架构（TaskUIRegistry）
   - 智能类型推断机制
   - 已实现：TemplateSelectionUI（模板选择界面）
   - 文件：`src/components/task-ui/`

2. **对话驱动UI操作系统**
   - UIActionStore 状态管理
   - useUIAction Hook
   - SSE ui_action 事件处理
   - 文件：`src/stores/useUIActionStore.ts`

3. **任务状态管理增强**
   - 新增 TaskStatus.Paused 状态
   - updateTaskStatus API 集成
   - TaskStatusIndicator 暂停/恢复功能
   - 文件：`src/services/api/workflow.ts`, `src/components/dialog/TaskStatusIndicator.tsx`

4. **飞书文档同步**
   - syncToFeishu API 实现
   - DocumentPreview "导出到飞书"按钮
   - 直接导出，无需确认对话框
   - 文件：`src/services/api/document.ts`, `src/components/preview/DocumentPreview.tsx`

5. **工作流树智能展开**
   - 自动展开 in_progress 和 completed 阶段
   - useRef 跟踪用户手动操作
   - 不覆盖用户展开/折叠状态
   - 文件：`src/components/workflow/WorkflowTree.tsx`

6. **数据模型更新**
   - TaskMetadata 接口（uiComponentType, uiProps）
   - StatusEventData 添加 taskId 字段
   - 文件：`src/types/models.ts`, `src/types/api.ts`

7. **运行记录UI组件嵌入系统** (2025-10-27 新增)
   - 扩展 ExecutionLog 数据模型支持4种日志类型
   - ExecutionLogType 枚举：log, ui_component, document_link, task_status
   - ExecutionLog 组件支持嵌入交互式UI组件
   - RightPanel 简化，移除独立任务UI区域
   - 文件：`src/types/models.ts`, `src/components/preview/ExecutionLog.tsx`, `src/components/layout/RightPanel.tsx`

**API 更新**:
- `PATCH /projects/{projectId}/workflow/tasks/{taskId}` - 更新任务状态
- `POST /projects/{projectId}/documents/{documentId}/feishu/sync` - 同步到飞书

**OpenAPI 规范更新**:
- TaskStatus 枚举添加 `paused`
- 新增 Feishu sync 端点
- StatusEventData 添加 taskId 字段

**Mock 数据更新**:
- 工作流阶段重命名（创建项目、需求阶段、方案阶段、实施阶段、交付阶段）
- 添加完整任务列表（7+6+6 个任务）
- 添加完整执行日志示例，包含4种日志类型（普通日志、UI组件、文档链接、任务状态）
- 完整的项目创建流程演示（确定归属 → 创建宪章 → 模板选择 → 文档生成）
- 文件：`src/mocks/data/workflows.ts`

**文档更新**:
- DESIGN.md 添加第12章"已实现的高级特性"
- DESIGN.md 添加第12.7节"运行记录UI组件嵌入系统"
- 详细的实现文档和代码示例
- 添加新UI组件的扩展指南
- 完整的交互流程演示和设计决策说明

## Next Steps

1. ✅ Complete Phase 0 research to resolve all "NEEDS CLARIFICATION" items
2. ✅ Generate data-model.md, contracts/, and quickstart.md (Phase 1)
3. ✅ Implement core features (Phase 2)
4. ⏳ Implement remaining User Stories (Phase 3)
5. ⏳ Testing and optimization (Phase 4)

---

**Status**: ✅ Phase 4 (Production) - Implementation Complete, Deployed (Updated: 2025-10-30)

## 🎉 Implementation Completed - Production Deployment

**最终状态**: 所有核心功能已完成实施并部署到生产环境

**生产地址**: http://172.16.18.184:8080
**部署时间**: 2025-10-29
**项目状态**: Phase 4 Complete - Production Ready

### ✅ 已完成的核心架构特性

#### 1. 四层 Hooks 架构 (已实现)
- **Composite Layer**: useChat, useWorkflow, useAIWorkflow
- **Business Layer**: useMessages, useTodos
- **Infrastructure Layer**: useApiClient, useSSE
- **Utility Layer**: useDebounce, useToggle

#### 2. 状态管理 (已实现)
- **Zustand + Immer**: 不可变状态更新
- **Session 隔离**: DialogStore, WorkflowStore, DocumentStore, UIActionStore
- **持久化**: IndexedDB (会话数据) + LocalStorage (用户偏好)

#### 3. AI 对话系统 (已实现)
- **Ant Design X**: 专业 AI 对话组件 (Bubble, Sender, Attachments)
- **SSE 流式响应**: 实时 EventSource 集成
- **TodoWrite 集成**: 实时任务追踪和工作流同步
- **附件支持**: 文件上传、图片预览

#### 4. 工作流可视化 (已实现)
- **实时同步**: 与 Claude TodoWrite 工具实时同步任务状态
- **阶段管理**: pending/in_progress/completed 状态展示
- **智能展开**: 自动展开活跃阶段和已完成阶段

#### 5. 文档预览编辑 (已实现)
- **Monaco Editor**: VSCode 风格代码编辑器，支持 50+ 语言语法高亮
- **双模式**: 预览模式 + 源码编辑模式自动切换
- **Markdown 渲染**: react-markdown + remark-gfm + react-syntax-highlighter
- **版本对比**: React Diff Viewer 支持

#### 6. 生产环境部署 (已实现)
- **Nginx 反向代理**: 端口 8080，代理 /api/ 到后端 8000
- **自动化部署**: deploy.sh 脚本，支持构建和上传
- **环境配置**: .env.production 生产环境变量
- **服务器**: 172.16.18.184 (用户: op)，Ubuntu + Nginx

#### 7. 测试架构 (已实现)
- **MSW 2.x**: API Mock 服务，支持开发和测试
- **集成测试**: SSE streaming, tool call extraction 测试覆盖
- **React Testing Library**: 组件测试框架
- **Vitest**: 单元测试框架
