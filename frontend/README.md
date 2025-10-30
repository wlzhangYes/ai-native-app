# AI-Driven Workflow Execution Frontend

> **对话驱动的智能工作流执行系统** - 基于 React + TypeScript 构建的现代化 AI 原生应用

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.x-blue?logo=react)](https://reactjs.org/)
[![Ant Design](https://img.shields.io/badge/Ant%20Design-5.x-blue?logo=ant-design)](https://ant.design/)
[![Zustand](https://img.shields.io/badge/Zustand-4.x-orange?logo=zustand)](https://github.com/pmndrs/zustand)
[![Vite](https://img.shields.io/badge/Vite-5.x-purple?logo=vite)](https://vitejs.dev/)

## 🎯 项目概述

这是一个**对话驱动的自执行工作流系统**前端应用，用户通过与 AI 教练的对话来管理软件开发流程。系统采用三栏布局设计，集成了 AI 对话、工作流树可视化、文档预览编辑等功能。

### 核心特性

- 🤖 **AI 对话界面** - 基于 SSE 的实时流式对话，支持 TodoWrite 工具集成
- 🌳 **工作流树可视化** - 实时展示任务状态，支持阶段管理和进度跟踪
- 📄 **文档预览编辑** - Monaco Editor 集成，支持 50+ 编程语言语法高亮
- 📱 **响应式设计** - 三栏布局 (3:2:5 比例)，移动端自适应
- 💾 **会话持久化** - IndexedDB + LocalStorage 双重持久化策略
- 🔄 **实时同步** - 工作流状态与 Claude TodoWrite 工具实时同步

## 🏗️ 技术架构

### 技术栈

| 层级 | 技术选型 | 版本 | 用途 |
|------|---------|------|------|
| **框架** | React + TypeScript | 18.x + 5.x | 核心框架 |
| **构建工具** | Vite | 5.x | 开发构建 |
| **UI 组件库** | Ant Design + Ant Design X | 5.x + 1.6.1 | 基础组件 + AI 专用组件 |
| **状态管理** | Zustand + Immer | 4.x | 全局状态 + 不可变更新 |
| **HTTP 通信** | Axios + EventSource | - | API 请求 + SSE 流式通信 |
| **数据持久化** | IndexedDB + LocalStorage | - | 会话数据 + 用户偏好 |
| **代码编辑器** | Monaco Editor | @monaco-editor/react | VSCode 风格编辑器 |
| **文档渲染** | React Markdown + React Diff Viewer | - | Markdown 渲染 + 版本对比 |
| **样式方案** | Tailwind CSS | 3.x | 原子化 CSS |
| **测试框架** | Vitest + React Testing Library | - | 单元测试 + 集成测试 |
| **API Mock** | MSW (Mock Service Worker) | 2.x | API 模拟 |

### 架构亮点

#### 🧩 四层 Hooks 架构

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

#### 🏪 Zustand 状态管理架构

- **DialogStore** - 对话消息、工具调用、SSE 流状态管理
- **WorkflowStore** - 工作流树、任务状态、阶段管理
- **DocumentStore** - 文档内容、编辑状态、版本历史
- **UIActionStore** - UI 交互、操作记录、用户偏好

所有 Store 支持：
- ✅ **Session 隔离** - 多项目会话数据独立存储
- ✅ **持久化** - localStorage 自动持久化
- ✅ **Immer 集成** - 不可变状态更新
- ✅ **TypeScript** - 完整类型安全

#### 🎨 动态 UI 组件系统

支持后端动态下发 UI 组件配置，前端自动渲染：

```typescript
// SSE Event 示例
{
  type: 'ui_component',
  component: 'Form',
  props: {
    title: '填写项目信息',
    fields: [
      { name: 'projectName', type: 'text', label: '项目名称', required: true }
    ]
  }
}
```

已实现组件：
- **FormRenderer** - 动态表单渲染器
- **CardRenderer** - 卡片展示组件
- **TableRenderer** - 数据表格组件
- **ImageGalleryRenderer** - 图片画廊组件

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0

### 安装依赖

```bash
# 克隆项目
git clone https://github.com/your-org/ai-native-app.git
cd ai-native-app/frontend

# 安装依赖
npm install
```

### 开发环境

```bash
# 启动开发服务器
npm run dev

# 访问 http://localhost:5173
```

### 构建部署

```bash
# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

## 📂 项目结构

```
src/
├── components/              # 组件库
│   ├── dialog/             # 对话相关组件
│   │   ├── ChatInterface.tsx    # AI 对话界面
│   │   └── MessageBubble.tsx    # 消息气泡
│   ├── workflow/           # 工作流组件
│   │   ├── WorkflowTree.tsx     # 工作流树
│   │   └── TaskCard.tsx         # 任务卡片
│   ├── preview/            # 预览组件
│   │   ├── DocumentPreview.tsx  # 文档预览
│   │   └── CodeEditor.tsx       # 代码编辑器
│   └── dynamic-ui/         # 动态 UI 系统
│       ├── registry/            # 组件注册表
│       └── renderers/           # 渲染器组件
├── hooks/                  # Hooks 层级架构
│   ├── utility/            # 工具函数层
│   ├── infrastructure/     # 基础设施层
│   ├── business/           # 业务逻辑层
│   └── composite/          # 组合逻辑层
├── stores/                 # Zustand 状态管理
│   ├── useDialogStore.ts        # 对话状态
│   ├── useWorkflowStore.ts      # 工作流状态
│   ├── useDocumentStore.ts      # 文档状态
│   └── useUIActionStore.ts      # UI 操作状态
├── services/               # 服务层
│   ├── api/                # API 服务
│   └── sse/                # SSE 服务
├── types/                  # TypeScript 类型定义
├── utils/                  # 工具函数
└── test/                   # 测试文件
    ├── unit/               # 单元测试
    ├── integration/        # 集成测试
    └── e2e/                # 端到端测试
```

## 🧪 测试

项目采用分层测试策略：

```bash
# 运行所有测试
npm run test

# 单元测试
npm run test:unit

# 集成测试
npm run test:integration

# 端到端测试
npm run test:e2e

# 测试覆盖率
npm run test:coverage
```

### 测试覆盖率

- **Hooks 层** - 14 个 hooks，100% 单元测试覆盖
- **组件层** - 核心组件集成测试覆盖
- **Store 层** - 状态管理逻辑完整测试
- **SSE 流** - 流式通信集成测试

## 📖 核心功能

### 1. AI 对话界面

基于 Ant Design X 构建的专业 AI 对话组件：

- **流式响应** - EventSource SSE 实时流式显示
- **工具调用** - Claude TodoWrite 工具集成，实时任务追踪
- **附件支持** - 文件上传、图片预览、文档附件
- **消息历史** - 会话持久化，支持页面刷新恢复

### 2. 工作流树可视化

实时展示项目工作流状态：

- **阶段管理** - 多阶段工作流可视化
- **任务追踪** - 与 Claude TodoWrite 实时同步
- **状态指示** - pending/in_progress/completed 状态展示
- **交互操作** - 任务点击、阶段展开/收起

### 3. 文档预览编辑

基于 Monaco Editor 的专业文档编辑：

- **语法高亮** - 支持 50+ 编程语言
- **双模式** - 预览模式 + 源码编辑模式
- **版本对比** - React Diff Viewer 版本差异对比
- **自动保存** - 编辑内容自动持久化

### 4. 会话管理

多项目会话隔离管理：

- **项目隔离** - 不同项目的对话、工作流、文档完全隔离
- **数据持久化** - IndexedDB 存储对话历史，LocalStorage 存储偏好设置
- **会话切换** - 快速切换不同项目会话
- **数据恢复** - 页面刷新后自动恢复会话状态

## 🔧 配置说明

### 环境变量

```bash
# .env.development
VITE_API_BASE_URL=http://localhost:8000/api

# .env.production
VITE_API_BASE_URL=http://172.16.18.184:8000/api
```

### 代理配置

开发环境 API 代理配置 (vite.config.ts)：

```typescript
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      }
    }
  }
})
```

## 🚀 部署

### 生产环境部署

项目已配置 Nginx + 后端 API 的生产环境部署：

```bash
# 构建生产版本
npm run build

# 部署到服务器 (172.16.18.184:8080)
npm run deploy
```

部署架构：
- **前端**: Nginx (端口 8080) 托管静态文件
- **后端**: API 服务 (端口 8000)
- **代理**: Nginx 将 `/api/*` 请求代理到后端

详细部署说明请参考 [DEPLOYMENT.md](../DEPLOYMENT.md)

## 📚 相关文档

- [项目总体架构](../CLAUDE.md) - SpecKit 工作流和项目整体说明
- [Hooks 架构文档](./HOOKS_ARCHITECTURE.md) - 四层 Hooks 架构详细说明
- [动态 UI 系统](./DYNAMIC_UI_SYSTEM.md) - 动态组件渲染系统
- [部署指南](../DEPLOYMENT.md) - 生产环境部署说明
- [开发进度](./TODO.md) - 项目开发进度和任务清单

## 🤝 贡献指南

1. Fork 项目仓库
2. 创建功能分支: `git checkout -b feature/your-feature`
3. 提交更改: `git commit -m 'Add some feature'`
4. 推送分支: `git push origin feature/your-feature`
5. 提交 Pull Request

### 代码规范

- 使用 TypeScript 进行类型安全开发
- 遵循 ESLint + Prettier 代码格式化规范
- 组件使用 Tailwind CSS 进行样式开发（禁用内联样式）
- Hooks 遵循四层架构设计原则
- 提交信息遵循 Conventional Commits 规范

## 📄 许可证

MIT License - 详见 [LICENSE](../LICENSE) 文件

---

**最后更新**: 2025-10-30
**项目状态**: ✅ 生产就绪
**版本**: v1.0.0