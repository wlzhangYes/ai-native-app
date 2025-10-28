// Dialog Store - Manages conversation messages and AI streaming
// Based on data-model.md Zustand store design

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { Message, TaskStatus, ToolCall } from '@/types/models';
import { getSessionMessages } from '@/services/api/session';
import { mapConversationsToMessages } from '@/services/api/adapters';

// ============================================================================
// Store State Interface
// ============================================================================

interface DialogStore {
  // State
  currentSessionId: string | null; // 当前会话ID，用于隔离数据
  messages: Message[];
  isStreaming: boolean;
  currentTaskStatus?: {
    taskId: string;
    taskName: string;
    status: TaskStatus;
    progress?: number;
  };
  currentStreamingMessageId?: string;
  toolCalls: ToolCall[]; // 存储当前会话的所有 tool calls

  // Actions
  setCurrentSession: (sessionId: string) => void; // 切换会话并加载对应数据
  saveSessionData: () => void; // 保存当前会话数据到 localStorage
  loadSessionData: (sessionId: string) => void; // 从 localStorage 加载会话数据
  addMessage: (message: Message) => void;
  updateMessage: (messageId: string, updates: Partial<Message>) => void;
  deleteMessage: (messageId: string) => void;
  clearMessages: () => void;
  setMessages: (messages: Message[]) => void;
  loadMessages: (sessionId: string) => Promise<void>;
  setStreaming: (streaming: boolean, messageId?: string) => void;
  setTaskStatus: (taskId: string, taskName: string, status: TaskStatus, progress?: number) => void;
  clearTaskStatus: () => void;
  appendToStreamingMessage: (messageId: string, delta: string) => void;
  addToolCall: (toolCall: ToolCall) => void;
  updateToolCall: (toolCallId: string, updates: Partial<ToolCall>) => void;
  clearToolCalls: () => void;
}

// ============================================================================
// Store Implementation
// ============================================================================

// Helper functions for session-based localStorage
const getSessionStorageKey = (sessionId: string) => `dialog-session-${sessionId}`;

const saveToSessionStorage = (sessionId: string, data: { messages: Message[]; toolCalls: ToolCall[] }) => {
  try {
    const key = getSessionStorageKey(sessionId);
    localStorage.setItem(key, JSON.stringify(data));
    console.log(`[DialogStore] Saved session data to ${key}:`, data);
  } catch (error) {
    console.error('[DialogStore] Failed to save session data:', error);
  }
};

const loadFromSessionStorage = (sessionId: string): { messages: Message[]; toolCalls: ToolCall[] } | null => {
  try {
    const key = getSessionStorageKey(sessionId);
    const data = localStorage.getItem(key);
    if (data) {
      const parsed = JSON.parse(data);
      console.log(`[DialogStore] Loaded session data from ${key}:`, parsed);
      return parsed;
    }
  } catch (error) {
    console.error('[DialogStore] Failed to load session data:', error);
  }
  return null;
};

