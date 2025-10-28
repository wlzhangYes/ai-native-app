import { useState, useRef, useEffect } from 'react';
import Message from './Message';
import StreamingText from './StreamingText';
import { Send, StopCircle, Bot } from 'lucide-react';
import clsx from 'clsx';
import ToolCallCard from './ToolCallCard';

interface ChatPanelProps {
  sessionId: string | null;
  chatStream: ReturnType<typeof import('@/hooks/useChatStream').useChatStream>;
}

export default function ChatPanel({ sessionId, chatStream }: ChatPanelProps) {
  const {
    messages,
    isStreaming,
    currentText,
    currentToolCalls,
    loadingHistory,
    sendMessage,
    stopStreaming,
    clearMessages,
    loadHistory,
  } = chatStream;

  // Load message history when session changes
  useEffect(() => {
    if (sessionId) {
      loadHistory(sessionId);
    } else {
      clearMessages();
    }
  }, [sessionId, loadHistory, clearMessages]);

  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentText, currentToolCalls]);

  // Debug: Log messages changes
  useEffect(() => {
    console.log('[ChatPanel] Messages updated:', messages.length, messages);
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming || !sessionId) return;

    const message = input.trim();
    setInput('');
    await sendMessage(message, sessionId);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  if (!sessionId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-anthropic-light">
        <div className="text-center">
          <Bot size={64} className="text-anthropic-mid-gray mx-auto mb-4" />
          <h2 className="font-poppins text-xl font-semibold text-anthropic-dark mb-2">
            No Session Selected
          </h2>
          <p className="text-anthropic-mid-gray">
            Create or select a session to start chatting
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        {loadingHistory ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-anthropic-orange mb-4"></div>
              <p className="text-anthropic-mid-gray">Loading conversation history...</p>
            </div>
          </div>
        ) : messages.length === 0 && !isStreaming ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md px-4">
              <Bot size={64} className="text-anthropic-orange mx-auto mb-4" />
              <h2 className="font-poppins text-xl font-semibold text-anthropic-dark mb-2">
                Ready to help
              </h2>
              <p className="text-anthropic-mid-gray mb-4">
                I'm Claude Code, your AI coding assistant. Ask me anything about your project,
                request code changes, or get help with debugging.
              </p>
              <div className="text-sm text-anthropic-mid-gray space-y-2">
                <p className="font-medium">Try asking:</p>
                <ul className="text-left space-y-1 pl-4">
                  <li>• "Explain what this project does"</li>
                  <li>• "Add error handling to the API"</li>
                  <li>• "Create a new component"</li>
                  <li>• "Review and optimize the code"</li>
                </ul>
              </div>
            </div>
          </div>
        ) : null}

        {messages.map((message) => (
          <Message key={message.id} message={message} />
        ))}

        {/* Streaming Message */}
        {isStreaming && (
          <div className="flex gap-4 p-6 border-b border-anthropic-light-gray bg-anthropic-light">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-anthropic-orange flex items-center justify-center">
              <Bot size={18} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-poppins font-semibold text-anthropic-mid-gray uppercase mb-2 block">
                Claude
              </span>

              {/* Show thinking animation when no content yet */}
              {!currentText && currentToolCalls.length === 0 && (
                <div className="flex items-center gap-2 text-anthropic-orange">
                  <span className="text-sm font-lora">Claude is thinking</span>
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-anthropic-orange rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-anthropic-orange rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-anthropic-orange rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              )}

              {currentText && (
                <div className="prose prose-sm max-w-none text-anthropic-dark">
                  <StreamingText text={currentText} />
                </div>
              )}
              {currentToolCalls.length > 0 && (
                <div className="mt-4 space-y-3">
                  {currentToolCalls.map((toolCall) => (
                    <ToolCallCard key={toolCall.id} toolCall={toolCall} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-anthropic-light-gray bg-white p-4">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isStreaming ? 'Waiting for response...' : 'Ask Claude anything...'}
            disabled={isStreaming}
            rows={1}
            className={clsx(
              'flex-1 resize-none rounded-lg border border-anthropic-light-gray px-4 py-3',
              'font-lora text-anthropic-dark placeholder-anthropic-mid-gray',
              'focus:outline-none focus:ring-2 focus:ring-anthropic-orange focus:border-transparent',
              'disabled:bg-anthropic-light disabled:cursor-not-allowed',
              'max-h-40 overflow-y-auto'
            )}
          />
          {isStreaming ? (
            <button
              type="button"
              onClick={stopStreaming}
              className={clsx(
                'px-6 py-3 rounded-lg font-poppins font-medium',
                'bg-anthropic-orange text-white hover:opacity-90',
                'transition-all flex items-center gap-2 relative overflow-hidden',
                'before:absolute before:inset-0 before:bg-white before:opacity-0',
                'hover:before:opacity-20 before:transition-opacity'
              )}
              title="Stop generating response"
            >
              <StopCircle size={18} className="animate-pulse" />
              <span>Stop</span>
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim() || !sessionId}
              className={clsx(
                'px-6 py-3 rounded-lg font-poppins font-medium',
                'bg-anthropic-orange text-white hover:opacity-90',
                'transition-all flex items-center gap-2',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              <Send size={18} />
              Send
            </button>
          )}
        </form>
        <p className="text-xs text-anthropic-mid-gray mt-2 text-center">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
