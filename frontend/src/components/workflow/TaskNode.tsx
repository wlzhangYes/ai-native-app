// TaskNode Component - Workflow Task Node
// Based on spec.md FR-014: Workflow tree with task visualization

import { Flex } from 'antd';
import { getTaskIcon } from '@/utils/icons';
import type { Task } from '@/types/models';

export interface TaskNodeProps {
  task: Task;
}

export function TaskNode({ task }: TaskNodeProps) {
  return (
    <Flex
      align="center"
      className="gap-2 px-2 py-1 cursor-pointer"
    >
      {/* Status Icon */}
      <Flex align="center">
        {getTaskIcon(task.status)}
      </Flex>

      {/* Task Name */}
      <span className="flex-1 text-sm text-gray-600">
        {task.name}
      </span>

      {/* Progress Percentage (if in progress) */}
      {task.status === 'in_progress' && task.progress !== undefined && (
        <span className="text-sm text-blue-500 font-medium">
          {task.progress}%
        </span>
      )}
    </Flex>
  );
}
