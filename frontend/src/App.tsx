// Main App Component with Provider Hierarchy and Three-Column Layout
// Based on plan.md provider structure and spec.md User Story 1
// Refactored to use SessionProvider architecture for unified session management

import { useEffect } from 'react';
import { App as AntdApp } from 'antd';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { SessionProvider } from './contexts/SessionContext';
import { ThreeColumnLayout } from './components/layout/ThreeColumnLayout';
import { LeftPanel } from './components/layout/LeftPanel';
import { MiddlePanel } from './components/layout/MiddlePanel';
import { RightPanel } from './components/layout/RightPanel';
import { useProjectStore } from './stores/useProjectStore';
import { useDialogStore } from './stores/useDialogStore';
import { useWorkflowStore } from './stores/useWorkflowStore';
import { useUIActionStore } from './stores/useUIActionStore';

// Inner App Component that handles session changes
function AppContent() {
  return (
    <div className="h-screen overflow-hidden">
      <ThreeColumnLayout
        left={<LeftPanel />}
        middle={<MiddlePanel />}
        right={<RightPanel />}
      />
    </div>
  );
}

// Main App with SessionProvider integration
function App() {
  const currentProjectId = useProjectStore((state) => state.currentProjectId);
  const projects = useProjectStore((state) => state.projects);
  const fetchProjects = useProjectStore((state) => state.fetchProjects);
  const createNewProject = useProjectStore((state) => state.createNewProject);
  const setCurrentProject = useProjectStore((state) => state.setCurrentProject);
  const setDialogSession = useDialogStore((state) => state.setCurrentSession);
  const setWorkflowSession = useWorkflowStore((state) => state.setCurrentSession);
  const setUIActionSession = useUIActionStore((state) => state.setCurrentSession);

  // Session initialization - run on app startup
  useEffect(() => {
    console.log('[App] Starting session initialization...');

    const initializeSessions = async () => {
      console.log('[App] 🚀 Initializing sessions...');
      try {
        // Load projects from backend/localStorage
        await fetchProjects();
        console.log('[App] ✅ Projects fetched successfully');
      } catch (error) {
        console.error('[App] ❌ Failed to fetch projects:', error);
        // For development without backend, create a default project
        console.log('[App] 🔧 Creating default project for development...');
        try {
          const newProject = await createNewProject({
            name: '默认会话',
            description: '自动创建的默认会话'
          });
          if (newProject) {
            console.log('[App] ✅ Created default project:', {
              id: newProject.id,
              name: newProject.name
            });
          }
        } catch (createError) {
          console.error('[App] ❌ Failed to create default project:', createError);
        }
      }
    };

    initializeSessions();
  }, []); // Run once on app startup

  // Auto-select session based on available projects
  useEffect(() => {
    const autoSelectSession = async () => {
      console.log('[App] Auto-selecting session...', {
        currentProjectId,
        projectsLength: projects.length,
        projects: projects.map(p => ({ id: p.id, name: p.name })),
        timestamp: new Date().toISOString()
      });

      // Wait for projects to be loaded (avoid running on initial empty state)
      if (projects.length === 0) {
        console.log('[App] Projects not loaded yet, waiting...');
        return;
      }

      // Priority 1: If there's a persisted current project ID, verify it exists
      if (currentProjectId) {
        const currentProjectExists = projects.find(p => p.id === currentProjectId);
        if (currentProjectExists) {
          console.log('[App] ✅ Persisted project exists, keeping selection:', {
            id: currentProjectId,
            name: currentProjectExists.name
          });
          return; // Keep current selection
        } else {
          console.log('[App] ⚠️  Persisted project no longer exists, will select another:', currentProjectId);
        }
      }

      // Priority 2: Auto-select first available session
      if (projects.length > 0) {
        const firstProject = projects[0];
        console.log('[App] 🎯 Selecting first available session:', {
          id: firstProject.id,
          name: firstProject.name
        });
        setCurrentProject(firstProject.id);
        return;
      }

      // Priority 3: This shouldn't happen since we check length above, but keep for safety
      console.log('[App] 🚫 No sessions available, this should not happen');
    };

    // Run when projects array has data (not initial empty state)
    if (projects.length > 0) {
      autoSelectSession();
    } else {
      console.log('[App] ⏳ Waiting for projects to load...');
    }
  }, [projects, currentProjectId]);

  // Session change handler - automatically switch all stores when session changes
  const handleSessionChange = (sessionId: string) => {
    console.log('[App] SessionProvider triggered session change:', sessionId);

    // 自动切换所有 Store 的会话数据
    setDialogSession(sessionId);
    setWorkflowSession(sessionId);
    setUIActionSession(sessionId);

    // 可以在此添加更多 Store 的切换逻辑
    // setDocumentSession(sessionId);
  };

  return (
    <AntdApp>
      <AuthProvider>
        <ThemeProvider>
          {/* SessionProvider wrapper - provides session context to entire app */}
          {currentProjectId ? (
            <SessionProvider
              sessionId={currentProjectId}
              storageKeyPrefix="ai-workflow"
              onSessionChange={handleSessionChange}
            >
              <AppContent />
            </SessionProvider>
          ) : (
            // Show loading or placeholder until session is initialized
            <div className="h-screen flex items-center justify-center">
              <span>正在初始化会话...</span>
            </div>
          )}
        </ThemeProvider>
      </AuthProvider>
    </AntdApp>
  );
}

export default App;
