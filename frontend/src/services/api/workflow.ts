// Workflow API Service
// Based on contracts/openapi.yaml

import { get, post, patch } from './request';
import type { ApiResponse, SwitchStageRequest } from '@/types/api';
import type { Workflow, Task, TaskStatus } from '@/types/models';

/**
 * Get workflow for a project
 */
export async function getWorkflow(projectId: string): Promise<ApiResponse<Workflow>> {
  return get<Workflow>(`/projects/${projectId}/workflow`);
}

/**
 * Get tasks for a specific stage
 */
export async function getStageTasks(projectId: string, stageId: string): Promise<ApiResponse<Task[]>> {
  return get<Task[]>(`/projects/${projectId}/workflow/stages/${stageId}/tasks`);
}

/**
 * Switch to a different workflow stage
 */
export async function switchStage(projectId: string, data: SwitchStageRequest): Promise<ApiResponse<Workflow>> {
  return post<Workflow>(`/projects/${projectId}/workflow/switch-stage`, data);
}

/**
 * Update task status (pause, resume, complete, etc.)
 */
export async function updateTaskStatus(
  projectId: string,
  taskId: string,
  status: TaskStatus
): Promise<ApiResponse<Task>> {
  return patch<Task>(`/projects/${projectId}/workflow/tasks/${taskId}`, { status });
}
