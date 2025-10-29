import { useCallback, useState } from 'react';
import { useMessages } from '../business/dialog/useMessages';
import { useSSE } from '../infrastructure/useSSE';
import { useApiClient } from '../infrastructure/useApiClient';
import { message as antMessage } from 'antd';
import type { AttachmentInfo } from '../../types/models';

interface UseChatOptions {
  sessionId: string;
  apiBaseUrl?: string;
  onError?: (error: Error) => void;
  onMessageReceived?: (content: string) => void;
}

/**
 * useChat Hook - 对话功能组合
 *
 * 整合对话消息、SSE 流式响应、API 调用等功能
 * 提供统一的对话接口
 *
 * 依赖：useMessages (Business), useSSE (Infrastructure), useApiClient (Infrastructure)
 *
 * @param options - 配置选项
 * @returns 对话相关操作和状态
 *
 * @example
 * ```tsx
 * const { messages, sendMessage, isStreaming } = useChat({
 *   sessionId: 'project-001'
 * });
 *
 * const handleSend = () => {
 *   sendMessage('Hello, AI!');
 * };
 * ```
 */
export function useChat(options: UseChatOptions) {
  const { sessionId, apiBaseUrl, onError, onMessageReceived } = options;

  const {
    messages,
    addUserMessage,
    addAssistantMessage,
    updateMessage,
    clearMessages,
  } = useMessages();

  const { request } = useApiClient({
    onError: (err) => {
      antMessage.error(err.message || '发送消息失败');
      onError?.(err);
    },
  });

  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStreamId, setCurrentStreamId] = useState<string>('');

  // SSE 消息处理
  const handleSSEMessage = useCallback(
    (data: any) => {
      if (data.type === 'content') {
        // 更新流式内容
        if (currentStreamId) {
          updateMessage(currentStreamId, { content: data.content });
        }
      } else if (data.type === 'done') {
        // 流式传输完成
        setIsStreaming(false);
        setCurrentStreamId('');
        onMessageReceived?.(data.content || '');
      }
    },
    [currentStreamId, updateMessage, onMessageReceived]
  );

  const { connect: connectSSE, disconnect: disconnectSSE } = useSSE({
    url: `${apiBaseUrl || ''}/chat/stream`,
    onMessage: handleSSEMessage,
    onError: (err) => {
      setIsStreaming(false);
      antMessage.error('连接失败');
      onError?.(err);
    },
  });

  // 发送消息
  const sendMessage = useCallback(
    async (content: string, attachments?: AttachmentInfo[]) => {
      if (!content.trim() && (!attachments || attachments.length === 0)) {
        return;
      }

      // 添加用户消息
      addUserMessage(content, { attachments });

      // 添加空的助手消息（用于流式更新）
      const assistantMsgId = `msg-${Date.now()}`;
      addAssistantMessage('', { id: assistantMsgId });
      setCurrentStreamId(assistantMsgId);
      setIsStreaming(true);

      try {
        // 发送请求到后端
        const response = await request('/chat', {
          method: 'POST',
          data: {
            sessionId,
            message: content,
            attachments,
          },
        });

        if (response?.streamUrl) {
          // 使用 SSE 接收流式响应
          connectSSE();
        } else {
          // 非流式响应
          updateMessage(assistantMsgId, { content: response?.message || '' });
          setIsStreaming(false);
        }
      } catch (error) {
        setIsStreaming(false);
        setCurrentStreamId('');
        throw error;
      }
    },
    [
      sessionId,
      addUserMessage,
      addAssistantMessage,
      updateMessage,
      request,
      connectSSE,
    ]
  );

  // 停止流式传输
  const stopStreaming = useCallback(() => {
    disconnectSSE();
    setIsStreaming(false);
    setCurrentStreamId('');
  }, [disconnectSSE]);

  // 重新生成回复
  const regenerateResponse = useCallback(() => {
    if (messages.length < 2) return;

    // 获取最后一条用户消息
    const lastUserMessage = [...messages]
      .reverse()
      .find((msg) => msg.role === 'user');

    if (lastUserMessage) {
      // 删除最后一条助手消息
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant') {
        // 这里需要 store 提供 deleteMessage 方法
        // 暂时用 clearMessages 替代
      }

      // 重新发送
      sendMessage(
        lastUserMessage.content,
        lastUserMessage.metadata?.attachments
      );
    }
  }, [messages, sendMessage]);

  return {
    messages,
    sendMessage,
    stopStreaming,
    regenerateResponse,
    clearMessages,
    isStreaming,
  };
}
