# Quickstart Guide: Frontend Development Setup

**Feature**: AI-Driven Workflow Execution Frontend
**Date**: 2025-10-25
**Version**: 1.0.0

本文档提供前端开发环境的快速搭建指南。

---

## 前置要求

### 必需软件

| 软件 | 版本要求 | 安装验证 |
|------|---------|----------|
| **Node.js** | >= 18.x | `node --version` |
| **npm** | >= 9.x | `npm --version` |
| **Git** | >= 2.x | `git --version` |

### 推荐工具

- **VS Code** (推荐编辑器)
- **VS Code Extensions**:
  - ESLint
  - Prettier
  - TypeScript Vue Plugin (Volar)
  - Tailwind CSS IntelliSense

---

## 1. 项目初始化

### 1.1 创建项目目录

```bash
cd /Users/admin/Desktop/anker/ai-native-app
mkdir frontend
cd frontend
```

### 1.2 初始化 Vite + React + TypeScript 项目

```bash
npm create vite@latest . -- --template react-ts
```

**选择选项**:
- Framework: `React`
- Variant: `TypeScript`

### 1.3 安装依赖

```bash
npm install
```

---

## 2. 安装核心依赖

### 2.1 UI 组件库

```bash
# Ant Design
npm install antd

# AIOS-Design (如果是内部包，替换为实际安装方式)
# npm install @aios/design
```

### 2.2 状态管理

```bash
# Zustand
npm install zustand

# Zustand middleware
npm install immer
```

### 2.3 HTTP 客户端和 SSE

```bash
# Axios
npm install axios

# EventSource 类型定义 (原生 API，仅需类型)
npm install --save-dev @types/eventsource
```

### 2.4 Markdown 和虚拟滚动

```bash
# Markdown 渲染
npm install react-markdown remark-gfm

# 代码高亮 (可选)
npm install react-syntax-highlighter
npm install --save-dev @types/react-syntax-highlighter

# 虚拟滚动
npm install react-window
npm install --save-dev @types/react-window

# 自适应文本输入
npm install react-textarea-autosize
npm install --save-dev @types/react-textarea-autosize
```

### 2.5 文档 Diff

```bash
# Diff 算法
npm install diff-match-patch
npm install --save-dev @types/diff-match-patch
```

### 2.6 本地存储

```bash
# IndexedDB 封装
npm install idb
```

### 2.7 Mock Service Worker

```bash
# MSW (开发和测试)
npm install --save-dev msw
```

### 2.8 测试库

```bash
# Vitest
npm install --save-dev vitest

# React Testing Library
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event

# Playwright (E2E 测试)
npm install --save-dev @playwright/test
```

---

## 3. 配置 MSW (Mock Service Worker)

### 3.1 初始化 MSW

```bash
npx msw init public/ --save
```

这会在 `public/` 目录生成 `mockServiceWorker.js`。

### 3.2 创建 Mock Handlers

创建 `src/mocks/` 目录结构：

```bash
mkdir -p src/mocks/data
touch src/mocks/handlers.ts
touch src/mocks/server.ts
```

**src/mocks/handlers.ts**:
```typescript
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/projects', () => {
    return HttpResponse.json({
      success: true,
      data: {
        items: [],
        total: 0,
        page: 1,
        pageSize: 20,
        hasMore: false,
      },
      timestamp: new Date().toISOString(),
    });
  }),
];
```

**src/mocks/server.ts**:
```typescript
import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

export const worker = setupWorker(...handlers);
```

### 3.3 在开发环境启动 MSW

修改 `src/main.tsx`：

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

async function enableMocking() {
  if (import.meta.env.DEV) {
    const { worker } = await import('./mocks/server');
    return worker.start({
      onUnhandledRequest: 'bypass', // 忽略未处理的请求
    });
  }
}

enableMocking().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});
```

---

## 4. 配置 TypeScript

### 4.1 更新 tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,

    /* Path alias */
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### 4.2 配置路径别名 (Vite)

修改 `vite.config.ts`：

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
  },
});
```

---

## 5. 创建项目目录结构

```bash
mkdir -p src/{components/{layout,dialog,workflow,preview,shared},services/{api,storage},stores,contexts,types,utils,hooks,mocks/{data}}
```

完整结构：
```
src/
├── components/
│   ├── layout/
│   ├── dialog/
│   ├── workflow/
│   ├── preview/
│   └── shared/
├── services/
│   ├── api/
│   └── storage/
├── stores/
├── contexts/
├── types/
├── utils/
├── hooks/
└── mocks/
    ├── data/
    ├── handlers.ts
    └── server.ts
```

---

## 6. 环境变量配置

创建 `.env.development`:

