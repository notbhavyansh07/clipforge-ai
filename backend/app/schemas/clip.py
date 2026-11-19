from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

class ScoreBreakdown(BaseModel):
    hook: float = Field(..., description="Hook strength in first 3s (30%)")
    emotion: float = Field(..., description="Emotional & tonal peak intensity (20%)")
    pacing: float = Field(..., description="Pacing and energetic delivery (20%)")
    story: float = Field(..., description="Story clarity and payoff completeness (15%)")
    trend: float = Field(..., description="Trending keyword and cultural relevance (15%)")

class ClipBase(BaseModel):
    id: str
    video_id: str
    title: str
    hook_text: Optional[str] = None
    description: Optional[str] = None
    start_time: float
    end_time: float
    duration: float
    virality_score: float
    score_breakdown: Optional[Dict[str, float]] = None
    virality_reason: Optional[str] = None
    status: str
    output_path: Optional[str] = None
    thumbnail_path: Optional[str] = None
    location: Optional[str] = None
    incident_type: Optional[str] = None
    stream_time_formatted: Optional[str] = None
    caption_style: Optional[Dict[str, Any]] = None
    tags: List[str] = []
    youtube_video_id: Optional[str] = None
    scheduled_publish_time: Optional[datetime] = None
    views_count: Optional[int] = 0
    retention_rate: Optional[float] = 0.0
    created_at: datetime

    class Config:
        from_attributes = True

class ClipUpdate(BaseModel):
    title: Optional[str] = None
    start_time: Optional[float] = None
    end_time: Optional[float] = None
    description: Optional[str] = None
    caption_style: Optional[Dict[str, Any]] = None
    tags: Optional[List[str]] = None

class ClipRenderRequest(BaseModel):
    aspect_ratio: str = "9:16"
    enable_face_tracking: bool = True
    enable_animated_captions: bool = True
    enable_silence_trim: bool = True
    enable_audio_normalization: bool = True
    caption_preset: str = "karaoke_bold"
    color_preset: str = "viral_vibrant"
    enable_punch_in_zoom: bool = True
    enable_retention_bar: bool = True
    split_screen: bool = False
    split_layout: Optional[str] = "gaming_stacked_50_50"
    hook_headline: Optional[str] = None

