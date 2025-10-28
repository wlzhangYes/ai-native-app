# Phase 1: Frontend Data Model

**Feature**: AI-Driven Workflow Execution Frontend
**Date**: 2025-10-25
**Status**: Complete

本文档定义前端应用的数据模型、状态结构、TypeScript 类型定义和 Zustand Store 设计。

---

## 1. Core Entities (数据实体)

### 1.1 Project (项目)

```typescript
// types/models.ts
export interface Project {
  id: string;                    // 项目唯一标识
  name: string;                  // 项目名称
  description?: string;          // 项目描述
  category: ProjectCategory;     // 组织分类
  currentStage: WorkflowStage;   // 当前工作流阶段 (0-4)
  status: ProjectStatus;         // 项目状态
  owner: User;                   // 项目所有者
  permissions: ProjectPermission[]; // 权限列表
  createdAt: string;             // 创建时间 (ISO 8601)
  updatedAt: string;             // 更新时间 (ISO 8601)
}

export interface ProjectCategory {
  virtualOrg: string;            // 虚拟组织
  strategicOpportunity: string;  // 战略机会
  jobFamily: string;             // 岗位族
}

export enum ProjectStatus {
  Active = 'active',
  Paused = 'paused',
  Completed = 'completed',
  Archived = 'archived',
}

export enum WorkflowStage {
  Stage0 = 0, // 项目初始化
  Stage1 = 1, // 需求澄清
  Stage2 = 2, // 方案构建
  Stage3 = 3, // 实施计划
  Stage4 = 4, // 任务构造
}
```

### 1.2 Workflow (工作流)

```typescript
export interface Workflow {
  id: string;
  projectId: string;
  stages: Stage[];               // 5个工作流阶段
  currentStageIndex: number;     // 当前阶段索引 (0-4)
}

export interface Stage {
  id: string;
  stageNumber: number;           // 阶段编号 (0-4)
  name: string;                  // 阶段名称 (中文)
  status: StageStatus;           // 阶段状态
  tasks: Task[];                 // 子任务列表
  documents: Document[];         // 文档列表
  executionLogs: ExecutionLog[]; // 执行日志
  startedAt?: string;
  completedAt?: string;
}

export enum StageStatus {
  Pending = 'pending',
  InProgress = 'in_progress',
  Completed = 'completed',
}

export interface Task {
  id: string;
  stageId: string;
  name: string;
  description?: string;
  status: TaskStatus;
  createdAt: string;
  completedAt?: string;
}

export enum TaskStatus {
  Pending = 'pending',
  InProgress = 'in_progress',
  Completed = 'completed',
  Failed = 'failed',
}
```

### 1.3 Document (文档)

```typescript
export interface Document {
  id: string;
  projectId: string;
  stageId: string;
  name: string;                  // 文档名称 (如 spec.md)
  content: string;               // Markdown 内容
  version: number;               // 版本号
  status: DocumentStatus;        // 文档状态
  metadata: DocumentMetadata;    // 元数据
  feishuDocId?: string;          // 飞书文档ID (可选)
  createdAt: string;
  updatedAt: string;
}

export interface DocumentMetadata {
  author: string;                // 作者
  createdBy: string;             // 创建者 user ID
  lastModifiedBy: string;        // 最后修改者 user ID
  wordCount: number;             // 字数
}

export enum DocumentStatus {
  Draft = 'draft',
  Completed = 'completed',
}
```

### 1.4 Conversation (对话)

```typescript
export interface Conversation {
  id: string;
  projectId: string;
  stageId: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  sender: MessageSender;
  content: string;
  type: MessageType;
  timestamp: string;
  metadata?: MessageMetadata;
}

export enum MessageSender {
  User = 'user',
  AI = 'ai',
  System = 'system',
}

export enum MessageType {
  Input = 'input',               // 用户输入 (箭头图标)
  Response = 'response',         // AI响应 (白点图标)
  CommandSuccess = 'command_success', // 命令成功 (绿点图标)
  CommandFailure = 'command_failure', // 命令失败 (红点图标)
  Executing = 'executing',       // 执行中 (闪烁星星图标)
}

export interface MessageMetadata {
  documentId?: string;           // 相关文档ID
  taskId?: string;               // 相关任务ID
  errorDetails?: string;         // 错误详情
}
```

### 1.5 ExecutionLog (执行日志)

