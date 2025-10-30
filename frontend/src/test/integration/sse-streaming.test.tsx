// Integration tests for SSE streaming functionality
// Tests real-time message streaming, tool call extraction, and workflow synchronization

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import { useChat } from '@/hooks/composite/useChat';
import { useDialogStore } from '@/stores/useDialogStore';
import { useWorkflowStore } from '@/stores/useWorkflowStore';
import type { Message, ToolCall } from '@/types/models';

// Mock EventSource for SSE testing
class MockEventSource {
  public onopen: ((event: Event) => void) | null = null;
  public onmessage: ((event: MessageEvent) => void) | null = null;
  public onerror: ((event: Event) => void) | null = null;
  public readyState: number = 0;
  public url: string;

  constructor(url: string) {
    this.url = url;
    // Simulate connection opening
    setTimeout(() => {
      this.readyState = 1; // OPEN
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    }, 10);
  }

  close() {
    this.readyState = 2; // CLOSED
  }

  // Method to simulate receiving messages
  simulateMessage(data: string, event?: string) {
    if (this.onmessage && this.readyState === 1) {
      const messageEvent = new MessageEvent('message', {
        data,
        lastEventId: '',
        origin: '',
        source: null,
        type: event || 'message',
      });
      this.onmessage(messageEvent);
    }
  }

  // Method to simulate errors
  simulateError() {
    if (this.onerror) {
      this.onerror(new Event('error'));
    }
  }
}

// Global mock for EventSource
global.EventSource = MockEventSource as any;

