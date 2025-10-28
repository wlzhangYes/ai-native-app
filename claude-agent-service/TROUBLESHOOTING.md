# 🔧 故障排查指南

## 当前问题: 前端不显示消息

### 问题分析

根据后端日志,流式接口返回了数据:
```json
{"type": "connected", "session_id": "..."}
{"type": "system", "subtype": "init", ...}
{"type": "result", "data": {"result": "你好!我是 Claude..."}}
{"type": "done", ...}
```

但**缺少 `text_delta` 事件**,这是因为:
- Claude SDK 0.1.4 可能不支持 `StreamEvent`
- 所以没有流式的文本片段
- 文本内容在 `result.data.result` 字段中

### 解决方案

✅ 已添加 fallback 逻辑:当没有 `text_delta` 时,从 `result.data.result` 获取文本

## 📝 部署和测试

### 1. 在测试服务器拉取最新代码

```bash
cd claude-agent-service
git pull
```

### 2. 重新构建并启动

```bash
# 重新构建后端(因为添加了 Claude Code CLI)
docker-compose build --no-cache backend

# 重新构建前端(因为修复了事件处理)
docker-compose build --no-cache frontend

# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f
```

### 3. 测试前端

打开浏览器: http://172.16.18.184:3000

1. 创建新会话
2. 发送消息: "你好"
3. 打开浏览器开发者工具(F12) → Console 标签
4. 应该看到:
   ```
   Stream connected: 4cc15e29-...
   System message: init
   ```
5. 消息应该显示在聊天界面

### 4. 如果还是不显示

#### 检查 1: 浏览器 Console
```javascript
// 查看是否有错误
// 查看是否收到事件
```

#### 检查 2: Network 标签
- 找到 `/api/chat/stream` 请求
- 查看 Response 标签
- 应该看到 SSE 数据流

#### 检查 3: 后端日志
```bash
docker-compose logs backend --tail=100
```
应该看到:
```
INFO: Starting stream for session xxx, message: 你好...
INFO: Creating Claude SDK client...
INFO: Sending query to Claude...
INFO: Query sent, waiting for response...
```

## 🐛 已知问题和解决方案

### 问题 1: text_delta 事件缺失

**原因**: SDK 版本不支持 StreamEvent

**解决**: ✅ 已添加 fallback,从 `result.data.result` 获取文本

### 问题 2: 数据库 AsyncSession 错误

**原因**: 使用了错误的方式创建 AsyncSession

**解决**: ✅ 已修复,使用 `AsyncSessionLocal()`

### 问题 3: Claude Code CLI 未安装

**原因**: Docker 容器没有 Node.js 和 Claude CLI

**解决**: ✅ 已在 Dockerfile 中添加

### 问题 4: Redis 密码认证失败

**原因**: 空字符串被当作密码

**解决**: ✅ 已修复,检查空字符串

### 问题 5: 前端 API URL 错误

**原因**: 环境变量在构建时未注入

**解决**: ✅ 添加运行时配置注入

## 🔍 调试命令

### 查看所有容器状态
```bash
docker-compose ps
```

### 查看特定服务日志
```bash
docker-compose logs backend --tail=50
docker-compose logs frontend --tail=50
```

### 进入容器调试
```bash
# 进入后端
docker-compose exec backend bash
python -c "from claude_agent_sdk import ClaudeSDKClient; print('SDK OK')"
claude --version  # 检查 Claude Code CLI

# 进入前端
docker-compose exec frontend sh
cat /app/public/config.js  # 检查运行时配置
```

### 测试 API
```bash
# 测试健康检查
curl http://172.16.18.184:8000/health

# 测试会话列表
curl http://172.16.18.184:8000/api/sessions

# 测试流式聊天
curl -X POST http://172.16.18.184:8000/api/chat/stream \
  -H "Content-Type: application/json" \
  -d '{"message": "你好"}' \
  --no-buffer
```

## 📊 当前状态

### 已推送的修复 (最近 3 个)
```
dd2fed0 - feat: Handle connected and system events
9aa354f - fix: Fallback to result.result when text_delta not available
2f5c840 - fix: Use AsyncSessionLocal
e21529a - fix: Install Claude Code CLI
```

### 下一步

1. 在测试服务器: `git pull`
2. 重新构建: `docker-compose build --no-cache`
3. 启动: `docker-compose up -d`
4. 测试前端: http://172.16.18.184:3000
5. 查看浏览器 Console,应该看到消息显示

## 🎯 预期结果

发送 "你好" 后,前端应该显示:

```
User: 你好

Claude: 你好!我是 Claude,很高兴为你提供帮助。

我是一个交互式命令行工具,可以帮助你完成各种软件工程任务...

💰 $0.0074 | ⏱ 4.8s | 🔄 1 turn
```

如果还有问题,请提供:
1. 浏览器 Console 的输出
2. Network 标签中 stream 请求的 Response
3. 后端最新日志

**所有修复已推送,请重新构建和部署!** 🚀
