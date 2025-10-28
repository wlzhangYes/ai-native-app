import { useChatContext } from '@/contexts/ChatContext';
import { useTodos } from '@/hooks/useTodos';
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';
import clsx from 'clsx';

interface TodoListProps {
  sessionId: string | null;
}

export default function TodoList({ sessionId }: TodoListProps) {
  const { messages, currentToolCalls } = useChatContext();

  // Only use tool calls from the LAST message (most recent conversation)
  // and current streaming tool calls
  const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
  const lastMessageToolCalls = lastMessage?.toolCalls || [];
  const allCurrentToolCalls = currentToolCalls || [];

  // If currently streaming, use current tool calls, otherwise use last message
  const relevantToolCalls = allCurrentToolCalls.length > 0
    ? allCurrentToolCalls
    : lastMessageToolCalls;

  const { todos, completedCount, inProgressCount, pendingCount, totalCount } =
    useTodos(relevantToolCalls);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 size={18} className="text-anthropic-green flex-shrink-0" />;
      case 'in_progress':
        return <Loader2 size={18} className="text-anthropic-orange flex-shrink-0 animate-spin" />;
      default:
        return <Circle size={18} className="text-anthropic-mid-gray flex-shrink-0" />;
    }
  };

  if (!sessionId) {
    return (
      <div className="flex items-center justify-center h-full text-anthropic-mid-gray text-sm">
        No session selected
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header with Progress */}
      {totalCount > 0 && (
        <div className="p-4 border-b border-anthropic-light-gray bg-anthropic-light">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-poppins font-semibold text-anthropic-dark">
              Progress
            </span>
            <span className="text-sm font-mono text-anthropic-mid-gray">
              {completedCount}/{totalCount}
            </span>
          </div>
          <div className="w-full bg-anthropic-light-gray rounded-full h-2 overflow-hidden">
            <div
              className="bg-anthropic-green h-full transition-all duration-500"
              style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-2 text-xs">
            <div className="flex items-center gap-1">
              <CheckCircle2 size={12} className="text-anthropic-green" />
              <span className="text-anthropic-mid-gray">{completedCount} done</span>
            </div>
            {inProgressCount > 0 && (
              <div className="flex items-center gap-1">
                <Loader2 size={12} className="text-anthropic-orange animate-spin" />
                <span className="text-anthropic-mid-gray">{inProgressCount} active</span>
              </div>
            )}
            {pendingCount > 0 && (
              <div className="flex items-center gap-1">
                <Circle size={12} className="text-anthropic-mid-gray" />
                <span className="text-anthropic-mid-gray">{pendingCount} pending</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Todo List */}
      <div className="flex-1 overflow-y-auto">
        {todos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-anthropic-mid-gray text-sm px-4 text-center">
            <p>No tasks yet</p>
            <p className="text-xs mt-1">
              Tasks will appear here when Claude uses the TodoWrite tool
            </p>
          </div>
        ) : (
          <div className="divide-y divide-anthropic-light-gray">
            {todos.map((todo, index) => (
              <div
                key={index}
                className={clsx(
                  'p-4 transition-colors hover:bg-anthropic-light',
                  todo.status === 'completed' && 'opacity-60'
                )}
              >
                <div className="flex gap-3">
                  {getStatusIcon(todo.status)}
                  <div className="flex-1 min-w-0">
                    <p
                      className={clsx(
                        'text-sm text-anthropic-dark',
                        todo.status === 'completed' && 'line-through'
                      )}
                    >
                      {todo.status === 'in_progress' ? todo.activeForm : todo.content}
                    </p>
                    {todo.status === 'in_progress' && todo.activeForm !== todo.content && (
                      <p className="text-xs text-anthropic-mid-gray mt-1">{todo.content}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
