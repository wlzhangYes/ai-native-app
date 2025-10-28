// DocumentDiffView Component - Side-by-side diff comparison
// Based on spec.md User Story 5: Document editing and version comparison

import { useMemo } from 'react';
import { Button, Space, Alert } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { computeDiff, calculateSimilarity } from '@/utils/diff';
import type { DiffResult } from '@/utils/diff';

export interface DocumentDiffViewProps {
  oldContent: string;
  newContent: string;
  onAccept?: () => void;
  onReject?: () => void;
}

export function DocumentDiffView({
  oldContent,
  newContent,
  onAccept,
  onReject,
}: DocumentDiffViewProps) {
  // Compute diff
  const diffs = useMemo<DiffResult[]>(
    () => computeDiff(oldContent, newContent),
    [oldContent, newContent]
  );

  // Calculate similarity
  const similarity = useMemo(
    () => calculateSimilarity(oldContent, newContent),
    [oldContent, newContent]
  );

  // Render old content (showing deletions)
  const renderOldContent = () => {
    return diffs.map((diff, index) => {
      if (diff.type === 'delete') {
        return (
          <span key={index} className="diff-delete">
            {diff.text}
          </span>
        );
      } else if (diff.type === 'equal') {
        return <span key={index}>{diff.text}</span>;
      }
      return null;
    });
  };

  // Render new content (showing insertions)
  const renderNewContent = () => {
    return diffs.map((diff, index) => {
      if (diff.type === 'insert') {
        return (
          <span key={index} className="diff-insert">
            {diff.text}
          </span>
        );
      } else if (diff.type === 'equal') {
        return <span key={index}>{diff.text}</span>;
      }
      return null;
    });
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header with similarity and actions */}
      <div
        style={{
          padding: '16px',
          borderBottom: '1px solid #f0f0f0',
          backgroundColor: '#fff',
        }}
      >
        <Alert
          message={`文档相似度：${similarity}%`}
          description="左侧为旧版本（红色为删除内容），右侧为新版本（绿色为新增内容）"
          type="info"
          showIcon
          style={{ marginBottom: '16px' }}
        />

        <Space>
          <Button
            type="primary"
            icon={<CheckOutlined />}
            onClick={onAccept}
          >
            确认变更
          </Button>
          <Button
            danger
            icon={<CloseOutlined />}
            onClick={onReject}
          >
            拒绝变更
          </Button>
        </Space>
      </div>

      {/* Side-by-side comparison */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Old version (left) */}
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            padding: '16px',
            borderRight: '1px solid #f0f0f0',
            backgroundColor: '#fff9f9',
          }}
        >
          <div
            style={{
              fontSize: '12px',
              fontWeight: 600,
              marginBottom: '12px',
              color: '#ff4d4f',
            }}
          >
            旧版本
          </div>
          <pre
            style={{
              margin: 0,
              fontSize: '13px',
              lineHeight: '1.6',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontFamily: 'monospace',
            }}
          >
            {renderOldContent()}
          </pre>
        </div>

        {/* New version (right) */}
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            padding: '16px',
            backgroundColor: '#f6ffed',
          }}
        >
          <div
            style={{
              fontSize: '12px',
              fontWeight: 600,
              marginBottom: '12px',
              color: '#52c41a',
            }}
          >
            新版本
          </div>
          <pre
            style={{
              margin: 0,
              fontSize: '13px',
              lineHeight: '1.6',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontFamily: 'monospace',
            }}
          >
            {renderNewContent()}
          </pre>
        </div>
      </div>
    </div>
  );
}
