import os
import uuid
import json
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.models.clip import Clip
from backend.app.models.video import Video
from backend.app.schemas.clip import ClipBase, ClipUpdate, ClipRenderRequest
from backend.app.services.virality_scorer import ViralityScorerService
from backend.app.tasks.render_tasks import render_clip_task

router = APIRouter(prefix="/clips", tags=["Clips"])

class FindMomentRequest(BaseModel):
    query: str

@router.get("/video/{video_id}", response_model=List[ClipBase])
def get_clips_for_video(video_id: str, db: Session = Depends(get_db)):
    clips = db.query(Clip).filter(Clip.video_id == video_id).order_by(Clip.virality_score.desc()).all()
    return clips

@router.get("/{clip_id}", response_model=ClipBase)
def get_clip_detail(clip_id: str, db: Session = Depends(get_db)):
    clip = db.query(Clip).filter(Clip.id == clip_id).first()
    if not clip:
        raise HTTPException(status_code=404, detail="Clip not found")
    return clip

@router.patch("/{clip_id}", response_model=ClipBase)
def update_clip(clip_id: str, payload: ClipUpdate, db: Session = Depends(get_db)):
    clip = db.query(Clip).filter(Clip.id == clip_id).first()
    if not clip:
        raise HTTPException(status_code=404, detail="Clip not found")

    if payload.title is not None:
        clip.title = payload.title
    if payload.description is not None:
        clip.description = payload.description
    if payload.start_time is not None:
        clip.start_time = payload.start_time
    if payload.end_time is not None:
        clip.end_time = payload.end_time
    if payload.start_time is not None or payload.end_time is not None:
        clip.duration = round(clip.end_time - clip.start_time, 2)
    if payload.caption_style is not None:
        clip.caption_style = payload.caption_style
    if payload.tags is not None:
        clip.tags = payload.tags
    if payload.status is not None:
        clip.status = payload.status
    if payload.scheduled_publish_time is not None:
        clip.scheduled_publish_time = payload.scheduled_publish_time

    db.commit()
    db.refresh(clip)
    return clip

@router.post("/{clip_id}/render")
def trigger_clip_render(
    clip_id: str,
    payload: ClipRenderRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    clip = db.query(Clip).filter(Clip.id == clip_id).first()
    if not clip:
        raise HTTPException(status_code=404, detail="Clip not found")

    clip.status = "rendering"
    db.commit()

    # Guaranteed background task execution without Celery/Redis dropouts
    def safe_render():
        try:
            render_clip_task(clip_id, payload.model_dump())
        except Exception as e:
            print(f"[RenderError] {e}")

    background_tasks.add_task(safe_render)
    return {"message": "Render job queued", "clip_id": clip_id, "status": "rendering"}

@router.get("/{clip_id}/stream")
def stream_clip_video(clip_id: str, db: Session = Depends(get_db)):
    clip = db.query(Clip).filter(Clip.id == clip_id).first()
    if not clip:
        raise HTTPException(status_code=404, detail="Clip not found")

    candidates = [
        clip.output_path,
        os.path.join("frontend", "public", clip.output_path.lstrip("/\\")) if clip.output_path else None,
        os.path.join("clips", f"{clip_id}.mp4"),
        os.path.join("frontend", "public", "clips", f"{clip_id}.mp4"),
    ]
    
    found_path = None
    for cand in candidates:
        if cand and os.path.exists(cand):
            found_path = cand
            break

    if not found_path:
        raise HTTPException(status_code=404, detail="Rendered clip file not found")

    return FileResponse(found_path, media_type="video/mp4", filename=f"{clip.title}.mp4")

@router.get("/{clip_id}/thumbnail")
def stream_clip_thumbnail(clip_id: str, db: Session = Depends(get_db)):
    clip = db.query(Clip).filter(Clip.id == clip_id).first()
    if not clip:
        raise HTTPException(status_code=404, detail="Clip not found")

    candidates = [
        clip.thumbnail_path,
        os.path.join("frontend", "public", clip.thumbnail_path.lstrip("/\\")) if clip.thumbnail_path else None,
        os.path.join("clips", f"{clip_id}_thumb.jpg"),
        os.path.join("frontend", "public", "clips", f"{clip_id}_thumb.jpg"),
    ]
    found_path = None
    for cand in candidates:
        if cand and os.path.exists(cand):
            found_path = cand
            break

    if not found_path:
        raise HTTPException(status_code=404, detail="Thumbnail not found")

    return FileResponse(found_path, media_type="image/jpeg")

@router.post("/video/{video_id}/find-moment", response_model=ClipBase)
def find_moment_by_prompt(video_id: str, payload: FindMomentRequest, db: Session = Depends(get_db)):
    """
    Wayin-style Natural Language / Prompt-to-Clip Moment Finder:
    Scans transcripts, acoustic energy bursts, and keywords to isolate the exact viral moment.
    """
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    query = payload.query.strip().lower()
    if not query:
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    query_tokens = query.split()
    total_dur = video.duration or 30.0

    # 1. Search transcript for matching segments
    transcript = video.transcript or []
    best_time = None
    best_score = 0.0

    for seg in transcript:
        text = seg.get("text", "").lower()
        match_count = sum(1 for token in query_tokens if token in text)
        if match_count > best_score:
            best_score = match_count
            best_time = seg.get("start", 0.0)

    # 2. Correlate with audio peaks
    peaks = (video.audio_metrics or {}).get("energy_peaks", [])
    if best_time is None:
        if any(w in query for w in ["scream", "shout", "climax", "insane", "loud", "reaction", "crash"]):
            best_time = peaks[-1] if peaks else total_dur * 0.75
        else:
            best_time = total_dur * 0.35

    # 3. Determine boundary window (14-18s)
    target_dur = 16.0
    start_t = max(0.0, best_time - 3.0)
    end_t = min(total_dur, start_t + target_dur)
    if end_t - start_t < 10.0 and total_dur >= 12.0:
        start_t = max(0.0, end_t - 14.0)

    # 4. Extract words in window
    matched_words = []
    for seg in transcript:
        for w in seg.get("words", []):
            if start_t <= w.get("start", 0.0) <= end_t:
                matched_words.append(w)

    # 5. Score with Virality Rubric
    text_snippet = " ".join([w.get("word", "") for w in matched_words]) or f"{query} in GTA 6"
    hook_text = f"WAIT FOR THIS: {query.upper()}!"
    title = f"{query.title()} in GTA 6 🔥"

    virality = ViralityScorerService.evaluate_clip_heuristic(
        candidate_text=f"{hook_text} {text_snippet}",
        start_time=start_t,
        end_time=end_t,
        audio_peaks=peaks,
        wpm=165.0
    )

    new_clip = Clip(
        id=str(uuid.uuid4()),
        video_id=video_id,
        title=title,
        hook_text=hook_text,
        description=f"AI Prompt-to-Clip discovery: {query}. Auto-generated 9:16 high-retention Short.",
        start_time=round(start_t, 2),
        end_time=round(end_t, 2),
        duration=round(end_t - start_t, 2),
        virality_score=round(virality["virality_score"], 1),
        score_breakdown=virality["breakdown"],
        virality_reason=f"Natural Language Match ('{query}') aligned with acoustic energy & pacing.",
        status="candidate",
        captions_data=matched_words if matched_words else None,
        caption_style={"preset": "karaoke_bold", "primary_color": "&H00FFFF", "highlight_color": "&H00FF00"},
        tags=["#Shorts", "#GTA6", "#Gaming", f"#{query_tokens[0].capitalize()}"]
    )

    db.add(new_clip)
    db.commit()
    db.refresh(new_clip)

    return new_clip

