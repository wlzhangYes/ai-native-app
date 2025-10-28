"""
Session schemas
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class SessionCreate(BaseModel):
    """Create session request"""
    session_id: Optional[str] = Field(None, description="Custom session ID")
    workspace_name: Optional[str] = Field(None, description="Workspace folder name")


class SessionResponse(BaseModel):
    """Session response"""
    id: str
    claude_session_id: Optional[str] = None
    workspace_path: str
    workspace_name: Optional[str]
    created_at: datetime
    updated_at: datetime
    last_activity: datetime
    conversation_count: int
    is_active: bool

    class Config:
        from_attributes = True


class SessionListResponse(BaseModel):
    """Session list response"""
    sessions: list[SessionResponse]
    total: int
    skip: int
    limit: int
