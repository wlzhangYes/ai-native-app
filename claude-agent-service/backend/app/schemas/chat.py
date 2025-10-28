"""
Chat schemas
"""
from pydantic import BaseModel, Field
from typing import Optional


class ChatRequest(BaseModel):
    """Chat request"""
    session_id: Optional[str] = Field(None, description="Session ID, auto-created if not provided")
    message: str = Field(..., description="User message")
    resume: Optional[str] = Field(None, description="Resume from conversation ID")
    max_turns: Optional[int] = Field(None, description="Maximum turns")
    permission_mode: Optional[str] = Field("acceptEdits", description="Permission mode")


class ChatStreamEvent(BaseModel):
    """Chat stream event"""
    type: str
    content: Optional[str] = None
    session_id: Optional[str] = None
    conversation_id: Optional[str] = None
    data: Optional[dict] = None
    error: Optional[str] = None
