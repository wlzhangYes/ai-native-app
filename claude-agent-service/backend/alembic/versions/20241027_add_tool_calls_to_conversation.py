"""Add tool_calls column to conversation table

Revision ID: add_tool_calls
Revises: add_claude_session_id
Create Date: 2024-10-27

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'add_tool_calls'
down_revision: Union[str, None] = 'add_claude_session_id'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add tool_calls JSON column
    op.add_column('conversations',
        sa.Column('tool_calls', sa.JSON(), nullable=True,
                 comment='Tool calls with results [{id, name, input, result, is_error}]')
    )


def downgrade() -> None:
    # Remove tool_calls column
    op.drop_column('conversations', 'tool_calls')
