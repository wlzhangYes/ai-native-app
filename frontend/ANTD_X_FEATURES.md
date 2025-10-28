# Ant Design X 核心功能使用指南

## 1. Attachments（附件上传）

### 功能说明
`Attachments` 组件用于文件上传和展示，支持拖拽上传、预览、删除等操作。

### API 接口
```typescript
import { Attachments } from '@ant-design/x';

interface AttachmentsProps {
  items?: Attachment[];        // 附件列表
  disabled?: boolean;          // 是否禁用
  placeholder?: PlaceholderType; // 占位符
  onChange?: (items: Attachment[]) => void;
  onRemove?: (file: Attachment) => void;
  beforeUpload?: (file: File) => boolean | Promise<File>;
}

interface Attachment {
  uid: string;
  name: string;
  status?: 'uploading' | 'done' | 'error';
  url?: string;
  thumbUrl?: string;
  description?: React.ReactNode; // 自定义描述
}
```

### 使用示例
```tsx
import { Attachments } from '@ant-design/x';
import { useState } from 'react';

function ChatWithAttachments() {
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  const handleChange = (info: any) => {
    const newFileList = [...info.fileList];
    setAttachments(newFileList);
  };

  const handleRemove = (file: Attachment) => {
    setAttachments(attachments.filter(f => f.uid !== file.uid));
  };

  return (
    <Attachments
      items={attachments}
      onChange={handleChange}
      onRemove={handleRemove}
      placeholder="点击或拖拽上传文件"
      beforeUpload={(file) => {
        // 验证文件大小、类型等
        if (file.size > 10 * 1024 * 1024) {
          message.error('文件大小不能超过 10MB');
          return false;
        }
        return true;
      }}
    />
  );
}
```

### 集成到 Sender
```tsx
<Sender
  prefix={
    <Attachments
      items={attachments}
      onChange={handleAttachmentsChange}
    />
  }
  onSubmit={handleSend}
/>
```

---

## 2. 语音输入（Speech Input）

### 功能说明
`Sender` 组件内置语音输入功能，通过 Web Speech API 实现语音转文字。

### API 接口
```typescript
interface SenderProps {
  allowSpeech?: boolean | ControlledSpeechConfig;
}

interface ControlledSpeechConfig {
  recording?: boolean;              // 是否正在录音（受控）
  onRecordingChange: (recording: boolean) => void;
}
```

### 使用示例

#### 简单模式（非受控）
```tsx
import { Sender } from '@ant-design/x';

function ChatWithSpeech() {
  const [message, setMessage] = useState('');

  return (
    <Sender
      value={message}
      onChange={setMessage}
      onSubmit={handleSend}
      allowSpeech={true}  // ✅ 启用语音输入
      placeholder="输入消息或点击麦克风说话..."
    />
  );
}
```

#### 受控模式（高级）
```tsx
function ChatWithControlledSpeech() {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  return (
    <Sender
      value={message}
      onChange={setMessage}
      onSubmit={handleSend}
      allowSpeech={{
        recording: isRecording,
        onRecordingChange: setIsRecording, // 监听录音状态
      }}
      placeholder={
        isRecording
          ? "正在录音，请说话..."
          : "输入消息或点击麦克风说话..."
      }
    />
  );
}
```

### 浏览器兼容性
- Chrome/Edge: ✅ 完全支持
- Safari: ✅ 支持（需 HTTPS）
- Firefox: ⚠️ 部分支持
- 需要用户授权麦克风权限

---

## 3. Actions（操作列表）

### 功能说明
`Actions` 组件用于展示可操作的按钮列表，常用于消息气泡下方的快捷操作。

### API 接口
```typescript
import { Actions } from '@ant-design/x';

interface ActionsProps {
  items: ActionItem[];     // 操作项列表
  block?: boolean;         // 是否占满一行
  variant?: 'borderless' | 'border'; // 样式变体
  onClick?: (info: ClickInfo) => void;
}

interface ActionItem {
  key: string;             // 唯一标识
  label?: string;          // 显示文本
  icon?: ReactNode;        // 图标
  children?: ActionItem[]; // 子菜单
  danger?: boolean;        // 危险操作（红色）
  onItemClick?: (info?: ActionItem) => void;
}
```

### 使用示例

#### 基础用法
```tsx
import { Actions } from '@ant-design/x';
import {
  CopyOutlined,
  RedoOutlined,
  DeleteOutlined
} from '@ant-design/icons';

function MessageActions() {
  const actionItems = [
    {
      key: 'copy',
      label: '复制',
      icon: <CopyOutlined />,
      onItemClick: () => {
        // 复制消息内容
        navigator.clipboard.writeText(messageContent);
      },
    },
    {
      key: 'regenerate',
      label: '重新生成',
      icon: <RedoOutlined />,
      onItemClick: () => {
        // 重新请求 AI 生成
        regenerateResponse();
      },
    },
    {
      key: 'delete',
      label: '删除',
      icon: <DeleteOutlined />,
      danger: true, // ⚠️ 危险操作，显示为红色
      onItemClick: () => {
        deleteMessage();
      },
    },
  ];

  return <Actions items={actionItems} />;
}
```

