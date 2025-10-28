// Task Status Indicator Component - Shows currently executing/paused tasks
// Based on spec.md FR-052: Display task status above input field
// Based on spec.md User Story 6: Task pause/resume functionality

import { Button, Space, Tag, Progress } from 'antd';
import {
  StarFilled,
  LoadingOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
import { useDialogStore } from '@/stores/useDialogStore';
import type { TaskStatus } from '@/types/models';

export interface TaskStatusIndicatorProps {
  onPause?: () => void;
  onResume?: () => void;
}

export function TaskStatusIndicator({ onPause, onResume }: TaskStatusIndicatorProps) {
  const currentTaskStatus = useDialogStore((state) => state.currentTaskStatus);

  // Don't render if no active task
  if (!currentTaskStatus) {
    return null;
  }

  const { taskName, status, progress } = currentTaskStatus;

  // Icon based on status
  const getIcon = (status: TaskStatus) => {
    switch (status) {
      case 'pending':
        return <LoadingOutlined spin style={{ color: '#1890ff' }} />;
      case 'in_progress':
        return <StarFilled style={{ color: '#faad14', animation: 'flash 1s infinite' }} />;
      case 'completed':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'failed':
        return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
      case 'paused':
        return <PauseCircleOutlined style={{ color: '#d9d9d9' }} />;
    }
  };

  // Status text
  const getStatusText = (status: TaskStatus) => {
    switch (status) {
      case 'pending':
        return '等待中';
      case 'in_progress':
        return '执行中';
      case 'completed':
        return '已完成';
      case 'failed':
        return '失败';
      case 'paused':
        return '已暂停';
    }
  };

  // Status tag color
  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'pending':
        return 'blue';
      case 'in_progress':
        return 'processing';
      case 'completed':
        return 'success';
      case 'failed':
        return 'error';
      case 'paused':
        return 'default';
    }
  };

  // Show pause button for executing tasks
  const showPauseButton = status === 'in_progress' || status === 'pending';
  // Show resume button for paused tasks
  const showResumeButton = status === 'paused';

  return (
    <>
      {/* Flashing star animation */}
      <style>
        {`
          @keyframes flash {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.3;
            }
          }
        `}
      </style>

      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #f0f0f0',
          backgroundColor: '#fafafa',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Left: Task status */}
        <Space>
          {getIcon(status)}
          <span style={{ fontWeight: 500, color: 'rgba(0, 0, 0, 0.85)' }}>{taskName}</span>
          <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
        </Space>

        {/* Middle: Progress bar (if available) */}
        {typeof progress === 'number' && (
          <div style={{ flex: 1, marginLeft: '16px', marginRight: '16px', maxWidth: '200px' }}>
            <Progress percent={progress} size="small" showInfo={false} />
          </div>
        )}

        {/* Right: Pause/Resume buttons */}
        <Space>
          {showPauseButton && (
            <Button
              type="text"
              size="small"
              icon={<PauseCircleOutlined />}
              onClick={onPause}
              disabled={!onPause}
            >
              暂停
            </Button>
          )}
          {showResumeButton && (
            <Button
              type="text"
              size="small"
              icon={<PlayCircleOutlined />}
              onClick={onResume}
              disabled={!onResume}
            >
              恢复
            </Button>
          )}
        </Space>
      </div>
    </>
  );
}
