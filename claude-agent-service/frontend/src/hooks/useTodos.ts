import { useState, useEffect } from 'react';
import { Todo, ToolCall } from '@/types';

export function useTodos(toolCalls: ToolCall[]) {
  const [todos, setTodos] = useState<Todo[]>([]);

  useEffect(() => {
    // Extract todos from TodoWrite tool calls
    // TodoWrite sends COMPLETE todo list each time, not incremental
    // So we only use the LAST TodoWrite call
    let latestTodos: Todo[] = [];

    for (const toolCall of toolCalls) {
      if (toolCall.name === 'TodoWrite' && toolCall.input?.todos) {
        const todosData = toolCall.input.todos as Array<{
          content: string;
          activeForm: string;
          status: 'pending' | 'in_progress' | 'completed';
        }>;

        // Replace with latest todos (not accumulate)
        latestTodos = todosData;
      }
    }

    setTodos(latestTodos);
  }, [toolCalls]);

  const completedCount = todos.filter((t) => t.status === 'completed').length;
  const inProgressCount = todos.filter((t) => t.status === 'in_progress').length;
  const pendingCount = todos.filter((t) => t.status === 'pending').length;

  return {
    todos,
    completedCount,
    inProgressCount,
    pendingCount,
    totalCount: todos.length,
  };
}
