import { useState, useCallback, useRef } from 'react';
import { Message, ToolCall, Statistics, SSEEvent } from '@/types';
import { chatApi, messageApi } from '@/services/api';

export function useChatStream() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentText, setCurrentText] = useState('');
  const [currentToolCalls, setCurrentToolCalls] = useState<Map<string, ToolCall>>(new Map());
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Store full text from result event (for fallback when no text_delta)
  const fullResultTextRef = useRef<string>('');

  // Store refs to avoid stale closures
  const currentToolCallsRef = useRef<Map<string, ToolCall>>(new Map());
  const statisticsRef = useRef<Statistics | null>(null);

  // Keep refs in sync
  currentToolCallsRef.current = currentToolCalls;
  statisticsRef.current = statistics;

  const processEvent = useCallback((event: SSEEvent) => {
    switch (event.type) {
      case 'connected':
        // Initial connection established
        console.log('Stream connected:', event.session_id);
        break;

      case 'system':
        // System message (e.g., init)
        console.log('System message:', event.subtype);
        break;

      case 'text_delta':
        // Append text delta to current text
        setCurrentText((prev) => prev + event.content);
        break;

      case 'content_block_start':
        // Start a new content block
        if (event.block_type === 'tool_use' && event.tool) {
          setCurrentToolCalls((prev) => {
            const newMap = new Map(prev);
            // Always add new tool call, don't replace existing ones
            newMap.set(event.tool!.id, {
              id: event.tool!.id,
              name: event.tool!.name,
              input: {},
              inputPartial: '',
              status: 'building',
            });
            return newMap;
          });
        }
        break;

      case 'tool_input_delta':
        // Update tool input with partial JSON
        setCurrentToolCalls((prev) => {
          const newMap = new Map(prev);
          // Find the latest tool call being built
          const entries = Array.from(newMap.entries());
          const lastEntry = entries[entries.length - 1];
          if (lastEntry) {
            const [id, toolCall] = lastEntry;
            if (toolCall.status === 'building') {
              newMap.set(id, {
                ...toolCall,
                inputPartial: (toolCall.inputPartial || '') + event.partial_json,
              });
            }
          }
          return newMap;
        });
        break;

      case 'tool_use':
        // Complete tool call with full input - transition from building to executing
        setCurrentToolCalls((prev) => {
          const newMap = new Map(prev);
          const existing = newMap.get(event.tool.id);
          newMap.set(event.tool.id, {
            ...existing,
            id: event.tool.id,
            name: event.tool.name,
            input: event.tool.input,
            inputPartial: undefined, // Clear partial input
            status: 'executing',
          });
          return newMap;
        });
        break;

      case 'tool_result':
        // Update tool call with result
        setCurrentToolCalls((prev) => {
          const newMap = new Map(prev);
          const toolCall = newMap.get(event.tool_use_id);
          if (toolCall) {
            newMap.set(event.tool_use_id, {
              ...toolCall,
              result: event.content,
              isError: event.is_error,
              status: event.is_error ? 'failed' : 'success',
            });
          }
          return newMap;
        });
        break;

      case 'result':
        // Set statistics
        const stats = {
          cost: event.data.total_cost_usd,
          duration: event.data.duration_ms,
          turns: event.data.num_turns,
          tokens: {
            input: event.data.usage?.input_tokens || 0,
            output: event.data.usage?.output_tokens || 0,
            cacheRead: event.data.usage?.cache_read_input_tokens || 0,
          },
        };
        setStatistics(stats);

        // Store full text from result (fallback for when no text_delta)
        if (event.data.result) {
          console.log('[Result] Got text:', event.data.result.substring(0, 50) + '...');
          fullResultTextRef.current = event.data.result;
          // Always update currentText from result (more reliable)
          setCurrentText(event.data.result);
        } else {
          console.warn('[Result] No text in result field');
        }
        break;

      case 'done':
        // Finalize the message
        console.log('[Done] fullResultTextRef:', fullResultTextRef.current?.substring(0, 50));

        // Use ref which should have the text
        const finalText = fullResultTextRef.current;

        if (!finalText) {
          console.error('[Done] No text content! ref is empty');
        } else {
          console.log('[Done] Using text from ref, length:', finalText.length);
        }

        // Get latest values from refs to avoid stale closure
        const finalToolCalls = Array.from(currentToolCallsRef.current.values());
        const finalStats = statisticsRef.current;

        setMessages((prev) => [
          ...prev,
          {
            id: event.conversation_id,
            role: 'assistant',
            content: finalText || '(No content)',
            toolCalls: finalToolCalls,
            stats: finalStats || undefined,
            timestamp: new Date(),
          },
        ]);

        // Reset state
        setCurrentText('');
        setCurrentToolCalls(new Map());
        setStatistics(null);
        fullResultTextRef.current = '';
        setIsStreaming(false);
        break;

      case 'system':
        // Handle system messages (logging, etc.)
        console.log('[System]', event.subtype, event.data);
        break;

      default:
        console.log('[Unknown Event]', event);
    }
  }, []); // Empty deps - use refs and functional updates

  const sendMessage = useCallback(
    async (
      message: string,
      sessionId?: string,
      options?: {
        permission_mode?: string;
        resume?: string;
        max_turns?: number;
      }
    ) => {
      // Add user message
      setMessages((prev) => [
        ...prev,
        {
          id: `user-${Date.now()}`,
          role: 'user',
          content: message,
          toolCalls: [],
          timestamp: new Date(),
        },
      ]);

      setIsStreaming(true);
      setCurrentText('');
      setCurrentToolCalls(new Map());
      setStatistics(null);

      // Create abort controller
      abortControllerRef.current = new AbortController();

      try {
        const stream = await chatApi.streamWithFetch({
          message,
          session_id: sessionId,
          permission_mode: options?.permission_mode,
          resume: options?.resume,
          max_turns: options?.max_turns,
        });

        const reader = stream.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              try {
                const event = JSON.parse(data) as SSEEvent;
                processEvent(event);
              } catch (err) {
                console.error('Failed to parse SSE event:', err, data);
              }
            }
          }
        }
      } catch (err) {
        console.error('Stream error:', err);
        setIsStreaming(false);
      }
    },
    [processEvent]
  );

  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setCurrentText('');
    setCurrentToolCalls(new Map());
    setStatistics(null);
  }, []);

  const loadHistory = useCallback(async (sessionId: string) => {
    setLoadingHistory(true);
    try {
      const data = await messageApi.getHistory(sessionId);

      // Convert history messages to Message format
      const historyMessages: Message[] = data.messages.map((msg: any) => {
        // Convert tool_calls from backend format to frontend format
        const toolCalls = msg.tool_calls?.map((tc: any) => ({
          id: tc.id,
          name: tc.name,
          input: tc.input,
          result: tc.result,
          isError: tc.is_error,
          status: tc.result ? (tc.is_error ? 'failed' : 'success') : 'completed'
        })) || [];

        return {
          id: msg.id,
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          toolCalls: toolCalls,
          timestamp: new Date(msg.timestamp),
        };
      });

      setMessages(historyMessages);
    } catch (err) {
      console.error('Failed to load message history:', err);
      // Clear messages on error
      setMessages([]);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  return {
    messages,
    isStreaming,
    currentText,
    currentToolCalls: Array.from(currentToolCalls.values()),
    statistics,
    loadingHistory,
    sendMessage,
    stopStreaming,
    clearMessages,
    loadHistory,
  };
}
