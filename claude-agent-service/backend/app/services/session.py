"""
Session management service
"""
from typing import Optional
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete as sql_delete
from pathlib import Path

from app.models.session import Session
from app.models.conversation import Conversation
from app.services.workspace import workspace_service
from app.services.cache import cache_service
from app.core.config import settings


class SessionService:
    """Session management service"""

    def __init__(self):
        self.max_sessions = settings.MAX_SESSIONS

    async def create_session(
        self,
        db: AsyncSession,
        session_id: Optional[str] = None,
        workspace_name: Optional[str] = None
    ) -> Session:
        """Create a new session"""
        import uuid

        # Check session limit
        count_stmt = select(Session).where(Session.is_active == True)
        result = await db.execute(count_stmt)
        active_count = len(result.scalars().all())

        if active_count >= self.max_sessions:
            raise ValueError(f"Maximum number of sessions ({self.max_sessions}) reached")

        # Generate session ID if not provided (must be UUID format)
        if not session_id:
            session_id = str(uuid.uuid4())

        # Create workspace
        workspace_path = await workspace_service.create_workspace(
            session_id=session_id,
            workspace_name=workspace_name
        )

        # Create session in database
        session = Session(
            id=session_id,  # Explicitly set the ID
            workspace_path=str(workspace_path),
            workspace_name=workspace_name or workspace_path.name
        )

        db.add(session)
        await db.flush()
        await db.refresh(session)

        # Cache session info
        await self._cache_session(session)

        return session

    async def get_session(self, db: AsyncSession, session_id: str) -> Optional[Session]:
        """Get session by ID"""

        # Try to get from cache first
        cached = await cache_service.get_session_info(session_id)
        if cached:
            # Verify session still exists in DB
            stmt = select(Session).where(Session.id == session_id)
            result = await db.execute(stmt)
            session = result.scalar_one_or_none()
            if session:
                return session

        # Get from database
        stmt = select(Session).where(Session.id == session_id)
        result = await db.execute(stmt)
        session = result.scalar_one_or_none()

        if session:
            await self._cache_session(session)

        return session

    async def list_sessions(
        self,
        db: AsyncSession,
        skip: int = 0,
        limit: int = 100,
        active_only: bool = True
    ) -> tuple[list[Session], int]:
        """List all sessions"""

        # Build query
        stmt = select(Session)
        if active_only:
            stmt = stmt.where(Session.is_active == True)

        stmt = stmt.order_by(Session.created_at.desc())

        # Count total
        count_stmt = select(Session)
        if active_only:
            count_stmt = count_stmt.where(Session.is_active == True)

        count_result = await db.execute(count_stmt)
        total = len(count_result.scalars().all())

        # Get sessions
        stmt = stmt.offset(skip).limit(limit)
        result = await db.execute(stmt)
        sessions = result.scalars().all()

        return list(sessions), total

    async def update_session_activity(
        self,
        db: AsyncSession,
        session_id: str,
        increment_conversation: bool = True,
        claude_session_id: Optional[str] = None
    ) -> Optional[Session]:
        """Update session last activity and Claude session ID"""

        stmt = select(Session).where(Session.id == session_id)
        result = await db.execute(stmt)
        session = result.scalar_one_or_none()

        if not session:
            return None

        session.last_activity = datetime.utcnow()
        if increment_conversation:
            session.conversation_count += 1

        # Update Claude session ID if provided
        if claude_session_id:
            session.claude_session_id = claude_session_id

        await db.flush()
        await db.refresh(session)

        # Update cache
        await self._cache_session(session)

        return session

    async def delete_session(self, db: AsyncSession, session_id: str) -> bool:
        """Delete a session"""

        # Get session
        session = await self.get_session(db, session_id)
        if not session:
            return False

        # Delete workspace
        workspace_path = Path(session.workspace_path)
        await workspace_service.delete_workspace(workspace_path)

        # Delete from database (cascade will handle conversations)
        stmt = sql_delete(Session).where(Session.id == session_id)
        await db.execute(stmt)

        # Delete from cache
        await cache_service.delete_session_info(session_id)

        return True

    async def create_conversation(
        self,
        db: AsyncSession,
        session_id: str,
        user_message: str,
        permission_mode: str = "acceptEdits",
        resume_id: Optional[str] = None,
        max_turns: Optional[int] = None
    ) -> Conversation:
        """Create a conversation record"""

        conversation = Conversation(
            session_id=session_id,
            user_message=user_message,
            permission_mode=permission_mode,
            resume_id=resume_id,
            max_turns=max_turns
        )

        db.add(conversation)
        await db.flush()
        await db.refresh(conversation)

        return conversation

    async def update_conversation_response(
        self,
        db: AsyncSession,
        conversation_id: str,
        response: str,
        tool_calls: list = None
    ) -> Optional[Conversation]:
        """Update conversation with assistant response and tool calls"""

        stmt = select(Conversation).where(Conversation.id == conversation_id)
        result = await db.execute(stmt)
        conversation = result.scalar_one_or_none()

        if not conversation:
            return None

        conversation.assistant_response = response
        conversation.tool_calls = tool_calls  # Save tool calls
        conversation.completed_at = datetime.utcnow()

        await db.flush()
        await db.refresh(conversation)

        return conversation

    async def _cache_session(self, session: Session):
        """Cache session info"""
        session_info = {
            "id": session.id,
            "claude_session_id": session.claude_session_id,
            "workspace_path": session.workspace_path,
            "workspace_name": session.workspace_name,
            "created_at": session.created_at.isoformat(),
            "last_activity": session.last_activity.isoformat(),
            "conversation_count": session.conversation_count,
            "is_active": session.is_active
        }

        await cache_service.set_session_info(session.id, session_info)


# Global session service instance
session_service = SessionService()
