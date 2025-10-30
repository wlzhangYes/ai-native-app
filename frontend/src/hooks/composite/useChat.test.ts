// Unit tests for useChat composite hook
// Tests chat functionality with SSE streaming, message handling, and error scenarios

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useChat } from './useChat';

// Mock the dependencies
vi.mock('../business/dialog/useMessages', () => ({
  useMessages: vi.fn(),
}));

vi.mock('../infrastructure/useSSE', () => ({
  useSSE: vi.fn(),
}));

vi.mock('../infrastructure/useApiClient', () => ({
  useApiClient: vi.fn(),
}));

import { useMessages } from '../business/dialog/useMessages';
import { useSSE } from '../infrastructure/useSSE';
import { useApiClient } from '../infrastructure/useApiClient';

const mockUseMessages = vi.mocked(useMessages);
const mockUseSSE = vi.mocked(useSSE);
const mockUseApiClient = vi.mocked(useApiClient);

describe('useChat', () => {
  const mockMessages = [
    {
      id: '1',
      content: 'Hello',
      sender: 'user' as const,
      timestamp: '2023-01-01T00:00:00Z',
      sessionId: 'session1',
      metadata: {},
    },
  ];

  const mockAddMessage = vi.fn();
  const mockUpdateMessage = vi.fn();
  const mockClearMessages = vi.fn();
  const mockConnect = vi.fn();
  const mockDisconnect = vi.fn();
  const mockRequest = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock useMessages
    mockUseMessages.mockReturnValue({
      messages: mockMessages,
      addMessage: mockAddMessage,
      updateMessage: mockUpdateMessage,
      clearMessages: mockClearMessages,
    });

    // Mock useSSE
    mockUseSSE.mockReturnValue({
      isConnected: false,
      isStreaming: false,
      error: null,
      connect: mockConnect,
      disconnect: mockDisconnect,
    });

    // Mock useApiClient
    mockUseApiClient.mockReturnValue({
      client: {} as any,
      loading: false,
      error: null,
      request: mockRequest,
    });
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() =>
      useChat({
        sessionId: 'session1',
      })
    );

    expect(result.current.messages).toEqual(mockMessages);
    expect(result.current.isStreaming).toBe(false);
    expect(result.current.sendMessage).toBeTypeOf('function');
    expect(result.current.cancelRequest).toBeTypeOf('function');
    expect(result.current.regenerateResponse).toBeTypeOf('function');
  });

  it('should call onError callback when provided', () => {
    const onError = vi.fn();

    // Mock SSE with error
    mockUseSSE.mockReturnValue({
      isConnected: false,
      isStreaming: false,
      error: new Error('SSE Error'),
      connect: mockConnect,
      disconnect: mockDisconnect,
    });

    renderHook(() =>
      useChat({
        sessionId: 'session1',
        onError,
      })
    );

    expect(onError).toHaveBeenCalledWith(new Error('SSE Error'));
  });

  it('should send message successfully', async () => {
    mockRequest.mockResolvedValue({
      data: { messageId: 'msg123' },
    });

    const { result } = renderHook(() =>
      useChat({
        sessionId: 'session1',
      })
    );

    await act(async () => {
      await result.current.sendMessage('Hello', []);
    });

    // Should add user message
    expect(mockAddMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        content: 'Hello',
        sender: 'user',
        sessionId: 'session1',
      })
    );

    // Should make API request
    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        url: '/chat/send',
        data: {
          message: 'Hello',
          sessionId: 'session1',
          attachments: [],
        },
      })
    );

    // Should connect SSE
    expect(mockConnect).toHaveBeenCalledWith('/chat/sse/session1');
  });

  it('should handle sendMessage with attachments', async () => {
    mockRequest.mockResolvedValue({
      data: { messageId: 'msg123' },
    });

    const attachments = [
      {
        id: 'att1',
        name: 'file.txt',
        size: 1024,
        type: 'text/plain',
        url: 'blob:...',
      },
    ];

    const { result } = renderHook(() =>
      useChat({
        sessionId: 'session1',
      })
    );

    await act(async () => {
      await result.current.sendMessage('Hello with file', attachments);
    });

    expect(mockAddMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        content: 'Hello with file',
        sender: 'user',
        metadata: { attachments },
      })
    );

    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          message: 'Hello with file',
          sessionId: 'session1',
          attachments,
        },
      })
    );
  });

  it('should handle sendMessage error', async () => {
    const error = new Error('Send failed');
    mockRequest.mockRejectedValue(error);

    const onError = vi.fn();
    const { result } = renderHook(() =>
      useChat({
        sessionId: 'session1',
        onError,
      })
    );

    await act(async () => {
      try {
        await result.current.sendMessage('Hello', []);
      } catch (e) {
        // Expected to throw
      }
    });

    expect(onError).toHaveBeenCalledWith(error);
  });

  it('should cancel request and disconnect SSE', async () => {
    const { result } = renderHook(() =>
      useChat({
        sessionId: 'session1',
      })
    );

    await act(async () => {
      await result.current.cancelRequest();
    });

    expect(mockDisconnect).toHaveBeenCalled();
  });

  it('should regenerate response', async () => {
    mockRequest.mockResolvedValue({
      data: { messageId: 'msg456' },
    });

    // Mock messages with AI message to regenerate
    const messagesWithAI = [
      ...mockMessages,
      {
        id: '2',
        content: 'AI response',
        sender: 'ai' as const,
        timestamp: '2023-01-01T00:01:00Z',
        sessionId: 'session1',
        metadata: {},
      },
    ];

    mockUseMessages.mockReturnValue({
      messages: messagesWithAI,
      addMessage: mockAddMessage,
      updateMessage: mockUpdateMessage,
      clearMessages: mockClearMessages,
    });

    const { result } = renderHook(() =>
      useChat({
        sessionId: 'session1',
      })
    );

    await act(async () => {
      await result.current.regenerateResponse();
    });

    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        url: '/chat/regenerate',
        data: {
          sessionId: 'session1',
          lastUserMessage: 'Hello',
        },
      })
    );

    expect(mockConnect).toHaveBeenCalledWith('/chat/sse/session1');
  });

  it('should handle session switching', () => {
    const { result, rerender } = renderHook(
      ({ sessionId }) => useChat({ sessionId }),
      {
        initialProps: { sessionId: 'session1' },
      }
    );

    // Switch to new session
    rerender({ sessionId: 'session2' });

    // Should disconnect old SSE connection
    expect(mockDisconnect).toHaveBeenCalled();

    // Should call useMessages with new session
    expect(mockUseMessages).toHaveBeenCalledWith('session2');
  });

  it('should cleanup on unmount', () => {
    const { unmount } = renderHook(() =>
      useChat({
        sessionId: 'session1',
      })
    );

    unmount();

    expect(mockDisconnect).toHaveBeenCalled();
  });

  it('should handle streaming state from SSE', () => {
    mockUseSSE.mockReturnValue({
      isConnected: true,
      isStreaming: true,
      error: null,
      connect: mockConnect,
      disconnect: mockDisconnect,
    });

    const { result } = renderHook(() =>
      useChat({
        sessionId: 'session1',
      })
    );

    expect(result.current.isStreaming).toBe(true);
  });

  it('should provide stable function references', () => {
    const { result, rerender } = renderHook(() =>
      useChat({
        sessionId: 'session1',
      })
    );

    const { sendMessage, cancelRequest, regenerateResponse } = result.current;

    rerender();

    expect(result.current.sendMessage).toBe(sendMessage);
    expect(result.current.cancelRequest).toBe(cancelRequest);
    expect(result.current.regenerateResponse).toBe(regenerateResponse);
  });
});