"""
Session API endpoints
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.core.database import get_db
from app.services.session import session_service
from app.schemas.session import SessionCreate, SessionResponse, SessionListResponse
from app.models.conversation import Conversation

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


class ConversationMessage(BaseModel):
    """Conversation message for API response"""
    id: str
    role: str
    content: str
    tool_calls: Optional[List[dict]] = None  # Tool calls with results
    timestamp: str

    class Config:
        from_attributes = True


class MessageHistoryResponse(BaseModel):
    """Message history response"""
    messages: List[ConversationMessage]
    total: int


@router.post("", response_model=SessionResponse, status_code=201)
async def create_session(
    request: SessionCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new session"""
    try:
        session = await session_service.create_session(
            db=db,
            session_id=request.session_id,
            workspace_name=request.workspace_name
        )
        await db.commit()
        return session
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create session: {str(e)}")


@router.get("", response_model=SessionListResponse)
async def list_sessions(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    active_only: bool = Query(True),
    db: AsyncSession = Depends(get_db)
):
    """List all sessions"""
    try:
        sessions, total = await session_service.list_sessions(
            db=db,
            skip=skip,
            limit=limit,
            active_only=active_only
        )
        return SessionListResponse(
            sessions=sessions,
            total=total,
            skip=skip,
            limit=limit
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list sessions: {str(e)}")


@router.get("/{session_id}", response_model=SessionResponse)
async def get_session(
    session_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get session by ID"""
    session = await session_service.get_session(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail=f"Session {session_id} not found")
    return session


@router.delete("/{session_id}")
async def delete_session(
    session_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Delete a session"""
    try:
        success = await session_service.delete_session(db, session_id)
        if not success:
            raise HTTPException(status_code=404, detail=f"Session {session_id} not found")

        await db.commit()
        return {"message": f"Session {session_id} deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete session: {str(e)}")


@router.get("/{session_id}/messages", response_model=MessageHistoryResponse)
async def get_session_messages(
    session_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: AsyncSession = Depends(get_db)
):
    """
    Get conversation history for a session

    Returns messages in chronological order (oldest first).
    Each conversation contains a user message and optionally an assistant response.
    """
    # Verify session exists
    session = await session_service.get_session(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail=f"Session {session_id} not found")

    # Get conversations for this session
    stmt = (
        select(Conversation)
        .where(Conversation.session_id == session_id)
        .order_by(Conversation.created_at.asc())  # Chronological order
        .offset(skip)
        .limit(limit)
    )
    result = await db.execute(stmt)
    conversations = result.scalars().all()

    # Convert to messages (user + assistant pairs)
    messages: List[ConversationMessage] = []

    for conv in conversations:
        # Add user message
        messages.append(ConversationMessage(
            id=f"{conv.id}-user",
            role="user",
            content=conv.user_message,
            timestamp=conv.created_at.isoformat()
        ))

        # Add assistant response if available
        if conv.assistant_response:
            messages.append(ConversationMessage(
                id=f"{conv.id}-assistant",
                role="assistant",
                content=conv.assistant_response,
                tool_calls=conv.tool_calls,  # Include tool calls
                timestamp=conv.completed_at.isoformat() if conv.completed_at else conv.created_at.isoformat()
            ))

    # Get total count
    count_stmt = select(Conversation).where(Conversation.session_id == session_id)
    count_result = await db.execute(count_stmt)
    total_conversations = len(count_result.scalars().all())

    return MessageHistoryResponse(
        messages=messages,
        total=total_conversations * 2  # Approximate (user + assistant)
    )
