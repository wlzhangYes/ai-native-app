// useTodos Hook - Extract and process TodoWrite tool calls
// Based on claude-agent-service/frontend/src/hooks/useTodos.ts

import { useMemo } from 'react';
import type { ToolCall, Todo } from '@/types/models';

export interface TodosResult {
  todos: Todo[];
  completedCount: number;
  inProgressCount: number;
  pendingCount: number;
  totalCount: number;
}

/**
 * Extract todos from TodoWrite tool calls
 * TodoWrite sends COMPLETE todo list each time, not incremental
 * So we only use the LAST TodoWrite call
 */
export function useTodos(toolCalls: ToolCall[]): TodosResult {
  const todos = useMemo(() => {
    let latestTodos: Todo[] = [];

    // Find the last TodoWrite tool call
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

    return latestTodos;
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
