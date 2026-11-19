from backend.app.core.celery_app import celery_app
from backend.app.core.database import SessionLocal
from backend.app.models.video import Video
from backend.app.models.clip import Clip
from backend.app.services.live_stream import LiveStreamService

@celery_app.task(name="tasks.monitor_live_stream_task")
def monitor_live_stream_task(video_id: str, stream_url: str, chunk_duration: int = 60, max_chunks: int = 15):
    db = SessionLocal()
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        db.close()
        return {"error": "Video not found"}

    try:
        video.is_live = True
        video.status = "analyzing"
        db.commit()

        for chunk_result in LiveStreamService.live_chunk_monitor(
            stream_url=stream_url,
            video_id=video_id,
            chunk_duration=chunk_duration,
            max_chunks=max_chunks
        ):
            video.stream_chunk_count = chunk_result["chunk_index"] + 1

            for cand in chunk_result["candidates"]:
                new_clip = Clip(
                    video_id=video_id,
                    title=f"[LIVE] {cand['title']}",
                    hook_text=cand.get("hook_text"),
                    description=cand.get("description"),
                    start_time=cand["start_time"],
                    end_time=cand["end_time"],
                    duration=cand["duration"],
                    virality_score=cand["virality_score"],
                    score_breakdown=cand["score_breakdown"],
                    virality_reason=f"[Live Detection] {cand['virality_reason']}",
                    tags=["#Live", "#Shorts", "#Viral"],
                    status="candidate"
                )
                db.add(new_clip)

            db.commit()

        video.status = "ready"
        db.commit()
        return {"status": "live_monitoring_complete", "video_id": video_id}
    except Exception as e:
        video.status = "failed"
        video.error_message = f"Live stream error: {str(e)}"
        db.commit()
        return {"error": str(e)}
    finally:
        db.close()

