# 贡献指南 - 业务组件开发

## 🤝 业务方组件贡献流程

### 1. 准备工作
```bash
# 1. Fork 主仓库到你们团队的 GitHub
# 2. Clone 到本地
git clone https://github.com/your-team/ai-native-app.git
cd ai-native-app/frontend

# 3. 安装依赖
npm install

# 4. 启动开发服务器
npm run dev
```

### 2. 分支规范
```bash
# 功能分支命名规范
git checkout -b feature/{业务域}-{组件名}

# 示例
git checkout -b feature/approval-workflow    # 审批工作流组件
git checkout -b feature/payment-checkout     # 支付结账组件
git checkout -b feature/crm-customer         # CRM客户组件
```

### 3. 提交规范
```bash
# 提交信息格式
{type}: {description}

# 类型说明
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式调整
refactor: 重构

# 示例
git commit -m "feat: 添加审批工作流组件"
git commit -m "fix: 修复支付组件金额显示问题"
```

### 4. PR 规范

#### PR 标题
```
[{业务域}] {简短描述}

# 示例
[Approval] 添加审批工作流组件
[Payment] 修复支付金额计算错误
[CRM] 新增客户信息展示组件
```

#### PR 描述模板
```markdown
## 📋 变更说明
- 添加了什么功能
- 修复了什么问题
- 影响了哪些文件

## 🧪 测试方法
- [ ] 本地开发服务器正常启动
- [ ] 组件正确注册到 ComponentRegistry
- [ ] UI 展示符合设计要求
- [ ] 事件回调正常工作

## 📷 效果截图
<!-- 请附上组件的UI截图 -->

## 🔗 相关链接
- 需求文档：
- 设计稿：

## ✅ 检查清单
- [ ] 遵循代码规范（Tailwind CSS，TypeScript）
- [ ] 组件实现了 DynamicUIComponentProps 接口
- [ ] 添加了必要的注释
- [ ] 更新了相关文档
```

## 🛡️ 代码审查标准

### 主项目团队会检查：
1. **架构合规性**：是否正确使用组件接口
2. **代码质量**：TypeScript 类型安全，ESLint 规范
3. **UI 一致性**：是否使用 Tailwind + Ant Design
4. **性能影响**：是否有内存泄漏、不必要的重渲染
5. **安全性**：是否有 XSS 风险、敏感信息泄露

### 审查流程：
1. **自动检查**：CI/CD 跑测试和 lint
2. **人工审查**：主项目团队 Code Review
3. **测试验证**：在测试环境验证功能
4. **合并主分支**：通过后合并到 main

## 🚀 发布流程

### 内部测试
```bash
# 业务方自测
npm run build          # 构建检查
npm run test           # 运行测试
npm run lint           # 代码规范检查
```

### 集成测试
主项目团队会在测试环境部署，验证：
- 组件正常渲染
- 事件交互正常
- 与其他组件无冲突
- 性能指标正常

### 生产发布
- 合并到主分支后，会自动部署到生产环境
- 业务方团队会收到发布通知

## 📞 沟通渠道

### 开发支持
- **技术问题**：提交 GitHub Issue
- **紧急问题**：联系主项目团队 Slack/微信群
- **需求讨论**：GitHub Discussions

### 定期同步
- **周例会**：每周三下午讨论组件开发进展
- **月度回顾**：每月总结组件质量和性能指标

---

**感谢各业务团队的贡献！让我们一起打造强大的动态UI生态！** 🎉