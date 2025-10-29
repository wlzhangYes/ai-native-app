/**
 * Infrastructure Layer Hooks
 *
 * 基础设施层 hooks，处理网络请求、存储、通信等
 * 依赖：Utility Layer
 * 被依赖：Business Layer, Composite Layer
 */

export { useSSE } from './useSSE';
export { useApiClient, apiClient } from './useApiClient';
export { useSession } from './useSession';
export { useLocalStorage } from './useLocalStorage';
