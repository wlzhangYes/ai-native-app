// E2E tests for complete user workflow scenarios
// Tests full user interactions from login to workflow completion

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '@/App';
import { useDialogStore } from '@/stores/useDialogStore';
import { useWorkflowStore } from '@/stores/useWorkflowStore';
import { useDocumentStore } from '@/stores/useDocumentStore';
import { useProjectStore } from '@/stores/useProjectStore';

// Mock API responses
const mockApiResponses = {
  '/api/chat/send': {
    data: { messageId: 'msg_001' },
  },
  '/api/projects': {
    data: {
      projects: [
        {
          id: 'project_1',
          name: '测试项目 1',
          description: '第一个测试项目',
          status: 'active',
        },
        {
          id: 'project_2',
          name: '测试项目 2',
          description: '第二个测试项目',
          status: 'active',
        },
      ],
    },
  },
  '/api/documents': {
    data: {
      documents: [
        {
          id: 'doc_1',
          title: '需求文档',
          content: '# 项目需求\n\n这是一个测试需求文档。',
          type: 'markdown',
          projectId: 'project_1',
        },
      ],
    },
  },
};

// Mock EventSource for SSE
class MockEventSource {
  public onopen: ((event: Event) => void) | null = null;
  public onmessage: ((event: MessageEvent) => void) | null = null;
  public onerror: ((event: Event) => void) | null = null;
  public readyState: number = 0;

  constructor(url: string) {
    setTimeout(() => {
      this.readyState = 1;
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    }, 100);
  }

  close() {
    this.readyState = 2;
  }

  simulateMessage(data: string) {
    if (this.onmessage && this.readyState === 1) {
      this.onmessage(new MessageEvent('message', { data }));
    }
  }
}

global.EventSource = MockEventSource as any;

// Mock fetch
global.fetch = vi.fn((url: string) => {
  const response = mockApiResponses[url as keyof typeof mockApiResponses];
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve(response),
  } as Response);
});

