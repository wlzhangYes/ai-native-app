// Chat Interface using Ant Design X (Official Components)
// Based on spec.md FR-006 to FR-013: AI dialog with streaming responses
// Using Bubble.List (官方推荐) for message display
// 适配 Claude Agent Service API

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Bubble, Sender, Actions, Attachments, Welcome, type GetProp } from '@ant-design/x';
import { message as antdMessage, Flex, Button } from 'antd';
import { createStyles } from 'antd-style';
import { useDialogStore } from '@/stores/useDialogStore';
import { useProjectStore } from '@/stores/useProjectStore';
import {
  CopyOutlined,
  RedoOutlined,
  PaperClipOutlined,
  CloudUploadOutlined,
  MenuOutlined,
} from '@ant-design/icons';
import type { Message, AttachmentInfo } from '@/types/models';
import { MessageSender, MessageType } from '@/types/models';
import type { BubbleDataType } from '@ant-design/x/es/bubble/BubbleList';
import type { ChatStreamEvent } from '@/services/api/chat';
import { SSEConnection } from '@/services/api/sse';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { SessionsDrawer } from '../session/SessionsDrawer';

// Custom attachment type for internal use
interface ChatAttachment {
  id: string;
  name: string;
  status: 'uploading' | 'success' | 'error';
  size?: number;
  url?: string;
  type?: string;
}

// antd-style 样式定义
const useStyle = createStyles(({ token, css }) => ({
  sender: css`
    width: 100%;
    max-width: 800px;
    margin: 0 auto;
  `,
  speechButton: css`
    font-size: 18px;
    color: ${token.colorText} !important;
  `,
  attachButton: css`
    font-size: 18px;
    color: ${token.colorText} !important;
  `,
}));

