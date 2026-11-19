from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, HttpUrl, Field

class VideoCreateURL(BaseModel):
    url: str
    has_permission: bool = Field(..., description="Confirmation that user owns the content or has explicit clipping permission")
    creator_name: Optional[str] = None
    creator_url: Optional[str] = None
    is_live: bool = False

class WordTimestamp(BaseModel):
    word: str
    start: float
    end: float
    probability: float = 1.0

class TranscriptSegment(BaseModel):
    id: int
    start: float
    end: float
    text: str
    words: List[WordTimestamp] = []

class VideoBase(BaseModel):
    id: str
    title: str
    source_type: str
    source_url: Optional[str] = None
    duration: float
    fps: float
    width: int
    height: int
    has_permission: bool
    creator_name: Optional[str] = None
    creator_url: Optional[str] = None
    status: str
    error_message: Optional[str] = None
    is_live: bool
    created_at: datetime

    class Config:
        from_attributes = True

class VideoDetail(VideoBase):
    transcript: Optional[List[Dict[str, Any]]] = None
    audio_metrics: Optional[Dict[str, Any]] = None
    scene_cuts: Optional[List[float]] = None
