import React, { useCallback } from 'react';
import { Alert } from 'antd';
import { componentRegistry } from './ComponentRegistry';
import { eventBus } from '../event-bus';

/**
 * SSE UI 组件事件
 */
export interface UIComponentEvent {
  /** 事件 ID */
  id: string;
  /** 组件类型（必须在 ComponentRegistry 中注册） */
  component: string;
  /** 组件配置 Props */
  props: Record<string, any>;
  /** 会话 ID */
  sessionId?: string;
}

/**
 * DynamicUIRenderer Props
 */
export interface DynamicUIRendererProps {
  /** UI 组件事件 */
  event: UIComponentEvent;
  /** 自定义事件处理（可选，不提供则使用 EventBus） */
  onEvent?: (componentId: string, eventName: string, data?: any) => void;
}

/**
 * DynamicUIRenderer - 动态 UI 渲染器
 *
 * 根据 SSE 事件动态渲染注册的组件
 *
 * @example
 * ```tsx
 * const event: UIComponentEvent = {
 *   id: 'ui-001',
 *   component: 'Form',
 *   props: {
 *     title: '填写项目信息',
 *     fields: [...]
 *   }
 * };
 *
 * <DynamicUIRenderer event={event} />
 * ```
 */
export const DynamicUIRenderer: React.FC<DynamicUIRendererProps> = ({
  event,
  onEvent,
}) => {
  const { id, component, props, sessionId } = event;

  // 获取注册的组件
  const Component = componentRegistry.get(component);

  // 事件处理
  const handleEvent = useCallback(
    (eventName: string, data?: any) => {
      // 使用自定义处理器或 EventBus
      if (onEvent) {
        onEvent(id, eventName, data);
      } else {
        // 通过 EventBus 广播事件
        eventBus.emit(`ui-component:${id}:${eventName}`, {
          componentId: id,
          eventName,
          data,
          sessionId,
        });

        // 也广播通用事件
        eventBus.emit(`ui-component:${eventName}`, {
          componentId: id,
          component,
          data,
          sessionId,
        });
      }
    },
    [id, component, sessionId, onEvent]
  );

  // 组件未注册
  if (!Component) {
    return (
      <Alert
        message="组件未注册"
        description={`未找到名为 "${component}" 的组件。请确保已通过 componentRegistry.register() 注册该组件。`}
        type="warning"
        showIcon
        className="my-4"
      />
    );
  }

  // 渲染组件
  return (
    <div data-component-id={id} data-component-type={component} className="my-4">
      <Component
        config={props}
        onEvent={handleEvent}
        sessionId={sessionId}
        componentId={id}
      />
    </div>
  );
};
