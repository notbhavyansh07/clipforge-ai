import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, JSON, Text
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

class Video(Base):
    __tablename__ = "videos"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(255), nullable=False)
    source_type = Column(String(50), nullable=False) # 'upload', 'youtube', 'twitch', 'livestream'
    source_url = Column(String(1024), nullable=True)
    file_path = Column(String(1024), nullable=True)
    duration = Column(Float, default=0.0)
    fps = Column(Float, default=30.0)
    width = Column(Integer, default=1920)
    height = Column(Integer, default=1080)
    
    # Permission & Creator Attribution
    has_permission = Column(Boolean, default=False, nullable=False)
    creator_name = Column(String(255), nullable=True)
    creator_url = Column(String(1024), nullable=True)
    
    status = Column(String(50), default="pending") # pending, downloading, transcribing, analyzing, ready, failed
    error_message = Column(Text, nullable=True)
    
    # Processed Analysis Data
    transcript = Column(JSON, nullable=True) # Full segments with word timestamps
    audio_metrics = Column(JSON, nullable=True) # RMS energy, laughter, speech pace
    scene_cuts = Column(JSON, nullable=True) # Transition timestamps
    
    is_live = Column(Boolean, default=False)
    stream_chunk_count = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    clips = relationship("Clip", back_populates="video", cascade="all, delete-orphan")

