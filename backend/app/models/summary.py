from sqlalchemy import Column, TIMESTAMP, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.database import Base


class Summary(Base):
    __tablename__ = "summaries"

    meeting_id = Column(
        UUID(as_uuid=True),
        ForeignKey("meetings.meeting_id"),
        primary_key=True
    )

    summary_text = Column(Text, nullable=False)

    decisions_text = Column(Text, nullable=False)

    created_at = Column(TIMESTAMP, server_default=func.now())