describe('Complete User Workflow E2E', () => {
  let user: ReturnType<typeof userEvent.setup>;
  let mockEventSource: MockEventSource;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
    cleanup();

    // Clear all stores
    useDialogStore.getState().clearMessages();
    useDialogStore.getState().clearToolCalls();
    useWorkflowStore.getState().clearWorkflow();
    useDocumentStore.getState().clearDocuments();
    useProjectStore.getState().clearProjects();
  });

  afterEach(() => {
    if (mockEventSource) {
      mockEventSource.close();
    }
  });

  it('should complete full project workflow from start to finish', async () => {
    // 1. Render the application
    render(<App />);

    // 2. Verify initial layout is rendered
    expect(screen.getByTestId('chat-panel')).toBeInTheDocument();
    expect(screen.getByTestId('workflow-panel')).toBeInTheDocument();
    expect(screen.getByTestId('preview-panel')).toBeInTheDocument();

    // 3. User creates a new project
    const projectButton = screen.getByRole('button', { name: /新建项目/i });
    await user.click(projectButton);

    // Fill project form
    const projectNameInput = screen.getByLabelText(/项目名称/i);
    await user.type(projectNameInput, '我的AI项目');

    const projectDescInput = screen.getByLabelText(/项目描述/i);
    await user.type(projectDescInput, '这是一个AI驱动的工作流项目');

    const createButton = screen.getByRole('button', { name: /创建/i });
    await user.click(createButton);

    // Verify project was created
    await waitFor(() => {
      expect(screen.getByText('我的AI项目')).toBeInTheDocument();
    });

    // 4. User starts a conversation with AI
    const messageInput = screen.getByPlaceholderText(/输入消息.../i);
    await user.type(messageInput, '帮我创建一个用户认证功能的开发计划');

    const sendButton = screen.getByRole('button', { name: /发送/i });
    await user.click(sendButton);

    // Verify message appears in chat
    await waitFor(() => {
      expect(screen.getByText('帮我创建一个用户认证功能的开发计划')).toBeInTheDocument();
    });

    // 5. Simulate AI response with TodoWrite tool call
    const aiResponseData = {
      type: 'message_chunk',
      data: {
        messageId: 'ai_msg_001',
        content: '我将帮您创建用户认证功能的开发计划。让我分解为具体的任务：',
        isComplete: false,
      },
    };

    const toolCallData = {
      type: 'tool_use',
      data: {
        toolCall: {
          id: 'todo_001',
          name: 'TodoWrite',
          input: {
            todos: [
              {
                content: '设计用户认证流程',
                status: 'pending',
                activeForm: '设计用户认证流程',
              },
              {
                content: '实现用户注册功能',
                status: 'pending',
                activeForm: '实现用户注册功能',
              },
              {
                content: '实现用户登录功能',
                status: 'pending',
                activeForm: '实现用户登录功能',
              },
              {
                content: '添加密码重置功能',
                status: 'pending',
                activeForm: '添加密码重置功能',
              },
              {
                content: '编写单元测试',
                status: 'pending',
                activeForm: '编写单元测试',
              },
            ],
          },
        },
        messageId: 'ai_msg_001',
      },
    };

    // Simulate SSE events
    if (mockEventSource) {
      mockEventSource.simulateMessage(JSON.stringify(aiResponseData));
      mockEventSource.simulateMessage(JSON.stringify(toolCallData));
    }

    // 6. Verify workflow tree is populated
    await waitFor(() => {
      expect(screen.getByText('设计用户认证流程')).toBeInTheDocument();
      expect(screen.getByText('实现用户注册功能')).toBeInTheDocument();
      expect(screen.getByText('实现用户登录功能')).toBeInTheDocument();
    });

    // 7. User clicks on a task to view details
    const firstTask = screen.getByText('设计用户认证流程');
    await user.click(firstTask);

    // Verify task details are shown in preview panel
    await waitFor(() => {
      expect(screen.getByTestId('preview-panel')).toHaveTextContent('设计用户认证流程');
    });

    // 8. Simulate AI updating task status
    const updatedToolCallData = {
      type: 'tool_use',
      data: {
        toolCall: {
          id: 'todo_002',
          name: 'TodoWrite',
          input: {
            todos: [
              {
                content: '设计用户认证流程',
                status: 'completed',
                activeForm: '设计用户认证流程',
              },
              {
                content: '实现用户注册功能',
                status: 'in_progress',
                activeForm: '正在实现用户注册功能',
              },
              {
                content: '实现用户登录功能',
                status: 'pending',
                activeForm: '实现用户登录功能',
              },
              {
                content: '添加密码重置功能',
                status: 'pending',
                activeForm: '添加密码重置功能',
              },
              {
                content: '编写单元测试',
                status: 'pending',
                activeForm: '编写单元测试',
              },
            ],
          },
        },
        messageId: 'ai_msg_002',
      },
    };

    if (mockEventSource) {
      mockEventSource.simulateMessage(JSON.stringify(updatedToolCallData));
    }

    // 9. Verify task status updates in workflow tree
    await waitFor(() => {
      const completedTask = screen.getByText('设计用户认证流程');
      expect(completedTask.closest('[data-status="completed"]')).toBeInTheDocument();

      const inProgressTask = screen.getByText('正在实现用户注册功能');
      expect(inProgressTask.closest('[data-status="in_progress"]')).toBeInTheDocument();
    });

    // 10. User uploads a file attachment
    const fileInput = screen.getByTestId('file-upload-input');
    const file = new File(['认证流程图'], 'auth-flow.png', { type: 'image/png' });

    await user.upload(fileInput, file);

    // Verify file attachment appears
    await waitFor(() => {
      expect(screen.getByText('auth-flow.png')).toBeInTheDocument();
    });

    // 11. User sends message with attachment
    await user.type(messageInput, '这是认证流程图，请帮我review一下');
    await user.click(sendButton);

    // Verify message with attachment is sent
    await waitFor(() => {
      expect(screen.getByText('这是认证流程图，请帮我review一下')).toBeInTheDocument();
      expect(screen.getByText('auth-flow.png')).toBeInTheDocument();
    });

    // 12. User switches to a different project
    const projectSwitcher = screen.getByTestId('project-switcher');
    await user.click(projectSwitcher);

    const project2Option = screen.getByText('测试项目 2');
    await user.click(project2Option);

    // Verify context switches (workflow tree should be empty/different)
    await waitFor(() => {
      // Current workflow should be cleared or switched
      expect(screen.queryByText('设计用户认证流程')).not.toBeInTheDocument();
    });

    // 13. User switches back to original project
    await user.click(projectSwitcher);

    const project1Option = screen.getByText('我的AI项目');
    await user.click(project1Option);

    // Verify workflow and conversation are restored
    await waitFor(() => {
      expect(screen.getByText('设计用户认证流程')).toBeInTheDocument();
      expect(screen.getByText('帮我创建一个用户认证功能的开发计划')).toBeInTheDocument();
    });

    // 14. User opens document editor
    const documentTab = screen.getByRole('tab', { name: /文档/i });
    await user.click(documentTab);

    // Create a new document
    const newDocButton = screen.getByRole('button', { name: /新建文档/i });
    await user.click(newDocButton);

    const docTitleInput = screen.getByLabelText(/文档标题/i);
    await user.type(docTitleInput, '用户认证API设计');

    const docContentArea = screen.getByTestId('document-editor');
    await user.type(docContentArea, '# 用户认证API设计\n\n## 概述\n\n这是用户认证系统的API设计文档。');

    // Save document
    const saveDocButton = screen.getByRole('button', { name: /保存/i });
    await user.click(saveDocButton);

    // Verify document appears in document list
    await waitFor(() => {
      expect(screen.getByText('用户认证API设计')).toBeInTheDocument();
    });

    // 15. User uses voice input (simulate)
    const voiceButton = screen.getByTestId('voice-input-button');
    await user.click(voiceButton);

    // Simulate voice recognition result
    const voiceInputEvent = new CustomEvent('voiceInput', {
      detail: { transcript: '请总结一下当前的开发进度' },
    });
    window.dispatchEvent(voiceInputEvent);

    // Verify voice input is processed
    await waitFor(() => {
      expect(screen.getByDisplayValue('请总结一下当前的开发进度')).toBeInTheDocument();
    });

    // 16. Complete the workflow by marking all tasks as done
    const allCompletedToolCall = {
      type: 'tool_use',
      data: {
        toolCall: {
          id: 'todo_final',
          name: 'TodoWrite',
          input: {
            todos: [
              {
                content: '设计用户认证流程',
                status: 'completed',
                activeForm: '设计用户认证流程',
              },
              {
                content: '实现用户注册功能',
                status: 'completed',
                activeForm: '实现用户注册功能',
              },
              {
                content: '实现用户登录功能',
                status: 'completed',
                activeForm: '实现用户登录功能',
              },
              {
                content: '添加密码重置功能',
                status: 'completed',
                activeForm: '添加密码重置功能',
              },
              {
                content: '编写单元测试',
                status: 'completed',
                activeForm: '编写单元测试',
              },
            ],
          },
        },
        messageId: 'ai_msg_final',
      },
    };

    if (mockEventSource) {
      mockEventSource.simulateMessage(JSON.stringify(allCompletedToolCall));
    }

    // 17. Verify workflow completion
    await waitFor(() => {
      const workflowStage = screen.getByTestId('workflow-stage');
      expect(workflowStage).toHaveAttribute('data-status', 'completed');
    });

    // 18. Verify persistence by refreshing page
    // Simulate page refresh by re-rendering
    cleanup();
    render(<App />);

    // Verify data persistence
    await waitFor(() => {
      expect(screen.getByText('我的AI项目')).toBeInTheDocument();
      expect(screen.getByText('设计用户认证流程')).toBeInTheDocument();
    });

    // Test completed successfully
    expect(true).toBe(true);
  }, 30000); // 30 second timeout for complex E2E test

  it('should handle error scenarios gracefully', async () => {
    // Mock API failure
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    render(<App />);

    const messageInput = screen.getByPlaceholderText(/输入消息.../i);
    await user.type(messageInput, '测试错误处理');

    const sendButton = screen.getByRole('button', { name: /发送/i });
    await user.click(sendButton);

    // Verify error is displayed
    await waitFor(() => {
      expect(screen.getByText(/网络错误/i)).toBeInTheDocument();
    });

    // Verify app remains functional
    expect(screen.getByTestId('chat-panel')).toBeInTheDocument();
    expect(screen.getByTestId('workflow-panel')).toBeInTheDocument();
    expect(screen.getByTestId('preview-panel')).toBeInTheDocument();
  });

  it('should support multiple concurrent sessions', async () => {
    render(<App />);

    // Create first session
    const messageInput = screen.getByPlaceholderText(/输入消息.../i);
    await user.type(messageInput, '第一个会话的消息');

    const sendButton = screen.getByRole('button', { name: /发送/i });
    await user.click(sendButton);

    // Simulate workflow creation for session 1
    const session1ToolCall = {
      type: 'tool_use',
      data: {
        toolCall: {
          id: 'session1_todo',
          name: 'TodoWrite',
          input: {
            todos: [
              {
                content: '会话1任务',
                status: 'pending',
                activeForm: '会话1任务',
              },
            ],
          },
        },
        messageId: 'session1_msg',
      },
    };

    if (mockEventSource) {
      mockEventSource.simulateMessage(JSON.stringify(session1ToolCall));
    }

    // Verify session 1 workflow
    await waitFor(() => {
      expect(screen.getByText('会话1任务')).toBeInTheDocument();
    });

    // Switch to session 2
    const newSessionButton = screen.getByRole('button', { name: /新建会话/i });
    await user.click(newSessionButton);

    // Verify session 1 data is cleared
    expect(screen.queryByText('会话1任务')).not.toBeInTheDocument();
    expect(screen.queryByText('第一个会话的消息')).not.toBeInTheDocument();

    // Create content in session 2
    await user.type(messageInput, '第二个会话的消息');
    await user.click(sendButton);

    // Switch back to session 1
    const sessionTabs = screen.getAllByRole('tab');
    const session1Tab = sessionTabs.find(tab => tab.textContent?.includes('会话 1'));

    if (session1Tab) {
      await user.click(session1Tab);

      // Verify session 1 data is restored
      await waitFor(() => {
        expect(screen.getByText('会话1任务')).toBeInTheDocument();
        expect(screen.getByText('第一个会话的消息')).toBeInTheDocument();
      });
    }
  });

  it('should maintain responsive design across different screen sizes', async () => {
    // Test desktop view
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1920,
    });

    render(<App />);

    // Verify all panels are visible
    expect(screen.getByTestId('chat-panel')).toBeVisible();
    expect(screen.getByTestId('workflow-panel')).toBeVisible();
    expect(screen.getByTestId('preview-panel')).toBeVisible();

    // Test tablet view
    Object.defineProperty(window, 'innerWidth', {
      value: 768,
    });
    window.dispatchEvent(new Event('resize'));

    await waitFor(() => {
      // Some panels might be collapsed or stacked
      const chatPanel = screen.getByTestId('chat-panel');
      expect(chatPanel).toBeInTheDocument();
    });

    // Test mobile view
    Object.defineProperty(window, 'innerWidth', {
      value: 375,
    });
    window.dispatchEvent(new Event('resize'));

    await waitFor(() => {
      // Mobile should show primarily chat interface
      expect(screen.getByTestId('chat-panel')).toBeVisible();
    });
  });
});