export const useDialogStore = create<DialogStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        currentSessionId: null,
        messages: [],
        isStreaming: false,
        currentTaskStatus: undefined,
        currentStreamingMessageId: undefined,
        toolCalls: [],

        // 设置当前会话并加载对应数据
        setCurrentSession: (sessionId) =>
          set((state) => {
            console.log(`[DialogStore] Switching to session: ${sessionId}`);

            // 保存当前会话数据（如果有）
            if (state.currentSessionId) {
              saveToSessionStorage(state.currentSessionId, {
                messages: state.messages,
                toolCalls: state.toolCalls,
              });
            }

            // 加载新会话数据
            const sessionData = loadFromSessionStorage(sessionId);
            state.currentSessionId = sessionId;
            state.messages = sessionData?.messages || [];
            state.toolCalls = sessionData?.toolCalls || [];
            state.isStreaming = false;
            state.currentStreamingMessageId = undefined;
          }),

        // 保存当前会话数据
        saveSessionData: () => {
          const state = get();
          if (state.currentSessionId) {
            saveToSessionStorage(state.currentSessionId, {
              messages: state.messages,
              toolCalls: state.toolCalls,
            });
          }
        },

        // 加载会话数据
        loadSessionData: (sessionId) =>
          set((state) => {
            const sessionData = loadFromSessionStorage(sessionId);
            if (sessionData) {
              state.messages = sessionData.messages;
              state.toolCalls = sessionData.toolCalls;
            }
          }),

        // Add a new message
        addMessage: (message) =>
          set((state) => {
            state.messages.push(message);
          }),

        // Update an existing message
        updateMessage: (messageId, updates) =>
          set((state) => {
            const messageIndex = state.messages.findIndex((m) => m.id === messageId);
            if (messageIndex !== -1) {
              state.messages[messageIndex] = {
                ...state.messages[messageIndex],
                ...updates,
              };
            }
          }),

        // Delete a message
        deleteMessage: (messageId) =>
          set((state) => {
            state.messages = state.messages.filter((m) => m.id !== messageId);
          }),

        // Clear all messages
        clearMessages: () =>
          set((state) => {
            state.messages = [];
            state.isStreaming = false;
            state.currentStreamingMessageId = undefined;
          }),

        // Set messages (replace all)
        setMessages: (messages) =>
          set((state) => {
            state.messages = messages;
          }),

        // Load messages from backend
        loadMessages: async (sessionId) => {
          try {
            console.log('[DialogStore] Loading messages for session:', sessionId);
            const response = await getSessionMessages(sessionId);

            if (response.data) {
              const messages = mapConversationsToMessages(response.data.messages, sessionId);
              console.log('[DialogStore] Loaded messages:', messages.length);

              // Extract tool calls from messages
              const toolCalls: ToolCall[] = [];
              messages.forEach((message) => {
                if (message.metadata?.toolCalls && Array.isArray(message.metadata.toolCalls)) {
                  message.metadata.toolCalls.forEach((tc: any) => {
                    toolCalls.push({
                      id: tc.id,
                      name: tc.name,
                      input: tc.input,
                      status: 'completed',
                    });
                  });
                }
              });

              console.log('[DialogStore] Extracted tool calls:', toolCalls.length);

              set((state) => {
                state.messages = messages;
                state.toolCalls = toolCalls;
              });
            } else {
              console.error('[DialogStore] Failed to load messages:', response.error);
            }
          } catch (error) {
            console.error('[DialogStore] Error loading messages:', error);
          }
        },

        // Set streaming state
        setStreaming: (streaming, messageId) =>
          set((state) => {
            state.isStreaming = streaming;
            state.currentStreamingMessageId = messageId;
          }),

        // Set current task status
        setTaskStatus: (taskId, taskName, status, progress) =>
          set((state) => {
            state.currentTaskStatus = { taskId, taskName, status, progress };
          }),

        // Clear current task status
        clearTaskStatus: () =>
          set((state) => {
            state.currentTaskStatus = undefined;
          }),

        // Append text to a streaming message
        appendToStreamingMessage: (messageId, delta) =>
          set((state) => {
            const messageIndex = state.messages.findIndex((m) => m.id === messageId);
            if (messageIndex !== -1) {
              state.messages[messageIndex].content += delta;
            }
          }),

        // Add a tool call
        addToolCall: (toolCall) =>
          set((state) => {
            console.log('[DialogStore] Adding tool call:', toolCall);
            state.toolCalls.push(toolCall);
            console.log('[DialogStore] Total tool calls now:', state.toolCalls.length);
          }),

        // Update a tool call
        updateToolCall: (toolCallId, updates) =>
          set((state) => {
            const index = state.toolCalls.findIndex((tc) => tc.id === toolCallId);
            if (index !== -1) {
              state.toolCalls[index] = {
                ...state.toolCalls[index],
                ...updates,
              };
            }
          }),

        // Clear all tool calls
        clearToolCalls: () =>
          set((state) => {
            state.toolCalls = [];
          }),
      })),
      {
        name: 'dialog-store',
        partialize: (state) => ({
          messages: state.messages, // Persist messages
          toolCalls: state.toolCalls, // Persist tool calls
          // Don't persist streaming state
        }),
      }
    ),
    { name: 'DialogStore' }
  )
);

// ============================================================================
// Selectors (for performance optimization)
// ============================================================================

export const selectMessages = (state: DialogStore) => state.messages;
export const selectIsStreaming = (state: DialogStore) => state.isStreaming;
export const selectCurrentTaskStatus = (state: DialogStore) => state.currentTaskStatus;
export const selectLatestMessage = (state: DialogStore) =>
  state.messages.length > 0 ? state.messages[state.messages.length - 1] : null;
