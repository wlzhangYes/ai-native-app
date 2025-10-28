// DocumentPreview Component - Full document preview with metadata and actions
// Based on spec.md FR-025: Document preview with actions
// Updated for User Story 5: Document editing and version comparison

import { useState } from 'react';
import { Button, Space, message } from 'antd';
import { DownloadOutlined, EditOutlined, CheckOutlined, CloseOutlined, SaveOutlined, CloudUploadOutlined } from '@ant-design/icons';
import { DocumentMetadata } from './DocumentMetadata';
import { CodeEditor } from './CodeEditor';
import { DocumentDiffView } from './DocumentDiffView';
import { useDocumentStore } from '@/stores/useDocumentStore';
import { syncToFeishu } from '@/services/api/document';
import type { Document } from '@/types/models';

export interface DocumentPreviewProps {
  documentId: string;
}

type ViewMode = 'preview' | 'edit' | 'diff';

export function DocumentPreview({ documentId }: DocumentPreviewProps) {
  const documents = useDocumentStore((state) => state.documents);
  const updateDocument = useDocumentStore((state) => state.updateDocument);
  const isDiffMode = useDocumentStore((state) => state.isDiffMode);
  const previousContent = useDocumentStore((state) => state.previousDocumentContent);
  const startEditing = useDocumentStore((state) => state.startEditing);
  const stopEditing = useDocumentStore((state) => state.stopEditing);
  const enterDiffMode = useDocumentStore((state) => state.enterDiffMode);
  const exitDiffMode = useDocumentStore((state) => state.exitDiffMode);

  const document = documents.get(documentId);
  const [viewMode, setViewMode] = useState<ViewMode>('preview');
  const [editedContent, setEditedContent] = useState('');
  const [isSyncingToFeishu, setIsSyncingToFeishu] = useState(false);

  // Handle export document as .md file
  const handleExport = () => {
    if (!document) return;

    const blob = new Blob([document.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = document.name;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
    URL.revokeObjectURL(url);

    message.success('文档已导出');
  };

  // Handle export to Feishu (direct export, no dialog)
  const handleExportToFeishu = async () => {
    if (!document) return;

    setIsSyncingToFeishu(true);

    try {
      // Project ID is hardcoded for now
      const projectId = 'proj-001'; // TODO: Get from route params or context

      const response = await syncToFeishu(projectId, documentId, {
        documentId,
        createNewDoc: false, // Update existing doc if available
      });

      if (response.success && response.data) {
        // Update document with Feishu doc ID
        updateDocument(documentId, {
          feishuDocId: response.data.feishuDocId,
        });

        message.success({
          content: (
            <span>
              文档已导出到飞书{' '}
              <a href={response.data.feishuUrl} target="_blank" rel="noopener noreferrer">
                点击查看
              </a>
            </span>
          ),
          duration: 5,
        });
      }
    } catch (error) {
      console.error('[DocumentPreview] Failed to sync to Feishu:', error);
      message.error('导出到飞书失败，文档已保存在本地');
    } finally {
      setIsSyncingToFeishu(false);
    }
  };

  // Handle edit document
  const handleEdit = () => {
    if (!document) return;

    startEditing(documentId);
    setEditedContent(document.content);
    setViewMode('edit');
    message.info('进入编辑模式');
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    stopEditing();
    setViewMode('preview');
    setEditedContent('');
    message.info('已取消编辑');
  };

  // Handle save edit
  const handleSaveEdit = () => {
    if (!document) return;

    // Check if content changed
    if (editedContent !== document.content) {
      // Enter diff mode to show changes
      enterDiffMode(documentId);
      setViewMode('diff');
      message.info('请确认或拒绝变更');
    } else {
      stopEditing();
      setViewMode('preview');
      message.info('内容未改变');
    }
  };

  // Handle accept changes in diff mode
  const handleAcceptChanges = () => {
    if (!document) return;

    // Update document with new content
    updateDocument(documentId, {
      content: editedContent,
      version: document.version + 1,
    });

    exitDiffMode();
    stopEditing();
    setViewMode('preview');
    setEditedContent('');
    message.success('变更已保存');
  };

  // Handle reject changes in diff mode
  const handleRejectChanges = () => {
    exitDiffMode();
    setViewMode('edit');
    message.info('已拒绝变更，返回编辑模式');
  };

  // Handle confirm document (mark as completed)
  const handleConfirm = () => {
    if (!document) return;

    updateDocument(documentId, {
      status: 'completed',
    });

    message.success('文档已确认');
  };

  if (!document) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: 'rgba(0, 0, 0, 0.45)',
        }}
      >
        请从工作流树中选择一个文档查看
      </div>
    );
  }

  // Diff mode view
  if (viewMode === 'diff' && previousContent) {
    return (
      <DocumentDiffView
        oldContent={previousContent}
        newContent={editedContent}
        onAccept={handleAcceptChanges}
        onReject={handleRejectChanges}
      />
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: '#fff',
      }}
    >
      {/* Document Metadata Header */}
      <DocumentMetadata document={document} />

      {/* Content Area */}
      <div style={{ flex: 1, overflow: 'hidden', borderBottom: '1px solid #f0f0f0' }}>
        <CodeEditor
          content={viewMode === 'edit' ? editedContent : document.content}
          fileName={document.name}
          readOnly={viewMode !== 'edit'}
          onChange={(value) => setEditedContent(value || '')}
          height="100%"
          defaultTab={viewMode === 'edit' ? 'source' : 'preview'}
        />
      </div>

      {/* Action Buttons - Bottom */}
      <div
        style={{
          padding: '12px 16px',
          backgroundColor: '#fff',
          borderTop: '1px solid #f0f0f0',
          flexShrink: 0,
          display: 'flex',
          justifyContent: 'flex-end',
        }}
      >
        {viewMode === 'preview' ? (
          <Space>
            <Button
              type="default"
              icon={<DownloadOutlined />}
              onClick={handleExport}
            >
              导出文本文档
            </Button>
            <Button
              type="default"
              icon={<CloudUploadOutlined />}
              onClick={handleExportToFeishu}
              loading={isSyncingToFeishu}
            >
              导出到飞书
            </Button>
            <Button
              type="default"
              icon={<EditOutlined />}
              onClick={handleEdit}
            >
              编辑
            </Button>
            <Button
              type="primary"
              icon={<CheckOutlined />}
              onClick={handleConfirm}
              disabled={document.status === 'completed'}
            >
              确认
            </Button>
          </Space>
        ) : (
          <Space>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSaveEdit}
            >
              保存
            </Button>
            <Button
              icon={<CloseOutlined />}
              onClick={handleCancelEdit}
            >
              取消
            </Button>
          </Space>
        )}
      </div>
    </div>
  );
}
