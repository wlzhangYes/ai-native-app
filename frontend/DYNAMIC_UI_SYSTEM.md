# 动态交互组件渲染系统 (Dynamic UI System)

## 1. 需求分析

### 1.1 核心问题

**场景**: 右侧"执行记录"面板需要根据 SSE event 动态渲染不同的交互组件

**挑战**:
- ❌ 后端可能发送20+种不同类型的交互组件（Form、Dropdown、Card、Image等）
- ❌ 前端不可能为每种类型硬编码组件
- ❌ 业务方需要灵活扩展新的组件类型（无需修改前端代码）
- ❌ 组件需要支持复杂交互（表单验证、异步提交、状态管理）

### 1.2 目标架构

**理想状态**: 前端提供一套**可扩展的组件渲染引擎**，业务方通过**配置驱动**实现自定义UI

```typescript
// SSE Event 示例
{
  type: 'ui_component',
  component: 'Form',  // 组件类型
  props: {            // 组件配置（JSON）
    title: '填写用户信息',
    fields: [
      { name: 'username', type: 'text', label: '用户名', required: true },
      { name: 'email', type: 'email', label: '邮箱' },
    ],
    onSubmit: '::handleUserFormSubmit',  // 回调函数标识
  }
}
```

**前端自动渲染**:
```tsx
<DynamicUIRenderer event={sseEvent} />
// → 自动渲染为 Form 组件
```

---

## 2. 架构设计

### 2.1 三层架构

```
┌─────────────────────────────────────────────┐
│  Layer 3: 业务组件库 (Business Components)  │  ← 业务方扩展
│  - FormRenderer, TableRenderer, ChartRenderer│
│  - 每个组件实现 DynamicUIComponent 接口     │
└─────────────────────────────────────────────┘
                    ↓ 注册
┌─────────────────────────────────────────────┐
│  Layer 2: 渲染引擎 (Rendering Engine)       │  ← 核心框架
│  - ComponentRegistry (组件注册表)            │
│  - DynamicUIRenderer (动态渲染器)            │
│  - EventBus (事件总线，处理交互回调)         │
└─────────────────────────────────────────────┘
                    ↓ 使用
┌─────────────────────────────────────────────┐
│  Layer 1: 基础组件 (Primitive Components)   │  ← Ant Design 封装
│  - Button, Input, Select, Upload, Image     │
│  - 基础的 Ant Design 组件二次封装           │
└─────────────────────────────────────────────┘
```

### 2.2 目录结构

```
src/components/dynamic-ui/
├── index.ts                         # 统一导出
│
├── core/                            # Layer 2: 核心引擎
│   ├── ComponentRegistry.ts         # 组件注册表
│   ├── DynamicUIRenderer.tsx        # 动态渲染器
│   ├── EventBus.ts                  # 事件总线
│   ├── types.ts                     # 类型定义
│   └── schema.ts                    # JSON Schema 验证
│
├── primitives/                      # Layer 1: 基础组件
│   ├── index.ts
│   ├── PrimitiveButton.tsx          # 按钮封装
│   ├── PrimitiveInput.tsx           # 输入框封装
│   ├── PrimitiveSelect.tsx          # 下拉框封装
│   ├── PrimitiveUpload.tsx          # 上传封装
│   └── PrimitiveImage.tsx           # 图片展示封装
│
└── business/                        # Layer 3: 业务组件
    ├── index.ts
    ├── FormRenderer.tsx             # 表单渲染器
    ├── TableRenderer.tsx            # 表格渲染器
    ├── CardRenderer.tsx             # 卡片渲染器
    ├── ChartRenderer.tsx            # 图表渲染器
    ├── ApprovalRenderer.tsx         # 审批流程
    ├── TemplateSelectionRenderer.tsx # 模板选择
    └── custom/                      # 业务方自定义组件
        ├── MyCustomRenderer.tsx
        └── ...
```

---

## 3. 核心实现

### 3.1 组件注册表 (ComponentRegistry)

