import React, { useEffect } from 'react';
import { SessionProvider } from '../providers';
import { ThreeColumnLayout } from '../../components/layout/ThreeColumnLayout';
import { ChatInterface } from '../../components/dialog/ChatInterface';
import { WorkflowTree } from '../../components/workflow/WorkflowTree';
import { RightPanel } from '../../components/layout/RightPanel';
import { registerAllRenderers } from '../../dynamic-ui/renderers';
import type { DynamicUIComponent } from '../../dynamic-ui';

/**
 * 布局配置
 */
export interface LayoutConfig {
  /** 左侧列宽度比例 */
  leftWidth?: number;
  /** 中间列宽度比例 */
  middleWidth?: number;
  /** 右侧列宽度比例 */
  rightWidth?: number;
  /** 是否显示左侧列 */
  showLeft?: boolean;
  /** 是否显示中间列 */
  showMiddle?: boolean;
  /** 是否显示右侧列 */
  showRight?: boolean;
}

/**
 * AIWorkflowTemplate Props
 */
export interface AIWorkflowTemplateProps {
  /** 当前会话 ID（必填） */
  sessionId: string;
  /** API 基础 URL */
  apiBaseUrl?: string;
  /** LocalStorage 存储键前缀 */
  storageKeyPrefix?: string;
  /** 自定义动态组件（用于扩展） */
  customComponents?: Record<string, DynamicUIComponent>;
  /** 布局配置 */
  layoutConfig?: LayoutConfig;
  /** 会话变化回调 */
  onSessionChange?: (sessionId: string) => void;
}

/**
 * AIWorkflowTemplate - AI 工作流模板组件
 *
 * 封装了完整的 AI 工作流 UI，包括：
 * - 三栏布局（对话 + 工作流 + 预览）
 * - 会话管理（自动隔离数据）
 * - 动态组件系统
 *
 * @example
 * ```tsx
 * <AIWorkflowTemplate
 *   sessionId="project-001"
 *   apiBaseUrl="http://localhost:8000/api"
 *   onSessionChange={(id) => console.log('Session changed:', id)}
 * />
 * ```
 */
export const AIWorkflowTemplate: React.FC<AIWorkflowTemplateProps> = ({
  sessionId,
  apiBaseUrl,
  storageKeyPrefix = 'ai-workflow',
  customComponents,
  layoutConfig,
  onSessionChange,
}) => {
  // 注册所有动态 UI 渲染器（只在组件挂载时执行一次）
  useEffect(() => {
    registerAllRenderers();

    // 如果有自定义组件，也注册它们
    if (customComponents) {
      const { componentRegistry } = require('../../dynamic-ui');
      componentRegistry.registerBatch(customComponents);
      console.log('[AIWorkflowTemplate] Registered custom components:', Object.keys(customComponents));
    }
  }, [customComponents]);

  // 默认布局配置
  const defaultLayoutConfig: LayoutConfig = {
    leftWidth: 3,
    middleWidth: 2,
    rightWidth: 5,
    showLeft: true,
    showMiddle: true,
    showRight: true,
  };

  const finalLayoutConfig = { ...defaultLayoutConfig, ...layoutConfig };

  return (
    <SessionProvider
      sessionId={sessionId}
      storageKeyPrefix={storageKeyPrefix}
      onSessionChange={onSessionChange}
    >
      <ThreeColumnLayout>
        {/* 左侧：对话界面 */}
        {finalLayoutConfig.showLeft && <ChatInterface />}

        {/* 中间：工作流树 */}
        {finalLayoutConfig.showMiddle && <WorkflowTree />}

        {/* 右侧：文档预览 + 执行记录 */}
        {finalLayoutConfig.showRight && <RightPanel />}
      </ThreeColumnLayout>
    </SessionProvider>
  );
};
