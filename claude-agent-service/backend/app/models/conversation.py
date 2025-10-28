"""
Conversation database model
"""
from sqlalchemy import Column, String, DateTime, Text, ForeignKey, Integer, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.core.database import Base


class Conversation(Base):
    """Conversation model"""
    __tablename__ = "conversations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String(36), ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False)

    user_message = Column(Text, nullable=False)
    assistant_response = Column(Text, nullable=True)

    # Store tool calls and results as JSON
    tool_calls = Column(JSON, nullable=True, comment="Tool calls with results [{id, name, input, result, is_error}]")

    permission_mode = Column(String(50), default="acceptEdits", nullable=False)
    resume_id = Column(String(100), nullable=True)
    max_turns = Column(Integer, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)

    # Relationship
    session = relationship("Session", back_populates="conversations")

    def __repr__(self):
        return f"<Conversation(id={self.id}, session_id={self.session_id})>"
