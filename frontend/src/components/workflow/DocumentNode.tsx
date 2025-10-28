// DocumentNode Component - Workflow Document Node
// Based on spec.md FR-014: Workflow tree with document visualization

import { Badge, Flex } from 'antd';
import { getDocumentIcon, getDocumentBadgeText } from '@/utils/icons';
import type { Document } from '@/types/models';

export interface DocumentNodeProps {
  document: Document;
}

export function DocumentNode({ document }: DocumentNodeProps) {
  return (
    <Flex
      align="center"
      className="gap-2 px-2 py-1 cursor-pointer"
    >
      {/* Status Icon */}
      <Flex align="center">
        {getDocumentIcon(document.status)}
      </Flex>

      {/* Document Name */}
      <span className="flex-1 text-sm text-gray-600">
        {document.name}
      </span>

      {/* Status Badge */}
      <Badge
        status={document.status === 'completed' ? 'success' : 'warning'}
        text={getDocumentBadgeText(document.status)}
        className="text-sm"
      />
    </Flex>
  );
}
