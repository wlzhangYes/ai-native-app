# 业务组件开发指南

## 🎯 概述

这个目录专门给各业务团队开发自定义UI组件。每个业务团队在自己的子目录下开发，互不干扰。

## 📂 目录规范

```
business/
├── {业务域名}/              ← 你们的业务名称
│   ├── README.md           ← 你们组件的说明
│   ├── {组件名}Renderer.tsx ← 具体组件
│   └── index.ts            ← 导出组件
```

## 🛠️ 开发步骤

### 1. 创建业务目录
```bash
# 在 business/ 下创建你们的业务目录
mkdir src/dynamic-ui/renderers/business/your-business
cd src/dynamic-ui/renderers/business/your-business
```

### 2. 开发组件
```typescript
// src/dynamic-ui/renderers/business/your-business/YourRenderer.tsx
import { DynamicUIComponentProps } from '../../../types';

export function YourRenderer({ config, onEvent }: DynamicUIComponentProps) {
  // 你们的组件逻辑
  return (
    <div>
      {/* 你们的UI */}
    </div>
  );
}
```

### 3. 导出组件
```typescript
// src/dynamic-ui/renderers/business/your-business/index.ts
export { YourRenderer } from './YourRenderer';
```

### 4. 注册组件
在主项目的 `renderers/index.ts` 中注册：
```typescript
// 联系主项目维护者，添加以下代码：
import { YourRenderer } from './business/your-business';
componentRegistry.register('YourComponent', YourRenderer);
```

## 📋 开发规范

### 组件命名
- 文件名：`{业务名}Renderer.tsx`，如 `ApprovalRenderer.tsx`
- 组件名：`{业务名}Renderer`，如 `ApprovalRenderer`
- 注册名：`{业务名}`，如 `Approval`

### 组件接口
所有组件必须实现 `DynamicUIComponentProps` 接口：
```typescript
interface DynamicUIComponentProps {
  config: Record<string, any>;      // 配置数据
  onEvent?: (event: string, data?: any) => void;  // 事件回调
  sessionId?: string;               // 会话ID
}
```

### 样式规范
- **必须使用 Tailwind CSS**，禁止内联样式
- 使用 `clsx` 处理条件样式
- 保持响应式设计

### 事件处理
```typescript
// 正确的事件触发方式
const handleSubmit = (data: any) => {
  onEvent?.('submit', data);  // 发送给后端
};
```

## 🔄 协作流程

### 1. Fork 主仓库
```bash
# 在 GitHub 上 fork ai-native-app 仓库
# 然后 clone 到本地
git clone https://github.com/your-team/ai-native-app.git
cd ai-native-app/frontend
```

### 2. 创建功能分支
```bash
git checkout -b feature/your-business-component
```

### 3. 开发组件
按照上述规范开发你们的组件

### 4. 提交 PR
```bash
git add .
git commit -m "feat: 添加 YourBusiness 组件"
git push origin feature/your-business-component
# 在 GitHub 提交 Pull Request
```

### 5. Code Review
主项目维护者会进行代码审查，通过后合并到主分支

## 🧪 测试

### 本地测试
```bash
# 启动开发服务器
npm run dev

# 在浏览器中模拟后端发送事件
window.postMessage({
  type: 'ui_component',
  component: 'YourComponent',
  props: { /* 测试配置 */ }
}, '*');
```

### 组件注册验证
```javascript
// 在浏览器控制台检查组件是否注册成功
import { componentRegistry } from '@/dynamic-ui';
console.log(componentRegistry.getRegisteredNames());
// 应该包含你的组件名
```

## ❓ 常见问题

### Q: 我们可以使用其他UI库吗？
A: 建议使用项目统一的 Ant Design。如有特殊需求，请先与主项目团队沟通。

### Q: 如何获取用户权限信息？
A: 通过 `useAuthContext` hook 获取当前用户信息。

### Q: 组件之间如何通信？
A: 通过 EventBus 或 `onEvent` 回调，不要直接引用其他组件。

### Q: 如何调试组件？
A: 使用浏览器开发者工具，组件会有 `data-component-id` 属性便于定位。

## 📞 联系方式

- 主项目维护者：[联系信息]
- 技术支持群：[群组信息]
- 文档更新：提交 Issue 或 PR

---

**开发愉快！有问题随时联系主项目团队！** 🎉