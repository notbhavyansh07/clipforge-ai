import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Integer, DateTime, JSON, Text, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

class Clip(Base):
    __tablename__ = "clips"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    video_id = Column(String(36), ForeignKey("videos.id", ondelete="CASCADE"), nullable=False)
    
    title = Column(String(255), nullable=False)
    hook_text = Column(String(512), nullable=True)
    description = Column(Text, nullable=True)
    
    start_time = Column(Float, nullable=False)
    end_time = Column(Float, nullable=False)
    duration = Column(Float, nullable=False)
    
    # Virality Metrics (0 - 100)
    virality_score = Column(Float, default=0.0)
    score_breakdown = Column(JSON, nullable=True) # {hook: 85, emotion: 70, pacing: 80, story: 90, trend: 75}
    virality_reason = Column(Text, nullable=True) # One-line explanation of viral potential
    
    # Edit & Generation Parameters
    status = Column(String(50), default="candidate") # candidate, rendering, rendered, published, failed
    output_path = Column(String(1024), nullable=True)
    thumbnail_path = Column(String(1024), nullable=True)
    
    # 10-Hour Live Stream Context (Location & Situation Radar)
    location = Column(String(255), nullable=True)
    incident_type = Column(String(100), nullable=True)
    stream_time_formatted = Column(String(50), nullable=True)
    
    captions_data = Column(JSON, nullable=True) # Edited or custom word timestamps and styles
    caption_style = Column(JSON, default=lambda: {
        "preset": "karaoke_bold",
        "primary_color": "&H00FFFF", # Yellow/Gold
        "highlight_color": "&H00FF00", # Neon Green
        "font_name": "Montserrat ExtraBold",
        "font_size": 24,
        "position": "center"
    })
    
    tags = Column(JSON, default=list) # Short-form tags: ["#shorts", "#gta6", ...]
    
    # YouTube Integration & Analytics Feedback
    youtube_video_id = Column(String(100), nullable=True)
    youtube_publish_time = Column(DateTime, nullable=True)
    scheduled_publish_time = Column(DateTime, nullable=True)
    views_count = Column(Integer, default=0)
    retention_rate = Column(Float, default=0.0) # percentage 0-100%
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    video = relationship("Video", back_populates="clips")

