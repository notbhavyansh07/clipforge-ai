import os
from backend.app.core.celery_app import celery_app
from backend.app.core.database import SessionLocal
from backend.app.core.config import settings
from backend.app.models.clip import Clip
from backend.app.models.video import Video
from backend.app.services.face_tracker import FaceTrackerService
from backend.app.services.caption_generator import CaptionGeneratorService
from backend.app.services.ffmpeg_pipeline import FFmpegPipelineService

@celery_app.task(name="tasks.render_clip_task")
def render_clip_task(clip_id: str, options: dict = None):
    db = SessionLocal()
    clip = db.query(Clip).filter(Clip.id == clip_id).first()
    if not clip:
        db.close()
        return {"error": "Clip not found"}

    video = db.query(Video).filter(Video.id == clip.video_id).first()
    if not video or not video.file_path or not os.path.exists(video.file_path):
        db.close()
        return {"error": "Source video file not found"}

    try:
        clip.status = "rendering"
        db.commit()

        render_opts = options or {}
        enable_face_tracking = render_opts.get("enable_face_tracking", True)
        enable_captions = render_opts.get("enable_animated_captions", True)
        enable_audio_norm = render_opts.get("enable_audio_normalization", True)
        preset = render_opts.get("caption_preset", "karaoke_bold")

        # 1. 9:16 Face tracking crops
        crop_x = None
        crop_w = int(video.height * (9.0 / 16.0)) if video.height else 608
        crop_h = video.height or 1080

        if enable_face_tracking:
            crops = FaceTrackerService.calculate_smooth_crops(
                video_path=video.file_path,
                start_time=clip.start_time,
                end_time=clip.end_time
            )
            if crops:
                crop_x = crops[0]["crop_x"]
                crop_w = crops[0]["crop_w"]
                crop_h = crops[0]["crop_h"]

        # 2. ASS Subtitle generation
        ass_path = None
        if enable_captions and clip.captions_data:
            ass_path = os.path.join(settings.TEMP_DIR, f"{clip_id}.ass")
            words_data = clip.captions_data
            if isinstance(words_data, str):
                try:
                    words_data = json.loads(words_data)
                except Exception:
                    words_data = []
            if isinstance(words_data, list) and len(words_data) > 0:
                incident_tag = render_opts.get("incident_tag") or clip.hook_text or clip.title
                CaptionGeneratorService.generate_ass(
                    words_data=words_data,
                    output_ass_path=ass_path,
                    style_preset=preset,
                    clip_start_time=clip.start_time,
                    incident_tag=incident_tag[:36] if incident_tag else None
                )

        # 3. Output paths
        output_clip_path = os.path.join(settings.CLIPS_DIR, f"{clip_id}.mp4")
        output_thumb_path = os.path.join(settings.CLIPS_DIR, f"{clip_id}_thumb.jpg")

        color_preset = render_opts.get("color_preset", "viral_vibrant")
        enable_punch_in = render_opts.get("enable_punch_in_zoom", True)
        enable_retention = render_opts.get("enable_retention_bar", True)
        split_screen = render_opts.get("split_screen", False)
        split_layout = render_opts.get("split_layout", "gaming_stacked_50_50")
        hook_headline = render_opts.get("hook_headline", clip.hook_text)

        # 4. Render vertical Short
        success = FFmpegPipelineService.render_clip(
            input_video_path=video.file_path,
            output_clip_path=output_clip_path,
            start_time=clip.start_time,
            end_time=clip.end_time,
            crop_x=crop_x,
            crop_w=crop_w,
            crop_h=crop_h,
            ass_subtitle_path=ass_path,
            enable_audio_norm=enable_audio_norm,
            color_preset=color_preset,
            enable_punch_in_zoom=enable_punch_in,
            enable_retention_bar=enable_retention,
            split_screen=split_screen,
            split_layout=split_layout,
            hook_headline=hook_headline
        )

        if success:
            FFmpegPipelineService.extract_thumbnail(output_clip_path, output_thumb_path, timestamp=0.5)
            clip.status = "rendered"
            clip.output_path = output_clip_path
            clip.thumbnail_path = output_thumb_path
        else:
            clip.status = "failed"

        # Cleanup ASS file
        if ass_path and os.path.exists(ass_path):
            try:
                os.remove(ass_path)
            except Exception:
                pass

        db.commit()
        return {"status": clip.status, "clip_id": clip_id, "output_path": clip.output_path}

    except Exception as e:
        clip.status = "failed"
        db.commit()
        return {"error": str(e)}
    finally:
        db.close()

