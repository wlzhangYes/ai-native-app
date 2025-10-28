// Mock data for Projects
// Copy this file to frontend/src/mocks/data/projects.ts and customize as needed

import { Project, ProjectStatus, ProjectRole } from '@/types/models';

export const mockProjects: Project[] = [
  {
    id: 'proj-001',
    name: '用户登录功能',
    description: '实现基于 IAM SSO 的用户登录和认证功能，支持多租户和权限管理',
    category: {
      virtualOrg: '产品技术部',
      strategicOpportunity: '数字化转型',
      jobFamily: '软件开发',
    },
    currentStage: 2, // 方案构建阶段
    status: ProjectStatus.Active,
    owner: {
      id: 'user-001',
      name: '张伟',
      email: 'zhangwei@example.com',
      avatar: 'https://i.pravatar.cc/150?img=1',
    },
    permissions: [
      {
        userId: 'user-001',
        role: ProjectRole.Owner,
        grantedAt: '2025-10-20T09:00:00Z',
        grantedBy: 'user-001',
      },
      {
        userId: 'user-002',
        role: ProjectRole.Editor,
        grantedAt: '2025-10-21T10:30:00Z',
        grantedBy: 'user-001',
      },
      {
        userId: 'user-003',
        role: ProjectRole.Viewer,
        grantedAt: '2025-10-22T14:00:00Z',
        grantedBy: 'user-001',
      },
    ],
    createdAt: '2025-10-20T09:00:00Z',
    updatedAt: '2025-10-24T16:45:00Z',
  },
  {
    id: 'proj-002',
    name: '数据报表系统',
    description: '构建统一的数据报表平台，支持自定义报表、定时导出和权限控制',
    category: {
      virtualOrg: '数据智能部',
      strategicOpportunity: '数据驱动决策',
      jobFamily: '数据工程',
    },
    currentStage: 4, // 任务构造阶段
    status: ProjectStatus.Active,
    owner: {
      id: 'user-004',
      name: '李娜',
      email: 'lina@example.com',
      avatar: 'https://i.pravatar.cc/150?img=5',
    },
    permissions: [
      {
        userId: 'user-004',
        role: ProjectRole.Owner,
        grantedAt: '2025-10-15T08:00:00Z',
        grantedBy: 'user-004',
      },
    ],
    createdAt: '2025-10-15T08:00:00Z',
    updatedAt: '2025-10-25T10:00:00Z',
  },
  {
    id: 'proj-003',
    name: 'AI 智能客服',
    description: '基于大语言模型的智能客服系统，支持多轮对话、知识库检索和工单创建',
    category: {
      virtualOrg: 'AI 应用部',
      strategicOpportunity: 'AI 赋能业务',
      jobFamily: 'AI 工程',
    },
    currentStage: 1, // 需求澄清阶段
    status: ProjectStatus.Active,
    owner: {
      id: 'user-005',
      name: '王强',
      email: 'wangqiang@example.com',
      avatar: 'https://i.pravatar.cc/150?img=12',
    },
    permissions: [
      {
        userId: 'user-005',
        role: ProjectRole.Owner,
        grantedAt: '2025-10-23T09:30:00Z',
        grantedBy: 'user-005',
      },
      {
        userId: 'user-006',
        role: ProjectRole.Editor,
        grantedAt: '2025-10-24T11:00:00Z',
        grantedBy: 'user-005',
      },
    ],
    createdAt: '2025-10-23T09:30:00Z',
    updatedAt: '2025-10-25T09:15:00Z',
  },
  {
    id: 'proj-004',
    name: '供应链管理系统',
    description: '端到端的供应链管理平台，包含采购、库存、物流和财务模块',
    category: {
      virtualOrg: '供应链部',
      strategicOpportunity: '供应链数字化',
      jobFamily: '系统集成',
    },
    currentStage: 3, // 实施计划阶段
    status: ProjectStatus.Active,
    owner: {
      id: 'user-007',
      name: '刘芳',
      email: 'liufang@example.com',
      avatar: 'https://i.pravatar.cc/150?img=20',
    },
    permissions: [
      {
        userId: 'user-007',
        role: ProjectRole.Owner,
        grantedAt: '2025-10-18T10:00:00Z',
        grantedBy: 'user-007',
      },
      {
        userId: 'user-008',
        role: ProjectRole.Editor,
        grantedAt: '2025-10-19T14:30:00Z',
        grantedBy: 'user-007',
      },
      {
        userId: 'user-009',
        role: ProjectRole.Editor,
        grantedAt: '2025-10-20T16:00:00Z',
        grantedBy: 'user-007',
      },
    ],
    createdAt: '2025-10-18T10:00:00Z',
    updatedAt: '2025-10-24T18:30:00Z',
  },
  {
    id: 'proj-005',
    name: '移动端APP重构',
    description: '使用 React Native 重构现有移动应用，提升性能和用户体验',
    category: {
      virtualOrg: '产品技术部',
      strategicOpportunity: '移动端优先',
      jobFamily: '移动开发',
    },
    currentStage: 0, // 项目初始化阶段
    status: ProjectStatus.Paused,
    owner: {
      id: 'user-010',
      name: '陈磊',
      email: 'chenlei@example.com',
      avatar: 'https://i.pravatar.cc/150?img=33',
    },
    permissions: [
      {
        userId: 'user-010',
        role: ProjectRole.Owner,
        grantedAt: '2025-10-22T13:00:00Z',
        grantedBy: 'user-010',
      },
    ],
    createdAt: '2025-10-22T13:00:00Z',
    updatedAt: '2025-10-23T15:00:00Z',
  },
];

// Mock factory function
export function createMockProject(overrides?: Partial<Project>): Project {
  const id = `proj-${Date.now()}`;
  const now = new Date().toISOString();

  return {
    id,
    name: '新项目',
    description: '',
    category: {
      virtualOrg: '产品技术部',
      strategicOpportunity: '数字化转型',
      jobFamily: '软件开发',
    },
    currentStage: 0,
    status: ProjectStatus.Active,
    owner: {
      id: 'user-001',
      name: '当前用户',
      email: 'current@example.com',
    },
    permissions: [
      {
        userId: 'user-001',
        role: ProjectRole.Owner,
        grantedAt: now,
        grantedBy: 'user-001',
      },
    ],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}
