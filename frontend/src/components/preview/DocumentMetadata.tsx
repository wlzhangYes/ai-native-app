// DocumentMetadata Component - Displays document metadata
// Based on spec.md FR-025: Document metadata display

import { Tag } from 'antd';
import { formatDate } from '@/utils/format';
import type { Document } from '@/types/models';

export interface DocumentMetadataProps {
  document: Document;
}

export function DocumentMetadata({ document }: DocumentMetadataProps) {
  return (
    <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
      {/* Document Title and Status */}
      <div className="flex items-center gap-3 mb-2">
        <h2 className="m-0 text-lg font-semibold">
          {document.name}
        </h2>
        <Tag color={document.status === 'completed' ? 'success' : 'warning'}>
          {document.status === 'completed' ? '已完成' : '草稿'}
        </Tag>
        <Tag>版本 {document.version}</Tag>
      </div>

      {/* Metadata Details - Compact Grid Layout */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-gray-600">
        <div>
          <span className="text-gray-500">作者：</span>
          <span>{document.metadata?.author || 'File'}</span>
        </div>
        <div>
          <span className="text-gray-500">字数：</span>
          <span>{document.metadata?.wordCount?.toLocaleString() || 0} 字</span>
        </div>
        <div>
          <span className="text-gray-500">创建时间：</span>
          <span>{formatDate(document.createdAt)}</span>
        </div>
        <div>
          <span className="text-gray-500">更新时间：</span>
          <span>{formatDate(document.updatedAt)}</span>
        </div>
      </div>
    </div>
  );
}
