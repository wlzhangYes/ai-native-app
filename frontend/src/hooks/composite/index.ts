/**
 * Composite Layer Hooks
 *
 * 组合层 hooks，整合多个业务 hooks 提供高级功能
 * 依赖：All lower layers (Utility, Infrastructure, Business)
 * 被依赖：Components
 */

export { useChat } from './useChat';
export { useAIWorkflow } from './useAIWorkflow';
