import { Message as MessageType } from '@/types';
import ToolCallCard from './ToolCallCard';
import ReactMarkdown from 'react-markdown';
import { User, Bot } from 'lucide-react';
import clsx from 'clsx';

interface MessageProps {
  message: MessageType;
}

export default function Message({ message }: MessageProps) {
  const isUser = message.role === 'user';

  return (
    <div
      className={clsx(
        'flex gap-4 p-6 border-b border-anthropic-light-gray',
        isUser ? 'bg-white' : 'bg-anthropic-light'
      )}
    >
      {/* Avatar */}
      <div
        className={clsx(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
          isUser ? 'bg-anthropic-blue' : 'bg-anthropic-orange'
        )}
      >
        {isUser ? (
          <User size={18} className="text-white" />
        ) : (
          <Bot size={18} className="text-white" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Role Label */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-poppins font-semibold text-anthropic-mid-gray uppercase">
            {isUser ? 'You' : 'Claude'}
          </span>
          <span className="text-xs text-anthropic-mid-gray">
            {message.timestamp.toLocaleTimeString()}
          </span>
        </div>

        {/* Message Content */}
        {message.content && (
          <div className="prose prose-sm max-w-none text-anthropic-dark">
            <ReactMarkdown
              components={{
                code: ({ node, className, children, ...props }: any) => {
                  const inline = !className?.includes('language-');
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline ? (
                    <pre className="bg-anthropic-dark text-anthropic-light p-3 rounded-lg overflow-x-auto">
                      <code className={className} {...props}>
                        {children}
                      </code>
                    </pre>
                  ) : (
                    <code
                      className="bg-anthropic-light-gray px-1.5 py-0.5 rounded text-sm font-mono"
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}

        {/* Tool Calls */}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="mt-4 space-y-3">
            {message.toolCalls.map((toolCall) => (
              <ToolCallCard key={toolCall.id} toolCall={toolCall} />
            ))}
          </div>
        )}

        {/* Statistics */}
        {message.stats && (
          <div className="mt-4 flex items-center gap-4 text-xs text-anthropic-mid-gray font-mono">
            <span>Duration: {(message.stats.duration / 1000).toFixed(2)}s</span>
            <span>•</span>
            <span>Cost: ${message.stats.cost.toFixed(4)}</span>
            <span>•</span>
            <span>Turns: {message.stats.turns}</span>
            <span>•</span>
            <span>
              Tokens: {message.stats.tokens.input}↑ / {message.stats.tokens.output}↓
            </span>
            {message.stats.tokens.cacheRead > 0 && (
              <>
                <span>•</span>
                <span className="text-anthropic-green">
                  Cache: {message.stats.tokens.cacheRead}
                </span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
