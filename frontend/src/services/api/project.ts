// Project Management API Service
// 适配 Claude Agent Service 的 Session API

import type {
  ApiResponse,
  PaginatedResponse,
  CreateProjectRequest,
  UpdateProjectRequest,
  ProjectListQuery,
  SetPermissionRequest,
} from '@/types/api';
import type { Project, ProjectPermission } from '@/types/models';
import { createSession, getSessions, getSession, deleteSession } from './session';
import { mapSessionToProject, mapSessionsToProjects, generateWorkspaceName } from './adapters';

/**
 * Get paginated list of projects (映射自 Sessions)
 */
export async function getProjects(
  query?: ProjectListQuery
): Promise<ApiResponse<PaginatedResponse<Project>>> {
  const response = await getSessions({
    skip: query?.page ? (query.page - 1) * (query.pageSize || 20) : 0,
    limit: query?.pageSize || 20,
    active_only: query?.status === 'active',
  });

  if (!response.success || !response.data) {
    return response as ApiResponse<PaginatedResponse<Project>>;
  }

  const projects = mapSessionsToProjects(response.data.sessions);
  const { total, skip, limit } = response.data;

  // 应用搜索和过滤
  let filteredProjects = projects;

  if (query?.search) {
    const searchLower = query.search.toLowerCase();
    filteredProjects = filteredProjects.filter(
      (p) =>
        p.name.toLowerCase().includes(searchLower) ||
        p.description?.toLowerCase().includes(searchLower)
    );
  }

  if (query?.category) {
    filteredProjects = filteredProjects.filter(
      (p) => p.category.virtualOrg === query.category
    );
  }

  return {
    success: true,
    data: {
      items: filteredProjects,
      total: total,
      page: Math.floor(skip / limit) + 1,
      pageSize: limit,
      hasMore: skip + limit < total,
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Create a new project (映射为 Session)
 */
export async function createProject(data: CreateProjectRequest): Promise<ApiResponse<Project>> {
  const workspaceName = generateWorkspaceName(data.name);

  const response = await createSession({
    workspace_name: workspaceName,
  });

  if (!response.success || !response.data) {
    return response as ApiResponse<Project>;
  }

  const project = mapSessionToProject(response.data);

  // 更新项目名称和描述
  project.name = data.name;
  project.description = data.description;
  project.category = data.category;

  return {
    success: true,
    data: project,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Get project details by ID (映射自 Session)
 */
export async function getProject(projectId: string): Promise<ApiResponse<Project>> {
  const response = await getSession(projectId);

  if (!response.success || !response.data) {
    return response as ApiResponse<Project>;
  }

  const project = mapSessionToProject(response.data);

  return {
    success: true,
    data: project,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Update project information
 * 注意：Claude Agent Service 不支持更新 Session，这里只是模拟
 */
export async function updateProject(
  projectId: string,
  data: UpdateProjectRequest
): Promise<ApiResponse<Project>> {
  // 先获取现有项目
  const projectResponse = await getProject(projectId);

  if (!projectResponse.success || !projectResponse.data) {
    return projectResponse;
  }

  const project = projectResponse.data;

  // 更新本地数据（实际上后端不支持更新）
  if (data.name) project.name = data.name;
  if (data.description !== undefined) project.description = data.description;
  if (data.status) project.status = data.status;

  return {
    success: true,
    data: project,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Delete a project (映射为删除 Session)
 */
export async function deleteProject(projectId: string): Promise<ApiResponse<void>> {
  const response = await deleteSession(projectId);

  if (!response.success) {
    return response as ApiResponse<void>;
  }

  return {
    success: true,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Get project permissions list
 * 注意：Claude Agent Service 不支持权限管理，返回空列表
 */
export async function getProjectPermissions(
  projectId: string
): Promise<ApiResponse<ProjectPermission[]>> {
  // Claude Agent Service 不支持权限管理
  return {
    success: true,
    data: [],
    timestamp: new Date().toISOString(),
  };
}

/**
 * Set user permission for a project
 * 注意：Claude Agent Service 不支持权限管理，这里只是模拟
 */
export async function setProjectPermission(
  projectId: string,
  data: SetPermissionRequest
): Promise<ApiResponse<ProjectPermission>> {
  // Claude Agent Service 不支持权限管理
  return {
    success: true,
    data: {
      userId: data.userId,
      role: data.role,
      grantedAt: new Date().toISOString(),
      grantedBy: 'system',
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Remove user permission from a project
 * 注意：Claude Agent Service 不支持权限管理，这里只是模拟
 */
export async function removeProjectPermission(
  projectId: string,
  userId: string
): Promise<ApiResponse<void>> {
  // Claude Agent Service 不支持权限管理
  return {
    success: true,
    timestamp: new Date().toISOString(),
  };
}