```typescript
// src/components/dynamic-ui/core/ComponentRegistry.ts

import type { DynamicUIComponent } from './types';

/**
 * 全局组件注册表
 */
class ComponentRegistry {
  private registry = new Map<string, DynamicUIComponent>();

  /**
   * 注册组件
   * @param name - 组件名称（唯一标识）
   * @param component - React 组件
   */
  register(name: string, component: DynamicUIComponent): void {
    if (this.registry.has(name)) {
      console.warn(`[ComponentRegistry] Component "${name}" is already registered. Overwriting.`);
    }
    this.registry.set(name, component);
    console.log(`[ComponentRegistry] Registered component: ${name}`);
  }

  /**
   * 批量注册组件
   */
  registerBatch(components: Record<string, DynamicUIComponent>): void {
    Object.entries(components).forEach(([name, component]) => {
      this.register(name, component);
    });
  }

  /**
   * 获取组件
   */
  get(name: string): DynamicUIComponent | undefined {
    return this.registry.get(name);
  }

  /**
   * 检查组件是否已注册
   */
  has(name: string): boolean {
    return this.registry.has(name);
  }

  /**
   * 获取所有已注册组件名称
   */
  getRegisteredNames(): string[] {
    return Array.from(this.registry.keys());
  }

  /**
   * 取消注册组件
   */
  unregister(name: string): void {
    this.registry.delete(name);
  }

  /**
   * 清空所有注册
   */
  clear(): void {
    this.registry.clear();
  }
}

// 单例模式
export const componentRegistry = new ComponentRegistry();

/**
 * Decorator: 自动注册组件
 *
 * 使用方式:
 * @RegisterComponent('MyForm')
 * class MyFormRenderer extends React.Component { ... }
 */
export function RegisterComponent(name: string) {
  return function <T extends DynamicUIComponent>(constructor: T) {
    componentRegistry.register(name, constructor as any);
    return constructor;
  };
}
```

### 3.2 类型定义 (types.ts)

```typescript
// src/components/dynamic-ui/core/types.ts

import type { ReactNode } from 'react';

/**
 * 动态组件 Props 基础接口
 */
export interface DynamicUIComponentProps {
  // 组件配置（从 SSE event 传入）
  config: Record<string, any>;

  // 事件回调
  onEvent?: (eventName: string, data?: any) => void;

  // 会话上下文
  sessionId?: string;

  // 其他通用 props
  [key: string]: any;
}

/**
 * 动态组件类型
 */
export type DynamicUIComponent = React.ComponentType<DynamicUIComponentProps>;

/**
 * SSE Event: UI Component
 */
export interface UIComponentEvent {
  type: 'ui_component';
  id: string;                    // 唯一标识
  component: string;             // 组件名称
  props: Record<string, any>;    // 组件配置
  timestamp: string;
}

/**
 * 组件事件类型
 */
export type ComponentEventType =
  | 'submit'        // 表单提交
  | 'cancel'        // 取消操作
  | 'select'        // 选择项
  | 'upload'        // 文件上传
  | 'approve'       // 审批通过
  | 'reject'        // 审批拒绝
  | 'navigate'      // 页面跳转
  | 'custom';       // 自定义事件

/**
 * 组件事件数据
 */
export interface ComponentEvent {
  id: string;                     // 组件 ID
  type: ComponentEventType;
  data?: any;
  timestamp: string;
}
```

### 3.3 动态渲染器 (DynamicUIRenderer)

```typescript
// src/components/dynamic-ui/core/DynamicUIRenderer.tsx

import { useCallback, useMemo } from 'react';
import { Alert, Spin } from 'antd';
import { componentRegistry } from './ComponentRegistry';
import { eventBus } from './EventBus';
import type { UIComponentEvent, ComponentEvent } from './types';
import { useSession } from '@/hooks/infrastructure/useSession';

export interface DynamicUIRendererProps {
  event: UIComponentEvent;
  loading?: boolean;
  onError?: (error: Error) => void;
}

export function DynamicUIRenderer({
  event,
  loading = false,
  onError,
}: DynamicUIRendererProps) {
  const { sessionId } = useSession();

  // 获取组件
  const Component = useMemo(() => {
    if (!event.component) {
      console.error('[DynamicUIRenderer] Missing component name in event:', event);
      return null;
    }

    const component = componentRegistry.get(event.component);
    if (!component) {
      console.error(
        `[DynamicUIRenderer] Component "${event.component}" not registered. ` +
        `Available components: ${componentRegistry.getRegisteredNames().join(', ')}`
      );
      return null;
    }

    return component;
  }, [event.component]);

  // 事件处理器
  const handleEvent = useCallback(
    (eventType: string, data?: any) => {
      const componentEvent: ComponentEvent = {
        id: event.id,
        type: eventType as any,
        data,
        timestamp: new Date().toISOString(),
      };

      console.log('[DynamicUIRenderer] Event triggered:', componentEvent);

      // 通过事件总线发送事件
      eventBus.emit('component_event', componentEvent);

      // 通过 SSE 回传给后端（如果需要）
      // sendEventToBackend(sessionId, componentEvent);
    },
    [event.id, sessionId]
  );

  // 错误处理
  if (!Component) {
    const errorMsg = `未找到组件 "${event.component}"`;
    onError?.(new Error(errorMsg));

    return (
      <Alert
        type="error"
        message="组件渲染失败"
        description={
          <div>
            <p>{errorMsg}</p>
            <p>
              <strong>可用组件:</strong> {componentRegistry.getRegisteredNames().join(', ')}
            </p>
          </div>
        }
        showIcon
      />
    );
  }

  // 加载状态
  if (loading) {
    return <Spin tip="加载组件中..." />;
  }

  // 渲染组件
  return (
    <div className="dynamic-ui-wrapper" data-component-id={event.id}>
      <Component
        config={event.props || {}}
        onEvent={handleEvent}
        sessionId={sessionId}
      />
    </div>
  );
}
```

