from sqlalchemy import Column, ForeignKey, String, TIMESTAMP
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.database import Base
import uuid


class Workspace(Base):
    __tablename__ = "workspaces"

    workspace_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    owner_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.user_id"),
        nullable=False
    )
    created_at = Column(TIMESTAMP, server_default=func.now())
