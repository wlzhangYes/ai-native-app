// Mock data for Conversations
// Based on data-model.md conversation structure

import type { Conversation, Message } from '@/types/models';
import { MessageSender, MessageType } from '@/types/models';

export const mockConversations: Conversation[] = [
  {
    id: 'conv-001',
    projectId: 'proj-001',
    stageId: 'stage-2-001',
    messages: [
      {
        id: 'msg-user-001',
        conversationId: 'conv-001',
        sender: MessageSender.User,
        content: '你好，我想实现一个用户登录功能',
        type: MessageType.Text,
        timestamp: '2025-10-20T09:00:00Z',
      },
      {
        id: 'msg-ai-001',
        conversationId: 'conv-001',
        sender: MessageSender.AI,
        content: '你好！我会帮助你完成用户登录功能的开发。让我们从项目初始化开始。\n\n首先，请告诉我：\n1. 这个登录功能是为什么类型的应用开发？\n2. 是否需要集成现有的身份认证系统（如 IAM SSO）？\n3. 是否支持多租户？',
        type: MessageType.Text,
        timestamp: '2025-10-20T09:00:15Z',
      },
      {
        id: 'msg-user-002',
        conversationId: 'conv-001',
        sender: MessageSender.User,
        content: '这是一个企业内部管理系统，需要集成 IAM SSO，支持多租户和权限管理',
        type: MessageType.Text,
        timestamp: '2025-10-20T09:02:00Z',
      },
      {
        id: 'msg-ai-002',
        conversationId: 'conv-001',
        sender: MessageSender.AI,
        content: '明白了！我已经记录下项目信息。\n\n接下来我们进入需求澄清阶段。我有几个问题：\n\n1. **认证流程**：是否需要支持单点登录（SSO）？\n2. **权限级别**：需要哪些权限角色（如Owner, Editor, Viewer）？\n3. **会话管理**：Token过期后如何处理？',
        type: MessageType.Text,
        timestamp: '2025-10-20T09:02:30Z',
      },
      {
        id: 'msg-user-003',
        conversationId: 'conv-001',
        sender: MessageSender.User,
        content: '1. 是的，需要支持 SSO\n2. 需要 Owner, Editor, Viewer 三种角色\n3. Token 过期后自动刷新，刷新失败则跳转登录页',
        type: MessageType.Text,
        timestamp: '2025-10-20T09:05:00Z',
      },
      {
        id: 'msg-system-001',
        conversationId: 'conv-001',
        sender: MessageSender.System,
        content: '✓ 需求澄清阶段完成\n\n正在生成功能规格说明...',
        type: MessageType.SystemNotification,
        timestamp: '2025-10-20T09:10:00Z',
      },
      {
        id: 'msg-ai-003',
        conversationId: 'conv-001',
        sender: MessageSender.AI,
        content: '好的！需求澄清已完成。现在我开始生成功能规格说明（spec.md）。\n\n我会包含以下内容：\n- 用户故事和验收标准\n- IAM SSO 集成流程\n- 权限管理设计\n- Token 刷新机制\n\n预计需要 2-3 分钟，请稍候...',
        type: MessageType.Text,
        timestamp: '2025-10-20T09:10:05Z',
        metadata: {
          relatedTaskId: 'task-003',
        },
      },
    ],
    createdAt: '2025-10-20T09:00:00Z',
    updatedAt: '2025-10-24T16:45:00Z',
  },
];

// Factory function
export function createMockMessage(
  conversationId: string,
  sender: MessageSender,
  content: string,
  type: MessageType = MessageType.Text
): Message {
  return {
    id: `msg-${sender}-${Date.now()}`,
    conversationId,
    sender,
    content,
    type,
    timestamp: new Date().toISOString(),
  };
}

export function createMockConversation(projectId: string, stageId: string): Conversation {
  return {
    id: `conv-${Date.now()}`,
    projectId,
    stageId,
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
