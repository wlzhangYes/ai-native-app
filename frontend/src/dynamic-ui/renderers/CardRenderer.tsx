import React from 'react';
import { Card, Button, Space } from 'antd';
import type { DynamicUIComponentProps } from '../registry';

/**
 * 卡片操作配置
 */
export interface CardAction {
  label: string;
  type?: 'primary' | 'default' | 'dashed' | 'link' | 'text';
  danger?: boolean;
}

/**
 * 卡片配置
 */
export interface CardConfig {
  title?: string;
  description?: string;
  imageUrl?: string;
  imageAlt?: string;
  actions?: CardAction[];
  extra?: string; // 右上角额外内容（文本）
  bordered?: boolean;
  hoverable?: boolean;
}

/**
 * CardRenderer - 卡片渲染器
 *
 * 根据配置动态渲染信息卡片
 *
 * @example
 * ```tsx
 * const config: CardConfig = {
 *   title: '项目信息',
 *   description: '这是一个 AI 驱动的工作流系统',
 *   imageUrl: 'https://example.com/image.jpg',
 *   actions: [
 *     { label: '查看详情', type: 'primary' },
 *     { label: '编辑', type: 'default' }
 *   ]
 * };
 *
 * <CardRenderer config={config} onEvent={handleEvent} />
 * ```
 */
export const CardRenderer: React.FC<DynamicUIComponentProps> = ({
  config,
  onEvent,
  componentId,
}) => {
  const cardConfig = config as CardConfig;

  // 处理操作按钮点击
  const handleAction = (action: CardAction, index: number) => {
    onEvent?.('action', {
      action: action.label,
      index,
    });
  };

  // 渲染操作按钮
  const renderActions = () => {
    if (!cardConfig.actions || cardConfig.actions.length === 0) {
      return null;
    }

    return (
      <Space className="w-full justify-end mt-4">
        {cardConfig.actions.map((action, index) => (
          <Button
            key={index}
            type={action.type || 'default'}
            danger={action.danger}
            onClick={() => handleAction(action, index)}
          >
            {action.label}
          </Button>
        ))}
      </Space>
    );
  };

  return (
    <Card
      title={cardConfig.title}
      extra={cardConfig.extra}
      bordered={cardConfig.bordered !== false}
      hoverable={cardConfig.hoverable}
      cover={
        cardConfig.imageUrl ? (
          <img
            alt={cardConfig.imageAlt || cardConfig.title || 'Card image'}
            src={cardConfig.imageUrl}
            className="w-full h-48 object-cover"
          />
        ) : undefined
      }
      className="w-full"
      data-component="CardRenderer"
      data-component-id={componentId}
    >
      {cardConfig.description && (
        <p className="text-gray-600 whitespace-pre-wrap">
          {cardConfig.description}
        </p>
      )}
      {renderActions()}
    </Card>
  );
};
