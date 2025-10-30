// Main App Component using AIWorkflowTemplate
// Refactored to use the template component from template system
// Based on plan.md provider structure and spec.md User Story 1

import { App as AntdApp } from 'antd';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AIWorkflowTemplate } from './template';
import { useProjectStore } from './stores/useProjectStore';

function AppRefactored() {
  const currentProjectId = useProjectStore((state) => state.currentProjectId);

  return (
    <AntdApp>
      <div style={{ height: '100vh', overflow: 'hidden' }}>
        <AuthProvider>
          <ThemeProvider>
            {/* 🌟 使用 AIWorkflowTemplate 一键搭建完整 UI */}
            <AIWorkflowTemplate
              sessionId={currentProjectId || 'default'}
              apiBaseUrl={import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'}
              storageKeyPrefix="ai-workflow"
              layoutConfig={{
                leftWidth: 3,
                middleWidth: 2,
                rightWidth: 5,
                showLeft: true,
                showMiddle: true,
                showRight: true,
              }}
              onSessionChange={(sessionId) => {
                console.log('[AppRefactored] Session changed:', sessionId);
              }}
            />
          </ThemeProvider>
        </AuthProvider>
      </div>
    </AntdApp>
  );
}

export default AppRefactored;
