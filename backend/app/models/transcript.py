from sqlalchemy import Column, TIMESTAMP, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.database import Base


class Transcript(Base):
    __tablename__ = "transcripts"

    meeting_id = Column(
        UUID(as_uuid=True),
        ForeignKey("meetings.meeting_id"),
        primary_key=True
    )

    full_text = Column(Text, nullable=False)

    created_at = Column(TIMESTAMP, server_default=func.now())