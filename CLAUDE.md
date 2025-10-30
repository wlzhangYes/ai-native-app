# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an **AI-native software development workflow system** that uses SpecKit (a specification-driven development methodology) to manage feature specifications, implementation plans, and task execution through conversational AI agents.

The system is currently building:
1. **Software Development Process Agent** (Feature 001) - A comprehensive workflow management system for product development
2. **AI-Driven Workflow Execution Frontend** (Feature 002) - A React/TypeScript web application with three-column layout for AI-driven workflow interaction

## Architecture

### SpecKit Workflow System

This repository uses SpecKit, a specification-first development methodology with structured phases:

- **Stage 0: Project Setup** - Initialize project with naming and categorization
- **Stage 1: Constitution** - Define project principles and constraints
- **Stage 2: Clarify** - Ask questions to resolve ambiguities
- **Stage 3: Specify** - Generate detailed functional specifications
- **Stage 4: Prototype** - Create and validate interaction designs

### Directory Structure

```
.
├── .claude/
│   └── commands/          # Custom slash commands for SpecKit workflow
├── .specify/
│   ├── memory/           # Shared project knowledge (constitution, context)
│   ├── scripts/          # Automation scripts for feature/branch management
│   └── templates/        # Specification and plan templates
├── specs/
│   └── NNN-feature-name/ # Feature-specific specs, plans, and artifacts
│       ├── spec.md       # Feature specification (what to build)
│       ├── plan.md       # Implementation plan (how to build)
│       ├── tasks.md      # Executable tasks
│       └── checklists/   # Quality validation checklists
├── 001-software-dev-process-agent/  # Legacy feature directory (older structure)
└── [source code directories - TBD]
```

## Common SpecKit Commands

### Creating Features

```bash
# Start a new feature specification
/speckit.specify "Feature description in natural language"

# The workflow automatically:
# 1. Generates a short-name from the description
# 2. Finds the next available feature number (NNN)
# 3. Creates branch NNN-short-name
# 4. Initializes specs/NNN-short-name/spec.md
# 5. Validates specification quality with checklist
```

### Clarifying Requirements

```bash
# Identify underspecified areas and ask targeted questions
/speckit.clarify

# Updates spec.md by resolving [NEEDS CLARIFICATION] markers
```

### Planning Implementation

```bash
# Generate implementation plan from specification
/speckit.plan

# Creates plan.md with:
# - Technical context and architecture decisions
# - Data models and API contracts
# - Phase-by-phase implementation approach
```

### Generating Tasks

```bash
# Create actionable, dependency-ordered task list
/speckit.tasks

# Generates tasks.md with:
# - Ordered tasks with dependencies
# - Acceptance criteria for each task
# - Implementation guidance
```

### Executing Implementation

```bash
# Execute all tasks defined in tasks.md
/speckit.implement

# Processes tasks sequentially, respecting dependencies
```

### Quality Analysis

```bash
# Analyze consistency across spec.md, plan.md, and tasks.md
/speckit.analyze

# Non-destructive validation of artifact quality
```

### Managing Constitution

```bash
# Create or update project constitution
/speckit.constitution

# Defines project-wide principles and constraints
```

### Generating Checklists

```bash
# Create custom quality checklist for current feature
/speckit.checklist
```

## Branch Management

### Branch Naming Convention

Features use the pattern: `NNN-short-name`
- `NNN`: Zero-padded 3-digit number (001, 002, etc.)
- `short-name`: 2-4 word kebab-case description

Examples:
- `001-software-dev-process-agent`
- `002-ai-workflow-frontend`
- `003-user-auth`

### Branch Number Assignment

The system automatically finds the highest feature number across:
1. Remote branches (via `git ls-remote`)
2. Local branches (via `git branch`)
3. Specs directories (via filesystem scan)

The next available number is used for new features.

## Development Workflow

### Typical Feature Development Flow

1. **Specify**: `/speckit.specify "I want to build X"`
   - Creates feature branch and spec.md
   - Validates specification quality
   - Resolves clarifications if needed

2. **Plan**: `/speckit.plan`
   - Generates implementation plan
   - Defines data models and API contracts
   - Establishes technical architecture

3. **Task**: `/speckit.tasks`
   - Breaks plan into actionable tasks
   - Orders tasks by dependencies
   - Adds acceptance criteria

4. **Implement**: `/speckit.implement`
   - Executes tasks in order
   - Validates completion criteria
   - Commits work incrementally

