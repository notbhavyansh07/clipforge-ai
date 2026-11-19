import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text
from backend.app.core.database import Base

class Channel(Base):
    __tablename__ = "channels"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    platform = Column(String(50), default="youtube") # youtube, instagram, tiktok
    channel_title = Column(String(255), nullable=True)
    channel_id = Column(String(255), nullable=True)
    access_token = Column(Text, nullable=False)
    refresh_token = Column(Text, nullable=True)
    token_expiry = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

