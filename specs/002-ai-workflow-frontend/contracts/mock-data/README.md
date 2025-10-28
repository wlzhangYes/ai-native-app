# Mock Data Examples

本目录包含用于前端开发的 Mock 数据示例，配合 Mock Service Worker (MSW) 使用。

## 文件说明

| 文件 | 说明 |
|------|------|
| `projects.example.ts` | 项目列表和详情的 mock 数据 |
| `workflows.example.ts` | 工作流和阶段的 mock 数据 |
| `documents.example.ts` | 文档内容的 mock 数据 |
| `conversations.example.ts` | 对话消息的 mock 数据 |
| `users.example.ts` | 用户和权限的 mock 数据 |

## 使用方式

### 1. 在 MSW Handlers 中引用

```typescript
// frontend/src/mocks/handlers.ts
import { http, HttpResponse } from 'msw';
import { mockProjects } from '@/mocks/data/projects';
import { mockWorkflows } from '@/mocks/data/workflows';

export const handlers = [
  http.get('/api/projects', () => {
    return HttpResponse.json({
      success: true,
      data: {
        items: mockProjects,
        total: mockProjects.length,
        page: 1,
        pageSize: 20,
        hasMore: false,
      },
      timestamp: new Date().toISOString(),
    });
  }),

  http.get('/api/projects/:projectId/workflow', ({ params }) => {
    const workflow = mockWorkflows.find(w => w.projectId === params.projectId);
    return HttpResponse.json({
      success: true,
      data: workflow,
      timestamp: new Date().toISOString(),
    });
  }),
];
```

### 2. 在实际项目中复制

将这些示例文件复制到 `frontend/src/mocks/data/` 目录，并根据需要调整。

```bash
cp contracts/mock-data/*.example.ts frontend/src/mocks/data/
```

### 3. 自定义 Mock 数据

根据开发需求，可以：
- 修改数据内容（如项目名称、阶段状态）
- 添加新的数据场景（如错误状态、边界情况）
- 创建工厂函数生成大量测试数据

## Mock 数据设计原则

1. **真实性**: 数据应接近真实场景，包含中文文本和合理的数值
2. **多样性**: 覆盖不同状态（pending, in_progress, completed）和角色（owner, editor, viewer）
3. **关联性**: 数据之间应有正确的外键关联（如 projectId, stageId）
4. **时间戳**: 使用合理的时间序列（createdAt < updatedAt）

## 数据工厂函数示例

```typescript
// frontend/src/mocks/factories/projectFactory.ts
import { Project, ProjectStatus } from '@/types/models';

let projectIdCounter = 1;

export function createMockProject(overrides?: Partial<Project>): Project {
  const id = `proj-${projectIdCounter++}`;
  const now = new Date().toISOString();

  return {
    id,
    name: `项目 ${projectIdCounter}`,
    description: '这是一个测试项目',
    category: {
      virtualOrg: '技术部',
      strategicOpportunity: '数字化转型',
      jobFamily: '软件开发',
    },
    currentStage: 0,
    status: ProjectStatus.Active,
    owner: {
      id: 'user-1',
      name: '张三',
      email: 'zhangsan@example.com',
    },
    permissions: [],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

// 使用示例
const testProjects = Array.from({ length: 10 }, (_, i) =>
  createMockProject({
    name: `测试项目 ${i + 1}`,
    currentStage: i % 5,
  })
);
```

## 注意事项

- ⚠️ 这些文件仅用于开发和测试，**不要**提交到生产环境
- ⚠️ 敏感信息（如真实用户数据）**不要**包含在 mock 数据中
- ✅ 提交到 Git 时使用 `.example.ts` 后缀，避免覆盖本地定制的 mock 数据
