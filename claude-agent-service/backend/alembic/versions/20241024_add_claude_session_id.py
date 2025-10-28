"""Add claude_session_id to session table

Revision ID: add_claude_session_id
Revises:
Create Date: 2024-10-24

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_claude_session_id'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create sessions table
    op.create_table(
        'sessions',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('claude_session_id', sa.String(length=100), nullable=True, comment='Claude SDK session ID for resuming conversations'),
        sa.Column('workspace_path', sa.String(length=500), nullable=False),
        sa.Column('workspace_name', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('last_activity', sa.DateTime(), nullable=False),
        sa.Column('conversation_count', sa.Integer(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('workspace_path')
    )
    op.create_index(op.f('ix_sessions_claude_session_id'), 'sessions', ['claude_session_id'], unique=False)

    # Create conversations table
    op.create_table(
        'conversations',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('session_id', sa.String(length=36), nullable=False),
        sa.Column('user_message', sa.Text(), nullable=False),
        sa.Column('assistant_response', sa.Text(), nullable=True),
        sa.Column('permission_mode', sa.String(length=50), nullable=False),
        sa.Column('resume_id', sa.String(length=100), nullable=True),
        sa.Column('max_turns', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['session_id'], ['sessions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    op.drop_table('conversations')
    op.drop_index(op.f('ix_sessions_claude_session_id'), table_name='sessions')
    op.drop_table('sessions')
