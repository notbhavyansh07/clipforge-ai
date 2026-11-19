from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel

class PublishRequest(BaseModel):
    clip_id: str
    channel_id: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[List[str]] = None
    scheduled_at: Optional[datetime] = None
    include_attribution: bool = True
    privacy_status: str = "public" # public, unlisted, private

class PublishResponse(BaseModel):
    success: bool
    platform: str
    video_id: Optional[str] = None
    video_url: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    message: str

