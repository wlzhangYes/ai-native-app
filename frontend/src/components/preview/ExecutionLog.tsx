// ExecutionLog Component - Displays execution logs for workflow stages
// Based on spec.md FR-026: Execution log display
// Updated: Support embedded UI components in execution logs + Tool Calls Display

import { useEffect, useRef } from 'react';
import { Timeline, Empty, Button, Tag, Progress } from 'antd';
import {
  InfoCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
  FileTextOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import { formatDate } from '@/utils/format';
import { useWorkflowStore } from '@/stores/useWorkflowStore';
import { useDocumentStore } from '@/stores/useDocumentStore';
import { useDialogStore } from '@/stores/useDialogStore';
import { getTaskUIComponent } from '../task-ui/TaskUIRegistry';
import { ToolCallCard } from '../dialog/ToolCallCard';
import type { ExecutionLog, ExecutionLogType } from '@/types/models';

export interface ExecutionLogProps {
  stageId?: string;
}

export function ExecutionLog({ stageId }: ExecutionLogProps) {
  const workflow = useWorkflowStore((state) => state.workflow);
  const activeStageId = useWorkflowStore((state) => state.activeStageId);
  const setSelectedDocument = useWorkflowStore((state) => state.setSelectedDocument);

  // Get tool calls from DialogStore
  const toolCalls = useDialogStore((state) => state.toolCalls);
  const isStreaming = useDialogStore((state) => state.isStreaming);

  // Auto-scroll to latest tool
  const containerRef = useRef<HTMLDivElement>(null);
  const lastToolCountRef = useRef(0);

  useEffect(() => {
    // Auto-scroll when new tool is added
    if (toolCalls.length > lastToolCountRef.current && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
    lastToolCountRef.current = toolCalls.length;
  }, [toolCalls.length]);

  // Calculate progress
  const completedCount = toolCalls.filter(tc => tc.status === 'completed' || tc.status === 'failed').length;
  const runningCount = toolCalls.filter(tc => tc.status === 'running').length;
  const totalCount = toolCalls.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Get logs for the specified stage or active stage
  const targetStageId = stageId || activeStageId;
  const stage = workflow?.stages.find((s) => s.id === targetStageId);
  const logs = stage?.executionLogs || [];

  // Get icon and color based on log level
  const getLogIcon = (level: ExecutionLog['level']) => {
    switch (level) {
      case 'info':
        return <InfoCircleOutlined style={{ color: '#1890ff' }} />;
      case 'success':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'warning':
        return <ExclamationCircleOutlined style={{ color: '#faad14' }} />;
      case 'error':
        return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
      default:
        return <InfoCircleOutlined style={{ color: '#1890ff' }} />;
    }
  };

  // Get color for timeline dot
  const getLogColor = (level: ExecutionLog['level']): 'blue' | 'green' | 'red' | 'gray' => {
    switch (level) {
      case 'info':
        return 'blue';
      case 'success':
        return 'green';
      case 'warning':
      case 'error':
        return 'red';
      default:
        return 'gray';
    }
  };

  // Render log content based on log type
  const renderLogContent = (log: ExecutionLog) => {
    switch (log.type) {
      case 'ui_component':
        return renderUIComponent(log);
      case 'document_link':
        return renderDocumentLink(log);
      case 'task_status':
        return renderTaskStatus(log);
      case 'log':
      default:
        return renderTextLog(log);
    }
  };

  // Render plain text log
  const renderTextLog = (log: ExecutionLog) => (
    <div>
      <div style={{ marginBottom: '4px', fontSize: '14px', color: 'rgba(0, 0, 0, 0.85)' }}>
        {log.message}
      </div>
      <div style={{ fontSize: '12px', color: 'rgba(0, 0, 0, 0.45)' }}>
        {formatDate(log.timestamp, { includeTime: true })}
      </div>
    </div>
  );

  // Render embedded UI component
  const renderUIComponent = (log: ExecutionLog) => {
    if (!log.uiComponent) return renderTextLog(log);

    // Find the task associated with this UI component
    const task = workflow?.stages
      .flatMap((s) => s.tasks)
      .find((t) => t.id === log.uiComponent?.taskId);

    if (!task) {
      return (
        <div>
          <div style={{ marginBottom: '8px', fontSize: '14px', color: 'rgba(0, 0, 0, 0.85)' }}>
            {log.message}
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(0, 0, 0, 0.45)', marginBottom: '12px' }}>
            {formatDate(log.timestamp, { includeTime: true })}
          </div>
          <div style={{ fontSize: '12px', color: '#ff4d4f' }}>
            错误：未找到关联任务
          </div>
        </div>
      );
    }

    // Get the UI component for the task
    const TaskUIComponent = getTaskUIComponent(task);

    return (
      <div>
        <div style={{ marginBottom: '8px', fontSize: '14px', color: 'rgba(0, 0, 0, 0.85)' }}>
          {log.message}
        </div>
        <div style={{ fontSize: '12px', color: 'rgba(0, 0, 0, 0.45)', marginBottom: '12px' }}>
          {formatDate(log.timestamp, { includeTime: true })}
        </div>
        {/* Embedded UI Component */}
        <div style={{
          marginTop: '12px',
          padding: '16px',
          backgroundColor: '#fafafa',
          border: '1px solid #d9d9d9',
          borderRadius: '4px'
        }}>
          <TaskUIComponent
            task={task}
            onComplete={(result) => {
              console.log('[ExecutionLog] UI Component completed:', result);
              // TODO: Send result to backend, update task status
            }}
            onCancel={() => {
              console.log('[ExecutionLog] UI Component cancelled');
            }}
          />
        </div>
      </div>
    );
  };

  // Render document link
  const renderDocumentLink = (log: ExecutionLog) => {
    if (!log.documentLink) return renderTextLog(log);

    const handleDocumentClick = () => {
      setSelectedDocument(log.documentLink!.documentId);
    };

    return (
      <div>
        <div style={{ marginBottom: '8px', fontSize: '14px', color: 'rgba(0, 0, 0, 0.85)' }}>
          {log.message}
        </div>
        <div style={{ fontSize: '12px', color: 'rgba(0, 0, 0, 0.45)', marginBottom: '8px' }}>
          {formatDate(log.timestamp, { includeTime: true })}
        </div>
        {/* Document Link Button */}
        <Button
          type="link"
          icon={<FileTextOutlined />}
          onClick={handleDocumentClick}
          style={{ padding: 0, height: 'auto' }}
        >
          {log.documentLink.documentName}
        </Button>
      </div>
    );
  };

  // Render task status update
  const renderTaskStatus = (log: ExecutionLog) => {
    if (!log.taskStatus) return renderTextLog(log);

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'completed':
          return 'success';
        case 'in_progress':
          return 'processing';
        case 'paused':
          return 'warning';
        case 'failed':
          return 'error';
        default:
          return 'default';
      }
    };

    const getStatusText = (status: string) => {
      switch (status) {
        case 'completed':
          return '已完成';
        case 'in_progress':
          return '进行中';
        case 'paused':
          return '已暂停';
        case 'failed':
          return '失败';
        case 'pending':
          return '等待中';
        default:
          return status;
      }
    };

    return (
      <div>
        <div style={{ marginBottom: '8px', fontSize: '14px', color: 'rgba(0, 0, 0, 0.85)' }}>
          {log.message}
        </div>
        <div style={{ fontSize: '12px', color: 'rgba(0, 0, 0, 0.45)', marginBottom: '8px' }}>
          {formatDate(log.timestamp, { includeTime: true })}
        </div>
        {/* Task Status Tag */}
        <Tag color={getStatusColor(log.taskStatus.status)}>
          {log.taskStatus.taskName}: {getStatusText(log.taskStatus.status)}
        </Tag>
      </div>
    );
  };

  // 如果没有选择 stage，显示工具调用记录
  if (!stage) {
    // 如果没有工具调用，显示占位图
    if (toolCalls.length === 0) {
      return (
        <div className="flex items-center justify-center h-full">
          <Empty description="暂无执行记录" />
        </div>
      );
    }

    // 显示工具执行记录
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Progress Header */}
        {isStreaming && totalCount > 0 && (
          <div style={{ padding: '16px 24px', borderBottom: '1px solid #f0f0f0', backgroundColor: '#fafafa' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '14px', color: 'rgba(0, 0, 0, 0.65)' }}>
                {runningCount > 0 ? (
                  <>
                    <LoadingOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
                    正在执行工具... ({completedCount}/{totalCount})
                  </>
                ) : (
                  <>执行完成 ({completedCount}/{totalCount})</>
                )}
              </span>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#1890ff' }}>
                {progressPercent}%
              </span>
            </div>
            <Progress
              percent={progressPercent}
              status={runningCount > 0 ? 'active' : 'success'}
              showInfo={false}
              strokeColor={{ from: '#1890ff', to: '#52c41a' }}
            />
          </div>
        )}

        {/* Tool Cards List with Auto-scroll */}
        <div
          ref={containerRef}
          style={{
            flex: 1,
            padding: '24px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          {toolCalls.map((toolCall) => {
            const isRunning = toolCall.status === 'running';
            return (
              <div
                key={toolCall.id}
                style={{
                  animation: isRunning ? 'pulse 2s ease-in-out infinite' : undefined,
                }}
              >
                <ToolCallCard
                  defaultExpanded={isRunning || toolCall.status === 'completed' || toolCall.status === 'failed'}
                  toolCall={{
                    id: toolCall.id,
                    name: toolCall.name,
                    input: toolCall.input,
                    result: toolCall.result,
                    status: toolCall.status === 'running'
                      ? 'executing'
                      : toolCall.status === 'completed'
                        ? 'success'
                        : 'failed',
                    isError: toolCall.status === 'failed',
                  }}
                />
              </div>
            );
          })}
        </div>

        <style>{`
          @keyframes pulse {
            0%, 100% {
              box-shadow: 0 0 0 0 rgba(24, 144, 255, 0.4);
            }
            50% {
              box-shadow: 0 0 0 8px rgba(24, 144, 255, 0);
            }
          }
        `}</style>
      </div>
    );
  }

  // Sort logs in reverse chronological order (newest first)
  const sortedLogs = logs.length > 0 ? [...logs].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  ) : [];

  return (
    <div style={{ padding: '24px' }}>
      {/* Stage Header */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
          {stage.name} - 执行记录
        </h3>
      </div>

      {/* Timeline */}
      {sortedLogs.length > 0 ? (
        <Timeline
          items={sortedLogs.map((log) => ({
            dot: getLogIcon(log.level),
            color: getLogColor(log.level),
            children: renderLogContent(log),
          }))}
        />
      ) : (
        <Empty description={`${stage.name} 暂无执行记录`} />
      )}

      {/* Tool Calls Section */}
      {toolCalls.length > 0 && (
        <div style={{ marginTop: '32px', borderTop: '1px solid #f0f0f0', paddingTop: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {toolCalls.map((toolCall) => (
              <ToolCallCard
                key={toolCall.id}
                defaultExpanded={true}
                toolCall={{
                  id: toolCall.id,
                  name: toolCall.name,
                  input: toolCall.input,
                  result: toolCall.result,
                  status: toolCall.status === 'running'
                    ? 'executing'
                    : toolCall.status === 'completed'
                      ? 'success'
                      : 'failed',
                  isError: toolCall.status === 'failed',
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
