# Claude Agent Service

一个完整的 Claude Agent 服务,包含前后端分离架构、多会话管理、流式响应和 Anthropic 品牌 UI。

## 🎯 项目架构

```
┌─────────────────────────────────────────────────────────────┐
│                    Claude Agent Service                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐        ┌─────────────────────────────┐   │
│  │   Frontend   │◀──────▶│         Backend             │   │
│  │   (Next.js)  │  HTTP  │        (FastAPI)            │   │
│  │              │  SSE   │                             │   │
│  │  • 会话列表   │        │  • Session Manager          │   │
│  │  • 聊天界面   │        │  • Stream Handler           │   │
│  │  • Todo监控   │        │  • Claude SDK Integration   │   │
│  │  • 文件浏览   │        │                             │   │
│  └──────────────┘        └─────────────────────────────┘   │
│                                      │                        │
│                          ┌───────────┴──────────────┐        │
│                          │                          │        │
│                  ┌───────▼────────┐        ┌───────▼──────┐ │
│                  │   PostgreSQL   │        │    Redis     │ │
│                  │   (Sessions)   │        │   (Cache)    │ │
│                  └────────────────┘        └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## ✨ 功能特性

### 前端 (Next.js + React + TypeScript)
- 🎨 **Anthropic 品牌设计** - 官方配色和字体
- 🖥️ **三栏布局** - 会话列表 | 聊天界面 | 侧边栏(Todo/文件)
- 📡 **实时流式响应** - SSE 流式文本输出
- 🔧 **工具调用可视化** - 美观的工具执行展示
- ✅ **Todo 实时监控** - 自动提取和追踪 TodoWrite
- 📁 **文件浏览器** - 浏览工作空间文件
- 💾 **会话持久化** - Session ID 映射管理

### 后端 (FastAPI + PostgreSQL + Redis)
- 🔄 **多会话管理** - 支持同时运行多个 Claude Code 实例
- 🗄️ **数据库持久化** - PostgreSQL 存储会话和对话
- ⚡ **Redis 缓存** - 高性能会话信息缓存
- 🏗️ **模块化架构** - 清晰的分层设计
- 🔐 **Session 映射** - 系统 UUID ↔ Claude session ID
- 📊 **完整监控** - 成本、耗时、token 统计

## 🚀 快速开始

### 1. 环境配置

```bash
# 复制环境变量配置
cp .env.example .env

# 编辑 .env 填入必要配置
# 必须配置:
# - ANTHROPIC_AUTH_TOKEN
# - POSTGRES_PASSWORD
```

### 2. 启动所有服务

```bash
# 使用 Docker Compose 一键启动
docker-compose up -d

# 查看日志
docker-compose logs -f
```

### 3. 访问应用

- 🌐 **前端界面**: http://localhost:3000
- 📚 **API 文档**: http://localhost:8000/docs
- 🔍 **健康检查**: http://localhost:8000/health

## 📁 项目结构

```
claude-agent-service/
├── frontend/                  # Next.js 前端
│   ├── src/
│   │   ├── app/              # Next.js App Router
│   │   ├── components/       # 8 个 React 组件
│   │   ├── hooks/            # 3 个自定义 Hooks
│   │   ├── services/         # API 服务层
│   │   ├── contexts/         # React Context
│   │   ├── types/            # TypeScript 类型
│   │   └── styles/           # 全局样式
│   ├── Dockerfile
│   ├── package.json
│   └── [配置文件...]
├── backend/                   # FastAPI 后端
│   ├── app/
│   │   ├── core/             # 核心配置
│   │   ├── models/           # 数据库模型
│   │   ├── schemas/          # Pydantic 模式
│   │   ├── services/         # 业务逻辑
│   │   ├── api/              # API 路由
│   │   └── utils/            # 工具函数
│   ├── alembic/              # 数据库迁移
│   ├── Dockerfile.backend
│   ├── requirements.txt
│   └── [配置文件...]
├── docs/                      # 完整文档
│   ├── SESSION_ID_MAPPING.md
│   ├── DATABASE_MIGRATION.md
│   ├── STREAMING_API.md
│   ├── TOOL_CALLING_EVENTS.md
│   └── FRONTEND_INTEGRATION.md
├── examples/                  # 使用示例
│   ├── client_example.py
│   └── streaming_client.py
├── workspace/                 # 工作空间 (Docker volume)
├── docker-compose.yml         # 完整的 Docker 配置
├── Makefile                   # 常用命令
└── README.md                  # 本文件
```

## 🎨 前端界面

### 布局设计

```
┌─────────────┬──────────────────────────┬─────────────┐
│             │                          │             │
│  会话列表    │       聊天界面           │  侧边栏      │
│             │                          │             │
│  • Session1 │  User: 帮我创建项目      │  ┌─────────┐ │
│  • Session2 │                          │  │Todo|文件│ │
│  • Session3 │  Claude: 好的...          │  └─────────┘ │
│             │                          │             │
│  [+ New]    │  🔧 Tool: Bash           │  Todo列表:   │
│             │  ├─ command: mkdir       │  ✅ Task 1  │
│             │  └─ ✅ Success           │  🔧 Task 2  │
│             │                          │  ⭕ Task 3  │
│             │  Claude: 创建完成         │             │
│             │                          │  进度: 1/3   │
│             │  [输入框]                │             │
│             │                          │             │
└─────────────┴──────────────────────────┴─────────────┘
```

### Anthropic 品牌应用

**配色方案**:
- 主背景: `#faf9f5` (Light)
- 主文字: `#141413` (Dark)
- 强调色: `#d97757` (Orange) - 工具调用、按钮
- 辅助色: `#6a9bcc` (Blue) - 链接、info
- 成功色: `#788c5d` (Green) - 完成状态