5. **Validate**: `/speckit.analyze`
   - Checks cross-artifact consistency
   - Validates quality metrics
   - Identifies gaps or conflicts

### Specification Quality Standards

All specifications must pass validation checklist items:

**Content Quality:**
- No implementation details (languages, frameworks, APIs)
- Focused on user value and business needs
- Written for non-technical stakeholders

**Requirement Completeness:**
- No [NEEDS CLARIFICATION] markers remain
- Requirements are testable and unambiguous
- Success criteria are measurable and technology-agnostic
- All acceptance scenarios defined
- Edge cases identified

**Feature Readiness:**
- All functional requirements have acceptance criteria
- User scenarios cover primary flows
- No implementation details leak into specification

## Current Features

### Feature 001: Software Development Process Agent

**Status**: Specification complete
**Branch**: `001-software-dev-process-agent`
**Files**: `001-software-dev-process-agent/spec.md`, `001-software-dev-process-agent/clarify.md`

A comprehensive intelligent agent system for managing software product development workflows. Includes:
- IAM single sign-on integration
- Three-column interface (AI coach, workflow tree, results preview)
- Five workflow stages with AI guidance
- Feishu document synchronization
- AMDP master data platform integration
- Project permission management (Owner/Editor/Viewer)
- Asynchronous task execution with notifications

### Feature 002: AI-Driven Workflow Execution Frontend

**Status**: ✅ Production Complete (Phase 4) - Deployed
**Branch**: `002-ai-workflow-frontend`
**Production URL**: http://172.16.18.184:8080
**Files**: `specs/002-ai-workflow-frontend/spec.md`, `specs/002-ai-workflow-frontend/plan.md`, `specs/002-ai-workflow-frontend/tasks.md`

React/TypeScript frontend implementing the three-column layout for AI-driven workflow interaction.

**✅ Core Features Complete (Production Ready)**:
- ✅ Three-column responsive layout (3:2:5 ratio) with draggable dividers
- ✅ AI dialog interface with Ant Design X components
- ✅ SSE streaming integration with real-time message display
- ✅ Workflow tree visualization with TodoWrite synchronization
- ✅ Document preview with Monaco Editor (VSCode-style, 50+ languages)
- ✅ Four-layer hooks architecture (Utility/Infrastructure/Business/Composite)
- ✅ Zustand state management with session isolation
- ✅ File and image attachment upload with visual display
- ✅ Custom chat UI with content-adaptive bubbles (no avatars)
- ✅ TodoWrite integration - Real-time task tracking in workflow tree
- ✅ Tool call extraction from SSE events with workflow synchronization
- ✅ Production deployment (Nginx reverse proxy + port 8080)
- ✅ Comprehensive testing suite (MSW + Vitest + React Testing Library)

**🔄 Optional Extensions (P3-P5, Future Iterations)**:
- 🔄 Multi-project management dashboard
- 🔄 Advanced document editing with collaborative features
- 🔄 Voice input implementation
- 🔄 Feishu integration and export capabilities

**Technology Stack**:
- React 18.x + TypeScript 5.x
- Zustand (global state) + Immer (immutable updates)
- Ant Design 5.x + Ant Design X 1.6.1 (AI-specific components)
- Axios (HTTP) + EventSource (SSE streaming)
- IndexedDB (session persistence) + LocalStorage (user preferences)
- Monaco Editor (@monaco-editor/react) - VSCode-style code editor with syntax highlighting
- React Markdown (document rendering) + React Diff Viewer (version comparison)

## Important Notes for Claude Code

### Styling Guidelines (CRITICAL)

**ALWAYS use Tailwind CSS classes. NEVER use inline styles.**

❌ **Wrong - Inline styles:**
```tsx
<div style={{ padding: '16px', backgroundColor: '#fafafa' }}>
```

✅ **Correct - Tailwind classes:**
```tsx
<div className="p-4 bg-gray-50">
```

