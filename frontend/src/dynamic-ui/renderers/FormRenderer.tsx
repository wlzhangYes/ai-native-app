import React, { useState } from 'react';
import { Form, Input, Select, Button, message, Card } from 'antd';
import type { DynamicUIComponentProps } from '../registry';

/**
 * 表单字段配置
 */
export interface FormFieldConfig {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'number' | 'email';
  required?: boolean;
  placeholder?: string;
  options?: Array<{ label: string; value: string | number }>;
  defaultValue?: any;
}

/**
 * 表单配置
 */
export interface FormConfig {
  title?: string;
  description?: string;
  fields: FormFieldConfig[];
  submitText?: string;
  cancelText?: string;
}

/**
 * FormRenderer - 表单渲染器
 *
 * 根据配置动态渲染表单
 *
 * @example
 * ```tsx
 * const config: FormConfig = {
 *   title: '填写项目信息',
 *   fields: [
 *     { name: 'projectName', type: 'text', label: '项目名称', required: true },
 *     { name: 'description', type: 'textarea', label: '项目描述' }
 *   ]
 * };
 *
 * <FormRenderer config={config} onEvent={handleEvent} />
 * ```
 */
export const FormRenderer: React.FC<DynamicUIComponentProps> = ({
  config,
  onEvent,
  componentId,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const formConfig = config as FormConfig;

  // 提交表单
  const handleSubmit = async (values: any) => {
    setLoading(true);

    try {
      // 触发 submit 事件
      onEvent?.('submit', values);
      message.success('提交成功');

      // 清空表单
      form.resetFields();
    } catch (error) {
      message.error('提交失败');
    } finally {
      setLoading(false);
    }
  };

  // 取消
  const handleCancel = () => {
    form.resetFields();
    onEvent?.('cancel');
  };

  // 渲染表单项
  const renderFormItem = (field: FormFieldConfig) => {
    switch (field.type) {
      case 'textarea':
        return (
          <Input.TextArea
            placeholder={field.placeholder}
            rows={4}
            className="w-full"
          />
        );

      case 'select':
        return (
          <Select
            placeholder={field.placeholder || '请选择'}
            options={field.options}
            className="w-full"
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            placeholder={field.placeholder}
            className="w-full"
          />
        );

      case 'email':
        return (
          <Input
            type="email"
            placeholder={field.placeholder}
            className="w-full"
          />
        );

      case 'text':
      default:
        return (
          <Input placeholder={field.placeholder} className="w-full" />
        );
    }
  };

  return (
    <Card
      title={formConfig.title}
      className="w-full"
      data-component="FormRenderer"
    >
      {formConfig.description && (
        <p className="text-gray-600 mb-4">{formConfig.description}</p>
      )}

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        className="space-y-4"
      >
        {formConfig.fields.map((field) => (
          <Form.Item
            key={field.name}
            name={field.name}
            label={field.label}
            rules={[
              {
                required: field.required,
                message: `请输入${field.label}`,
              },
            ]}
            initialValue={field.defaultValue}
          >
            {renderFormItem(field)}
          </Form.Item>
        ))}

        <Form.Item className="mb-0 mt-6">
          <div className="flex gap-2 justify-end">
            {formConfig.cancelText !== undefined && (
              <Button onClick={handleCancel}>
                {formConfig.cancelText || '取消'}
              </Button>
            )}
            <Button type="primary" htmlType="submit" loading={loading}>
              {formConfig.submitText || '提交'}
            </Button>
          </div>
        </Form.Item>
      </Form>
    </Card>
  );
};
