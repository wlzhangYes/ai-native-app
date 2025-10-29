// Middle Panel Component - Workflow Tree Panel with Tabs
// Based on spec.md FR-014 to FR-024: Workflow tree with 5 stages

import { useState } from 'react';
import { Tabs, Flex, Space, Empty } from 'antd';
import { UnorderedListOutlined, DatabaseOutlined, FileOutlined } from '@ant-design/icons';
import { WorkflowTree } from '../workflow/WorkflowTree';
import { DocumentList } from '../document/DocumentList';

export function MiddlePanel() {
  const [activeTab, setActiveTab] = useState('workflow');

  const items = [
    {
      key: 'workflow',
      label: (
        <Space size={4}>
          <UnorderedListOutlined />
          <span>流程</span>
        </Space>
      ),
      children: (
        <div className="h-full overflow-hidden bg-white">
          <WorkflowTree />
        </div>
      ),
    },
    {
      key: 'data',
      label: (
        <Space size={4}>
          <DatabaseOutlined />
          <span>数据</span>
        </Space>
      ),
      children: (
        <Flex align="center" justify="center" className="h-full bg-white">
          <Empty description="数据视图（待实现）" />
        </Flex>
      ),
    },
    {
      key: 'files',
      label: (
        <Space size={4}>
          <FileOutlined />
          <span>文件</span>
        </Space>
      ),
      children: (
        <div className="h-full overflow-hidden bg-white">
          <DocumentList />
        </div>
      ),
    },
  ];

  return (
    <Flex vertical className="h-full bg-gray-50">
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={items}
        className="middle-panel-tabs h-full flex flex-col"
        tabBarStyle={{
          padding: '0 16px',
          marginBottom: 0,
          backgroundColor: '#ffffff',
          flexShrink: 0,
        }}
      />
      <style>{`
        .middle-panel-tabs .ant-tabs-content-holder {
          display: flex;
          flex-direction: column;
          overflow: hidden;
          flex: 1;
        }
        .middle-panel-tabs .ant-tabs-content {
          height: 100%;
        }
        .middle-panel-tabs .ant-tabs-tabpane {
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        .middle-panel-tabs .ant-tabs-tabpane-hidden {
          display: none !important;
        }
      `}</style>
    </Flex>
  );
}