**字体**:
- 标题: Poppins (sans-serif)
- 正文: Lora (serif)
- 代码: Monaco (monospace)

## 📡 流式响应

### 支持的事件类型

| 事件 | 说明 | 前端处理 |
|------|------|---------|
| `text_delta` | 文本片段 | 实时追加显示 |
| `tool_input_delta` | 工具参数流 | 显示构建进度 |
| `content_block_start` | 块开始 | 标记类型 |
| `tool_use` | 工具调用 | 显示工具卡片 |
| `tool_result` | 工具结果 | 显示执行结果 |
| `system` | 系统消息 | 捕获 session ID |
| `result` | 统计信息 | 显示成本/耗时 |
| `done` | 完成标记 | 结束对话 |

## 🛠️ 开发

### 本地开发

```bash
# 启动后端服务
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload

# 启动前端服务
cd frontend
npm install
npm run dev
```

### Docker 开发

```bash
# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f frontend
docker-compose logs -f backend

# 重启服务
docker-compose restart frontend
```

### 常用命令

```bash
# 前端
cd frontend
npm run dev          # 开发模式
npm run build        # 构建生产版本
npm run start        # 启动生产服务器

# 后端
cd backend
make dev             # 开发模式
make db-upgrade      # 运行迁移
make test            # 运行测试

# Docker
docker-compose build      # 构建镜像
docker-compose up -d      # 启动服务
docker-compose down       # 停止服务
docker-compose logs -f    # 查看日志
```

## 📊 API 端点

### 会话管理
- `POST /api/sessions` - 创建会话
- `GET /api/sessions` - 列出会话
- `GET /api/sessions/{id}` - 获取会话
- `DELETE /api/sessions/{id}` - 删除会话

### 聊天
- `POST /api/chat/stream` - 流式聊天 (SSE)

### 系统
- `GET /health` - 健康检查
- `GET /` - 根路径

## 🎯 核心特性展示

### 1. Todo 监控

前端会自动捕获 `TodoWrite` 工具调用:

```typescript
// 从 tool_use 事件中提取
if (tool.name === 'TodoWrite') {
  const todos = tool.input.todos;
  // 显示在右侧边栏
  updateTodoList(todos);
}
```

显示效果:
```
📋 Todo List (2/5 completed)

✅ 创建项目结构
🔧 实现API接口 (in progress)
⭕ 添加测试
⭕ 编写文档
⭕ 部署服务

Progress: ████░░░░░░ 40%
```

### 2. 工具调用展示

```
┌─────────────────────────────────────────┐
│ 🔧 Bash                        ⏳ 执行中 │
├─────────────────────────────────────────┤
│ Parameters:                             │
│   command: ls -la                       │
│   description: List files               │
│                                         │
│ ✅ Result:                              │
│   total 48                              │
│   drwxr-xr-x  10 user  staff   320     │
│   -rw-r--r--   1 user  staff  1024     │
└─────────────────────────────────────────┘
```

### 3. 会话管理

- 创建新会话
- 自动生成工作空间
- 会话历史记录
- 一键删除会话
- Claude session ID 映射

## 📖 文档

### 后端文档
- `docs/SESSION_ID_MAPPING.md` - Session ID 映射关系
- `docs/DATABASE_MIGRATION.md` - 数据库版本维护
- `docs/STREAMING_API.md` - 流式 API 详解
- `docs/TOOL_CALLING_EVENTS.md` - 工具调用事件
- `docs/FRONTEND_INTEGRATION.md` - 前端集成指南

### 前端文档
- `frontend/README.md` - 前端使用指南
- `frontend/IMPLEMENTATION.md` - 技术实现详解
- `frontend/PROJECT_SUMMARY.md` - 项目总结
- `frontend/CHECKLIST.md` - 实现检查清单

