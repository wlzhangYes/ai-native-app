// Template Selection UI Component
// 模板选择界面组件，用于选择宪章模板等场景

import { useState, useEffect } from 'react';
import { Card, Radio, Button, Space, Typography, Divider, message } from 'antd';
import type { RadioChangeEvent } from 'antd';
import type { TaskUIComponentProps } from './TaskUIRegistry';
import { useUIAction } from '@/stores/useUIActionStore';

const { Title, Paragraph, Text } = Typography;

// ============================================================================
// 模板定义
// ============================================================================

interface Template {
  id: string;
  name: string;
  description: string;
  content?: string; // 模板内容预览
}

// 默认模板库（宪章模板示例）
const DEFAULT_TEMPLATES: Template[] = [
  {
    id: 'agile',
    name: '敏捷宪章模板',
    description: '适用于敏捷开发团队，强调快速迭代、持续交付和团队协作',
    content: `# 敏捷宪章
## 核心原则
1. 个体和互动高于流程和工具
2. 工作的软件高于详尽的文档
3. 客户合作高于合同谈判
4. 响应变化高于遵循计划`,
  },
  {
    id: 'waterfall',
    name: '瀑布式宪章模板',
    description: '适用于需求明确、变更少的项目，强调阶段划分和文档完整性',
    content: `# 瀑布式宪章
## 核心原则
1. 需求分析完整且冻结
2. 设计先行，实现随后
3. 测试覆盖全面
4. 文档规范齐全`,
  },
  {
    id: 'devops',
    name: 'DevOps 宪章模板',
    description: '适用于强调持续集成/持续部署的团队，注重开发与运维协作',
    content: `# DevOps 宪章
## 核心原则
1. 自动化优先
2. 持续集成与持续部署
3. 监控与反馈驱动
4. 文化、流程与工具并重`,
  },
  {
    id: 'lean',
    name: '精益宪章模板',
    description: '适用于注重效率和浪费消除的团队，强调价值流优化',
    content: `# 精益宪章
## 核心原则
1. 消除浪费
2. 价值流最大化
3. 持续改进
4. 以客户价值为中心`,
  },
];

// ============================================================================
// 组件实现
// ============================================================================

export function TemplateSelectionUI({ task, onComplete, onCancel }: TaskUIComponentProps) {
  // 从任务元数据获取模板列表（如果有），否则使用默认模板
  const templates = (task.metadata?.uiProps?.templates as Template[]) || DEFAULT_TEMPLATES;

  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 当前选中的模板详情
  const currentTemplate = templates.find((t) => t.id === selectedTemplate);

  // 监听对话驱动的模板选择操作
  useUIAction<{ templateId?: string; templateName?: string }>(
    'select-template',
    (payload) => {
      console.log('[TemplateSelectionUI] Received select-template action:', payload);

      // 根据 templateId 或 templateName 查找模板
      let matchedTemplate: Template | undefined;

      if (payload.templateId) {
        matchedTemplate = templates.find((t) => t.id === payload.templateId);
      } else if (payload.templateName) {
        // 模糊匹配模板名称
        const lowerName = payload.templateName.toLowerCase();
        matchedTemplate = templates.find((t) =>
          t.name.toLowerCase().includes(lowerName) ||
          lowerName.includes(t.name.toLowerCase())
        );
      }

      if (matchedTemplate) {
        setSelectedTemplate(matchedTemplate.id);
        message.success(`已自动选择模板：${matchedTemplate.name}`);
      } else {
        message.warning(`未找到匹配的模板：${payload.templateName || payload.templateId}`);
      }
    }
  );

  // 处理模板选择
  const handleTemplateChange = (e: RadioChangeEvent) => {
    setSelectedTemplate(e.target.value);
  };

  // 提交选择
  const handleSubmit = async () => {
    if (!selectedTemplate) {
      message.warning('请先选择一个模板');
      return;
    }

    setIsSubmitting(true);

    try {
      // TODO: 调用 API 提交模板选择
      // await api.submitTemplateSelection(task.id, selectedTemplate);

      // 模拟 API 调用
      await new Promise((resolve) => setTimeout(resolve, 500));

      message.success(`已选择模板：${currentTemplate?.name}`);

      // 通知父组件完成
      if (onComplete) {
        onComplete({
          selectedTemplateId: selectedTemplate,
          selectedTemplate: currentTemplate,
        });
      }
    } catch (error) {
      message.error('提交失败，请重试');
      console.error('Template selection error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        padding: '24px',
        height: '100%',
        overflow: 'auto',
        backgroundColor: '#fff',
      }}
    >
      {/* 标题和说明 */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={3} style={{ marginBottom: '8px' }}>
          选择宪章模板
        </Title>
        <Paragraph style={{ color: 'rgba(0, 0, 0, 0.65)', marginBottom: 0 }}>
          请根据您的团队特点和项目需求，选择最适合的宪章模板。选择后可以在后续阶段进行调整和定制。
        </Paragraph>
      </div>

      {/* 模板选择 */}
      <Radio.Group
        onChange={handleTemplateChange}
        value={selectedTemplate}
        style={{ width: '100%' }}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {templates.map((template) => (
            <Card
              key={template.id}
              hoverable
              style={{
                cursor: 'pointer',
                border: selectedTemplate === template.id ? '2px solid #1677ff' : '1px solid #d9d9d9',
                backgroundColor: selectedTemplate === template.id ? '#f0f5ff' : '#fff',
              }}
              onClick={() => setSelectedTemplate(template.id)}
            >
              <Radio value={template.id} style={{ marginBottom: '8px' }}>
                <Text strong style={{ fontSize: '16px' }}>
                  {template.name}
                </Text>
              </Radio>
              <Paragraph
                style={{
                  marginLeft: '24px',
                  marginBottom: 0,
                  color: 'rgba(0, 0, 0, 0.65)',
                }}
              >
                {template.description}
              </Paragraph>
            </Card>
          ))}
        </Space>
      </Radio.Group>

      {/* 模板预览 */}
      {currentTemplate && (
        <>
          <Divider />
          <Card
            title="模板预览"
            size="small"
            style={{ marginBottom: '16px', backgroundColor: '#fafafa' }}
          >
            <pre
              style={{
                margin: 0,
                fontSize: '13px',
                lineHeight: '1.6',
                color: 'rgba(0, 0, 0, 0.85)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {currentTemplate.content || '暂无内容预览'}
            </pre>
          </Card>
        </>
      )}

      {/* 操作按钮 */}
      <div
        style={{
          marginTop: '24px',
          paddingTop: '16px',
          borderTop: '1px solid #f0f0f0',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '8px',
        }}
      >
        {onCancel && (
          <Button onClick={onCancel} disabled={isSubmitting}>
            取消
          </Button>
        )}
        <Button
          type="primary"
          onClick={handleSubmit}
          loading={isSubmitting}
          disabled={!selectedTemplate}
        >
          确认选择
        </Button>
      </div>
    </div>
  );
}
