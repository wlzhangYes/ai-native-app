// Right Panel Component - Execution & Preview Panel
// Based on spec.md FR-025 to FR-034: Two tabs (运行记录 and 结果预览)
// Updated: Task UI components are now embedded in ExecutionLog, not shown separately

import { useEffect, useState } from 'react';
import { Tabs, Flex, Empty } from 'antd';
import { ExecutionLog } from '../preview/ExecutionLog';
import { DocumentPreview } from '../preview/DocumentPreview';
import { useWorkflowStore } from '@/stores/useWorkflowStore';

export function RightPanel() {
  const [activeTab, setActiveTab] = useState('logs');
  const selectedDocumentId = useWorkflowStore((state) => state.selectedDocumentId);
  const activeStageId = useWorkflowStore((state) => state.activeStageId);

  // Auto-switch to preview tab when document is selected
  useEffect(() => {
    if (selectedDocumentId) {
      setActiveTab('preview');
    }
  }, [selectedDocumentId]);

  // Auto-switch to logs tab when stage is selected (and no document is selected)
  useEffect(() => {
    if (activeStageId && !selectedDocumentId) {
      setActiveTab('logs');
    }
  }, [activeStageId, selectedDocumentId]);

  const items = [
    {
      key: 'logs',
      label: '执行记录',
      children: (
        <div className="h-full overflow-auto">
          <ExecutionLog stageId={activeStageId || undefined} />
        </div>
      ),
    },
    {
      key: 'preview',
      label: '结果预览',
      children: selectedDocumentId ? (
        <DocumentPreview documentId={selectedDocumentId} />
      ) : (
        <Flex align="center" justify="center" className="h-full">
          <Empty description="请从工作流树中选择一个文档查看" />
        </Flex>
      ),
    },
  ];

  return (
    <Flex vertical className="h-full bg-gray-50">
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={items}
        destroyInactiveTabPane={false}
        className="full-height-tabs h-full flex flex-col"
        tabBarStyle={{
          padding: '0 16px',
          marginBottom: 0,
          backgroundColor: '#ffffff',
          flexShrink: 0,
        }}
      />
      <style>{`
        .full-height-tabs .ant-tabs-content-holder {
          display: flex;
          flex-direction: column;
          overflow: hidden;
          flex: 1;
        }
        .full-height-tabs .ant-tabs-content {
          height: 100%;
        }
        .full-height-tabs .ant-tabs-tabpane {
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        .full-height-tabs .ant-tabs-tabpane-hidden {
          display: none !important;
        }
      `}</style>
    </Flex>
  );
}