## 🔧 配置说明

### 环境变量

创建 `.env` 文件:

```bash
# Claude API (必须)
ANTHROPIC_AUTH_TOKEN=your_token_here

# Database (必须)
POSTGRES_PASSWORD=your_secure_password

# 可选配置
MAX_SESSIONS=100
REDIS_CACHE_TTL=3600
DEBUG=false
```

## 🚢 部署

### Docker 部署(推荐)

```bash
# 1. 配置环境变量
cp .env.example .env
# 编辑 .env

# 2. 构建并启动
docker-compose build
docker-compose up -d

# 3. 查看状态
docker-compose ps
docker-compose logs -f
```

### 访问服务

- 🌐 **前端**: http://localhost:3000
- 🔌 **后端 API**: http://localhost:8000
- 📚 **API 文档**: http://localhost:8000/docs
- 🗄️ **PostgreSQL**: localhost:5432
- 💾 **Redis**: localhost:6379

### 生产部署建议

1. **使用强密码**
```bash
POSTGRES_PASSWORD=$(openssl rand -base64 32)
```

2. **配置域名和 HTTPS**
```bash
# 使用 Nginx 反向代理
# 配置 SSL 证书
certbot --nginx -d yourdomain.com
```

3. **环境隔离**
```bash
# 前端环境变量
NEXT_PUBLIC_API_URL=https://api.yourdomain.com

# 后端 CORS 配置
CORS_ORIGINS=["https://yourdomain.com"]
```

## 💡 使用示例

### 创建会话并对话

1. 打开 http://localhost:3000
2. 点击左上角 "+ New Session"
3. 在中间聊天框输入消息
4. 实时查看:
   - AI 的回复(逐字显示)
   - 工具调用过程
   - 右侧的 Todo 更新
5. 切换到 "Files" 查看工作空间文件

### 工具调用示例

发送消息: "帮我创建一个 Python 项目"

前端会显示:
1. AI 回复: "我来帮你创建..."
2. 工具调用: Bash (mkdir project)
3. 工具结果: ✅ Success
4. 工具调用: Write (创建 main.py)
5. 工具结果: ✅ Success
6. AI 回复: "项目已创建完成"
7. Todo 更新显示在右侧

## 🧪 测试

### 前端测试

```bash
cd frontend
npm run build      # 测试构建
npm run lint       # 代码检查
```

### 后端测试

```bash
cd backend
make test          # 运行测试
make lint          # 代码检查
```

### 集成测试

```bash
# 1. 启动所有服务
docker-compose up -d

# 2. 测试健康检查
curl http://localhost:8000/health
curl http://localhost:3000

# 3. 运行示例客户端
python examples/streaming_client.py
```

## 📈 性能指标

- **前端**: 首屏加载 < 2s, Bundle 130KB
- **后端**: API 响应 < 100ms (缓存命中)
- **流式**: 首字节延迟 < 3s
- **数据库**: 连接池 20, 最大并发 40
- **并发**: 支持 100+ 会话同时在线

## 🛠️ 技术栈

### 前端
- Next.js 14 (App Router)
- React 18
- TypeScript (strict)
- Tailwind CSS
- Lucide React (icons)
- React Markdown

### 后端
- FastAPI 0.115
- PostgreSQL 16 + SQLAlchemy 2.0
- Redis 7 + redis-py
- Pydantic 2.9
- Alembic
- Claude Agent SDK

### DevOps
- Docker & Docker Compose
- Nginx (可选)
- PostgreSQL
- Redis

## 📝 TODO

- [ ] 添加文件浏览 API 端点到后端
- [ ] 添加用户认证
- [ ] 添加 WebSocket 支持(可选)
- [ ] 添加导出对话功能
- [ ] 添加 Prometheus 监控
- [ ] 添加单元测试覆盖

## 🐛 故障排查

### 前端无法连接后端

```bash
# 检查后端是否运行
curl http://localhost:8000/health

# 检查环境变量
cd frontend
cat .env.local
# 确保 NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Docker 容器无法启动

```bash
# 查看日志
docker-compose logs backend
docker-compose logs frontend

# 检查端口占用
lsof -i :3000
lsof -i :8000

# 重建容器
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### 数据库连接失败

```bash
# 检查 PostgreSQL
docker-compose ps postgres
docker-compose logs postgres

# 进入数据库
docker-compose exec postgres psql -U claude_agent -d claude_agent_db
```

## 📞 支持

如有问题,请查看:
- `docs/` 目录下的详细文档
- `examples/` 目录下的示例代码
- 项目 Issues

## 📄 License

MIT

## 🙏 贡献

欢迎提交 Issue 和 Pull Request!
