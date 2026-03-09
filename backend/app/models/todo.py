from sqlalchemy import Column, Text, Date, TIMESTAMP, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.database import Base
from app.enums.todo_status import TodoStatus
import uuid


class Todo(Base):
    __tablename__ = "todos"

    todo_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    meeting_id = Column(
        UUID(as_uuid=True),
        ForeignKey("meetings.meeting_id"),
        nullable=False
    )

    task = Column(Text, nullable=False)

    due_date = Column(Date)

    status = Column(
        Enum(TodoStatus, name="todo_status"),
        nullable=False
    )

    created_at = Column(TIMESTAMP, server_default=func.now())