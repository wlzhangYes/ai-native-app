// Main App Component with Provider Hierarchy and Three-Column Layout
// Based on plan.md provider structure and spec.md User Story 1

import { useEffect } from 'react';
import { App as AntdApp } from 'antd';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ThreeColumnLayout } from './components/layout/ThreeColumnLayout';
import { LeftPanel } from './components/layout/LeftPanel';
import { MiddlePanel } from './components/layout/MiddlePanel';
import { RightPanel } from './components/layout/RightPanel';
import { MobileNotSupported } from './components/shared/MobileNotSupported';
import { useProjectStore } from './stores/useProjectStore';
import { useDialogStore } from './stores/useDialogStore';
import { useWorkflowStore } from './stores/useWorkflowStore';

function App() {
  // 移除所有 Mock 数据加载，直接使用真实 API

  // Solution C: 监听 ProjectStore 的 currentProjectId 变化，自动切换会话数据
  const currentProjectId = useProjectStore((state) => state.currentProjectId);
  const setDialogSession = useDialogStore((state) => state.setCurrentSession);
  const setWorkflowSession = useWorkflowStore((state) => state.setCurrentSession);

  useEffect(() => {
    if (currentProjectId) {
      console.log('[App] ProjectStore currentProjectId changed, switching session:', currentProjectId);

      // 自动切换所有 Store 的会话数据
      setDialogSession(currentProjectId);
      setWorkflowSession(currentProjectId);

      // 未来可以在此添加更多 Store 的切换逻辑
      // setDocumentSession(currentProjectId);
      // setUISession(currentProjectId);
    }
  }, [currentProjectId, setDialogSession, setWorkflowSession]);

  return (
    <AntdApp>
      <div style={{ height: '100vh', overflow: 'hidden' }}>
        <AuthProvider>
          <ThemeProvider>
            {/* Mobile Not Supported Message (shown via CSS on small screens) */}
            <MobileNotSupported />

            {/* Three-Column Layout (hidden via CSS on small screens) */}
            <ThreeColumnLayout
              left={<LeftPanel />}
              middle={<MiddlePanel />}
              right={<RightPanel />}
            />
          </ThemeProvider>
        </AuthProvider>
      </div>
    </AntdApp>
  );
}

export default App;
