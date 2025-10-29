import { useCallback } from 'react';
import { useDialogStore } from '../../../stores/useDialogStore';
import type { Message } from '../../../types/models';

/**
 * useMessages Hook - 对话消息管理
 *
 * 封装对话消息的 CRUD 操作
 * 依赖：useDialogStore (Zustand)
 *
 * @returns 消息相关操作和数据
 *
 * @example
 * ```tsx
 * const { messages, addMessage, clearMessages } = useMessages();
 *
 * addMessage({
 *   role: 'user',
 *   content: 'Hello',
 *   timestamp: Date.now()
 * });
 * ```
 */
export function useMessages() {
  const messages = useDialogStore((state) => state.messages);
  const setMessages = useDialogStore((state) => state.setMessages);
  const addMessage = useDialogStore((state) => state.addMessage);
  const updateMessage = useDialogStore((state) => state.updateMessage);
  const clearMessages = useDialogStore((state) => state.clearMessages);

  // 添加用户消息
  const addUserMessage = useCallback(
    (content: string, metadata?: Message['metadata']) => {
      const message: Message = {
        role: 'user',
        content,
        timestamp: Date.now(),
        metadata,
      };
      addMessage(message);
      return message;
    },
    [addMessage]
  );

  // 添加助手消息
  const addAssistantMessage = useCallback(
    (content: string, metadata?: Message['metadata']) => {
      const message: Message = {
        role: 'assistant',
        content,
        timestamp: Date.now(),
        metadata,
      };
      addMessage(message);
      return message;
    },
    [addMessage]
  );

  // 获取最后一条消息
  const getLastMessage = useCallback(() => {
    return messages[messages.length - 1];
  }, [messages]);

  // 按角色过滤消息
  const getMessagesByRole = useCallback(
    (role: 'user' | 'assistant') => {
      return messages.filter((msg) => msg.role === role);
    },
    [messages]
  );

  return {
    messages,
    setMessages,
    addMessage,
    addUserMessage,
    addAssistantMessage,
    updateMessage,
    clearMessages,
    getLastMessage,
    getMessagesByRole,
  };
}