### 3.4 事件总线 (EventBus)

```typescript
// src/components/dynamic-ui/core/EventBus.ts

type EventHandler = (data: any) => void;

/**
 * 事件总线 - 用于组件间通信
 */
class EventBus {
  private listeners = new Map<string, Set<EventHandler>>();

  /**
   * 订阅事件
   */
  on(event: string, handler: EventHandler): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);

    // 返回取消订阅函数
    return () => this.off(event, handler);
  }

  /**
   * 取消订阅
   */
  off(event: string, handler: EventHandler): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  /**
   * 发送事件
   */
  emit(event: string, data?: any): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(data);
        } catch (error) {
          console.error(`[EventBus] Error in handler for event "${event}":`, error);
        }
      });
    }
  }

  /**
   * 订阅一次性事件
   */
  once(event: string, handler: EventHandler): void {
    const onceHandler = (data: any) => {
      handler(data);
      this.off(event, onceHandler);
    };
    this.on(event, onceHandler);
  }

  /**
   * 清空所有订阅
   */
  clear(): void {
    this.listeners.clear();
  }
}

export const eventBus = new EventBus();
```

---

## 4. 业务组件示例

### 4.1 表单渲染器 (FormRenderer)

```typescript
// src/components/dynamic-ui/business/FormRenderer.tsx

import { useState } from 'react';
import { Form, Input, Button, Select, message } from 'antd';
import type { DynamicUIComponentProps } from '../core/types';

interface FormField {
  name: string;
  type: 'text' | 'email' | 'select' | 'textarea';
  label: string;
  required?: boolean;
  options?: Array<{ label: string; value: string }>;
  placeholder?: string;
}

interface FormConfig {
  title?: string;
  fields: FormField[];
  submitText?: string;
  cancelText?: string;
}

export function FormRenderer({ config, onEvent }: DynamicUIComponentProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const formConfig = config as FormConfig;

  const handleSubmit = async (values: any) => {
    setLoading(true);

    try {
      console.log('[FormRenderer] Form submitted:', values);

      // 触发 submit 事件
      onEvent?.('submit', values);

      message.success('表单提交成功');
      form.resetFields();
    } catch (error) {
      console.error('[FormRenderer] Submit error:', error);
      message.error('表单提交失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onEvent?.('cancel');
  };

  return (
    <div className="p-4 bg-white rounded shadow">
      {formConfig.title && <h3 className="text-lg font-bold mb-4">{formConfig.title}</h3>}

      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        {formConfig.fields.map((field) => (
          <Form.Item
            key={field.name}
            name={field.name}
            label={field.label}
            rules={[{ required: field.required, message: `${field.label}不能为空` }]}
          >
            {field.type === 'select' ? (
              <Select placeholder={field.placeholder}>
                {field.options?.map((opt) => (
                  <Select.Option key={opt.value} value={opt.value}>
                    {opt.label}
                  </Select.Option>
                ))}
              </Select>
            ) : field.type === 'textarea' ? (
              <Input.TextArea placeholder={field.placeholder} rows={4} />
            ) : (
              <Input type={field.type} placeholder={field.placeholder} />
            )}
          </Form.Item>
        ))}

        <Form.Item className="mb-0">
          <div className="flex gap-2">
            <Button type="primary" htmlType="submit" loading={loading}>
              {formConfig.submitText || '提交'}
            </Button>
            {formConfig.cancelText && (
              <Button onClick={handleCancel}>{formConfig.cancelText}</Button>
            )}
          </div>
        </Form.Item>
      </Form>
    </div>
  );
}

// 自动注册组件
import { componentRegistry } from '../core/ComponentRegistry';
componentRegistry.register('Form', FormRenderer);
```

