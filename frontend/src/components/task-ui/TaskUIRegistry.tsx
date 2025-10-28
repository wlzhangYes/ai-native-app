// Task UI Component Registry
// 任务特定交互组件的注册系统，支持可扩展的任务UI类型

import type { Task } from '@/types/models';

// ============================================================================
// Task UI 组件类型定义
// ============================================================================

/**
 * 任务UI组件类型枚举
 * 新增任务UI类型时，在这里添加新的类型
 */
export type TaskUIType =
  | 'template-selection'    // 模板选择（如宪章模板）
  | 'file-upload'          // 文件上传
  | 'confirmation'         // 确认对话框
  | 'form-input'           // 表单输入
  | 'code-review'          // 代码审查
  | 'approval'             // 审批流程
  | 'default';             // 默认任务详情展示

/**
 * Task UI 组件的通用 Props 接口
 */
export interface TaskUIComponentProps {
  task: Task;
  onComplete?: (result?: any) => void;
  onCancel?: () => void;
}

/**
 * Task UI 组件构造函数类型
 */
export type TaskUIComponent = React.ComponentType<TaskUIComponentProps>;

// ============================================================================
// 组件注册表
// ============================================================================

/**
 * 全局任务UI组件注册表
 *
 * 使用方式：
 * 1. 在这里导入新的组件
 * 2. 在 TASK_UI_REGISTRY 中注册组件映射
 */
import { TemplateSelectionUI } from './TemplateSelectionUI';
import { DefaultTaskUI } from './DefaultTaskUI';
// import { FileUploadUI } from './FileUploadUI'; // 未来扩展
// import { ConfirmationUI } from './ConfirmationUI'; // 未来扩展

/**
 * 任务UI组件注册表
 * 映射关系：TaskUIType -> React Component
 */
export const TASK_UI_REGISTRY: Record<TaskUIType, TaskUIComponent> = {
  'template-selection': TemplateSelectionUI,
  'file-upload': DefaultTaskUI,        // TODO: 未来替换为 FileUploadUI
  'confirmation': DefaultTaskUI,       // TODO: 未来替换为 ConfirmationUI
  'form-input': DefaultTaskUI,         // TODO: 未来替换为 FormInputUI
  'code-review': DefaultTaskUI,        // TODO: 未来替换为 CodeReviewUI
  'approval': DefaultTaskUI,           // TODO: 未来替换为 ApprovalUI
  'default': DefaultTaskUI,
};

// ============================================================================
// UI 类型推断逻辑
// ============================================================================

/**
 * 根据任务信息智能推断需要的UI组件类型
 *
 * 优先级：
 * 1. 任务元数据中明确指定的 uiComponentType
 * 2. 基于任务名称的规则匹配
 * 3. 默认返回 'default' 类型
 *
 * @param task - 任务对象
 * @returns UI组件类型
 */
export function inferTaskUIType(task: Task): TaskUIType {
  // 1. 优先使用任务元数据中明确指定的类型
  if (task.metadata?.uiComponentType) {
    return task.metadata.uiComponentType as TaskUIType;
  }

  // 2. 基于任务名称的智能推断规则
  const taskName = task.name.toLowerCase();

  // 模板选择相关任务
  if (
    taskName.includes('模板') ||
    taskName.includes('宪章') ||
    taskName.includes('template')
  ) {
    return 'template-selection';
  }

  // 文件上传相关任务
  if (
    taskName.includes('上传') ||
    taskName.includes('upload') ||
    taskName.includes('附件')
  ) {
    return 'file-upload';
  }

  // 确认相关任务
  if (
    taskName.includes('确认') ||
    taskName.includes('confirm') ||
    taskName.includes('验证')
  ) {
    return 'confirmation';
  }

  // 审批相关任务
  if (
    taskName.includes('审批') ||
    taskName.includes('approval') ||
    taskName.includes('审核')
  ) {
    return 'approval';
  }

  // 3. 默认类型
  return 'default';
}

/**
 * 获取任务对应的UI组件
 *
 * @param task - 任务对象
 * @returns React 组件
 */
export function getTaskUIComponent(task: Task): TaskUIComponent {
  const uiType = inferTaskUIType(task);
  return TASK_UI_REGISTRY[uiType] || TASK_UI_REGISTRY['default'];
}
