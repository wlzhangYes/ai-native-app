// Mock data for Documents
// Based on data-model.md document structure

import type { Document } from '@/types/models';
import { DocumentStatus } from '@/types/models';

export const mockDocuments: Document[] = [
  // Stage 0: Project Initialization Documents
  {
    id: 'doc-001',
    projectId: 'proj-001',
    stageId: 'stage-0-001',
    name: 'constitution.md',
    content: `# 项目宪章 (Constitution)

## 项目原则

### 原则 1: 用户体验优先
所有功能设计必须以用户体验为中心，确保界面简洁直观，操作流程顺畅。

### 原则 2: 安全性不可妥协
用户数据和认证信息必须使用行业标准加密方式存储和传输，定期进行安全审计。

### 原则 3: 可扩展性
系统架构必须支持未来功能扩展，避免技术债务累积。

## 约束条件

- 必须符合公司 IAM SSO 集成规范
- 响应时间 p95 < 500ms
- 支持 1000+ 并发用户
- 数据必须本地化存储在中国大陆

## 技术栈

- Frontend: React 18 + TypeScript 5
- Backend: Node.js + Express
- Database: PostgreSQL 14
- Cache: Redis 7`,
    version: 2,
    status: DocumentStatus.Completed,
    metadata: {
      author: 'AI Coach',
      createdBy: 'system',
      lastModifiedBy: 'user-001',
      wordCount: 280,
    },
    feishuDocId: 'feishu-doc-001',
    createdAt: '2025-10-20T09:00:00Z',
    updatedAt: '2025-10-20T09:30:00Z',
  },
  {
    id: 'doc-002',
    projectId: 'proj-001',
    stageId: 'stage-0-001',
    name: 'project-info.md',
    content: `# 项目信息

## 基本信息

- **项目名称**: 用户登录功能
- **项目类型**: Web 应用
- **所属组织**: 产品技术部
- **战略机会**: 数字化转型
- **岗位族**: 软件开发

## 项目背景

公司现有系统缺乏统一的用户认证机制，各系统独立维护用户账号，导致用户体验差、管理成本高。本项目旨在实现基于 IAM SSO 的统一登录功能。

## 项目目标

1. 实现与公司 IAM 系统的 SSO 集成
2. 支持多租户和细粒度权限管理
3. 提供安全可靠的用户认证服务
4. 提升用户登录体验`,
    version: 1,
    status: DocumentStatus.Completed,
    metadata: {
      author: '张伟',
      createdBy: 'user-001',
      lastModifiedBy: 'user-001',
      wordCount: 185,
    },
    feishuDocId: 'feishu-doc-002',
    createdAt: '2025-10-20T09:05:00Z',
    updatedAt: '2025-10-20T09:20:00Z',
  },

  // Stage 1: Requirement Clarification Documents
  {
    id: 'doc-003',
    projectId: 'proj-001',
    stageId: 'stage-1-001',
    name: 'clarify.md',
    content: `# 需求澄清文档

## 问题 1: IAM SSO 集成方式

**问题**: 如何与公司 IAM 系统集成？使用哪种认证协议？

**回答**: 使用 OAuth 2.0 协议，通过 Authorization Code Flow 实现 SSO 集成。IAM 系统提供标准的 OIDC 端点。

**影响**: 需要在前端实现 OAuth 2.0 授权流程，包括授权码获取和令牌交换。

---

## 问题 2: 多租户隔离策略

**问题**: 如何实现多租户数据隔离？租户ID从哪里获取？

**回答**: 租户ID存储在 IAM token 的 claims 中，后端通过中间件自动解析并注入到请求上下文。数据库层面使用 tenant_id 字段实现行级隔离。

**影响**: 所有 API 需要支持租户上下文，数据库表需要添加 tenant_id 索引。

---

## 问题 3: 权限粒度设计

**问题**: 权限管理的粒度是什么？如何定义角色和权限？

**回答**: 采用 RBAC 模型，预定义三种角色：Owner（所有者）、Editor（编辑者）、Viewer（查看者）。权限按功能模块划分，支持后续扩展自定义角色。

**影响**: 需要设计权限表结构，实现动态权限校验逻辑。

---

## 问题 4: 会话管理策略

**问题**: Token 有效期多长？如何处理 Token 刷新？

**回答**: Access Token 有效期 1 小时，Refresh Token 有效期 7 天。前端通过拦截器自动刷新 Token，失败则引导用户重新登录。

**影响**: 需要实现 Token 刷新逻辑和会话状态管理。`,
    version: 3,
    status: DocumentStatus.Completed,
    metadata: {
      author: 'AI Coach',
      createdBy: 'system',
      lastModifiedBy: 'user-001',
      wordCount: 512,
    },
    feishuDocId: 'feishu-doc-003',
    createdAt: '2025-10-20T10:00:00Z',
    updatedAt: '2025-10-20T11:30:00Z',
  },

  // Stage 2: Solution Design Documents
  {
    id: 'doc-004',
    projectId: 'proj-001',
    stageId: 'stage-2-001',
    name: 'spec.md',
    content: `# 功能规格说明书 (Specification)

## 用户故事

### US-1: 用户通过 IAM SSO 登录

当用户访问应用时，如果未登录，系统自动跳转到 IAM 登录页面。用户输入凭证后，IAM 返回授权码，系统使用授权码交换 Access Token，完成登录并跳转回应用首页。

**验收标准**:
- 未登录用户访问应用时，自动跳转到 IAM 登录页
- 登录成功后，用户信息显示在页面右上角
- Token 存储在 httpOnly Cookie 中，防止 XSS 攻击

---

### US-2: 用户查看个人信息

登录后，用户可以点击右上角头像，查看个人信息（姓名、邮箱、所属组织、角色）。

**验收标准**:
- 点击头像弹出用户信息卡片
- 显示用户姓名、邮箱、头像、所属租户、角色列表

---

### US-3: 用户登出

用户可以点击"登出"按钮，清除本地 Token 并跳转到 IAM 登出页面。

**验收标准**:
- 点击登出后，清除所有本地存储的认证信息
- 跳转到 IAM 登出页面，完成全局登出
- 登出后访问应用，自动跳转到登录页

---

### US-4: Token 自动刷新

当 Access Token 即将过期（剩余 5 分钟）时，系统自动使用 Refresh Token 刷新，无需用户重新登录。

**验收标准**:
- Token 过期前自动刷新，用户无感知
- 刷新失败时，提示用户重新登录
- 并发请求时，仅发起一次刷新请求

---

### US-5: 权限控制

系统根据用户角色显示不同功能。Viewer 用户只能查看，Editor 用户可以编辑，Owner 用户可以管理权限和删除项目。

**验收标准**:
- Viewer 用户看不到编辑和删除按钮
- Editor 用户可以编辑内容，但看不到权限管理按钮
- Owner 用户拥有所有功能访问权限

## 成功标准

- 登录成功率 > 99.9%
- Token 刷新成功率 > 99%
- 登录流程耗时 < 3 秒
- 权限校验响应时间 < 100ms`,
    version: 5,
    status: DocumentStatus.Completed,
    metadata: {
      author: 'AI Coach',
      createdBy: 'system',
      lastModifiedBy: 'user-001',
      wordCount: 876,
    },
    feishuDocId: 'feishu-doc-004',
    createdAt: '2025-10-21T09:00:00Z',
    updatedAt: '2025-10-22T14:30:00Z',
  },
  {
    id: 'doc-005',
    projectId: 'proj-001',
    stageId: 'stage-2-001',
    name: 'architecture.md',
    content: `# 架构设计文档

## 系统架构

### 整体架构

\`\`\`
┌─────────────┐
│   Browser   │
│  (React)    │
└──────┬──────┘
       │ HTTPS
       ▼
┌─────────────┐      ┌──────────┐
│   Nginx     │─────▶│   IAM    │
│ (Reverse    │      │  Server  │
│  Proxy)     │      └──────────┘
└──────┬──────┘
       │
       ▼
┌─────────────┐      ┌──────────┐
│   Backend   │─────▶│ Database │
│  (Node.js)  │      │(Postgres)│
└─────────────┘      └──────────┘
       │
       ▼
┌─────────────┐
│    Redis    │
│   (Cache)   │
└─────────────┘
\`\`\`

### 前端架构

- **状态管理**: Zustand (轻量级状态管理)
- **路由**: React Router v6
- **UI 组件**: Ant Design 5.x
- **HTTP 客户端**: Axios with interceptors
- **认证**: httpOnly Cookies + Token refresh logic

### 后端架构

- **框架**: Express.js
- **认证中间件**: passport-oauth2
- **数据库 ORM**: Prisma
- **缓存**: ioredis
- **日志**: Winston

## 数据模型

### User 表

- id (UUID, PK)
- email (String, Unique)
- name (String)
- avatar_url (String, Nullable)
- tenant_id (UUID, FK)
- created_at (Timestamp)
- updated_at (Timestamp)

### UserRole 表 (多对多关联)

- user_id (UUID, FK)
- project_id (UUID, FK)
- role (Enum: owner, editor, viewer)
- granted_at (Timestamp)
- granted_by (UUID, FK)`,
    version: 2,
    status: DocumentStatus.Draft,
    metadata: {
      author: '张伟',
      createdBy: 'user-001',
      lastModifiedBy: 'user-001',
      wordCount: 445,
    },
    createdAt: '2025-10-22T10:00:00Z',
    updatedAt: '2025-10-23T16:00:00Z',
  },

  // Stage 3: Implementation Plan Documents
  {
    id: 'doc-006',
    projectId: 'proj-001',
    stageId: 'stage-3-001',
    name: 'plan.md',
    content: `# 实施计划

## Phase 1: 前端基础设施 (Week 1)

### 任务
- [ ] 初始化 React + TypeScript 项目
- [ ] 配置 Ant Design 和 Zustand
- [ ] 实现 OAuth 2.0 授权流程
- [ ] 实现 Token 存储和刷新逻辑
- [ ] 创建认证 Context 和 Hook

### 产出
- 可运行的前端项目骨架
- 完整的认证流程实现
- 单元测试覆盖率 > 80%

---

## Phase 2: 后端 API 实现 (Week 2)

### 任务
- [ ] 初始化 Express 项目
- [ ] 配置 Passport OAuth2 策略
- [ ] 实现 /auth/login, /auth/callback, /auth/refresh, /auth/logout 端点
- [ ] 实现 JWT 中间件
- [ ] 实现权限校验中间件

### 产出
- 完整的认证 API
- API 文档 (OpenAPI 3.0)
- 集成测试覆盖核心流程

---

## Phase 3: 数据库和缓存 (Week 3)

### 任务
- [ ] 设计数据库 schema
- [ ] 使用 Prisma 迁移创建表
- [ ] 实现用户和权限 CRUD API
- [ ] 配置 Redis 缓存 Token
- [ ] 实现会话管理逻辑

### 产出
- 完整的数据库结构
- 用户和权限管理 API
- 缓存策略文档

---

## Phase 4: 集成测试和部署 (Week 4)

### 任务
- [ ] 前后端联调
- [ ] 编写端到端测试 (Playwright)
- [ ] 性能测试和优化
- [ ] 配置 CI/CD 流水线
- [ ] 部署到预发布环境

### 产出
- 可部署的完整应用
- E2E 测试套件
- 部署文档`,
    version: 1,
    status: DocumentStatus.Draft,
    metadata: {
      author: 'AI Coach',
      createdBy: 'system',
      lastModifiedBy: 'user-001',
      wordCount: 623,
    },
    createdAt: '2025-10-23T09:00:00Z',
    updatedAt: '2025-10-23T15:00:00Z',
  },

  // Stage 4: Task Construction Documents
  {
    id: 'doc-007',
    projectId: 'proj-001',
    stageId: 'stage-4-001',
    name: 'tasks.md',
    content: `# 任务清单

## Phase 1: 前端基础设施

### T001 - 初始化项目 [P]
**依赖**: 无
**描述**: 使用 Vite 创建 React + TypeScript 项目
**验收标准**:
- \`npm run dev\` 可以启动开发服务器
- TypeScript strict mode 已启用
- ESLint 和 Prettier 配置完成

---

### T002 - 安装依赖 [P]
**依赖**: T001
**描述**: 安装 Ant Design, Zustand, Axios, React Router
**验收标准**:
- 所有依赖安装成功
- package.json 中包含所有必需依赖

---

### T003 - 实现 OAuth2 授权流程
**依赖**: T002
**描述**: 实现 OAuth2 Authorization Code Flow
**文件**: src/services/auth.ts
**验收标准**:
- 点击"登录"按钮跳转到 IAM 授权页面
- 授权后回调到 /auth/callback 路由
- 使用授权码交换 Access Token
- Token 存储在 httpOnly Cookie

---

### T004 - 实现 Token 刷新逻辑
**依赖**: T003
**描述**: 在 Axios 拦截器中实现自动 Token 刷新
**文件**: src/services/api/request.ts
**验收标准**:
- Token 过期前 5 分钟自动刷新
- 刷新失败时引导用户重新登录
- 并发请求时仅刷新一次

---

### T005 - 创建认证 Context
**依赖**: T004
**描述**: 创建 AuthContext 提供认证状态和方法
**文件**: src/contexts/AuthContext.tsx
**验收标准**:
- 提供 \`user\`, \`isAuthenticated\`, \`login\`, \`logout\` 方法
- 子组件可以通过 \`useAuth\` Hook 访问认证状态

---

## Phase 2: 后端 API 实现

### T006 - 初始化 Express 项目 [P]
**依赖**: 无
**描述**: 创建 Express + TypeScript 后端项目
**验收标准**:
- \`npm run dev\` 启动服务器监听 3001 端口
- 支持热重载

---

### T007 - 配置 Passport OAuth2
**依赖**: T006
**描述**: 配置 Passport OAuth2 策略连接 IAM
**文件**: src/auth/passport.ts
**验收标准**:
- Passport 策略配置正确
- 可以获取 IAM 用户信息

---

### T008 - 实现认证端点
**依赖**: T007
**描述**: 实现 /auth/login, /auth/callback, /auth/refresh, /auth/logout
**文件**: src/routes/auth.ts
**验收标准**:
- 所有端点返回正确的 HTTP 状态码
- Token 以 httpOnly Cookie 形式返回

---

### T009 - 实现 JWT 中间件
**依赖**: T008
**描述**: 实现 JWT 验证中间件保护受保护路由
**文件**: src/middleware/auth.ts
**验收标准**:
- 有效 Token 可以访问受保护路由
- 无效 Token 返回 401

---

### T010 - 实现权限校验中间件
**依赖**: T009
**描述**: 实现基于角色的权限校验
**文件**: src/middleware/permission.ts
**验收标准**:
- 不同角色访问权限正确
- 无权限用户返回 403

---

## 任务依赖图

\`\`\`
T001 → T002 → T003 → T004 → T005
                ↓
T006 → T007 → T008 → T009 → T010
\`\`\`

---

**总任务数**: 10
**并行任务**: T001, T002, T006 (标记 [P])
**预计完成时间**: 2 周`,
    version: 1,
    status: DocumentStatus.Draft,
    metadata: {
      author: 'AI Coach',
      createdBy: 'system',
      lastModifiedBy: 'system',
      wordCount: 1024,
    },
    createdAt: '2025-10-24T10:00:00Z',
    updatedAt: '2025-10-24T10:00:00Z',
  },
];

// Helper function to get documents by project ID
export function getDocumentsByProjectId(projectId: string): Document[] {
  return mockDocuments.filter((doc) => doc.projectId === projectId);
}

// Helper function to get documents by stage ID
export function getDocumentsByStageId(stageId: string): Document[] {
  return mockDocuments.filter((doc) => doc.stageId === stageId);
}

// Helper function to get a single document by ID
export function getDocumentById(id: string): Document | undefined {
  return mockDocuments.find((doc) => doc.id === id);
}