### 4.2 卡片渲染器 (CardRenderer)

```typescript
// src/components/dynamic-ui/business/CardRenderer.tsx

import { Card, Button, Tag } from 'antd';
import type { DynamicUIComponentProps } from '../core/types';

interface CardConfig {
  title: string;
  description?: string;
  image?: string;
  tags?: string[];
  actions?: Array<{
    label: string;
    type: 'primary' | 'default' | 'dashed' | 'link';
    event: string;  // 触发的事件名
  }>;
}

export function CardRenderer({ config, onEvent }: DynamicUIComponentProps) {
  const cardConfig = config as CardConfig;

  return (
    <Card
      className="shadow-sm"
      cover={
        cardConfig.image && (
          <img alt={cardConfig.title} src={cardConfig.image} className="h-48 object-cover" />
        )
      }
      actions={cardConfig.actions?.map((action, index) => (
        <Button
          key={index}
          type={action.type}
          onClick={() => onEvent?.(action.event, { action: action.label })}
        >
          {action.label}
        </Button>
      ))}
    >
      <Card.Meta
        title={cardConfig.title}
        description={
          <div>
            {cardConfig.description && <p className="mb-2">{cardConfig.description}</p>}
            {cardConfig.tags && (
              <div className="flex gap-2">
                {cardConfig.tags.map((tag) => (
                  <Tag key={tag}>{tag}</Tag>
                ))}
              </div>
            )}
          </div>
        }
      />
    </Card>
  );
}

// 自动注册
import { componentRegistry } from '../core/ComponentRegistry';
componentRegistry.register('Card', CardRenderer);
```

### 4.3 图片列表渲染器 (ImageGalleryRenderer)

```typescript
// src/components/dynamic-ui/business/ImageGalleryRenderer.tsx

import { useState } from 'react';
import { Image, Modal, Button } from 'antd';
import { EyeOutlined, DownloadOutlined } from '@ant-design/icons';
import type { DynamicUIComponentProps } from '../core/types';

interface ImageItem {
  url: string;
  title?: string;
  description?: string;
}

interface ImageGalleryConfig {
  title?: string;
  images: ImageItem[];
  columns?: number;
  downloadable?: boolean;
}

export function ImageGalleryRenderer({ config, onEvent }: DynamicUIComponentProps) {
  const galleryConfig = config as ImageGalleryConfig;
  const [previewImage, setPreviewImage] = useState<ImageItem | null>(null);

  const handleDownload = (image: ImageItem) => {
    onEvent?.('download', { url: image.url });
    // 实际下载逻辑
    const link = document.createElement('a');
    link.href = image.url;
    link.download = image.title || 'image';
    link.click();
  };

  return (
    <div className="p-4">
      {galleryConfig.title && <h3 className="text-lg font-bold mb-4">{galleryConfig.title}</h3>}

      <div
        className="grid gap-4"
        style={{
          gridTemplateColumns: `repeat(${galleryConfig.columns || 3}, minmax(0, 1fr))`,
        }}
      >
        {galleryConfig.images.map((image, index) => (
          <div key={index} className="relative group">
            <Image
              src={image.url}
              alt={image.title}
              className="rounded"
              preview={false}
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
              <Button
                type="primary"
                shape="circle"
                icon={<EyeOutlined />}
                onClick={() => setPreviewImage(image)}
              />
              {galleryConfig.downloadable && (
                <Button
                  type="primary"
                  shape="circle"
                  icon={<DownloadOutlined />}
                  onClick={() => handleDownload(image)}
                />
              )}
            </div>
          </div>
        ))}
      </div>

      <Modal
        open={!!previewImage}
        footer={null}
        onCancel={() => setPreviewImage(null)}
        width="80%"
      >
        {previewImage && (
          <div>
            <img src={previewImage.url} alt={previewImage.title} className="w-full" />
            {previewImage.title && <h4 className="mt-4 text-lg">{previewImage.title}</h4>}
            {previewImage.description && <p className="text-gray-600">{previewImage.description}</p>}
          </div>
        )}
      </Modal>
    </div>
  );
}

// 自动注册
import { componentRegistry } from '../core/ComponentRegistry';
componentRegistry.register('ImageGallery', ImageGalleryRenderer);
```

---

## 5. 使用方式

