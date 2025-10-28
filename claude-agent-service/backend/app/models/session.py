"""
Session database model
"""
from sqlalchemy import Column, String, DateTime, Integer, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.core.database import Base


class Session(Base):
    """Session model"""
    __tablename__ = "sessions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    claude_session_id = Column(String(100), nullable=True, index=True, comment="Claude SDK session ID for resuming conversations")

    workspace_path = Column(String(500), nullable=False, unique=True)
    workspace_name = Column(String(255), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    last_activity = Column(DateTime, default=datetime.utcnow, nullable=False)

    conversation_count = Column(Integer, default=0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    # Relationship
    conversations = relationship("Conversation", back_populates="session", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Session(id={self.id}, claude_session_id={self.claude_session_id}, workspace={self.workspace_name})>"
