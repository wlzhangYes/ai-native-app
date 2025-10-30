// Sessions List Sider Component - Left Sidebar Session Management
// Based on Ant Design X official example

import { useEffect, useState } from 'react';
import { Button, Modal, message as antdMessage, App } from 'antd';
import { Conversations } from '@ant-design/x';
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { useProjectStore } from '@/stores/useProjectStore';

// ============================================================================
// Component
// ============================================================================

export function SessionsList() {
  const { modal } = App.useApp();
  const {
    projects,
    currentProjectId,
    fetchProjects,
    createNewProject,
    deleteProjectById,
    setCurrentProject,
  } = useProjectStore();

  const [isCreating, setIsCreating] = useState(false);

  // ====================================================================
  // Fetch Sessions on Mount and Auto-Initialize
  // ====================================================================

  useEffect(() => {
    const initSessions = async () => {
      console.log('[SessionsList] Initializing sessions...');

      // Fetch projects from server
      await fetchProjects({ activeOnly: true });
    };

    initSessions();
  }, []); // Only run once on mount

  // Note: Session auto-selection logic moved to App.tsx for global initialization
  // This component now focuses only on UI presentation

  // ====================================================================
  // Session Actions
  // ====================================================================

  const handleCreateSession = async () => {
    setIsCreating(true);
    try {
      const newProject = await createNewProject();
      if (newProject) {
        // setCurrentProject 会触发 App.tsx 中的 useEffect，自动切换所有 Store 的会话数据
        setCurrentProject(newProject.id);
        antdMessage.success('新建会话成功');
      }
    } catch (err) {
      console.error('[SessionsList] Create session error:', err);
      antdMessage.error('创建会话失败');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteSession = (sessionId: string) => {
    console.log('[SessionsList] Delete clicked for session:', sessionId);
    modal.confirm({
      title: '确认删除',
      content: '确定要删除这个会话吗？',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await deleteProjectById(sessionId);
          antdMessage.success('删除会话成功');

          // If deleted session was current, select first remaining session
          if (currentProjectId === sessionId) {
            const remainingSessions = projects.filter((p) => p.id !== sessionId);
            if (remainingSessions.length > 0) {
              setCurrentProject(remainingSessions[0].id);
            }
          }
        } catch (err) {
          console.error('[SessionsList] Delete session error:', err);
          antdMessage.error('删除会话失败');
        }
      },
    });
  };

  const handleSessionClick = (sessionId: string) => {
    // setCurrentProject 会触发 App.tsx 中的 useEffect，自动切换所有 Store 的会话数据
    setCurrentProject(sessionId);
  };

  const handleMenuClick = (menuInfo: { key: string; domEvent: React.MouseEvent }, conversation: any) => {
    menuInfo.domEvent?.stopPropagation();
    console.log('[SessionsList] Menu clicked:', menuInfo.key, conversation.key);

    if (menuInfo.key === 'delete') {
      handleDeleteSession(conversation.key as string);
    } else if (menuInfo.key === 'rename') {
      console.log('[SessionsList] Rename not implemented yet');
    }
  };

  // ====================================================================
  // Transform Projects to Conversations Format
  // ====================================================================

  const conversationItems = projects.map((project) => {
    return {
      key: project.id,
      label: project.name || '未命名会话',
    };
  });

  // ====================================================================
  // Render (使用 @ant-design/x Conversations)
  // ====================================================================

  return (
    <div className="flex flex-col h-full bg-gray-50 px-3">
      {/* Logo */}
      <div className="flex items-center justify-start px-3 gap-2 my-6">
        <img
          src="https://mdn.alipayobjects.com/huamei_iwk9zp/afts/img/A*eco6RrQhxbMAAAAAAAAAAAAADgCCAQ/original"
          draggable={false}
          alt="logo"
          width={24}
          height={24}
        />
        <span className="font-bold text-base text-gray-800">
          AI Workflow
        </span>
      </div>

      {/* 新建会话按钮 */}
      <Button
        onClick={handleCreateSession}
        disabled={isCreating}
        type="link"
        icon={<PlusOutlined />}
        className="h-10 mb-3 bg-[#1677ff0f] border border-[#1677ff34]"
      >
        {isCreating ? '创建中...' : '新建会话'}
      </Button>

      {/* Conversations List */}
      <div className="flex-1 overflow-auto">
        <Conversations
          items={conversationItems}
          activeKey={currentProjectId || undefined}
          onActiveChange={(key) => {
            if (key) {
              handleSessionClick(key as string);
            }
          }}
          className="h-full"
          styles={{
            list: { paddingInlineStart: 0 },
            item: { padding: '0 8px' },
          }}
          menu={(conversation) => ({
            items: [
              {
                label: '重命名',
                key: 'rename',
                icon: <EditOutlined />,
              },
              {
                label: '删除',
                key: 'delete',
                icon: <DeleteOutlined />,
                danger: true,
              },
            ],
            onClick: (menuInfo) => handleMenuClick(menuInfo, conversation),
          })}
        />
      </div>
    </div>
  );
}