```bash
VITE_API_BASE_URL=http://localhost:3000/api
VITE_APP_NAME=AI Workflow System
VITE_ENABLE_MOCK=true
```

创建 `.env.production`:

```bash
VITE_API_BASE_URL=https://api.workflow.example.com/api
VITE_APP_NAME=AI Workflow System
VITE_ENABLE_MOCK=false
```

---

## 7. 运行项目

### 7.1 启动开发服务器

```bash
npm run dev
```

访问: http://localhost:3000

**验证 MSW**:
- 打开浏览器开发者工具 (F12) → Console
- 应该看到: `[MSW] Mocking enabled.`

### 7.2 构建生产版本

```bash
npm run build
```

### 7.3 预览生产构建

```bash
npm run preview
```

---

## 8. 编码规范和 Linting

### 8.1 安装 ESLint 和 Prettier

```bash
npm install --save-dev eslint prettier eslint-config-prettier eslint-plugin-prettier
npm install --save-dev @typescript-eslint/parser @typescript-eslint/eslint-plugin
```

### 8.2 创建 .eslintrc.cjs

```javascript
module.exports = {
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  plugins: ['react-refresh', 'prettier'],
  rules: {
    'react-refresh/only-export-components': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn',
    'prettier/prettier': 'error',
  },
};
```

### 8.3 创建 .prettierrc

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}
```

### 8.4 运行 Lint

```bash
npm run lint
```

---

## 9. 测试配置

### 9.1 配置 Vitest

创建 `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### 9.2 创建测试 Setup 文件

**src/test/setup.ts**:
```typescript
import '@testing-library/jest-dom';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { setupServer } from 'msw/node';
import { handlers } from '@/mocks/handlers';

const server = setupServer(...handlers);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### 9.3 添加测试脚本

修改 `package.json`:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint src --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

### 9.4 运行测试

```bash
# 运行所有测试
npm test

# Watch 模式
npm test -- --watch

# 生成覆盖率报告
npm run test:coverage
```

---

## 10. 配置 Playwright (E2E 测试)

### 10.1 初始化 Playwright

```bash
npx playwright install
```

### 10.2 创建 E2E 测试

创建 `tests/e2e/workflow.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test('应该显示项目列表', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.getByText('项目列表')).toBeVisible();
});
```

### 10.3 运行 E2E 测试

```bash
npx playwright test
```

---

## 11. Git 忽略配置

确保 `.gitignore` 包含以下内容：

```
# Dependencies
node_modules/

# Build output
dist/
build/

# Environment files
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/

# Test coverage
coverage/

# MSW
public/mockServiceWorker.js

# Playwright
test-results/
playwright-report/
```

---

## 12. 常见问题排查

### 12.1 MSW 未生效

**症状**: 浏览器 Console 没有 `[MSW] Mocking enabled.` 消息

**解决方案**:
1. 确认 `public/mockServiceWorker.js` 存在
2. 清除浏览器缓存和 Service Worker（开发者工具 → Application → Service Workers → Unregister）
3. 重启开发服务器

### 12.2 TypeScript 路径别名无法解析

**症状**: `import '@/...'` 报错 "Cannot find module"

**解决方案**:
1. 检查 `tsconfig.json` 的 `baseUrl` 和 `paths` 配置
2. 检查 `vite.config.ts` 的 `resolve.alias` 配置
3. 重启 VS Code 或开发服务器

### 12.3 Ant Design 样式未加载

**症状**: 组件显示但无样式

**解决方案**:
在 `main.tsx` 中导入 Ant Design CSS:

```typescript
import 'antd/dist/reset.css';
```

---

## 13. 下一步

开发环境搭建完成后，可以开始实现核心功能：

1. **API 封装** (`src/services/api/request.ts`) - 参考 `research.md` 中的 Axios 拦截器模式
2. **Zustand Store** (`src/stores/`) - 参考 `data-model.md` 中的 Store 设计
3. **三栏布局** (`src/components/layout/ThreeColumnLayout.tsx`) - 参考 `spec.md` 的布局需求
4. **SSE 集成** (`src/hooks/useSSE.ts`) - 参考 `contracts/sse-events.md`
5. **Mock 数据** (`src/mocks/data/`) - 参考 `contracts/mock-data/` 示例

---

## 相关文档

- [research.md](./research.md) - 技术选型和最佳实践
- [data-model.md](./data-model.md) - 数据模型和状态管理
- [contracts/openapi.yaml](./contracts/openapi.yaml) - API 契约
- [contracts/sse-events.md](./contracts/sse-events.md) - SSE 事件定义
- [plan.md](./plan.md) - 实施计划

---

**Status**: ✅ Complete - Development environment ready for coding