```typescript
export interface ExecutionLog {
  id: string;
  stageId: string;
  type: LogType;
  status: LogStatus;
  message: string;
  timestamp: string;
  metadata?: LogMetadata;
}

export enum LogType {
  UserAction = 'user_action',    // 用户操作
  AIProcess = 'ai_process',      // AI处理
  SystemEvent = 'system_event',  // 系统事件
}

export enum LogStatus {
  Success = 'success',
  Failure = 'failure',
  InProgress = 'in_progress',
}

export interface LogMetadata {
  documentId?: string;
  feishuDocId?: string;
  errorDetails?: string;
}
```

### 1.6 User & Permission (用户和权限)

```typescript
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface ProjectPermission {
  userId: string;
  role: ProjectRole;
  grantedAt: string;
  grantedBy: string;
}

export enum ProjectRole {
  Owner = 'owner',               // 可删除项目、与AI交互、编辑文档
  Editor = 'editor',             // 可与AI交互、编辑文档
  Viewer = 'viewer',             // 仅查看
}
```

---

## 2. Zustand Stores (状态管理)

### 2.1 Dialog Store (对话状态)

```typescript
// stores/useDialogStore.ts
import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';

interface DialogStore {
  // State
  messages: Message[];
  isStreaming: boolean;
  currentTaskStatus?: {
    taskName: string;
    status: TaskStatus;
  };

  // Actions
  addMessage: (message: Message) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  clearMessages: () => void;
  setStreaming: (streaming: boolean) => void;
  setTaskStatus: (status: { taskName: string; status: TaskStatus } | undefined) => void;
}

export const useDialogStore = create<DialogStore>()(
  devtools(
    persist(
      (set) => ({
        // Initial state
        messages: [],
        isStreaming: false,
        currentTaskStatus: undefined,

        // Actions
        addMessage: (message) =>
          set((state) => ({
            messages: [...state.messages, message],
          })),

        updateMessage: (id, updates) =>
          set((state) => ({
            messages: state.messages.map((msg) =>
              msg.id === id ? { ...msg, ...updates } : msg
            ),
          })),

        clearMessages: () => set({ messages: [] }),

        setStreaming: (streaming) => set({ isStreaming: streaming }),

        setTaskStatus: (status) => set({ currentTaskStatus: status }),
      }),
      {
        name: 'dialog-store',
        partialize: (state) => ({ messages: state.messages }), // 仅持久化 messages
      }
    )
  )
);
```

### 2.2 Workflow Store (工作流状态)

```typescript
// stores/useWorkflowStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface WorkflowStore {
  // State
  workflow: Workflow | null;
  activeStageId: string | null;
  selectedDocumentId: string | null;
  expandedKeys: string[];

  // Actions
  setWorkflow: (workflow: Workflow) => void;
  updateStage: (stageId: string, updates: Partial<Stage>) => void;
  setActiveStage: (stageId: string) => void;
  setSelectedDocument: (documentId: string | null) => void;
  setExpandedKeys: (keys: string[]) => void;
  addTask: (stageId: string, task: Task) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  addExecutionLog: (stageId: string, log: ExecutionLog) => void;
}

export const useWorkflowStore = create<WorkflowStore>()(
  devtools((set) => ({
    // Initial state
    workflow: null,
    activeStageId: null,
    selectedDocumentId: null,
    expandedKeys: [],

    // Actions
    setWorkflow: (workflow) => set({ workflow }),

    updateStage: (stageId, updates) =>
      set((state) => {
        if (!state.workflow) return state;
        return {
          workflow: {
            ...state.workflow,
            stages: state.workflow.stages.map((stage) =>
              stage.id === stageId ? { ...stage, ...updates } : stage
            ),
          },
        };
      }),

    setActiveStage: (stageId) => set({ activeStageId: stageId }),

    setSelectedDocument: (documentId) => set({ selectedDocumentId: documentId }),

    setExpandedKeys: (keys) => set({ expandedKeys: keys }),

    addTask: (stageId, task) =>
      set((state) => {
        if (!state.workflow) return state;
        return {
          workflow: {
            ...state.workflow,
            stages: state.workflow.stages.map((stage) =>
              stage.id === stageId
                ? { ...stage, tasks: [...stage.tasks, task] }
                : stage
            ),
          },
        };
      }),

    updateTask: (taskId, updates) =>
      set((state) => {
        if (!state.workflow) return state;
        return {
          workflow: {
            ...state.workflow,
            stages: state.workflow.stages.map((stage) => ({
              ...stage,
              tasks: stage.tasks.map((task) =>
                task.id === taskId ? { ...task, ...updates } : task
              ),
            })),
          },
        };
      }),

    addExecutionLog: (stageId, log) =>
      set((state) => {
        if (!state.workflow) return state;
        return {
          workflow: {
            ...state.workflow,
            stages: state.workflow.stages.map((stage) =>
              stage.id === stageId
                ? { ...stage, executionLogs: [log, ...stage.executionLogs] }
                : stage
            ),
          },
        };
      }),
  }))
);
```