### 5.1 初始化注册（App 启动时）

```typescript
// src/App.tsx 或 src/components/dynamic-ui/index.ts

import { componentRegistry } from './dynamic-ui/core/ComponentRegistry';

// 批量注册业务组件
import { FormRenderer } from './dynamic-ui/business/FormRenderer';
import { CardRenderer } from './dynamic-ui/business/CardRenderer';
import { ImageGalleryRenderer } from './dynamic-ui/business/ImageGalleryRenderer';
import { TableRenderer } from './dynamic-ui/business/TableRenderer';
import { ChartRenderer } from './dynamic-ui/business/ChartRenderer';

componentRegistry.registerBatch({
  Form: FormRenderer,
  Card: CardRenderer,
  ImageGallery: ImageGalleryRenderer,
  Table: TableRenderer,
  Chart: ChartRenderer,
});

console.log('[App] Registered components:', componentRegistry.getRegisteredNames());
```

### 5.2 在执行记录中使用

```typescript
// src/components/preview/ExecutionLog.tsx

import { DynamicUIRenderer } from '@/components/dynamic-ui';
import type { UIComponentEvent } from '@/components/dynamic-ui/core/types';

function ExecutionLog() {
  const [uiEvents, setUiEvents] = useState<UIComponentEvent[]>([]);

  // 监听 SSE ui_component 事件
  useEffect(() => {
    const handleSSEMessage = (event: any) => {
      if (event.type === 'ui_component') {
        setUiEvents((prev) => [...prev, event]);
      }
    };

    // SSE 订阅
    eventSource.addEventListener('message', handleSSEMessage);

    return () => {
      eventSource.removeEventListener('message', handleSSEMessage);
    };
  }, []);

  return (
    <div className="execution-log">
      <Timeline>
        {uiEvents.map((event) => (
          <Timeline.Item key={event.id}>
            <div className="mb-2 text-gray-500">{event.timestamp}</div>
            <DynamicUIRenderer event={event} />
          </Timeline.Item>
        ))}
      </Timeline>
    </div>
  );
}
```

### 5.3 业务方扩展自定义组件

```typescript
// business-team/MyCustomRenderer.tsx

import { componentRegistry } from '@/components/dynamic-ui';
import type { DynamicUIComponentProps } from '@/components/dynamic-ui/core/types';

function MyCustomRenderer({ config, onEvent }: DynamicUIComponentProps) {
  return (
    <div className="my-custom-ui">
      <h3>{config.title}</h3>
      <button onClick={() => onEvent?.('custom_action', { data: 'xxx' })}>
        自定义操作
      </button>
    </div>
  );
}

// 注册到全局
componentRegistry.register('MyCustom', MyCustomRenderer);
```

---

## 6. 后端集成示例

### 6.1 SSE Event 示例

```json
// Event 1: 表单
{
  "type": "ui_component",
  "id": "ui-001",
  "component": "Form",
  "props": {
    "title": "填写项目信息",
    "fields": [
      { "name": "projectName", "type": "text", "label": "项目名称", "required": true },
      { "name": "category", "type": "select", "label": "分类", "options": [
        { "label": "AI应用", "value": "ai" },
        { "label": "Web应用", "value": "web" }
      ]},
      { "name": "description", "type": "textarea", "label": "描述" }
    ],
    "submitText": "创建项目",
    "cancelText": "取消"
  },
  "timestamp": "2025-10-29T10:00:00Z"
}

// Event 2: 卡片
{
  "type": "ui_component",
  "id": "ui-002",
  "component": "Card",
  "props": {
    "title": "推荐模板",
    "description": "基于您的输入，我们推荐使用以下模板",
    "image": "https://example.com/template.png",
    "tags": ["AI", "React", "TypeScript"],
    "actions": [
      { "label": "使用此模板", "type": "primary", "event": "select_template" },
      { "label": "查看详情", "type": "default", "event": "view_details" }
    ]
  },
  "timestamp": "2025-10-29T10:05:00Z"
}

// Event 3: 图片列表
{
  "type": "ui_component",
  "id": "ui-003",
  "component": "ImageGallery",
  "props": {
    "title": "生成的设计稿",
    "images": [
      { "url": "https://example.com/design-1.png", "title": "主页设计" },
      { "url": "https://example.com/design-2.png", "title": "详情页设计" },
      { "url": "https://example.com/design-3.png", "title": "列表页设计" }
    ],
    "columns": 3,
    "downloadable": true
  },
  "timestamp": "2025-10-29T10:10:00Z"
}
```

