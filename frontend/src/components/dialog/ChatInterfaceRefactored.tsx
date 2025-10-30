// Chat Interface using Ant Design X + useChat hook
// Refactored to use the composite useChat hook from hooks architecture
// Based on spec.md FR-006 to FR-013: AI dialog with streaming responses

import { useState, useCallback, useRef, useEffect } from 'react';
import { Bubble, Sender, Actions, Attachments, Welcome } from '@ant-design/x';
import { message as antdMessage, Flex, Button, type GetProp } from 'antd';
import { createStyles } from 'antd-style';
import { useChat } from '@/hooks/composite/useChat';
import { useProjectStore } from '@/stores/useProjectStore';
import {
  CopyOutlined,
  RedoOutlined,
  PaperClipOutlined,
  CloudUploadOutlined,
  MenuOutlined,
} from '@ant-design/icons';
import type { AttachmentInfo } from '@/types/models';
import { MessageSender } from '@/types/models';
import type { BubbleDataType } from '@ant-design/x/es/bubble/BubbleList';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { SessionsDrawer } from '../session/SessionsDrawer';

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

export function ChatInterfaceRefactored() {
  const { styles } = useStyle();
  const currentProjectId = useProjectStore((state) => state.currentProjectId);

  // 🌟 使用 useChat 组合 hook（替代直接使用 useDialogStore 和 SSE）
  const {
    messages,
    sendMessage,
    cancelRequest,
    regenerateResponse,
    isStreaming,
  } = useChat({
    sessionId: currentProjectId || '',
    onError: (error) => {
      console.error('[ChatInterface] Error:', error);
    },
  });

  const [inputValue, setInputValue] = useState('');
  const messageListRef = useRef<HTMLDivElement>(null);
  const [attachments, setAttachments] = useState<GetProp<typeof Attachments, 'items'>>([]);
  const [attachmentsOpen, setAttachmentsOpen] = useState(false);
  const [sessionsDrawerOpen, setSessionsDrawerOpen] = useState(false);

  // Auto scroll to bottom when messages change
  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTo({
        top: messageListRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, isStreaming]);

  // Handle attachments change
  const handleAttachmentsChange = useCallback((info: { fileList: GetProp<typeof Attachments, 'items'> }) => {
    setAttachments(info.fileList);
  }, []);

  // Handle send message
  const handleSend = useCallback(
    async (message: string) => {
      if (!message.trim() && attachments.length === 0) return;

      if (!currentProjectId) {
        antdMessage.error('请先选择或创建一个项目');
        return;
      }

      // 转换附件格式
      const attachmentInfos: AttachmentInfo[] = attachments.map((att: any) => ({
        id: att.uid,
        name: att.name,
        size: att.size,
        url: att.url,
        type: att.type,
      }));

      // 🌟 使用 useChat 的 sendMessage（内部处理 SSE、toolCalls 等）
      await sendMessage(message, attachmentInfos);

      // Clear input and attachments
      setInputValue('');
      setAttachments([]);
    },
    [attachments, currentProjectId, sendMessage]
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
        // 🌟 使用 useChat 的 regenerateResponse
        regenerateResponse();
        break;
      }

      default:
        break;
    }
  }, [messages, regenerateResponse]);

  // Convert messages to Bubble.List format
  const bubbleItems: BubbleDataType[] = messages.map((msg) => {
    const hasAttachments = msg.metadata?.attachments && msg.metadata.attachments.length > 0;
    const isStreamingThisMsg = msg.metadata?.isStreaming && isStreaming;

    const baseItem: BubbleDataType = {
      key: msg.id,
      role: msg.sender,
      content: msg.content,
      typing: isStreamingThisMsg,
      loading: isStreamingThisMsg,
    };

    // 如果有附件，添加 messageRender
    if (hasAttachments) {
      baseItem.messageRender = () => (
        <Flex vertical gap="small">
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
          {msg.content && <div>{msg.content}</div>}
        </Flex>
      );
    }

    // 为 AI 消息添加 Markdown 渲染和操作按钮
    if (msg.sender === MessageSender.AI) {
      return {
        ...baseItem,
        typing: isStreamingThisMsg && !msg.content,
        loading: isStreamingThisMsg && !msg.content,
        messageRender: () => (
          <div>
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
          </div>
        ),
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

  // Define role-based styling
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

  return (
    <>
      <SessionsDrawer
        open={sessionsDrawerOpen}
        onClose={() => setSessionsDrawerOpen(false)}
      />

      <Flex vertical className="h-full">
        {/* Top Bar */}
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

        {/* Message List */}
        <div ref={messageListRef} className="flex-1 overflow-auto p-8 px-6 bg-gray-50">
          <Welcome
            variant="borderless"
            icon="https://mdn.alipayobjects.com/huamei_iwk9zp/afts/img/A*s5sNRo5LjfQAAAAAAAAAAAAADgCCAQ/fmt.webp"
            title="你好，我是 AI 产研教练"
            description="基于对话驱动的智能工作流系统，帮助您高效完成产品开发全流程 ~"
          />

          {messages.length > 0 && (
            <div className="mt-4">
              <Bubble.List
                items={bubbleItems}
                roles={roles}
              />
            </div>
          )}
        </div>

        {/* Sender */}
        <Flex
          vertical
          className="p-4 border-t border-gray-200 bg-white"
        >
          <Sender
            value={inputValue}
            onChange={setInputValue}
            onSubmit={handleSend}
            onCancel={cancelRequest}
            placeholder="输入消息 / 语音输入 / 上传文件..."
            loading={isStreaming}
            disabled={isStreaming}
            allowSpeech
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
                  <Button
                    type="text"
                    icon={<PaperClipOutlined />}
                    onClick={() => setAttachmentsOpen(!attachmentsOpen)}
                    className={styles.attachButton}
                    disabled={isStreaming}
                  />
                  <SpeechButton className={styles.speechButton} />
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
