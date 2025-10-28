# 数据库版本维护指南

本项目使用 Alembic 进行数据库版本管理和迁移。

## 目录

- [Alembic 简介](#alembic-简介)
- [项目配置](#项目配置)
- [迁移文件结构](#迁移文件结构)
- [常用命令](#常用命令)
- [创建迁移](#创建迁移)
- [应用迁移](#应用迁移)
- [回滚迁移](#回滚迁移)
- [最佳实践](#最佳实践)
- [故障排查](#故障排查)

## Alembic 简介

Alembic 是 SQLAlchemy 的数据库迁移工具,类似于 Django 的 migrations 或 Rails 的 ActiveRecord Migrations。

### 核心概念

- **Migration**: 数据库结构变更的脚本
- **Revision**: 每个迁移的唯一标识
- **Upgrade**: 应用迁移,更新数据库结构
- **Downgrade**: 回滚迁移,恢复之前的结构
- **Head**: 最新的迁移版本
- **Base**: 数据库的初始状态

## 项目配置

### 配置文件

```
alembic.ini              # Alembic 主配置文件
alembic/
├── env.py               # 迁移环境配置
├── script.py.mako       # 迁移文件模板
└── versions/            # 迁移脚本目录
    └── *.py             # 具体的迁移文件
```

### alembic.ini

```ini
[alembic]
script_location = alembic
file_template = %%(year)d%%(month).2d%%(day).2d_%%(hour).2d%%(minute).2d_%%(rev)s_%%(slug)s
prepend_sys_path = .
version_locations = %(here)s/alembic/versions
```

### env.py

```python
from app.core.database import Base
from app.core.config import settings
from app.models.session import Session
from app.models.conversation import Conversation

# 设置数据库 URL
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

# 设置 metadata
target_metadata = Base.metadata
```

## 迁移文件结构

### 文件命名规则

```
{year}{month}{day}_{hour}{minute}_{revision}_{slug}.py
```

示例:
```
20241024_1430_add_claude_session_id_add_claude_session_id_to_session_table.py
```

### 迁移文件模板

```python
"""描述迁移的内容

Revision ID: add_claude_session_id
Revises: previous_revision_id
Create Date: 2024-10-24 14:30:00

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers
revision: str = 'add_claude_session_id'
down_revision: Union[str, None] = 'previous_revision_id'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """应用迁移"""
    # 添加列
    op.add_column('sessions',
        sa.Column('claude_session_id', sa.String(100), nullable=True)
    )

    # 创建索引
    op.create_index('ix_sessions_claude_session_id',
                   'sessions', ['claude_session_id'])


def downgrade() -> None:
    """回滚迁移"""
    # 删除索引
    op.drop_index('ix_sessions_claude_session_id', 'sessions')

    # 删除列
    op.drop_column('sessions', 'claude_session_id')
```

## 常用命令

### 查看状态

```bash
# 查看当前数据库版本
alembic current

# 查看迁移历史
alembic history

# 查看详细历史(带 SQL)
alembic history --verbose

# 查看待应用的迁移
alembic show <revision_id>
```

### 创建迁移

```bash
# 自动生成迁移(推荐)
alembic revision --autogenerate -m "描述信息"

# 手动创建空白迁移
alembic revision -m "描述信息"

# 使用 Makefile
make migrate msg="Add new field"
```

### 应用迁移

```bash
# 升级到最新版本
alembic upgrade head

# 升级到特定版本
alembic upgrade <revision_id>

# 升级 N 个版本
alembic upgrade +2

# 使用 Makefile
make db-upgrade
```

### 回滚迁移

```bash
# 回滚到上一个版本
alembic downgrade -1

# 回滚到特定版本
alembic downgrade <revision_id>

# 回滚 N 个版本
alembic downgrade -2

# 回滚到初始状态
alembic downgrade base

# 使用 Makefile
make db-downgrade
```

### 其他命令

```bash
# 查看 SQL(不执行)
alembic upgrade head --sql

# 标记为已应用(不执行 SQL)
alembic stamp head

# 重置数据库
make db-reset  # downgrade base + upgrade head
```

## 创建迁移

### 1. 修改模型

```python
# app/models/session.py
class Session(Base):
    __tablename__ = "sessions"

    id = Column(String(36), primary_key=True)
    # 添加新字段
    new_field = Column(String(100), nullable=True)
```

### 2. 生成迁移

```bash
# 方式 1: 使用 Makefile
make migrate msg="Add new_field to session"

# 方式 2: 直接使用 alembic
alembic revision --autogenerate -m "Add new_field to session"
```

### 3. 检查生成的迁移

```python
# alembic/versions/20241024_xxxx_add_new_field_to_session.py

def upgrade() -> None:
    # 自动生成的升级逻辑
    op.add_column('sessions',
        sa.Column('new_field', sa.String(100), nullable=True)
    )

def downgrade() -> None:
    # 自动生成的回滚逻辑
    op.drop_column('sessions', 'new_field')
```

### 4. 应用迁移

```bash
# 方式 1: 使用 Makefile
make db-upgrade

# 方式 2: 直接使用 alembic
alembic upgrade head
```

## 应用迁移

### 本地开发环境

```bash
# 1. 启动数据库
docker-compose up -d postgres

# 2. 应用迁移
make db-upgrade

# 3. 查看结果
make psql
```

### Docker 环境

```bash
# 方式 1: 在启动时自动应用
# 修改 Dockerfile 或 docker-compose.yml
CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000"]

# 方式 2: 进入容器手动应用
docker-compose exec app alembic upgrade head
```

### 生产环境

```bash
# 1. 备份数据库
pg_dump -U claude_agent -d claude_agent_db > backup_$(date +%Y%m%d).sql

# 2. 查看待应用的迁移
alembic current
alembic history

# 3. 预览 SQL(可选)
alembic upgrade head --sql > migration.sql

# 4. 应用迁移
alembic upgrade head

# 5. 验证
alembic current
```

## 回滚迁移

### 紧急回滚

```bash
# 1. 回滚到上一个版本
alembic downgrade -1

# 2. 重启服务
docker-compose restart app
```

### 回滚到特定版本

```bash
# 1. 查看历史
alembic history

# 2. 回滚到目标版本
alembic downgrade <target_revision_id>

# 3. 验证
alembic current
```

### 完全重置

```bash
# 1. 回滚到初始状态
alembic downgrade base

# 2. 重新应用所有迁移
alembic upgrade head

# 或使用 Makefile
make db-reset
```

## 常见操作示例

### 添加列

```python
def upgrade():
    op.add_column('table_name',
        sa.Column('column_name', sa.String(100), nullable=True)
    )

def downgrade():
    op.drop_column('table_name', 'column_name')
```

### 修改列

```python
def upgrade():
    op.alter_column('table_name', 'column_name',
                   existing_type=sa.String(50),
                   type_=sa.String(100),
                   nullable=False)

def downgrade():
    op.alter_column('table_name', 'column_name',
                   existing_type=sa.String(100),
                   type_=sa.String(50),
                   nullable=True)
```

### 创建表

```python
def upgrade():
    op.create_table(
        'new_table',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
    )

def downgrade():
    op.drop_table('new_table')
```

### 删除表

```python
def upgrade():
    op.drop_table('old_table')

def downgrade():
    # 注意: 需要完整的表结构
    op.create_table(
        'old_table',
        sa.Column('id', sa.String(36), primary_key=True),
        # ... 其他列
    )
```

### 添加索引

```python
def upgrade():
    op.create_index('ix_table_column', 'table_name', ['column_name'])

def downgrade():
    op.drop_index('ix_table_column', 'table_name')
```

### 添加外键

```python
def upgrade():
    op.create_foreign_key(
        'fk_session_user',
        'sessions', 'users',
        ['user_id'], ['id'],
        ondelete='CASCADE'
    )

def downgrade():
    op.drop_constraint('fk_session_user', 'sessions', type_='foreignkey')
```

### 数据迁移

```python
from sqlalchemy import table, column, String

def upgrade():
    # 1. 添加新列
    op.add_column('sessions',
        sa.Column('new_status', sa.String(20), nullable=True)
    )

    # 2. 迁移数据
    sessions_table = table('sessions',
        column('id', String),
        column('old_status', String),
        column('new_status', String)
    )

    op.execute(
        sessions_table.update()
        .where(sessions_table.c.old_status == 'active')
        .values(new_status='running')
    )

    # 3. 设置为非空
    op.alter_column('sessions', 'new_status', nullable=False)

    # 4. 删除旧列
    op.drop_column('sessions', 'old_status')

def downgrade():
    # 反向操作
    op.add_column('sessions',
        sa.Column('old_status', sa.String(20), nullable=True)
    )
    # ... 数据迁移
    op.drop_column('sessions', 'new_status')
```

## 最佳实践

### 1. 迁移前准备

- ✅ **备份数据库**: 始终在应用迁移前备份
- ✅ **代码审查**: 检查自动生成的迁移文件
- ✅ **测试环境**: 先在测试环境验证
- ✅ **编写回滚**: 确保 downgrade 可用

### 2. 迁移文件编写

- ✅ **清晰描述**: 使用有意义的描述信息
- ✅ **单一职责**: 每个迁移只做一件事
- ✅ **可逆操作**: 确保可以安全回滚
- ✅ **数据安全**: 涉及数据迁移要特别小心

### 3. 命名规范

```bash
# 好的命名
alembic revision -m "Add claude_session_id to session table"
alembic revision -m "Create conversations table"
alembic revision -m "Add index on user_email"

# 不好的命名
alembic revision -m "update"
alembic revision -m "fix"
alembic revision -m "changes"
```

### 4. 版本控制

- ✅ **提交迁移**: 迁移文件必须提交到 Git
- ✅ **顺序执行**: 按照 Git 历史顺序应用
- ✅ **不要修改**: 已应用的迁移不要修改
- ✅ **团队协作**: 多人开发时注意冲突

### 5. 安全操作

```python
# ✅ 好的做法: 先允许 NULL,迁移数据后再设置 NOT NULL
def upgrade():
    # 1. 添加列(允许 NULL)
    op.add_column('sessions',
        sa.Column('new_field', sa.String(100), nullable=True)
    )

    # 2. 填充默认值
    op.execute("UPDATE sessions SET new_field = 'default' WHERE new_field IS NULL")

    # 3. 设置为 NOT NULL
    op.alter_column('sessions', 'new_field', nullable=False)

# ❌ 不好的做法: 直接添加 NOT NULL 列
def upgrade():
    op.add_column('sessions',
        sa.Column('new_field', sa.String(100), nullable=False)  # 如果表有数据会失败
    )
```

### 6. 生产环境检查清单

- [ ] 数据库已备份
- [ ] 迁移在测试环境验证通过
- [ ] 查看了迁移 SQL (`--sql` 参数)
- [ ] 评估了执行时间(大表操作)
- [ ] 准备了回滚方案
- [ ] 通知了相关人员
- [ ] 选择了低峰时段

## 故障排查

### 问题 1: 迁移冲突

```bash
# 错误: Multiple head revisions are present
alembic heads  # 查看多个 head

# 解决: 合并 heads
alembic merge -m "Merge heads" <rev1> <rev2>
```

### 问题 2: 数据库状态不一致

```bash
# 错误: Can't locate revision identified by 'xxx'

# 解决 1: 查看数据库版本
psql -U claude_agent -d claude_agent_db -c "SELECT * FROM alembic_version;"

# 解决 2: 手动标记版本
alembic stamp head

# 解决 3: 重置到已知版本
alembic stamp <known_revision_id>
```

### 问题 3: 自动生成的迁移不正确

```bash
# 1. 删除生成的迁移文件
rm alembic/versions/20241024_xxxx_*.py

# 2. 检查模型定义
# 确保所有模型都被导入到 env.py

# 3. 重新生成
alembic revision --autogenerate -m "description"

# 4. 手动编辑迁移文件
```

### 问题 4: 迁移执行失败

```bash
# 1. 查看详细错误
alembic upgrade head --verbose

# 2. 检查数据库连接
psql -U claude_agent -d claude_agent_db

# 3. 手动执行 SQL 调试
alembic upgrade head --sql > debug.sql

# 4. 回滚后重试
alembic downgrade -1
# 修复问题
alembic upgrade head
```

### 问题 5: 依赖环境变量

```bash
# 错误: ValidationError: Field required

# 解决: 确保环境变量已配置
cp .env.example .env
# 编辑 .env 填入必要配置

# 或者临时设置
export POSTGRES_PASSWORD=your_password
alembic upgrade head
```

## 数据库版本表

Alembic 在数据库中维护一个版本表:

```sql
-- 查看版本表
SELECT * FROM alembic_version;

-- 输出示例
 version_num
--------------------------
 add_claude_session_id

-- 手动更新版本(谨慎!)
UPDATE alembic_version SET version_num = 'target_revision_id';
```

## 团队协作流程

### 开发流程

```bash
# 1. 拉取最新代码
git pull origin main

# 2. 应用新的迁移
alembic upgrade head

# 3. 创建新功能和迁移
# ... 修改模型
alembic revision --autogenerate -m "Add feature"

# 4. 测试迁移
alembic upgrade head
alembic downgrade -1
alembic upgrade head

# 5. 提交代码
git add .
git commit -m "Add feature with migration"
git push
```

### 合并冲突

```bash
# 场景: 两个开发者同时创建了迁移

# 方法 1: 合并迁移
alembic merge -m "Merge migrations" <rev1> <rev2>

# 方法 2: 调整迁移顺序
# 修改迁移文件中的 down_revision
down_revision = 'previous_revision_id'
```

## 性能考虑

### 大表操作

```python
# ❌ 避免: 在大表上添加 NOT NULL 列
op.add_column('large_table',
    sa.Column('new_col', sa.String(100), nullable=False, server_default='default')
)

# ✅ 推荐: 分步操作
def upgrade():
    # 1. 添加列(nullable)
    op.add_column('large_table',
        sa.Column('new_col', sa.String(100), nullable=True)
    )

    # 2. 批量更新(分批)
    connection = op.get_bind()
    connection.execute("""
        UPDATE large_table
        SET new_col = 'default'
        WHERE new_col IS NULL
    """)

    # 3. 设置 NOT NULL
    op.alter_column('large_table', 'new_col', nullable=False)
```

### 索引创建

```python
# 在大表上创建索引时使用 CONCURRENTLY (PostgreSQL)
def upgrade():
    op.create_index(
        'ix_sessions_claude_session_id',
        'sessions',
        ['claude_session_id'],
        postgresql_concurrently=True  # 不锁表
    )
```

## 参考资源

- [Alembic 官方文档](https://alembic.sqlalchemy.org/)
- [SQLAlchemy 文档](https://docs.sqlalchemy.org/)
- [PostgreSQL 文档](https://www.postgresql.org/docs/)
- 项目 README: `README.md`
- 会话映射文档: `docs/SESSION_ID_MAPPING.md`
