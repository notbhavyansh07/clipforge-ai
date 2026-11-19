import os
import json
import logging
from sqlalchemy.orm import Session
from backend.app.core.database import SessionLocal
from backend.app.models.video import Video
from backend.app.models.clip import Clip
from backend.app.models.channel import Channel

logger = logging.getLogger("DBSeeder")

def seed_database_if_empty():
    """Seeds the database with existing videos and clips if empty."""
    db: Session = SessionLocal()
    try:
        # Check if already seeded
        existing_vids = db.query(Video).count()
        if existing_vids > 0:
            logger.info(f"Database already has {existing_vids} videos. Skipping seeder.")
            return

        seed_file = os.path.join(os.path.dirname(__file__), "seed_data.json")
        if not os.path.exists(seed_file):
            logger.warning("seed_data.json not found. Skipping seeder.")
            return

        with open(seed_file, "r", encoding="utf-8") as f:
            data = json.load(f)

        # 1. Seed Channels
        for ch in data.get("channels", []):
            channel = Channel(
                id=ch.get("id"),
                platform=ch.get("platform", "youtube"),
                channel_id=ch.get("channel_id"),
                channel_title=ch.get("channel_title") or "@salviashu02",
                access_token=ch.get("access_token"),
                refresh_token=ch.get("refresh_token")
            )
            db.merge(channel)

        # 2. Seed Videos
        for v in data.get("videos", []):
            video = Video(
                id=v.get("id"),
                title=v.get("title"),
                source_type=v.get("source_type", "youtube"),
                source_url=v.get("source_url"),
                file_path=v.get("file_path"),
                duration=v.get("duration", 180.0),
                fps=v.get("fps", 60.0),
                width=v.get("width", 1920),
                height=v.get("height", 1080),
                has_permission=bool(v.get("has_permission", True)),
                creator_name=v.get("creator_name", "CarryisLive"),
                creator_url=v.get("creator_url"),
                status=v.get("status", "ready"),
                transcript=json.loads(v["transcript"]) if isinstance(v.get("transcript"), str) else v.get("transcript"),
                scene_cuts=json.loads(v["scene_cuts"]) if isinstance(v.get("scene_cuts"), str) else v.get("scene_cuts")
            )
            db.merge(video)

        # 3. Seed Clips
        for c in data.get("clips", []):
            clip = Clip(
                id=c.get("id"),
                video_id=c.get("video_id"),
                title=c.get("title"),
                hook_text=c.get("hook_text"),
                description=c.get("description"),
                start_time=float(c.get("start_time", 0.0)),
                end_time=float(c.get("end_time", 15.0)),
                duration=float(c.get("duration", 15.0)),
                virality_score=float(c.get("virality_score", 95.0)),
                score_breakdown=json.loads(c["score_breakdown"]) if isinstance(c.get("score_breakdown"), str) else c.get("score_breakdown"),
                virality_reason=c.get("virality_reason"),
                status=c.get("status", "rendered"),
                output_path=c.get("output_path"),
                thumbnail_path=c.get("thumbnail_path"),
                location=c.get("location"),
                incident_type=c.get("incident_type"),
                stream_time_formatted=c.get("stream_time_formatted"),
                captions_data=json.loads(c["captions_data"]) if isinstance(c.get("captions_data"), str) else c.get("captions_data"),
                caption_style=json.loads(c["caption_style"]) if isinstance(c.get("caption_style"), str) else c.get("caption_style"),
                tags=json.loads(c["tags"]) if isinstance(c.get("tags"), str) else (c.get("tags") or []),
                youtube_video_id=c.get("youtube_video_id")
            )
            db.merge(clip)

        db.commit()
        logger.info(f"Database successfully seeded with {len(data.get('videos', []))} videos and {len(data.get('clips', []))} clips!")

    except Exception as e:
        db.rollback()
        logger.error(f"Error seeding database: {e}")
    finally:
        db.close()