export function ChatInterface() {
  const { styles } = useStyle();
  const { messages, isStreaming, addMessage, setStreaming, updateMessage, appendToStreamingMessage, loadMessages, addToolCall, updateToolCall, clearToolCalls, toolCalls: storedToolCalls } = useDialogStore();
  const currentProjectId = useProjectStore((state) => state.currentProjectId);
  const [inputValue, setInputValue] = useState('');
  const streamingMessageIdRef = useRef<string | null>(null);
  const sseConnectionRef = useRef<SSEConnection | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const messageListRef = useRef<HTMLDivElement>(null);
  const [attachments, setAttachments] = useState<GetProp<typeof Attachments, 'items'>>([]);
  const [attachmentsOpen, setAttachmentsOpen] = useState(false);
  const welcomeInitializedRef = useRef(false);
  const [toolCalls, setToolCalls] = useState<Array<{
    id: string;
    name: string;
    input?: Record<string, unknown>;
    inputPartial?: string;
    result?: unknown;
    status: 'building' | 'executing' | 'success' | 'failed';
    isError?: boolean;
  }>>([]);
  const [sessionsDrawerOpen, setSessionsDrawerOpen] = useState(false);

  // Load history messages when session changes
  useEffect(() => {
    if (currentProjectId) {
      loadMessages(currentProjectId);
      welcomeInitializedRef.current = true; // Mark as initialized after loading
    }
  }, [currentProjectId, loadMessages]);

  // Auto scroll to bottom when messages change (smooth scrolling)
  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTo({
        top: messageListRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, isStreaming]);

  // Note: Welcome message now rendered using Welcome component instead of a message

  // Handle SSE events from Claude Agent Service
  const handleSSEMessage = useCallback((event: ChatStreamEvent) => {
    const msgId = streamingMessageIdRef.current;

    switch (event.type) {
      case 'connected':
        break;

      case 'text_delta':
        // 实时文本流式输出
        if (msgId && 'content' in event) {
          appendToStreamingMessage(msgId, event.content as string);
        }
        break;

      case 'content_block_start':
        // 内容块开始（文本或工具调用）
        if (event.type === 'content_block_start' && 'tool' in event && event.tool) {
          const toolInfo = event.tool as { id: string; name: string };
          const newToolCall = {
            id: toolInfo.id,
            name: toolInfo.name,
            status: 'building' as const,
          };
          console.log('➕ [ChatInterface] Adding tool call:', newToolCall);
          setToolCalls((prev) => {
            const updated = [...prev, newToolCall];
            console.log('📋 [ChatInterface] Current toolCalls state:', updated);
            return updated;
          });
        }
        break;

      case 'tool_input_delta':
        // 工具输入流式更新
        if ('partial_json' in event) {
          setToolCalls((prev) =>
            prev.map((t, index) =>
              index === prev.length - 1
                ? { ...t, inputPartial: (t.inputPartial || '') + event.partial_json }
                : t
            )
          );
        }
        break;

      case 'tool_use':
        // 工具调用（后端直接发送完整的 tool_use 事件）
        if (event.type === 'tool_use' && 'tool' in event && event.tool) {
          const toolInfo = event.tool as { id: string; name: string; input: Record<string, unknown> };

          console.log('🔧 [ChatInterface] Received tool_use event:', toolInfo);

          // 检查是否已存在（从 content_block_start 添加的）
          setToolCalls((prev) => {
            const existingIndex = prev.findIndex(t => t.id === toolInfo.id);

            if (existingIndex >= 0) {
              // 更新已存在的 tool call
              const updated = prev.map((t) =>
                t.id === toolInfo.id
                  ? { ...t, status: 'executing' as const, input: toolInfo.input, inputPartial: undefined }
                  : t
              );
              console.log('📋 [ChatInterface] Updated existing toolCall:', updated);
              return updated;
            } else {
              // 添加新的 tool call（后端没有发送 content_block_start）
              const newToolCall = {
                id: toolInfo.id,
                name: toolInfo.name,
                input: toolInfo.input,
                status: 'executing' as const,
              };
              const updated = [...prev, newToolCall];
              console.log('📋 [ChatInterface] Added new toolCall:', updated);
              return updated;
            }
          });

          // Save to DialogStore for workflow integration
          addToolCall({
            id: toolInfo.id,
            name: toolInfo.name,
            input: toolInfo.input,
            status: 'running',
          });
        }
        break;

      case 'tool_result':
        // 工具执行结果
        if ('tool_use_id' in event) {
          const toolUseId = event.tool_use_id as string;
          const result = event.content;
          const isError = event.is_error as boolean;

          console.log('✅ [ChatInterface] Received tool_result:', { toolUseId, result, isError });

          // Update local toolCalls state
          setToolCalls((prev) =>
            prev.map((t) =>
              t.id === toolUseId
                ? {
                    ...t,
                    status: (isError ? 'failed' : 'success') as const,
                    result,
                    isError,
                  }
                : t
            )
          );

          // Update DialogStore toolCall with result
          updateToolCall(toolUseId, {
            result,
            status: isError ? 'failed' : 'completed',
          });
        }
        break;

      case 'result':
        // 完成消息 (包含统计信息和最终结果)
        if (event.type === 'result' && 'data' in event && event.data) {
          const resultData = event.data as {
            result?: string;
            total_cost_usd?: number;
          };

          // 将最终结果设置为消息内容
          if (msgId && resultData.result) {
            updateMessage(msgId, {
              content: resultData.result,
            });
          }

        }
        break;

      case 'done':
        // 对话结束
        if (msgId) {
          updateMessage(msgId, {
            metadata: { isStreaming: false },
          });
        }
        setStreaming(false);
        streamingMessageIdRef.current = null;
        setToolCalls([]); // 清空工具调用列表

        // 关闭 SSE 连接
        if (sseConnectionRef.current) {
          sseConnectionRef.current.close();
          sseConnectionRef.current = null;
        }
        break;

      case 'error':
        // 错误消息
        setStreaming(false);
        if (msgId) {
          updateMessage(msgId, {
            metadata: { isStreaming: false },
          });
        }
        streamingMessageIdRef.current = null;

        addMessage({
          id: `error-${Date.now()}`,
          conversationId: currentProjectId || 'default',
          sender: MessageSender.System,
          content: `❌ ${'error' in event ? event.error : '发生错误'}${
            'suggestion' in event && event.suggestion ? `\n建议: ${event.suggestion}` : ''
          }`,
          type: MessageType.Text,
          timestamp: new Date().toISOString(),
        });

        // 关闭 SSE 连接
        if (sseConnectionRef.current) {
          sseConnectionRef.current.close();
          sseConnectionRef.current = null;
        }
        break;

      default:
        break;
    }
  }, [appendToStreamingMessage, updateMessage, setStreaming, addMessage, addToolCall, currentProjectId]);

  // Handle cancel request
  const handleCancel = useCallback(() => {
    // 中止请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // 关闭 SSE 连接
    if (sseConnectionRef.current) {
      sseConnectionRef.current.close();
      sseConnectionRef.current = null;
    }

    // 更新消息状态
    if (streamingMessageIdRef.current) {
      updateMessage(streamingMessageIdRef.current, {
        content: '⚠️ 请求已取消',
        metadata: { isStreaming: false },
      });
      streamingMessageIdRef.current = null;
    }

    setStreaming(false);
    setToolCalls([]);
    antdMessage.info('已取消当前请求');
  }, [updateMessage, setStreaming]);

  // 同步 toolCalls 状态到当前流式消息的 metadata
  useEffect(() => {
    const msgId = streamingMessageIdRef.current;
    console.log('🔍 [ChatInterface] useEffect triggered:', {
      msgId,
      toolCallsLength: toolCalls.length,
      isStreaming,
      condition: msgId && toolCalls.length > 0 && isStreaming,
    });

    if (msgId && toolCalls.length > 0 && isStreaming) {
      console.log('🔧 [ChatInterface] Syncing toolCalls to metadata:', {
        msgId,
        toolCallsCount: toolCalls.length,
        toolCalls: toolCalls.map(t => ({ id: t.id, name: t.name, status: t.status })),
      });

      const toolCallsData = toolCalls.map(t => ({
        id: t.id,
        name: t.name,
        input: t.input || {},
        result: t.result,
        is_error: !!t.isError,
      }));

      updateMessage(msgId, {
        metadata: {
          isStreaming: true,
          toolCalls: toolCallsData,
        },
      });

      console.log('✅ [ChatInterface] Updated metadata with toolCalls');
    }
  }, [toolCalls, isStreaming, updateMessage]);

  // Cleanup SSE connection on unmount
  useEffect(() => {
    return () => {
      if (sseConnectionRef.current) {
        sseConnectionRef.current.close();
        sseConnectionRef.current = null;
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  // Handle file upload (参考 Independent 示例的实现)
  // 使用 Attachments 组件的 onChange 处理
  const handleAttachmentsChange = useCallback((info: { fileList: GetProp<typeof Attachments, 'items'> }) => {
    setAttachments(info.fileList);
  }, []);

  // Handle send message
  const handleSend = useCallback(
    async (message: string) => {
      if (!message.trim() && attachments.length === 0) return;

      // 检查是否有当前项目
      if (!currentProjectId) {
        antdMessage.error('请先选择或创建一个项目');
        return;
      }

      // 清空上一轮的工具调用记录和工作流任务
      clearToolCalls();
      setToolCalls([]);

      // 转换附件格式（从 Attachments.items 到 AttachmentInfo[]）
      const attachmentInfos: AttachmentInfo[] = attachments.map((att) => ({
        id: att.uid,
        name: att.name,
        size: att.size,
        url: att.url,
        type: att.type,
      }));

      // Add user message
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        conversationId: currentProjectId,
        sender: MessageSender.User,
        content: message,
        type: MessageType.Text,
        timestamp: new Date().toISOString(),
        metadata: attachmentInfos.length > 0 ? { attachments: attachmentInfos } : undefined,
      };
      addMessage(userMessage);

      // Add placeholder AI message for streaming
      const aiMessageId = `ai-${Date.now()}`;
      const aiMessage: Message = {
        id: aiMessageId,
        conversationId: currentProjectId,
        sender: MessageSender.AI,
        content: '',
        type: MessageType.Text,
        timestamp: new Date().toISOString(),
        metadata: { isStreaming: true },
      };
      addMessage(aiMessage);
      streamingMessageIdRef.current = aiMessageId;

      // Start streaming
      setStreaming(true);

      // 构建 POST 请求体
      const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
      const url = `${baseURL}/chat/stream`;
      const requestBody = {
        session_id: currentProjectId,
        message: message,
        permission_mode: 'acceptEdits',
      };

      // 创建 AbortController 用于中止请求
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      // 创建并连接 SSE（使用 POST 方法）
      const connection = new SSEConnection({
        url: url,
        method: 'POST',
        body: requestBody,
        onMessage: handleSSEMessage,
        onError: (error) => {
          if (streamingMessageIdRef.current) {
            updateMessage(streamingMessageIdRef.current, {
              metadata: { isStreaming: false },
            });
          }
          setStreaming(false);
          streamingMessageIdRef.current = null;
          abortControllerRef.current = null;

          addMessage({
            id: `error-${Date.now()}`,
            conversationId: currentProjectId,
            sender: MessageSender.System,
            content: '❌ 连接失败，请重试',
            type: MessageType.Text,
            timestamp: new Date().toISOString(),
          });
        },
        onOpen: () => {},
      });

      connection.connect();
      sseConnectionRef.current = connection;

      // Clear input and attachments
      setInputValue('');
      setAttachments([]);
    },
    [
      addMessage,
      setStreaming,
      attachments,
      currentProjectId,
      handleSSEMessage,
      updateMessage,
      clearToolCalls,
    ]
  );

  // Handle message actions (copy, regenerate)
  const handleMessageAction = useCallback((actionKey: string, messageId: string) => {
    switch (actionKey) {
      case 'copy': {
        const msg = messages.find(m => m.id === messageId);
        if (msg) {
          navigator.clipboard.writeText(msg.content);
          antdMessage.success('已复制到剪贴板');
        }
        break;
      }

      case 'regenerate': {
        // 找到用户的上一条消息
        const msgIndex = messages.findIndex(m => m.id === messageId);
        if (msgIndex > 0) {
          const previousUserMsg = messages[msgIndex - 1];
          if (previousUserMsg.sender === MessageSender.User) {
            // 删除当前 AI 回复
            // TODO: 实现删除消息功能
            // 重新发送用户消息
            handleSend(previousUserMsg.content);
            antdMessage.info('正在重新生成...');
          }
        }
        break;
      }

      default:
        break;
    }
  }, [messages, handleSend]);

  // Convert messages to Bubble.List format (官方推荐的简洁格式)
  // 注意：不使用 useMemo，因为 Zustand + Immer 修改 message.metadata 不会改变 messages 引用
  const bubbleItems: BubbleDataType[] = messages.map((msg) => {
    const hasAttachments = msg.metadata?.attachments && msg.metadata.attachments.length > 0;

    const isStreamingThisMsg = msg.metadata?.isStreaming && isStreaming && msg.id === streamingMessageIdRef.current;

    const baseItem: BubbleDataType = {
      key: msg.id,
      role: msg.sender,
      content: msg.content,
      typing: isStreamingThisMsg,
      loading: isStreamingThisMsg,
    };

    // 如果是欢迎消息，直接显示内容（不使用 Welcome 组件的标题）
    // 已移除 Welcome 组件的 title，让欢迎消息像普通消息一样显示

    // 如果有附件，添加 messageRender
    if (hasAttachments) {
      baseItem.messageRender = () => (
        <Flex vertical gap="small">
          {/* 显示附件列表 */}
          {msg.metadata!.attachments!.map((attachment) => (
            <Attachments.FileCard
              key={attachment.id}
              item={{
                uid: attachment.id,
                name: attachment.name,
                size: attachment.size,
                status: 'done',
              }}
            />
          ))}
          {/* 显示文本内容 */}
          {msg.content && <div>{msg.content}</div>}
        </Flex>
      );
    }

    // 为 AI 消息添加 Markdown 渲染、操作按钮和工具调用显示
    if (msg.sender === MessageSender.AI) {
      const isStreamingThisMsg = msg.metadata?.isStreaming && isStreaming && msg.id === streamingMessageIdRef.current;
      // 统一从 msg.metadata.toolCalls 获取工具调用信息（包括流式和历史）
      const msgToolCalls = msg.metadata?.toolCalls || [];

      console.log('🎨 [ChatInterface] Rendering AI message:', {
        msgId: msg.id,
        isStreamingThisMsg,
        metadataToolCalls: msg.metadata?.toolCalls,
        msgToolCallsLength: msgToolCalls.length,
        willRenderToolCards: msgToolCalls.length > 0,
      });

      return {
        ...baseItem,
        // 控制 typing/loading：没有内容时显示 loading
        typing: isStreamingThisMsg && !msg.content,
        loading: isStreamingThisMsg && !msg.content,
        // 使用 Markdown 渲染 AI 消息内容 + Tool Calls
        messageRender: () => (
          <div>
            {/* Markdown 内容 */}
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
              code({ inline, className, children, ...props }: any) {
                return !inline ? (
                  <pre className="bg-gray-100 p-3 rounded overflow-x-auto text-[13px] my-2 max-w-[90%] box-border whitespace-pre">
                    <code className={className} {...props}>
                      {children}
                    </code>
                  </pre>
                ) : (
                  <code className="bg-gray-100 px-1.5 py-0.5 rounded text-[13px]" {...props}>
                    {children}
                  </code>
                );
              },
              p: ({ children, node }) => {
                // 检查子元素中是否包含 code 标签（代码块），如果是则用 div 避免 <p> 嵌套 <pre> 错误
                const hasCodeBlock = node?.children?.some(
                  (child) => (child as { tagName?: string }).tagName === 'code'
                );
                return hasCodeBlock ? (
                  <div className="my-2 leading-relaxed">{children}</div>
                ) : (
                  <p className="my-2 leading-relaxed">{children}</p>
                );
              },
              h1: ({ children }) => (
                <h1 className="text-xl font-semibold mt-4 mb-2">{children}</h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-lg font-semibold mt-3.5 mb-2">{children}</h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-base font-semibold mt-3 mb-2">{children}</h3>
              ),
              ul: ({ children }) => <ul className="pl-6 my-2">{children}</ul>,
              ol: ({ children }) => <ol className="pl-6 my-2">{children}</ol>,
              li: ({ children }) => <li className="mb-1">{children}</li>,
              blockquote: ({ children }) => (
                <blockquote className="my-2 py-2 px-3 border-l-4 border-blue-500 bg-blue-50">
                  {children}
                </blockquote>
              ),
              a: ({ children, href }) => (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500"
                >
                  {children}
                </a>
              ),
              strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
            }}
          >
            {msg.content}
          </ReactMarkdown>

            {/* Tool Calls 已移至右侧"执行记录"Tab，此处不再显示 */}
          </div>
        ),
        // Footer 显示操作按钮
        ...(!isStreamingThisMsg && msg.content
          ? {
              footer: (
                <Actions
                  items={[
                    {
                      key: 'copy',
                      label: '复制',
                      icon: <CopyOutlined />,
                      onItemClick: () => handleMessageAction('copy', msg.id),
                    },
                    {
                      key: 'regenerate',
                      label: '重新生成',
                      icon: <RedoOutlined />,
                      onItemClick: () => handleMessageAction('regenerate', msg.id),
                    },
                  ]}
                />
              ),
            }
          : {}),
      };
    }

    return baseItem;
  });

  // Define role-based styling (参考官方 demo)
  const roles = {
    user: {
      placement: 'end' as const,
      variant: 'filled' as const,
      shape: 'corner' as const,
      styles: {
        content: {
          maxWidth: 600,
          backgroundColor: '#f5f5f5',
          color: '#000000d9',
          minHeight: 'auto',
        },
      },
    },
    ai: {
      placement: 'start' as const,
      variant: 'outlined' as const,
      styles: {
        content: {
          maxWidth: 600,
          backgroundColor: 'transparent',
          border: 'none',
          boxShadow: 'none',
          padding: 0,
          minHeight: 'auto',
        },
      },
    },
    system: {
      placement: 'start' as const,
      variant: 'outlined' as const,
      styles: {
        content: {
          maxWidth: 600,
          backgroundColor: '#fef3c7',
          border: '1px solid #fde68a',
          minHeight: 'auto',
        },
      },
    },
  };
  console.log('messages111111', messages);
  return (
    <>
      {/* Sessions Drawer */}
      <SessionsDrawer
        open={sessionsDrawerOpen}
        onClose={() => setSessionsDrawerOpen(false)}
      />

      <Flex vertical className="h-full">
        {/* Top Bar - Hamburger Menu */}
        <Flex
          align="center"
          className="px-4 py-3 border-b border-gray-200 bg-white"
        >
          <Button
            type="text"
            icon={<MenuOutlined className="text-xl" />}
            onClick={() => setSessionsDrawerOpen(true)}
            className="mr-3"
          />
          <span className="text-base font-medium text-gray-800">
            AI 对话
          </span>
        </Flex>

        {/* Message List - Scrollable */}
        <div ref={messageListRef} className="flex-1 overflow-auto p-8 px-6 bg-gray-50">
          {/* 🌟 Welcome 欢迎页 - 始终显示在顶部 */}
          <Welcome
            variant="borderless"
            icon="https://mdn.alipayobjects.com/huamei_iwk9zp/afts/img/A*s5sNRo5LjfQAAAAAAAAAAAAADgCCAQ/fmt.webp"
            title="你好，我是 AI 产研教练"
            description="基于对话驱动的智能工作流系统，帮助您高效完成产品开发全流程 ~"
          />

          {/* 消息列表 */}
          {messages.length > 0 && (
            <div className="mt-4">
              <Bubble.List
                items={bubbleItems}
                roles={roles}
              />
            </div>
          )}
        </div>

      {/* Sender - Fixed at bottom */}
      <Flex
        vertical
        className="p-4 border-t border-gray-200 bg-white"
      >
        {/* 🌟 Sender with Header for Attachments */}
        <Sender
          value={inputValue}
          onChange={setInputValue}
          onSubmit={handleSend}
          onCancel={handleCancel}
          placeholder="输入消息 / 语音输入 / 上传文件..."
          loading={isStreaming}
          disabled={isStreaming}
          allowSpeech  // 启用语音输入
          className={styles.sender}
          header={
            <Sender.Header
              title="上传文件"
              open={attachmentsOpen}
              onOpenChange={setAttachmentsOpen}
              styles={{ content: { padding: 0 } }}
            >
              <Attachments
                beforeUpload={() => false}
                items={attachments}
                onChange={handleAttachmentsChange}
                placeholder={(type) =>
                  type === 'drop'
                    ? { title: '拖拽文件到这里' }
                    : {
                        icon: <CloudUploadOutlined />,
                        title: '上传文件',
                        description: '点击或拖拽文件到此区域上传',
                      }
                }
              />
            </Sender.Header>
          }
          actions={(_, info) => {
            const { SendButton, LoadingButton, SpeechButton } = info.components;
            return (
              <Flex gap={4}>
                {/* 附件按钮 */}
                <Button
                  type="text"
                  icon={<PaperClipOutlined />}
                  onClick={() => setAttachmentsOpen(!attachmentsOpen)}
                  className={styles.attachButton}
                  disabled={isStreaming}
                />

                {/* 语音按钮 */}
                <SpeechButton className={styles.speechButton} />

                {/* 发送/取消按钮 */}
                {isStreaming ? (
                  <LoadingButton type="default" />
                ) : (
                  <SendButton type="primary" />
                )}
              </Flex>
            );
          }}
        />
      </Flex>
    </Flex>
    </>
  );
}