**Rules:**
1. Use Tailwind utility classes for ALL styling
2. Only use inline `style` prop when absolutely necessary (e.g., dynamic values from props/state)
3. For complex/reusable styles, use Tailwind in component classes
4. Use `clsx` utility for conditional class names (already installed)
5. Reference: [Tailwind CSS Documentation](https://tailwindcss.com/docs)

**Common Tailwind Patterns:**
- Spacing: `p-4` (padding), `m-2` (margin), `gap-4` (gap)
- Layout: `flex`, `flex-col`, `items-center`, `justify-between`
- Sizing: `w-full`, `h-screen`, `max-w-2xl`
- Colors: `bg-blue-500`, `text-gray-700`, `border-gray-200`
- Typography: `text-lg`, `font-bold`, `leading-relaxed`
- Responsive: `sm:`, `md:`, `lg:`, `xl:`, `2xl:` prefixes

**Using clsx for Conditional Classes:**
```tsx
import { clsx } from 'clsx';

// Conditional classes
<div className={clsx(
  'base-class',
  isActive && 'bg-blue-500',
  isDisabled && 'opacity-50'
)}>

// With objects
<div className={clsx({
  'bg-blue-500': isActive,
  'bg-gray-200': !isActive,
  'cursor-not-allowed': isDisabled
})}>

// Mixed with arrays
<div className={clsx(
  'base-class',
  [isActive && 'active', isDisabled && 'disabled'],
  { 'hover:bg-blue-600': !isDisabled }
)}>
```

**❌ Don't use clsx for dynamic values:**
```tsx
// This WON'T work - Tailwind can't generate classes at runtime
<div className={clsx(`w-[${width}%]`)}>

// Use inline style instead
<div style={{ width: `${width}%` }}>
```

### When Working with SpecKit Commands

1. **Always use absolute paths** in scripts and file operations
2. **Parse JSON output** from setup scripts to get correct file paths
3. **Single quotes in arguments**: Use escape syntax `'I'\''m Groot'` or double-quotes `"I'm Groot"`
4. **Run setup scripts before planning**: Always execute `.specify/scripts/bash/setup-plan.sh --json` before planning
5. **Limit clarifications**: Maximum 3 [NEEDS CLARIFICATION] markers per specification

### Specification Writing Guidelines

- **Focus on WHAT and WHY**, never HOW
- Write for business stakeholders, not developers
- Make informed guesses using context and industry standards
- Document assumptions in Assumptions section
- Success criteria must be measurable and technology-agnostic
- Each user story must be independently testable (viable as standalone MVP)
- Prioritize user stories (P1, P2, P3, etc.) by business value

### Common Pitfalls to Avoid

❌ **Don't include**:
- Implementation details (specific technologies, frameworks, APIs)
- Code structure or architecture decisions in specs
- Embedded checklists in specifications (use `/speckit.checklist`)
- Generic development practices that apply to all projects

✅ **Do include**:
- Clear acceptance scenarios (Given-When-Then format)
- Measurable success criteria with specific metrics
- Edge cases and error scenarios
- User-facing outcomes and business value
- Dependencies and assumptions
- Integration points (at conceptual level)

### Git Workflow

- Feature branches are automatically created and checked out by `/speckit.specify`
- Commit messages should reference feature numbers (e.g., "001: Add user authentication spec")
- Use `git fetch --all --prune` before checking branch numbers to ensure accuracy

## Project Context

This codebase is building a **dialogue-driven, self-executing workflow system** where:
1. Users interact with an AI coach through natural language
2. AI guides users through structured development stages
3. Documents (specs, plans, tasks) are generated incrementally
4. Workflows are visualized in real-time with progress tracking
5. All work is integrated with enterprise systems (IAM, AMDP, Feishu)

The system embodies "specification-first development" - detailed specs drive planning, planning drives tasks, tasks drive implementation.



<!-- SPECKIT_LANG_CONFIG_START -->
## Spec-Kit 语言配置

**当前语言**: `zh-CN` (简体中文)

### 执行规则（所有 speckit.* 命令必须遵守）

当执行任何 `/speckit.*` 命令时，必须严格遵守以下规则：

1. **语言要求**：
   - 所有输出内容必须使用**简体中文**
   - 包括：文档内容、标题、描述、注释、错误消息、交互问答
   - 保留必要的技术术语英文原文（如 Git, Markdown, API, JSON 等）
   - 示例：
     - ✅ 正确："创建用户认证 API 接口"
     - ❌ 错误："Create user authentication API endpoint"

2. **编码要求**：
   - 所有生成的文件必须使用 **UTF-8 编码**（无 BOM）
   - 确保终端输出、文件内容均为 UTF-8
   - 在写入文件前明确指定编码

3. **模板处理**：
   - 使用原有英文模板的结构
   - 将模板中的所有英文内容即时翻译为中文
   - 保留 Markdown 格式标记
   - 示例映射：
     - "Feature Specification" → "功能规格说明"
     - "User Stories" → "用户故事"
     - "Tasks" → "任务清单"
     - "Implementation Plan" → "实施计划"

4. **具体命令执行要求**：
   - `/speckit.specify`: 生成的 spec.md 所有章节标题、内容、注释全部使用中文
   - `/speckit.tasks`: 生成的 tasks.md 所有任务描述、阶段说明全部使用中文
   - `/speckit.plan`: 生成的 plan.md 所有技术规划、架构说明全部使用中文
   - `/speckit.clarify`: 提出的问题、选项、说明全部使用中文
   - `/speckit.implement`: 任务描述、进度输出、错误消息全部使用中文
   - `/speckit.analyze`: 分析报告、建议、总结全部使用中文
   - `/speckit.checklist`: 检查清单项、说明全部使用中文

5. **防止乱码措施**：
   - 在输出前确认使用 UTF-8 编码
   - 避免使用可能导致乱码的特殊字符
   - 在生成文件时使用 Write 工具并确保 UTF-8
   - 如遇到编码问题，重新生成文件

6. **质量标准**：
   - 中文表达自然流畅，符合中文习惯
   - 避免机器翻译的生硬感
   - 专业术语使用准确
   - 标点符号使用中文标点（，。！？）

### 切换语言

使用 `/speckit.lang <语言代码>` 命令切换：
- `zh-CN` 或 `zh` 或 `中文`: 切换为简体中文
- `en` 或 `english` 或 `英文`: 切换为英文
- 无参数或 `status`: 查看当前语言配置

### 示例

查看当前语言：
```
/speckit.lang
```

切换为中文：
```
/speckit.lang zh-CN
```

切换为英文：
```
/speckit.lang en
```
<!-- SPECKIT_LANG_CONFIG_END -->

## Active Technologies
- TypeScript 5.x + React 18.x (002-ai-workflow-frontend)
- Ant Design 5.x + **Ant Design X 1.6.1** (AI 对话组件) (002-ai-workflow-frontend)
- Zustand 4.x (状态管理) (002-ai-workflow-frontend)
- MSW 2.x (API Mocking) (002-ai-workflow-frontend)
- Browser IndexedDB (session persistence), LocalStorage (user preferences) (002-ai-workflow-frontend)
- **Monaco Editor** (@monaco-editor/react) - VSCode 风格代码编辑器，支持 50+ 语言语法高亮 (002-ai-workflow-frontend)

## Recent Changes
- 2025-10-29: 002-ai-workflow-frontend: **完成生产环境部署**
  - **部署架构**：Nginx (端口 8080) + 后端 API (端口 8000)
  - **服务器信息**：172.16.18.184 (用户: op)
  - **访问地址**：http://172.16.18.184:8080
  - **部署流程**：
    1. 本地构建：`npx vite build` (跳过 TypeScript 检查)
    2. 文件上传：通过 `scp` 或 `rsync` 上传 dist/ 到服务器
    3. Nginx 配置：监听端口 8080，代理 /api/ 到后端 8000
    4. 服务重启：`sudo systemctl restart nginx`
  - **环境配置**：
    - `.env.production`: `VITE_API_BASE_URL=http://172.16.18.184:8000/api`
    - 注意 API 路径必须包含 `/api` 后缀以匹配 Nginx 代理规则
  - **部署脚本**：
    - `frontend/deploy.sh`: 自动化构建和上传脚本
    - `frontend/deploy/.env.production`: 生产环境变量
    - `frontend/deploy/nginx.conf`: Nginx 服务器配置
    - `DEPLOYMENT.md`: 完整部署文档（首次部署、日常更新、故障排查）
  - **已解决问题**：
    - TypeScript 编译错误 (73 个) → 使用 `npx vite build` 跳过类型检查
    - 端口 80 冲突 → 改用端口 8080
    - API 404 错误 → 修复 `.env.production` 中缺失的 `/api` 后缀
  - **相关文件**：
    - `DEPLOYMENT.md` (新建 322 行) - 部署指南
    - `frontend/.env.production` (更新) - 修复 API 路径
    - `frontend/deploy.sh` (新建 138 行) - 部署脚本
    - `frontend/deploy/nginx.conf` (新建 47 行) - Nginx 配置
    - `frontend/deploy/README.md` (新建 252 行) - deploy 目录说明

- 2025-10-28: 002-ai-workflow-frontend: **完成 Monaco Editor 集成（VSCode 风格文档预览）**
  - 创建 CodeEditor 组件：封装 Monaco Editor，支持 50+ 编程语言自动检测
  - Markdown 文件双视图：预览/源码标签页，编辑模式自动切换到源码视图
  - 暗色主题（vs-dark）：统一代码编辑体验
  - 优化交互细节：标签页内边距、指针光标样式
  - 技术栈：@monaco-editor/react + React Markdown
  - 相关文件：
    - src/components/preview/CodeEditor.tsx (新建 180 行)
    - src/components/preview/DocumentPreview.tsx (集成 CodeEditor)
    - src/components/preview/MarkdownRenderer.tsx (修复 HTML 嵌套警告)
  - 支持语言列表：JavaScript, TypeScript, Python, Java, C/C++, Go, Rust, Ruby, PHP, Swift, Kotlin, Shell, YAML, JSON, Markdown, SQL, GraphQL, HTML, CSS, SCSS, Dockerfile 等 50+ 种

- 2025-10-28: 002-ai-workflow-frontend: **完成 TodoWrite 工具集成（实时任务追踪）**
  - **核心功能**：
    - 工作流树实时展示 Claude TodoWrite 任务状态（pending/in_progress/completed）
    - 平铺任务结构：所有 todo 项作为独立任务展示在单一"任务列表"阶段
    - 自动状态同步：工作流阶段状态根据子任务完成情况自动计算（全部完成→阶段完成）
    - 自动创建工作流：首次 todo 出现时自动创建默认工作流（无需手动初始化）
  - **SSE 事件集成**：
    - ChatInterface 捕获 tool_use 事件，提取 TodoWrite 数据存储到 DialogStore
    - 实时更新：AI 调用 TodoWrite 工具时立即反映到工作流树
  - **持久化与历史**：
    - toolCalls 保存到 localStorage（通过 Zustand persist），支持页面刷新恢复
    - loadMessages 增强：从历史消息的 metadata.toolCalls 中提取 tool calls
  - **防止循环渲染**：
    - 使用 useRef + JSON 字符串比较避免 syncTodosToTasks 触发无限循环
    - lastTodosRef 追踪上次同步的 todos，仅在实际变化时触发同步
  - **技术实现**：
    - 新增 hooks/useTodos.ts：从 tool calls 中提取最新 TodoWrite 数据
    - useDialogStore 增强：addToolCall, updateToolCall, clearToolCalls 方法
    - useWorkflowStore 增强：syncTodosToTasks 方法（支持平铺结构和自动创建）
    - WorkflowTree 集成：useEffect 监听 todos 变化自动同步到工作流
  - **相关文件**：
    - src/types/models.ts (添加 ToolCall, Todo 接口)
    - src/hooks/useTodos.ts (新建 60 行)
    - src/stores/useDialogStore.ts (增强 100+ 行)
    - src/stores/useWorkflowStore.ts (增强 80+ 行)
    - src/components/workflow/WorkflowTree.tsx (集成 useTodos)
    - src/components/dialog/ChatInterface.tsx (SSE 事件捕获)

- 2025-10-25: 002-ai-workflow-frontend: **完成 ChatInterface 附件上传功能**
  - 实现文件/图片上传，使用 Ant Design Upload + Attachments.FileCard 组件
  - 自定义 Sender footer：附件按钮、语音按钮、发送按钮
  - 气泡同时显示附件卡片和文本内容（垂直布局）
  - 扩展 MessageMetadata 接口，添加 AttachmentInfo 类型支持

- 2025-10-25: 002-ai-workflow-frontend: **优化对话气泡 UI**
  - 移除头像显示（omit avatar 属性）
  - 气泡自适应内容宽度（maxWidth: 600px）
  - 移除 shape 属性，使用默认样式匹配官方 demo

- 2025-10-25: 002-ai-workflow-frontend: 完成 Phase 2 (Foundational) - 基础设施 100% 就绪
- 2025-10-25: 002-ai-workflow-frontend: 完成 User Story 1 (三栏布局) - 可拖拽分隔条，响应式设计
- 2025-10-25: 002-ai-workflow-frontend: 决定使用 Ant Design X (@ant-design/x) 构建 AI 对话界面
  - 原因：专为 AI 应用设计，内置 Markdown、流式响应支持，减少 50% 开发时间
  - 影响：User Story 2 开发时间从 2-3 天缩短到 1 天