### 2.3 Document Store (文档状态)

```typescript
// stores/useDocumentStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface DocumentStore {
  // State
  documents: Map<string, Document>;
  editingDocumentId: string | null;
  draftContent: string | null;
  isDiffMode: boolean;
  oldContent: string | null;
  newContent: string | null;

  // Actions
  setDocument: (document: Document) => void;
  updateDocument: (id: string, updates: Partial<Document>) => void;
  startEditing: (documentId: string) => void;
  saveDraft: (content: string) => void;
  cancelEditing: () => void;
  enterDiffMode: (oldContent: string, newContent: string) => void;
  exitDiffMode: () => void;
  acceptChanges: () => void;
  rejectChanges: () => void;
}

export const useDocumentStore = create<DocumentStore>()(
  devtools((set, get) => ({
    // Initial state
    documents: new Map(),
    editingDocumentId: null,
    draftContent: null,
    isDiffMode: false,
    oldContent: null,
    newContent: null,

    // Actions
    setDocument: (document) =>
      set((state) => ({
        documents: new Map(state.documents).set(document.id, document),
      })),

    updateDocument: (id, updates) =>
      set((state) => {
        const doc = state.documents.get(id);
        if (!doc) return state;
        return {
          documents: new Map(state.documents).set(id, { ...doc, ...updates }),
        };
      }),

    startEditing: (documentId) => {
      const doc = get().documents.get(documentId);
      set({
        editingDocumentId: documentId,
        draftContent: doc?.content || '',
      });
    },

    saveDraft: (content) => set({ draftContent: content }),

    cancelEditing: () =>
      set({
        editingDocumentId: null,
        draftContent: null,
      }),

    enterDiffMode: (oldContent, newContent) =>
      set({
        isDiffMode: true,
        oldContent,
        newContent,
      }),

    exitDiffMode: () =>
      set({
        isDiffMode: false,
        oldContent: null,
        newContent: null,
      }),

    acceptChanges: () => {
      const { editingDocumentId, newContent } = get();
      if (editingDocumentId && newContent) {
        get().updateDocument(editingDocumentId, { content: newContent });
      }
      set({
        isDiffMode: false,
        oldContent: null,
        newContent: null,
        editingDocumentId: null,
      });
    },

    rejectChanges: () => {
      set({
        isDiffMode: false,
        oldContent: null,
        newContent: null,
      });
    },
  }))
);
```

### 2.4 Project Store (项目状态)

```typescript
// stores/useProjectStore.ts
import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';

interface ProjectStore {
  // State
  projects: Project[];
  currentProjectId: string | null;
  searchQuery: string;
  filterCategory: ProjectCategory | null;

  // Actions
  setProjects: (projects: Project[]) => void;
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  setCurrentProject: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  setFilterCategory: (category: ProjectCategory | null) => void;
}

export const useProjectStore = create<ProjectStore>()(
  devtools(
    persist(
      (set) => ({
        // Initial state
        projects: [],
        currentProjectId: null,
        searchQuery: '',
        filterCategory: null,

        // Actions
        setProjects: (projects) => set({ projects }),

        addProject: (project) =>
          set((state) => ({ projects: [...state.projects, project] })),

        updateProject: (id, updates) =>
          set((state) => ({
            projects: state.projects.map((proj) =>
              proj.id === id ? { ...proj, ...updates } : proj
            ),
          })),

        deleteProject: (id) =>
          set((state) => ({
            projects: state.projects.filter((proj) => proj.id !== id),
          })),

        setCurrentProject: (id) => set({ currentProjectId: id }),

        setSearchQuery: (query) => set({ searchQuery: query }),

        setFilterCategory: (category) => set({ filterCategory: category }),
      }),
      {
        name: 'project-store',
        partialize: (state) => ({
          currentProjectId: state.currentProjectId,
        }),
      }
    )
  )
);
```

