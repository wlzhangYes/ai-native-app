// Default Task UI Component
// 默认的任务详情展示组件，适用于没有特定交互需求的任务

import { Card, Descriptions, Tag } from 'antd';
import type { TaskUIComponentProps } from './TaskUIRegistry';
import { TaskStatus } from '@/types/models';

// 任务状态显示配置
const TASK_STATUS_CONFIG = {
  [TaskStatus.Pending]: { label: '待处理', color: 'default' },
  [TaskStatus.InProgress]: { label: '进行中', color: 'processing' },
  [TaskStatus.Completed]: { label: '已完成', color: 'success' },
  [TaskStatus.Failed]: { label: '失败', color: 'error' },
};

export function DefaultTaskUI({ task, onComplete, onCancel }: TaskUIComponentProps) {
  const statusConfig = TASK_STATUS_CONFIG[task.status];

  return (
    <div
      style={{
        padding: '16px',
        height: '100%',
        overflow: 'auto',
        backgroundColor: '#fff',
      }}
    >
      <Card
        title="任务详情"
        bordered={false}
        style={{ marginBottom: '16px' }}
      >
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="任务名称">
            {task.name}
          </Descriptions.Item>

          {task.description && (
            <Descriptions.Item label="任务描述">
              {task.description}
            </Descriptions.Item>
          )}

          <Descriptions.Item label="任务状态">
            <Tag color={statusConfig.color}>{statusConfig.label}</Tag>
          </Descriptions.Item>

          <Descriptions.Item label="创建时间">
            {new Date(task.createdAt).toLocaleString('zh-CN')}
          </Descriptions.Item>

          {task.completedAt && (
            <Descriptions.Item label="完成时间">
              {new Date(task.completedAt).toLocaleString('zh-CN')}
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      {/* Metadata 展示 (调试用) */}
      {task.metadata && Object.keys(task.metadata).length > 0 && (
        <Card
          title="任务元数据"
          bordered={false}
          size="small"
          style={{ marginBottom: '16px' }}
        >
          <pre style={{ margin: 0, fontSize: '12px', color: 'rgba(0, 0, 0, 0.65)' }}>
            {JSON.stringify(task.metadata, null, 2)}
          </pre>
        </Card>
      )}

      <div
        style={{
          marginTop: '24px',
          padding: '16px',
          backgroundColor: '#f5f5f5',
          borderRadius: '4px',
          color: 'rgba(0, 0, 0, 0.45)',
          fontSize: '13px',
        }}
      >
        <p style={{ margin: 0 }}>
          💡 <strong>提示：</strong>
          此任务使用默认展示组件。如需特定交互界面，可在任务元数据中指定 <code>uiComponentType</code>。
        </p>
      </div>
    </div>
  );
}
