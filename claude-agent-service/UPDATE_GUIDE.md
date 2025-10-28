# 🔄 更新数据库表结构指南

## 快速更新(推荐)

在项目根目录运行:

```bash
./update-database.sh
```

这个脚本会自动:
1. 检查后端容器状态
2. 显示当前数据库版本
3. 运行所有待执行的迁移
4. 验证新版本

## 手动更新步骤

### 步骤 1: 查看当前版本

```bash
docker-compose exec backend alembic current
```

输出示例:
```
add_claude_session_id (head)
```

### 步骤 2: 查看待执行的迁移

```bash
docker-compose exec backend alembic history
```

应该看到:
```
add_claude_session_id -> add_tool_calls (head)
<base> -> add_claude_session_id
```

### 步骤 3: 运行迁移

```bash
docker-compose exec backend alembic upgrade head
```

输出示例:
```
INFO  [alembic.runtime.migration] Running upgrade add_claude_session_id -> add_tool_calls, Add tool_calls column
```

### 步骤 4: 验证

```bash
# 检查新版本
docker-compose exec backend alembic current

# 应该显示:
# add_tool_calls (head)

# 进入数据库查看
docker-compose exec postgres psql -U claude_agent -d claude_agent_db -c "\d conversations"

# 应该看到 tool_calls 列
```

## 📋 本次更新的表结构

### 1. sessions 表 (已有)
```sql
ALTER TABLE sessions
ADD COLUMN claude_session_id VARCHAR(100);

CREATE INDEX ix_sessions_claude_session_id
ON sessions(claude_session_id);
```

### 2. conversations 表 (本次新增)
```sql
ALTER TABLE conversations
ADD COLUMN tool_calls JSON;

COMMENT ON COLUMN conversations.tool_calls IS
'Tool calls with results [{id, name, input, result, is_error}]';
```

## 🐛 故障排查

### 问题 1: 后端容器未运行

```bash
docker-compose up -d backend
# 等待容器启动
sleep 5
# 再执行迁移
docker-compose exec backend alembic upgrade head
```

### 问题 2: 迁移失败

```bash
# 查看详细错误
docker-compose exec backend alembic upgrade head --verbose

# 查看数据库连接
docker-compose exec postgres psql -U claude_agent -d claude_agent_db -c "SELECT version();"
```

### 问题 3: 版本冲突

```bash
# 回滚到上一个版本
docker-compose exec backend alembic downgrade -1

# 重新升级
docker-compose exec backend alembic upgrade head
```

### 问题 4: 表已存在

如果之前手动创建过列,可能会报错。解决方案:

```bash
# 选项 A: 标记为已应用(不执行SQL)
docker-compose exec backend alembic stamp head

# 选项 B: 手动删除列后重新迁移
docker-compose exec postgres psql -U claude_agent -d claude_agent_db -c "ALTER TABLE conversations DROP COLUMN IF EXISTS tool_calls;"
docker-compose exec backend alembic upgrade head
```

## ✅ 验证迁移成功

### 检查 1: 版本正确

```bash
docker-compose exec backend alembic current
# 应该显示: add_tool_calls (head)
```

### 检查 2: 表结构正确

```bash
docker-compose exec postgres psql -U claude_agent -d claude_agent_db

# 在 psql 中:
\d conversations

# 应该看到:
# tool_calls | jsonb |
```

### 检查 3: 应用功能正常

1. 重启后端: `docker-compose restart backend`
2. 发送消息测试工具调用
3. 查询历史消息,应该包含 tool_calls

## 📝 迁移文件位置

```
backend/alembic/versions/
├── 20241024_add_claude_session_id.py
└── 20241027_add_tool_calls_to_conversation.py  # 新增
```

## 🎯 完成后

迁移完成后,重启后端生效:

```bash
docker-compose restart backend
```

现在可以:
- ✅ 保存工具调用到数据库
- ✅ 加载历史对话(包含工具调用)
- ✅ 显示完整的对话历史

---

**运行 `./update-database.sh` 即可完成数据库更新!** 🚀
