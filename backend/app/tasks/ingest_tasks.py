import os
from backend.app.core.celery_app import celery_app
from backend.app.core.database import SessionLocal
from backend.app.core.config import settings
from backend.app.models.video import Video
from backend.app.services.ingest import IngestService

@celery_app.task(name="tasks.process_video_ingest")
def process_video_ingest(video_id: str):
    db = SessionLocal()
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        db.close()
        return {"error": "Video not found"}

    try:
        # Validate permission
        IngestService.validate_permission(video.has_permission)

        video.status = "downloading"
        db.commit()

        if video.source_type in ["youtube", "twitch"] and video.source_url:
            download_dir = os.path.join(settings.UPLOAD_DIR, video_id)
            info = IngestService.download_stream_or_url(video.source_url, download_dir)
            video.file_path = info["file_path"]
            video.title = video.title or info["title"]
            video.duration = info["duration"]
            video.width = info["width"]
            video.height = info["height"]
            video.fps = info["fps"]
            video.creator_name = video.creator_name or info["creator_name"]
            video.creator_url = video.creator_url or info["creator_url"]
            video.is_live = info["is_live"]
        else:
            # File already uploaded, probe media info
            if video.file_path and os.path.exists(video.file_path):
                media_info = IngestService.get_media_info(video.file_path)
                video.duration = media_info["duration"]
                video.width = media_info["width"]
                video.height = media_info["height"]
                video.fps = media_info["fps"]

        db.commit()

        # Trigger analysis pipeline task
        from backend.app.tasks.analysis_tasks import process_video_analysis
        process_video_analysis.delay(video_id)
        return {"status": "ingest_complete", "video_id": video_id}

    except Exception as e:
        video.status = "failed"
        video.error_message = str(e)
        db.commit()
        return {"error": str(e)}
    finally:
        db.close()