#### 集成到 Bubble（消息气泡）
```tsx
import { Bubble } from '@ant-design/x';

function MessageWithActions({ message }) {
  const actionItems = [
    { key: 'copy', label: '复制', icon: <CopyOutlined /> },
    { key: 'like', label: '点赞', icon: <LikeOutlined /> },
  ];

  return (
    <Bubble
      content={message.content}
      footer={<Actions items={actionItems} />} // ✅ 放在 footer
    />
  );
}
```

#### 带子菜单的高级用法
```tsx
const advancedActions = [
  {
    key: 'export',
    label: '导出',
    icon: <ExportOutlined />,
    children: [  // 📁 子菜单
      { key: 'export-md', label: '导出为 Markdown' },
      { key: 'export-pdf', label: '导出为 PDF' },
      { key: 'export-docx', label: '导出为 Word' },
    ],
  },
  {
    key: 'share',
    label: '分享',
    icon: <ShareAltOutlined />,
    children: [
      { key: 'share-feishu', label: '分享到飞书' },
      { key: 'share-wechat', label: '分享到微信' },
    ],
  },
];

<Actions
  items={advancedActions}
  onClick={({ key }) => {
    console.log('Clicked:', key);
  }}
/>
```

---

## 完整集成示例

### 将三个功能整合到一个聊天界面

```tsx
import { useState } from 'react';
import { Bubble, Sender, Actions, Attachments } from '@ant-design/x';
import {
  CopyOutlined,
  RedoOutlined,
  LikeOutlined
} from '@ant-design/icons';

function AdvancedChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isRecording, setIsRecording] = useState(false);

  const handleSend = (text: string) => {
    if (!text.trim() && attachments.length === 0) return;

    // 发送消息（带附件）
    sendMessage({
      content: text,
      attachments: attachments.map(a => a.url),
    });

    // 清空输入
    setInputValue('');
    setAttachments([]);
  };

  // 消息操作按钮
  const getMessageActions = (msgId: string) => [
    {
      key: 'copy',
      label: '复制',
      icon: <CopyOutlined />,
      onItemClick: () => copyMessage(msgId),
    },
    {
      key: 'regenerate',
      label: '重新生成',
      icon: <RedoOutlined />,
      onItemClick: () => regenerateMessage(msgId),
    },
    {
      key: 'like',
      label: '点赞',
      icon: <LikeOutlined />,
      onItemClick: () => likeMessage(msgId),
    },
  ];

  return (
    <div className="chat-container">
      {/* 消息列表 */}
      <div className="messages">
        {messages.map((msg) => (
          <Bubble
            key={msg.id}
            content={msg.content}
            placement={msg.sender === 'user' ? 'end' : 'start'}
            footer={
              msg.sender === 'ai' && (
                <Actions items={getMessageActions(msg.id)} />
              )
            }
          />
        ))}
      </div>

      {/* 输入区域 */}
      <Sender
        value={inputValue}
        onChange={setInputValue}
        onSubmit={handleSend}
        // ✅ 启用语音输入
        allowSpeech={{
          recording: isRecording,
          onRecordingChange: setIsRecording,
        }}
        // ✅ 添加附件上传
        prefix={
          <Attachments
            items={attachments}
            onChange={(info) => setAttachments(info.fileList)}
            onRemove={(file) =>
              setAttachments(attachments.filter(f => f.uid !== file.uid))
            }
          />
        }
        placeholder={
          isRecording
            ? "🎤 正在录音..."
            : "输入消息、上传文件或语音输入..."
        }
      />
    </div>
  );
}
```

---

## 与当前项目集成建议

### 1. 在 ChatInterface.tsx 中添加语音输入
```tsx
// src/components/dialog/ChatInterface.tsx
<Sender
  value={inputValue}
  onChange={setInputValue}
  onSubmit={handleSend}
  placeholder="输入消息..."
  loading={isStreaming}
  disabled={isStreaming}
  allowSpeech={true}  // ⭐ 添加这一行启用语音输入
/>
```

### 2. 为 AI 消息添加操作按钮
```tsx
const bubbleItems: BubbleDataType[] = messages.map((msg) => ({
  key: msg.id,
  role: msg.sender,
  content: msg.content,
  typing: msg.metadata?.isStreaming && isStreaming,
  // ⭐ 为 AI 消息添加操作按钮
  footer: msg.sender === 'ai' ? (
    <Actions
      items={[
        { key: 'copy', label: '复制', icon: <CopyOutlined /> },
        { key: 'regenerate', label: '重新生成', icon: <RedoOutlined /> },
      ]}
      onClick={({ key }) => handleMessageAction(key, msg.id)}
    />
  ) : undefined,
}));
```

### 3. 添加附件上传（可选）
如果需要支持文件上传，可以在 Sender 的 prefix 中添加 Attachments 组件。

---

## 参考资源

- [Ant Design X 官方文档](https://x.ant.design)
- [Bubble 组件示例](https://x.ant.design/components/bubble-cn)
- [Sender 组件示例](https://x.ant.design/components/sender-cn)
- [Actions 组件示例](https://x.ant.design/components/actions-cn)
- [Attachments 组件示例](https://x.ant.design/components/attachments-cn)
