import os
import shutil
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.config import settings
from backend.app.models.video import Video
from backend.app.schemas.video import VideoCreateURL, VideoBase, VideoDetail
from backend.app.services.ingest import IngestService
from backend.app.tasks.ingest_tasks import process_video_ingest
from backend.app.tasks.live_tasks import monitor_live_stream_task

router = APIRouter(prefix="/videos", tags=["Videos"])

@router.post("/ingest/url", response_model=VideoBase)
def ingest_url(payload: VideoCreateURL, db: Session = Depends(get_db)):
    # 1. Require strict confirmation of permission/ownership
    IngestService.validate_permission(payload.has_permission)

    # 2. Determine source type
    lower_url = payload.url.lower()
    source_type = "twitch" if "twitch.tv" in lower_url else "youtube"

    video = Video(
        title=f"Imported from {source_type.title()}",
        source_type=source_type,
        source_url=payload.url,
        has_permission=payload.has_permission,
        creator_name=payload.creator_name,
        creator_url=payload.creator_url,
        is_live=payload.is_live,
        status="pending"
    )
    db.add(video)
    db.commit()
    db.refresh(video)

    # 3. Dispatch Celery task
    if payload.is_live:
        monitor_live_stream_task.delay(video.id, payload.url)
    else:
        process_video_ingest.delay(video.id)

    return video

@router.post("/ingest/upload", response_model=VideoBase)
def ingest_upload(
    file: UploadFile = File(...),
    has_permission: bool = Form(...),
    creator_name: str = Form(None),
    creator_url: str = Form(None),
    db: Session = Depends(get_db)
):
    IngestService.validate_permission(has_permission)

    # Save uploaded file
    target_dir = os.path.join(settings.UPLOAD_DIR, "raw")
    os.makedirs(target_dir, exist_ok=True)
    dest_path = os.path.join(target_dir, file.filename)
    
    with open(dest_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    media_info = IngestService.get_media_info(dest_path)

    video = Video(
        title=os.path.splitext(file.filename)[0],
        source_type="upload",
        file_path=dest_path,
        duration=media_info["duration"],
        width=media_info["width"],
        height=media_info["height"],
        fps=media_info["fps"],
        has_permission=has_permission,
        creator_name=creator_name,
        creator_url=creator_url,
        status="pending"
    )
    db.add(video)
    db.commit()
    db.refresh(video)

    process_video_ingest.delay(video.id)
    return video

@router.get("", response_model=List[VideoBase])
def list_videos(db: Session = Depends(get_db)):
    return db.query(Video).order_by(Video.created_at.desc()).all()

@router.get("/{video_id}", response_model=VideoDetail)
def get_video(video_id: str, db: Session = Depends(get_db)):
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    return video

@router.post("/{video_id}/retry", response_model=VideoBase)
def retry_video_processing(video_id: str, db: Session = Depends(get_db)):
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    video.status = "pending"
    video.error_message = None
    db.commit()
    db.refresh(video)

    process_video_ingest.delay(video.id)
    return video

@router.delete("/{video_id}")
def delete_video(video_id: str, db: Session = Depends(get_db)):
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    
    if video.file_path and os.path.exists(video.file_path):
        try:
            os.remove(video.file_path)
        except Exception:
            pass

    db.delete(video)
    db.commit()
    return {"message": "Video deleted successfully"}

