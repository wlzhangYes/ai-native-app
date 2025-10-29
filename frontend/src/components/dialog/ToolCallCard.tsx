// ToolCallCard Component - Displays tool call information
// Based on claude-agent-service ToolCallCard

import { useState } from 'react';
import { Card, Flex, Typography, Tag, Collapse } from 'antd';
import {
  ToolOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
  DownOutlined,
  RightOutlined,
} from '@ant-design/icons';

const { Text, Paragraph } = Typography;

interface ToolCallCardProps {
  toolCall: {
    id: string;
    name: string;
    input?: Record<string, unknown>;
    inputPartial?: string;
    result?: unknown;
    status: 'building' | 'executing' | 'success' | 'failed';
    isError?: boolean;
  };
  defaultExpanded?: boolean; // 是否默认展开
}

export function ToolCallCard({ toolCall, defaultExpanded = false }: ToolCallCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const getStatusIcon = () => {
    switch (toolCall.status) {
      case 'building':
        return <LoadingOutlined spin className="text-orange-500" />;
      case 'executing':
        return <LoadingOutlined spin className="text-blue-500" />;
      case 'success':
        return <CheckCircleOutlined className="text-green-500" />;
      case 'failed':
        return <CloseCircleOutlined className="text-red-500" />;
    }
  };

  const getStatusText = () => {
    switch (toolCall.status) {
      case 'building':
        return '构建参数中...';
      case 'executing':
        return '执行中...';
      case 'success':
        return '完成';
      case 'failed':
        return '失败';
    }
  };

  const getStatusColor = () => {
    switch (toolCall.status) {
      case 'building':
        return 'orange';
      case 'executing':
        return 'blue';
      case 'success':
        return 'success';
      case 'failed':
        return 'error';
    }
  };

  const getBorderColor = () => {
    switch (toolCall.status) {
      case 'building':
        return '#fa8c16';
      case 'executing':
        return '#1890ff';
      case 'success':
        return '#52c41a';
      case 'failed':
        return '#f5222d';
    }
  };

  const displayInput =
    toolCall.status === 'building' && toolCall.inputPartial
      ? toolCall.inputPartial
      : JSON.stringify(toolCall.input, null, 2);

  return (
    <Card
      size="small"
      className="mt-2"
      style={{ borderLeft: `4px solid ${getBorderColor()}` }}
    >
      {/* Header */}
      <Flex justify="space-between" align="start">
        <Flex gap="small" align="center" className="flex-1">
          <ToolOutlined className="text-base" />
          <div className="flex-1">
            <Text strong className="text-sm">
              {toolCall.name}
            </Text>
            <div className="mt-1">
              <Flex gap="small" align="center">
                {getStatusIcon()}
                <Text type="secondary" className="text-xs">
                  {getStatusText()}
                </Text>
              </Flex>
            </div>
          </div>
        </Flex>
        {(toolCall.status === 'success' || toolCall.status === 'failed') && (
          <div
            onClick={() => setIsExpanded(!isExpanded)}
            className="cursor-pointer p-1"
          >
            {isExpanded ? <DownOutlined /> : <RightOutlined />}
          </div>
        )}
      </Flex>

      {/* Input (always visible when building/executing) */}
      {(toolCall.status === 'building' || toolCall.status === 'executing') && (
        <div className="mt-3">
          <Text strong className="text-xs">
            参数:
          </Text>
          <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-[200px] whitespace-pre-wrap break-words">
            {displayInput}
          </pre>
        </div>
      )}

      {/* Expanded Details */}
      {isExpanded && (toolCall.status === 'success' || toolCall.status === 'failed') && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          {/* Input */}
          <div>
            <Text strong className="text-xs">
              输入:
            </Text>
            <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-[150px] whitespace-pre-wrap break-words">
              {displayInput}
            </pre>
          </div>

          {/* Result */}
          {toolCall.result && (
            <div className="mt-3">
              <Text strong className="text-xs">
                {toolCall.isError ? '错误:' : '结果:'}
              </Text>
              <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-[200px] whitespace-pre-wrap break-words">
                {typeof toolCall.result === 'string'
                  ? toolCall.result
                  : JSON.stringify(toolCall.result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
