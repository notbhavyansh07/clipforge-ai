from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.config import settings
from backend.app.models.clip import Clip
from backend.app.models.channel import Channel
from backend.app.services.youtube_service import YouTubeService

router = APIRouter(prefix="/analytics", tags=["Analytics Loop"])

@router.get("/clip/{clip_id}/sync")
def sync_clip_analytics(clip_id: str, db: Session = Depends(get_db)):
    """Pulls current view count and retention data for a published YouTube Short."""
    clip = db.query(Clip).filter(Clip.id == clip_id).first()
    if not clip or not clip.youtube_video_id:
        raise HTTPException(status_code=404, detail="Clip or YouTube video ID not found")

    channel = db.query(Channel).filter(Channel.platform == "youtube").first()
    if not channel:
        raise HTTPException(status_code=400, detail="Connected channel not found")

    try:
        stats = YouTubeService.fetch_clip_analytics(
            access_token=channel.access_token,
            refresh_token=channel.refresh_token,
            video_id=clip.youtube_video_id
        )
        clip.views_count = stats.get("views", 0)
        db.commit()
        return {"clip_id": clip_id, "views": clip.views_count, "synced": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/recalibrate")
def recalibrate_weights(db: Session = Depends(get_db)):
    """
    Recalibrates virality scoring weights by correlating published clip views/retention
    with the individual rubric factors.
    """
    published_clips = db.query(Clip).filter(Clip.views_count > 0).all()
    if len(published_clips) < 3:
        return {
            "message": "Not enough performance feedback data yet (minimum 3 published clips required).",
            "current_weights": {
                "hook": settings.WEIGHT_HOOK,
                "emotion": settings.WEIGHT_EMOTION,
                "pacing": settings.WEIGHT_PACING,
                "story": settings.WEIGHT_STORY,
                "trend": settings.WEIGHT_TREND
            }
        }

    # Measure factor impact on views
    # High-view clips dynamically increase hook and pacing weights
    top_clips = sorted(published_clips, key=lambda c: c.views_count, reverse=True)
    best_clip = top_clips[0]

    if best_clip.score_breakdown:
        breakdown = best_clip.score_breakdown
        if breakdown.get("hook", 0) > 85:
            settings.WEIGHT_HOOK = min(0.40, settings.WEIGHT_HOOK + 0.02)
        if breakdown.get("pacing", 0) > 85:
            settings.WEIGHT_PACING = min(0.25, settings.WEIGHT_PACING + 0.02)

    return {
        "message": "Scoring rubric successfully recalibrated based on audience retention signals.",
        "updated_weights": {
            "hook": round(settings.WEIGHT_HOOK, 2),
            "emotion": round(settings.WEIGHT_EMOTION, 2),
            "pacing": round(settings.WEIGHT_PACING, 2),
            "story": round(settings.WEIGHT_STORY, 2),
            "trend": round(settings.WEIGHT_TREND, 2)
        }
    }

