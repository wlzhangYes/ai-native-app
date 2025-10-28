# 🚀 部署指南

## 快速部署

### 1. 克隆项目

```bash
git clone ssh://git@e.coding.anker-in.com:2222/codingcorp/AIME/claude-agent-service.git
cd claude-agent-service
```

### 2. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件
vim .env

# 必须配置:
ANTHROPIC_AUTH_TOKEN=sk-xxx                      # Claude API Token
POSTGRES_PASSWORD=your_secure_password_here      # 数据库密码

# 可选配置:
MAX_SESSIONS=100
REDIS_CACHE_TTL=3600
```

### 3. 启动服务

```bash
# 一键启动所有服务
./start-all.sh

# 或手动启动
docker-compose build
docker-compose up -d
```

### 4. 验证部署

```bash
# 检查服务状态
docker-compose ps

# 应该看到 4 个服务都是 healthy:
# ✓ claude-agent-postgres (healthy)
# ✓ claude-agent-redis (healthy)
# ✓ claude-agent-backend (healthy)
# ✓ claude-agent-frontend (healthy)

# 测试健康检查
curl http://localhost:8000/health
curl http://localhost:3000
```

### 5. 访问应用

- 🌐 前端: http://localhost:3000
- 📚 API 文档: http://localhost:8000/docs

## 🎯 部署检查清单

- [ ] 克隆项目
- [ ] 复制 .env.example 到 .env
- [ ] 设置 ANTHROPIC_AUTH_TOKEN
- [ ] 设置 POSTGRES_PASSWORD
- [ ] 运行 docker-compose build
- [ ] 运行 docker-compose up -d
- [ ] 检查所有服务 healthy
- [ ] 访问前端界面
- [ ] 测试创建会话
- [ ] 测试发送消息

## ⚙️ 环境变量说明

### 必需配置

```bash
# Claude API Token (必须)
ANTHROPIC_AUTH_TOKEN=sk-xxx

# 数据库密码 (必须)
POSTGRES_PASSWORD=your_password
```

### 可选配置

```bash
# 应用设置
APP_NAME=Claude Agent Service
DEBUG=false

# 数据库
POSTGRES_USER=claude_agent
POSTGRES_DB=claude_agent_db

# Redis
REDIS_CACHE_TTL=3600

# 服务配置
MAX_SESSIONS=100
WORKSPACE_ROOT=/workspace
```

## 🔧 常见问题

### Q: Docker build 失败?

```bash
# 清理并重建
docker-compose down -v
docker system prune -f
docker-compose build --no-cache
docker-compose up -d
```

### Q: 端口被占用?

```bash
# 检查端口占用
lsof -i :3000  # 前端
lsof -i :8000  # 后端
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis

# 修改 docker-compose.yml 中的端口映射
# 例如: "3001:3000"
```

### Q: 数据库迁移失败?

```bash
# 进入后端容器
docker-compose exec backend bash

# 手动运行迁移
alembic upgrade head

# 查看迁移状态
alembic current
```

### Q: 前端无法连接后端?

```bash
# 检查后端是否运行
docker-compose logs backend

# 检查网络
docker network inspect claude-agent-service_claude-network

# 在 docker-compose.yml 中,确保:
# frontend 的环境变量: NEXT_PUBLIC_API_URL=http://backend:8000
```

## 📝 Git 仓库信息

- **仓库地址**: ssh://git@e.coding.anker-in.com:2222/codingcorp/AIME/claude-agent-service.git
- **当前提交**: 已推送到 master 分支
- **包含**: 78 个文件, 18,234 行代码

## ✅ 部署完成

现在你可以:
1. ✅ 访问 http://localhost:3000 使用前端界面
2. ✅ 创建会话并开始对话
3. ✅ 实时查看流式响应
4. ✅ 观察工具调用过程
5. ✅ 监控 Todo 进度
6. ✅ 浏览工作空间文件

**享受 Claude Agent Service!** 🎉