---

## 3. React Context (全局状态)

### 3.1 Auth Context (认证上下文)

```typescript
// contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 检查 session 是否有效
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const response = await fetch('/api/auth/me', { credentials: 'include' });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function login(token: string) {
    // IAM SSO 登录后由后端设置 httpOnly cookie
    await checkAuth();
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    setUser(null);
  }

  async function refreshToken() {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refreshToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

### 3.2 Theme Context (主题上下文)

```typescript
// contexts/ThemeContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme');
    return (saved as Theme) || 'light';
  });

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  function setTheme(newTheme: Theme) {
    setThemeState(newTheme);
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
```

---

## 4. API Response Types

```typescript
// types/api.ts

// 通用响应格式
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  timestamp: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// 分页响应
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// 项目列表响应
export type GetProjectsResponse = ApiResponse<PaginatedResponse<Project>>;

// 项目详情响应
export type GetProjectResponse = ApiResponse<Project>;

// 工作流响应
export type GetWorkflowResponse = ApiResponse<Workflow>;

// 对话历史响应
export type GetConversationResponse = ApiResponse<Conversation>;

// SSE 事件类型
export interface SSEEvent {
  type: 'message' | 'status' | 'error' | 'complete';
  data: any;
  timestamp: string;
}
```

---

## 5. Tree Data Structure (工作流树)

```typescript
// types/workflow.ts
import { DataNode } from 'antd/es/tree';

export interface WorkflowTreeNode extends DataNode {
  key: string;
  title: string;
  type: 'stage' | 'task' | 'document';
  status: StageStatus | TaskStatus | DocumentStatus;
  taskCount?: number;              // 仅阶段节点有此字段
  icon?: React.ReactNode;
  children?: WorkflowTreeNode[];
}

// 将 Workflow 转换为 Ant Design Tree 数据结构
export function workflowToTreeData(workflow: Workflow): WorkflowTreeNode[] {
  return workflow.stages.map((stage) => ({
    key: stage.id,
    title: `阶段${stage.stageNumber}：${stage.name}`,
    type: 'stage',
    status: stage.status,
    taskCount: stage.tasks.length + stage.documents.length,
    icon: getStageIcon(stage.status),
    children: [
      ...stage.tasks.map((task) => ({
        key: task.id,
        title: task.name,
        type: 'task' as const,
        status: task.status,
        icon: getTaskIcon(task.status),
      })),
      ...stage.documents.map((doc) => ({
        key: doc.id,
        title: doc.name,
        type: 'document' as const,
        status: doc.status,
        icon: getDocumentIcon(doc.status),
      })),
    ],
  }));
}
```

---

## 6. LocalStorage Schema (用户偏好)

```typescript
// services/storage/localStorage.ts

interface UserPreferences {
  columnWidths: {
    left: number;
    middle: number;
    right: number;
  };
  theme: 'light' | 'dark';
  language: 'zh-CN' | 'en-US';
  expandedTreeKeys: string[];
}

export function getUserPreferences(): UserPreferences {
  const stored = localStorage.getItem('user-preferences');
  return stored
    ? JSON.parse(stored)
    : {
        columnWidths: { left: 30, middle: 20, right: 50 },
        theme: 'light',
        language: 'zh-CN',
        expandedTreeKeys: [],
      };
}

export function setUserPreferences(prefs: Partial<UserPreferences>) {
  const current = getUserPreferences();
  localStorage.setItem('user-preferences', JSON.stringify({ ...current, ...prefs }));
}
```

---

## Summary

### Store 使用场景

| Store | 用途 | 持久化 |
|-------|------|--------|
| **DialogStore** | 对话消息、流式状态、任务状态 | 是 (IndexedDB) |
| **WorkflowStore** | 工作流结构、活动阶段、选中文档 | 否 (从API加载) |
| **DocumentStore** | 文档内容、编辑状态、Diff 模式 | 否 (从API加载) |
| **ProjectStore** | 项目列表、当前项目、搜索过滤 | 部分 (currentProjectId) |
| **AuthContext** | 用户认证、登录状态 | 否 (httpOnly cookie) |
| **ThemeContext** | 主题设置 | 是 (LocalStorage) |

### 数据流向

```
用户操作 → Zustand Action → API 调用 → 更新 Store → React 组件重渲染
                                      ↓
                               IndexedDB 持久化
```

---

**Status**: ✅ Complete - Frontend data model fully defined
