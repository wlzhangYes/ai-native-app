// StageNode Component - Workflow Stage Node
// Based on spec.md FR-014: Workflow tree with stage visualization

import { Badge, Flex } from 'antd';
import { getStageIcon } from '@/utils/icons';
import type { Stage } from '@/types/models';

export interface StageNodeProps {
  stage: Stage;
  isActive?: boolean;
  taskCount?: number;
  completedTaskCount?: number;
}

export function StageNode({
  stage,
  isActive = false,
  taskCount = 0,
  completedTaskCount = 0,
}: StageNodeProps) {
  const isAllTasksCompleted = taskCount > 0 && completedTaskCount === taskCount;

  return (
    <Flex
      align="center"
      className={`gap-2 px-2 py-1 rounded cursor-pointer ${
        isActive ? 'bg-blue-50 border border-blue-500' : 'border border-transparent'
      }`}
    >
      {/* Status Icon */}
      <Flex align="center">
        {getStageIcon(stage.status)}
      </Flex>

      {/* Stage Name */}
      <span
        className={`flex-1 text-sm ${isActive ? 'font-semibold text-blue-500' : 'font-normal text-gray-900'}`}
      >
        {stage.name}
      </span>

      {/* Task Count Badge - Hidden per user request */}
      {/* {taskCount > 0 && (
        <Badge
          count={`${completedTaskCount}/${taskCount}`}
          className={`text-xs ${isAllTasksCompleted ? '!bg-green-500' : '!bg-blue-500'}`}
        />
      )} */}
    </Flex>
  );
}
