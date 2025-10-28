// Project Store - Manages project list and current project state
// Based on data-model.md Zustand store design
// Integrated with Claude Agent Service Session API

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { Project, ProjectStatus } from '@/types/models';
import { getSessions, createSession, deleteSession, getSession } from '@/services/api/session';
import { mapSessionToProject, mapSessionsToProjects } from '@/services/api/adapters';
import type { SessionCreateRequest } from '@/services/api/session';

// ============================================================================
// Store State Interface
// ============================================================================

interface ProjectStore {
  // State
  projects: Project[];
  currentProjectId: string | null;
  searchQuery: string;
  filterStatus: ProjectStatus | 'all';
  filterCategory: string | null;
  isLoading: boolean;
  error: string | null;

  // Local Actions
  setProjects: (projects: Project[]) => void;
  addProject: (project: Project) => void;
  updateProject: (projectId: string, updates: Partial<Project>) => void;
  removeProject: (projectId: string) => void;
  setCurrentProject: (projectId: string | null) => void;
  setSearchQuery: (query: string) => void;
  setFilterStatus: (status: ProjectStatus | 'all') => void;
  setFilterCategory: (category: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearProjects: () => void;

  // API Actions
  fetchProjects: (params?: { skip?: number; limit?: number; activeOnly?: boolean }) => Promise<void>;
  createNewProject: (data?: SessionCreateRequest) => Promise<Project | null>;
  deleteProjectById: (projectId: string) => Promise<void>;
  refreshCurrentProject: () => Promise<void>;
}

// ============================================================================
// Store Implementation
// ============================================================================

export const useProjectStore = create<ProjectStore>()(
  devtools(
    persist(
      immer((set) => ({
        // Initial state
        projects: [],
        currentProjectId: null,
        searchQuery: '',
        filterStatus: 'all',
        filterCategory: null,
        isLoading: false,
        error: null,

        // Set all projects
        setProjects: (projects) =>
          set((state) => {
            state.projects = projects;
          }),

        // Add a new project
        addProject: (project) =>
          set((state) => {
            state.projects.push(project);
          }),

        // Update an existing project
        updateProject: (projectId, updates) =>
          set((state) => {
            const projectIndex = state.projects.findIndex((p) => p.id === projectId);
            if (projectIndex !== -1) {
              state.projects[projectIndex] = {
                ...state.projects[projectIndex],
                ...updates,
                updatedAt: new Date().toISOString(),
              };
            }
          }),

        // Remove a project
        removeProject: (projectId) =>
          set((state) => {
            state.projects = state.projects.filter((p) => p.id !== projectId);
            if (state.currentProjectId === projectId) {
              state.currentProjectId = null;
            }
          }),

        // Set current active project
        setCurrentProject: (projectId) =>
          set((state) => {
            state.currentProjectId = projectId;
          }),

        // Set search query
        setSearchQuery: (query) =>
          set((state) => {
            state.searchQuery = query;
          }),

        // Set status filter
        setFilterStatus: (status) =>
          set((state) => {
            state.filterStatus = status;
          }),

        // Set category filter
        setFilterCategory: (category) =>
          set((state) => {
            state.filterCategory = category;
          }),

        // Set loading state
        setLoading: (loading) =>
          set((state) => {
            state.isLoading = loading;
          }),

        // Set error state
        setError: (error) =>
          set((state) => {
            state.error = error;
          }),

        // Clear all projects
        clearProjects: () =>
          set((state) => {
            state.projects = [];
            state.currentProjectId = null;
            state.searchQuery = '';
            state.filterStatus = 'all';
            state.filterCategory = null;
            state.error = null;
          }),

        // ====================================================================
        // API Actions
        // ====================================================================

        // Fetch projects from backend (Session API)
        fetchProjects: async (params) => {
          set((state) => {
            state.isLoading = true;
            state.error = null;
          });

          try {
            const response = await getSessions({
              skip: params?.skip,
              limit: params?.limit || 100,
              active_only: params?.activeOnly ?? true,
            });

            if (response.data) {
              const projects = mapSessionsToProjects(response.data.sessions);
              set((state) => {
                state.projects = projects;
                state.isLoading = false;
              });
            } else {
              const errorMsg = typeof response.error === 'string'
                ? response.error
                : response.error?.message || '获取项目列表失败';
              throw new Error(errorMsg);
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '未知错误';
            set((state) => {
              state.isLoading = false;
              state.error = errorMessage;
            });
            console.error('[ProjectStore] fetchProjects error:', error);
          }
        },

        // Create a new project (Session)
        createNewProject: async (data) => {
          set((state) => {
            state.isLoading = true;
            state.error = null;
          });

          try {
            const response = await createSession(data);

            if (response.data) {
              const newProject = mapSessionToProject(response.data);
              set((state) => {
                state.projects.unshift(newProject); // Add to beginning
                state.currentProjectId = newProject.id; // Auto-select
                state.isLoading = false;
              });
              return newProject;
            } else {
              const errorMsg = typeof response.error === 'string'
                ? response.error
                : response.error?.message || '创建项目失败';
              throw new Error(errorMsg);
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '未知错误';
            set((state) => {
              state.isLoading = false;
              state.error = errorMessage;
            });
            console.error('[ProjectStore] createNewProject error:', error);
            return null;
          }
        },

        // Delete a project by ID
        deleteProjectById: async (projectId) => {
          set((state) => {
            state.isLoading = true;
            state.error = null;
          });

          try {
            const response = await deleteSession(projectId);

            if (response.data) {
              set((state) => {
                state.projects = state.projects.filter((p) => p.id !== projectId);
                if (state.currentProjectId === projectId) {
                  state.currentProjectId = null;
                }
                state.isLoading = false;
              });
            } else {
              const errorMsg = typeof response.error === 'string'
                ? response.error
                : response.error?.message || '删除项目失败';
              throw new Error(errorMsg);
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '未知错误';
            set((state) => {
              state.isLoading = false;
              state.error = errorMessage;
            });
            console.error('[ProjectStore] deleteProjectById error:', error);
          }
        },

        // Refresh current project details
        refreshCurrentProject: async () => {
          const currentId = useProjectStore.getState().currentProjectId;
          if (!currentId) {
            console.warn('[ProjectStore] No current project to refresh');
            return;
          }

          set((state) => {
            state.isLoading = true;
            state.error = null;
          });

          try {
            const response = await getSession(currentId);

            if (response.data) {
              const updatedProject = mapSessionToProject(response.data);
              set((state) => {
                const index = state.projects.findIndex((p) => p.id === currentId);
                if (index !== -1) {
                  state.projects[index] = updatedProject;
                }
                state.isLoading = false;
              });
            } else {
              const errorMsg = typeof response.error === 'string'
                ? response.error
                : response.error?.message || '获取项目详情失败';
              throw new Error(errorMsg);
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '未知错误';
            set((state) => {
              state.isLoading = false;
              state.error = errorMessage;
            });
            console.error('[ProjectStore] refreshCurrentProject error:', error);
          }
        },
      })),
      {
        name: 'project-store',
        partialize: (state) => ({
          currentProjectId: state.currentProjectId, // Persist current project
          filterStatus: state.filterStatus,
          filterCategory: state.filterCategory,
          // Don't persist projects list (fetch from server)
        }),
      }
    ),
    { name: 'ProjectStore' }
  )
);

// ============================================================================
// Selectors
// ============================================================================

export const selectProjects = (state: ProjectStore) => state.projects;

export const selectCurrentProject = (state: ProjectStore) =>
  state.projects.find((p) => p.id === state.currentProjectId) || null;

export const selectFilteredProjects = (state: ProjectStore) => {
  let filtered = state.projects;

  // Apply search query
  if (state.searchQuery) {
    const query = state.searchQuery.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query) ||
        p.category.virtualOrg.toLowerCase().includes(query)
    );
  }

  // Apply status filter
  if (state.filterStatus !== 'all') {
    filtered = filtered.filter((p) => p.status === state.filterStatus);
  }

  // Apply category filter
  if (state.filterCategory) {
    filtered = filtered.filter((p) => p.category.virtualOrg === state.filterCategory);
  }

  return filtered;
};

export const selectIsLoading = (state: ProjectStore) => state.isLoading;
export const selectError = (state: ProjectStore) => state.error;