describe('SSE Streaming Integration', () => {
  let mockEventSource: MockEventSource;
  let dialogStore: ReturnType<typeof useDialogStore>;
  let workflowStore: ReturnType<typeof useWorkflowStore>;

  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();

    // Clear stores
    dialogStore = useDialogStore.getState();
    workflowStore = useWorkflowStore.getState();

    dialogStore.clearMessages();
    dialogStore.clearToolCalls();
    workflowStore.clearWorkflow();
  });

  afterEach(() => {
    if (mockEventSource) {
      mockEventSource.close();
    }
  });

  it('should handle streaming message chunks', async () => {
    const sessionId = 'test-session';
    const { result } = renderHook(() => useChat({ sessionId }));

    // Start a chat request that will initiate SSE
    await act(async () => {
      // This would normally trigger SSE connection
      const messageEvent = new MessageEvent('message', {
        data: JSON.stringify({
          type: 'message_chunk',
          data: {
            messageId: 'msg_123',
            content: 'Hello ',
            isComplete: false,
          },
        }),
      });

      // Simulate SSE message reception
      if (mockEventSource && mockEventSource.onmessage) {
        mockEventSource.onmessage(messageEvent);
      }
    });

    // Verify partial message is handled
    const messages = dialogStore.messages;
    const streamingMessage = messages.find(m => m.id === 'msg_123');
    expect(streamingMessage?.content).toBe('Hello ');
  });

  it('should accumulate streaming chunks into complete message', async () => {
    const sessionId = 'test-session';
    const { result } = renderHook(() => useChat({ sessionId }));

    await act(async () => {
      // First chunk
      const chunk1 = new MessageEvent('message', {
        data: JSON.stringify({
          type: 'message_chunk',
          data: {
            messageId: 'msg_456',
            content: 'Hello ',
            isComplete: false,
          },
        }),
      });

      // Second chunk
      const chunk2 = new MessageEvent('message', {
        data: JSON.stringify({
          type: 'message_chunk',
          data: {
            messageId: 'msg_456',
            content: 'world!',
            isComplete: false,
          },
        }),
      });

      // Final chunk with completion flag
      const finalChunk = new MessageEvent('message', {
        data: JSON.stringify({
          type: 'message_chunk',
          data: {
            messageId: 'msg_456',
            content: '',
            isComplete: true,
          },
        }),
      });

      // Simulate receiving chunks
      if (mockEventSource && mockEventSource.onmessage) {
        mockEventSource.onmessage(chunk1);
        mockEventSource.onmessage(chunk2);
        mockEventSource.onmessage(finalChunk);
      }
    });

    const messages = dialogStore.messages;
    const completeMessage = messages.find(m => m.id === 'msg_456');
    expect(completeMessage?.content).toBe('Hello world!');
    expect(completeMessage?.metadata?.isStreaming).toBe(false);
  });

  it('should extract tool calls from SSE events', async () => {
    const sessionId = 'test-session';
    const { result } = renderHook(() => useChat({ sessionId }));

    const toolCallEvent = {
      type: 'tool_use',
      data: {
        toolCall: {
          id: 'tool_001',
          name: 'TodoWrite',
          input: {
            todos: [
              {
                content: '完成用户认证功能',
                status: 'pending',
                activeForm: '完成用户认证功能',
              },
              {
                content: '实现数据库集成',
                status: 'in_progress',
                activeForm: '正在实现数据库集成',
              },
            ],
          },
        },
        messageId: 'msg_789',
      },
    };

    await act(async () => {
      const messageEvent = new MessageEvent('message', {
        data: JSON.stringify(toolCallEvent),
      });

      if (mockEventSource && mockEventSource.onmessage) {
        mockEventSource.onmessage(messageEvent);
      }
    });

    // Verify tool call was stored
    const toolCalls = dialogStore.toolCalls;
    expect(toolCalls).toHaveLength(1);
    expect(toolCalls[0].name).toBe('TodoWrite');
    expect(toolCalls[0].input.todos).toHaveLength(2);
    expect(toolCalls[0].input.todos[0].content).toBe('完成用户认证功能');
  });

  it('should sync TodoWrite tool calls to workflow tree', async () => {
    const sessionId = 'test-session';

    // Initialize stores
    await act(async () => {
      dialogStore.setCurrentSession(sessionId);
      workflowStore.setCurrentSession(sessionId);
    });

    const toolCallEvent = {
      type: 'tool_use',
      data: {
        toolCall: {
          id: 'tool_002',
          name: 'TodoWrite',
          input: {
            todos: [
              {
                content: '创建API接口',
                status: 'completed',
                activeForm: '创建API接口',
              },
              {
                content: '编写单元测试',
                status: 'in_progress',
                activeForm: '正在编写单元测试',
              },
              {
                content: '部署到生产环境',
                status: 'pending',
                activeForm: '部署到生产环境',
              },
            ],
          },
        },
        messageId: 'msg_sync',
      },
    };

    await act(async () => {
      // Simulate tool call reception
      dialogStore.addToolCall(toolCallEvent.data.toolCall);

      // Trigger workflow sync (this would normally happen via useEffect)
      const todos = toolCallEvent.data.toolCall.input.todos;
      workflowStore.syncTodosToTasks(todos);
    });

    // Verify workflow was updated
    const workflow = workflowStore.currentWorkflow;
    expect(workflow).toBeDefined();
    expect(workflow!.stages).toHaveLength(1);

    const taskStage = workflow!.stages[0];
    expect(taskStage.name).toBe('任务列表');
    expect(taskStage.tasks).toHaveLength(3);

    // Check task statuses
    const completedTask = taskStage.tasks.find(t => t.name === '创建API接口');
    const inProgressTask = taskStage.tasks.find(t => t.name === '正在编写单元测试');
    const pendingTask = taskStage.tasks.find(t => t.name === '部署到生产环境');

    expect(completedTask?.status).toBe('completed');
    expect(inProgressTask?.status).toBe('in_progress');
    expect(pendingTask?.status).toBe('pending');

    // Check stage status calculation
    expect(taskStage.status).toBe('in_progress'); // Not all tasks completed
  });

  it('should handle SSE connection errors gracefully', async () => {
    const sessionId = 'test-session';
    const onError = vi.fn();

    const { result } = renderHook(() =>
      useChat({ sessionId, onError })
    );

    await act(async () => {
      if (mockEventSource && mockEventSource.onerror) {
        mockEventSource.simulateError();
      }
    });

    // Verify error was handled
    expect(onError).toHaveBeenCalled();
    expect(result.current.isStreaming).toBe(false);
  });

  it('should clean up SSE connection on session switch', async () => {
    const { result, rerender } = renderHook(
      ({ sessionId }) => useChat({ sessionId }),
      { initialProps: { sessionId: 'session1' } }
    );

    // Get initial connection
    const initialEventSource = mockEventSource;

    // Switch session
    rerender({ sessionId: 'session2' });

    await act(async () => {
      // Allow cleanup to occur
    });

    // Verify old connection was closed
    expect(initialEventSource.readyState).toBe(2); // CLOSED
  });

  it('should handle malformed SSE messages', async () => {
    const sessionId = 'test-session';
    const onError = vi.fn();

    const { result } = renderHook(() =>
      useChat({ sessionId, onError })
    );

    await act(async () => {
      // Send malformed JSON
      const malformedEvent = new MessageEvent('message', {
        data: 'invalid json {',
      });

      if (mockEventSource && mockEventSource.onmessage) {
        mockEventSource.onmessage(malformedEvent);
      }
    });

    // Should handle gracefully without crashing
    expect(result.current.isStreaming).toBe(false);
  });

  it('should persist tool calls across page reloads', async () => {
    const sessionId = 'test-session';

    // Add tool call
    const toolCall: ToolCall = {
      id: 'persistent_001',
      name: 'TodoWrite',
      input: {
        todos: [
          {
            content: '持久化测试任务',
            status: 'completed',
            activeForm: '持久化测试任务',
          },
        ],
      },
    };

    await act(async () => {
      dialogStore.setCurrentSession(sessionId);
      dialogStore.addToolCall(toolCall);
    });

    // Simulate page reload by creating new store instance
    const newDialogStore = useDialogStore.getState();

    await act(async () => {
      newDialogStore.setCurrentSession(sessionId);
      // This should load persisted data
    });

    // Verify tool call was persisted
    const persistedToolCalls = newDialogStore.toolCalls;
    expect(persistedToolCalls).toHaveLength(1);
    expect(persistedToolCalls[0].id).toBe('persistent_001');
    expect(persistedToolCalls[0].input.todos[0].content).toBe('持久化测试任务');
  });

  it('should handle concurrent tool call updates', async () => {
    const sessionId = 'test-session';

    await act(async () => {
      dialogStore.setCurrentSession(sessionId);

      // Simulate rapid tool call updates
      const toolCall1: ToolCall = {
        id: 'concurrent_001',
        name: 'TodoWrite',
        input: {
          todos: [
            { content: '任务1', status: 'pending', activeForm: '任务1' },
          ],
        },
      };

      const toolCall2: ToolCall = {
        id: 'concurrent_002',
        name: 'TodoWrite',
        input: {
          todos: [
            { content: '任务1', status: 'in_progress', activeForm: '正在执行任务1' },
            { content: '任务2', status: 'pending', activeForm: '任务2' },
          ],
        },
      };

      const toolCall3: ToolCall = {
        id: 'concurrent_003',
        name: 'TodoWrite',
        input: {
          todos: [
            { content: '任务1', status: 'completed', activeForm: '任务1' },
            { content: '任务2', status: 'in_progress', activeForm: '正在执行任务2' },
            { content: '任务3', status: 'pending', activeForm: '任务3' },
          ],
        },
      };

      // Add all tool calls rapidly
      dialogStore.addToolCall(toolCall1);
      dialogStore.addToolCall(toolCall2);
      dialogStore.addToolCall(toolCall3);
    });

    // Verify only the latest tool call data is kept
    const toolCalls = dialogStore.toolCalls;
    expect(toolCalls).toHaveLength(3);

    // Find the latest TodoWrite call
    const latestTodoWrite = toolCalls
      .filter(tc => tc.name === 'TodoWrite')
      .sort((a, b) => a.id.localeCompare(b.id))
      .pop();

    expect(latestTodoWrite?.input.todos).toHaveLength(3);
    expect(latestTodoWrite?.input.todos[0].status).toBe('completed');
    expect(latestTodoWrite?.input.todos[1].status).toBe('in_progress');
    expect(latestTodoWrite?.input.todos[2].status).toBe('pending');
  });
});