### 6.2 前端回传事件

```json
// 用户点击"使用此模板"后，前端回传
POST /sessions/{sessionId}/events
{
  "id": "ui-002",
  "type": "select",
  "data": {
    "action": "使用此模板"
  },
  "timestamp": "2025-10-29T10:06:00Z"
}
```

---

## 7. 高级特性

### 7.1 JSON Schema 验证

```typescript
// src/components/dynamic-ui/core/schema.ts

import Ajv from 'ajv';

const ajv = new Ajv();

// 表单配置 Schema
const formSchema = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    fields: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          type: { type: 'string', enum: ['text', 'email', 'select', 'textarea'] },
          label: { type: 'string' },
          required: { type: 'boolean' },
        },
        required: ['name', 'type', 'label'],
      },
    },
  },
  required: ['fields'],
};

export const validateFormConfig = ajv.compile(formSchema);

// 在 DynamicUIRenderer 中使用
if (event.component === 'Form') {
  if (!validateFormConfig(event.props)) {
    console.error('[DynamicUIRenderer] Invalid form config:', validateFormConfig.errors);
    // 显示错误
  }
}
```

### 7.2 异步组件加载（代码分割）

```typescript
// src/components/dynamic-ui/core/ComponentRegistry.ts

import { lazy } from 'react';

class ComponentRegistry {
  // ...

  /**
   * 注册异步组件（代码分割）
   */
  registerAsync(name: string, loader: () => Promise<{ default: DynamicUIComponent }>): void {
    const LazyComponent = lazy(loader);
    this.register(name, LazyComponent);
  }
}

// 使用方式
componentRegistry.registerAsync(
  'HeavyChart',
  () => import('./business/ChartRenderer')
);
```

### 7.3 组件权限控制

```typescript
// src/components/dynamic-ui/core/DynamicUIRenderer.tsx

import { useAuthContext } from '@/contexts/AuthContext';

function DynamicUIRenderer({ event }: DynamicUIRendererProps) {
  const { user, hasPermission } = useAuthContext();

  // 检查权限
  const requiredPermission = event.props.requiredPermission;
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <Alert
        type="warning"
        message="权限不足"
        description="您没有权限访问此组件"
      />
    );
  }

  // ... 渲染组件
}
```

---

## 8. 最佳实践

### 8.1 组件设计原则

1. **单一职责**: 每个组件只做一件事
2. **配置驱动**: 所有 UI 细节通过 config 配置
3. **事件回调**: 通过 onEvent 回调与外部通信
4. **错误处理**: 组件内部捕获所有错误，避免崩溃
5. **加载状态**: 异步操作显示 loading 状态

### 8.2 命名规范

| 类型 | 命名规范 | 示例 |
|------|----------|------|
| 组件名 | PascalCase + Renderer | FormRenderer, CardRenderer |
| 注册名 | PascalCase（无 Renderer 后缀） | Form, Card |
| 事件名 | snake_case | submit, select_template |
| 配置字段 | camelCase | submitText, downloadable |

### 8.3 性能优化

```typescript
// 1. 使用 memo 避免不必要的重渲染
export const FormRenderer = memo(function FormRenderer({ config, onEvent }: Props) {
  // ...
});

// 2. 使用 useMemo 缓存配置解析
const parsedConfig = useMemo(() => {
  return parseFormConfig(config);
}, [config]);

// 3. 使用 useCallback 缓存事件处理器
const handleSubmit = useCallback((values: any) => {
  onEvent?.('submit', values);
}, [onEvent]);
```

---

## 9. 总结

### 9.1 核心优势

| 维度 | 传统方案 | 动态UI系统 |
|------|----------|-----------|
| **扩展性** | 每增加一种UI需修改代码 | 注册新组件即可 |
| **维护成本** | 高（硬编码） | 低（配置驱动） |
| **业务方灵活性** | 低（依赖前端开发） | 高（自主扩展） |
| **代码复用性** | 低 | 高（组件库） |
| **类型安全** | 一般 | 强（TypeScript） |

### 9.2 未来扩展

- **可视化配置**: 提供 UI Builder，拖拽生成配置
- **组件市场**: 建立组件库，业务方共享组件
- **版本管理**: 支持组件版本控制和灰度发布
- **性能监控**: 追踪组件渲染性能和错误率
- **国际化**: 支持多语言配置

---

**文档版本**: 1.0
**最后更新**: 2025-10-29
**作者**: Claude Code + Human
