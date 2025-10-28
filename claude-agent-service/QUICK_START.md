# 🚀 快速开始指南

## 5 分钟启动 Claude Agent Service

### 第 1 步: 配置环境变量 (1 分钟)

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件,设置两个必填项:
# ANTHROPIC_AUTH_TOKEN=your_token_here
# POSTGRES_PASSWORD=your_secure_password
```

或者使用命令行:
```bash
# 设置 API Token
echo "ANTHROPIC_AUTH_TOKEN=sk-xxx" >> .env

# 生成随机密码
echo "POSTGRES_PASSWORD=$(openssl rand -base64 32)" >> .env
```

### 第 2 步: 启动所有服务 (3 分钟)

```bash
# 一键启动(Docker)
./start-all.sh

# 或者手动启动
docker-compose build
docker-compose up -d
```

等待服务启动(约 30-60 秒),你会看到:
```
✓ postgres      healthy
✓ redis         healthy
✓ backend       healthy
✓ frontend      healthy
```

### 第 3 步: 访问应用 (1 分钟)

打开浏览器访问:

**🌐 http://localhost:3000**

你会看到三栏界面:
- **左侧**: 会话列表
- **中间**: 聊天界面
- **右侧**: Todo/文件侧边栏

### 第 4 步: 创建第一个会话

1. 点击左上角 **"+ New Session"**
2. 输入 workspace 名称(可选): `my-first-project`
3. 点击创建

### 第 5 步: 开始对话

在中间的输入框输入:

```
帮我创建一个 Python FastAPI 项目
```

你会实时看到:
1. 🤖 Claude 的回复逐字显示
2. 🔧 工具调用卡片(Bash, Write 等)
3. ✅ 执行结果
4. 📋 右侧 Todo 列表实时更新

## 🎉 完成!

现在你已经成功运行了 Claude Agent Service!

---

## 💡 快速示例

### 示例 1: 创建项目

```
你: 帮我创建一个包含 README 的 Python 项目

Claude: 我来帮你创建 Python 项目...

🔧 Bash
├─ command: mkdir project
└─ ✅ Success

🔧 Write
├─ file_path: /workspace/project/README.md
└─ ✅ Success

Claude: 已创建完成!
```

### 示例 2: 查看 Todo

发送消息:
```
重构这个项目,添加测试
```

右侧会显示:
```
📋 Tasks (0/4)

🔧 分析当前代码 (进行中)
⭕ 创建测试目录
⭕ 编写单元测试
⭕ 运行测试

Progress: ░░░░░░░░░░ 0%
```

随着 Claude 工作,进度会实时更新。

### 示例 3: 浏览文件

1. 在右侧点击 **"Files"** 标签
2. 查看工作空间的文件结构
3. 点击文件可查看内容(待实现后端 API)

---

## 🔧 开发模式

如果你想在本地开发(前端热重载):

```bash
./start-dev.sh
```

这会:
1. 启动 PostgreSQL + Redis (Docker)
2. 启动后端 (Docker)
3. 启动前端 (本地 npm dev,支持热重载)

---

## 📚 更多信息

### 查看文档
```bash
# 项目总览
cat README.md

# 流式 API
cat docs/STREAMING_API.md

# 前端实现
cat frontend/IMPLEMENTATION.md
```

### 查看日志
```bash
# 所有服务
docker-compose logs -f

# 单个服务
docker-compose logs -f frontend
docker-compose logs -f backend
```

### API 文档
打开: http://localhost:8000/docs

### 健康检查
```bash
curl http://localhost:8000/health
curl http://localhost:3000
```

---

## ❓ 常见问题

### Q: 端口被占用怎么办?

```bash
# 查看占用
lsof -i :3000
lsof -i :8000

# 修改端口(编辑 docker-compose.yml)
# frontend: "3001:3000"
# backend: "8001:8000"
```

### Q: 前端无法连接后端?

```bash
# 检查后端健康
curl http://localhost:8000/health

# 检查前端环境变量
cat frontend/.env.local
# 应该有: NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Q: Docker 构建失败?

```bash
# 清理重建
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

---

## 🎊 享受使用!

现在你可以:
- ✅ 创建多个独立的 Claude Code 会话
- ✅ 实时看到 AI 的思考过程
- ✅ 可视化工具调用
- ✅ 追踪任务进度
- ✅ 管理工作空间文件

**Have fun with Claude Agent Service!** 🎉
