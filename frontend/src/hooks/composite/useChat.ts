import { useCallback, useState, useRef, useEffect } from 'react';
import { useDialogStore } from '../../stores/useDialogStore';
import { message as antMessage } from 'antd';
import type { Message, AttachmentInfo, ToolCall, MessageSender, MessageType } from '../../types/models';
import { SSEConnection } from '../../services/api/sse';
import type { ChatStreamEvent } from '../../services/api/chat';

interface UseChatOptions {
  sessionId: string;
  apiBaseUrl?: string;
  onError?: (error: Error) => void;
  onMessageReceived?: (content: string) => void;
}

/**
 * useChat Hook - 对话功能组合
 *
 * 整合对话消息、SSE 流式响应、Tool Calls 处理等功能
 * 适配 Claude Agent Service API
 * 提供统一的对话接口
 *
 * 依赖：useDialogStore (Zustand)
 *
 * @param options - 配置选项
 * @returns 对话相关操作和状态
 *
 * @example
 * ```tsx
 * const {
 *   messages,
 *   sendMessage,
 *   cancelRequest,
 *   isStreaming,
 *   toolCalls
 * } = useChat({
 *   sessionId: 'project-001'
 * });
 * ```
 */
export function useChat(options: UseChatOptions) {
  const { sessionId, apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api', onError, onMessageReceived } = options;

  // Zustand store
  const {
    messages,
    isStreaming,
    addMessage,
    updateMessage,
    setStreaming,
    appendToStreamingMessage,
    clearMessages,
    loadMessages,
    addToolCall,
    updateToolCall,
    clearToolCalls,
    toolCalls: storedToolCalls,
  } = useDialogStore();

  // Refs
  const streamingMessageIdRef = useRef<string | null>(null);
  const sseConnectionRef = useRef<SSEConnection | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Local tool calls state (for current streaming message)
  const [toolCalls, setToolCalls] = useState<Array<{
    id: string;
    name: string;
    input?: Record<string, unknown>;
    inputPartial?: string;
    result?: unknown;
    status: 'building' | 'executing' | 'success' | 'failed';
    isError?: boolean;
  }>>([]);

  // Load messages when sessionId changes
  useEffect(() => {
    if (sessionId) {
      loadMessages(sessionId);
    }
  }, [sessionId, loadMessages]);

  // SSE Event Handler
  const handleSSEMessage = useCallback((event: ChatStreamEvent) => {
    const msgId = streamingMessageIdRef.current;

    switch (event.type) {
      case 'connected':
        break;

      case 'text_delta':
        // 实时文本流式输出
        if (msgId && 'content' in event) {
          appendToStreamingMessage(msgId, event.content as string);
        }
        break;

      case 'content_block_start':
        // 内容块开始（文本或工具调用）
        if (event.type === 'content_block_start' && 'tool' in event && event.tool) {
          const toolInfo = event.tool as { id: string; name: string };
          const newToolCall = {
            id: toolInfo.id,
            name: toolInfo.name,
            status: 'building' as const,
          };
          setToolCalls((prev) => [...prev, newToolCall]);
        }
        break;

      case 'tool_input_delta':
        // 工具输入流式更新
        if ('partial_json' in event) {
          setToolCalls((prev) =>
            prev.map((t, index) =>
              index === prev.length - 1
                ? { ...t, inputPartial: (t.inputPartial || '') + event.partial_json }
                : t
            )
          );
        }
        break;

      case 'tool_use':
        // 工具调用
        if (event.type === 'tool_use' && 'tool' in event && event.tool) {
          const toolInfo = event.tool as { id: string; name: string; input: Record<string, unknown> };

          setToolCalls((prev) => {
            const existingIndex = prev.findIndex(t => t.id === toolInfo.id);

            if (existingIndex >= 0) {
              return prev.map((t) =>
                t.id === toolInfo.id
                  ? { ...t, status: 'executing' as const, input: toolInfo.input, inputPartial: undefined }
                  : t
              );
            } else {
              return [...prev, {
                id: toolInfo.id,
                name: toolInfo.name,
                input: toolInfo.input,
                status: 'executing' as const,
              }];
            }
          });

          // Save to DialogStore for workflow integration
          addToolCall({
            id: toolInfo.id,
            name: toolInfo.name,
            input: toolInfo.input,
            status: 'running',
          });
        }
        break;

      case 'tool_result':
        // 工具执行结果
        if ('tool_use_id' in event) {
          const toolUseId = event.tool_use_id as string;
          const result = event.content;
          const isError = event.is_error as boolean;

          setToolCalls((prev) =>
            prev.map((t) =>
              t.id === toolUseId
                ? {
                    ...t,
                    status: (isError ? 'failed' : 'success') as const,
                    result,
                    isError,
                  }
                : t
            )
          );

          updateToolCall(toolUseId, {
            result,
            status: isError ? 'failed' : 'completed',
          });
        }
        break;

      case 'result':
        // 完成消息
        if (event.type === 'result' && 'data' in event && event.data) {
          const resultData = event.data as {
            result?: string;
            total_cost_usd?: number;
          };

          if (msgId && resultData.result) {
            updateMessage(msgId, {
              content: resultData.result,
            });
          }
        }
        break;

      case 'done':
        // 对话结束
        if (msgId) {
          updateMessage(msgId, {
            metadata: { isStreaming: false },
          });
        }
        setStreaming(false);
        streamingMessageIdRef.current = null;
        setToolCalls([]);

        if (sseConnectionRef.current) {
          sseConnectionRef.current.close();
          sseConnectionRef.current = null;
        }

        onMessageReceived?.(messages.find(m => m.id === msgId)?.content || '');
        break;

      case 'error':
        // 错误消息
        setStreaming(false);
        if (msgId) {
          updateMessage(msgId, {
            metadata: { isStreaming: false },
          });
        }
        streamingMessageIdRef.current = null;

        addMessage({
          id: `error-${Date.now()}`,
          conversationId: sessionId,
          sender: 'system' as MessageSender,
          content: `❌ ${'error' in event ? event.error : '发生错误'}${
            'suggestion' in event && event.suggestion ? `\n建议: ${event.suggestion}` : ''
          }`,
          type: 'text' as MessageType,
          timestamp: new Date().toISOString(),
        });

        if (sseConnectionRef.current) {
          sseConnectionRef.current.close();
          sseConnectionRef.current = null;
        }

        onError?.(new Error('error' in event ? (event.error as string) : '发生错误'));
        break;

      default:
        break;
    }
  }, [appendToStreamingMessage, updateMessage, setStreaming, addMessage, addToolCall, updateToolCall, sessionId, messages, onMessageReceived, onError]);

  // Sync toolCalls to current streaming message metadata
  useEffect(() => {
    const msgId = streamingMessageIdRef.current;

    if (msgId && toolCalls.length > 0 && isStreaming) {
      const toolCallsData = toolCalls.map(t => ({
        id: t.id,
        name: t.name,
        input: t.input || {},
        result: t.result,
        is_error: !!t.isError,
      }));

      updateMessage(msgId, {
        metadata: {
          isStreaming: true,
          toolCalls: toolCallsData,
        },
      });
    }
  }, [toolCalls, isStreaming, updateMessage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sseConnectionRef.current) {
        sseConnectionRef.current.close();
        sseConnectionRef.current = null;
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  // Send message
  const sendMessage = useCallback(
    async (content: string, attachments?: AttachmentInfo[]) => {
      if (!content.trim() && (!attachments || attachments.length === 0)) {
        return;
      }

      if (!sessionId) {
        antMessage.error('请先选择或创建一个项目');
        return;
      }

      // 清空上一轮的工具调用记录
      clearToolCalls();
      setToolCalls([]);

      // Add user message
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        conversationId: sessionId,
        sender: 'user' as MessageSender,
        content: content,
        type: 'text' as MessageType,
        timestamp: new Date().toISOString(),
        metadata: attachments && attachments.length > 0 ? { attachments } : undefined,
      };
      addMessage(userMessage);

      // Add placeholder AI message
      const aiMessageId = `ai-${Date.now()}`;
      const aiMessage: Message = {
        id: aiMessageId,
        conversationId: sessionId,
        sender: 'ai' as MessageSender,
        content: '',
        type: 'text' as MessageType,
        timestamp: new Date().toISOString(),
        metadata: { isStreaming: true },
      };
      addMessage(aiMessage);
      streamingMessageIdRef.current = aiMessageId;

      // Start streaming
      setStreaming(true);

      // Build request
      const url = `${apiBaseUrl}/chat/stream`;
      const requestBody = {
        session_id: sessionId,
        message: content,
        permission_mode: 'acceptEdits',
      };

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      // Create SSE connection
      const connection = new SSEConnection({
        url: url,
        method: 'POST',
        body: requestBody,
        onMessage: handleSSEMessage,
        onError: (error) => {
          if (streamingMessageIdRef.current) {
            updateMessage(streamingMessageIdRef.current, {
              metadata: { isStreaming: false },
            });
          }
          setStreaming(false);
          streamingMessageIdRef.current = null;
          abortControllerRef.current = null;

          addMessage({
            id: `error-${Date.now()}`,
            conversationId: sessionId,
            sender: 'system' as MessageSender,
            content: '❌ 连接失败，请重试',
            type: 'text' as MessageType,
            timestamp: new Date().toISOString(),
          });

          onError?.(new Error('连接失败'));
        },
        onOpen: () => {},
      });

      connection.connect();
      sseConnectionRef.current = connection;
    },
    [sessionId, apiBaseUrl, addMessage, setStreaming, clearToolCalls, handleSSEMessage, updateMessage, onError]
  );

  // Cancel request
  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    if (sseConnectionRef.current) {
      sseConnectionRef.current.close();
      sseConnectionRef.current = null;
    }

    if (streamingMessageIdRef.current) {
      updateMessage(streamingMessageIdRef.current, {
        content: '⚠️ 请求已取消',
        metadata: { isStreaming: false },
      });
      streamingMessageIdRef.current = null;
    }

    setStreaming(false);
    setToolCalls([]);
    antMessage.info('已取消当前请求');
  }, [updateMessage, setStreaming]);

  // Regenerate response
  const regenerateResponse = useCallback(() => {
    if (messages.length < 2) return;

    const lastUserMessage = [...messages]
      .reverse()
      .find((msg) => msg.sender === 'user');

    if (lastUserMessage) {
      sendMessage(
        lastUserMessage.content,
        lastUserMessage.metadata?.attachments
      );
      antMessage.info('正在重新生成...');
    }
  }, [messages, sendMessage]);

  return {
    messages,
    sendMessage,
    cancelRequest,
    regenerateResponse,
    clearMessages,
    isStreaming,
    toolCalls,
    storedToolCalls,
  };
}
