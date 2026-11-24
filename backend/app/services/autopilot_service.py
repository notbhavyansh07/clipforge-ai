import os
import time
import json
import sqlite3
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any, List

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] [Autopilot] %(message)s")
logger = logging.getLogger("AutopilotService")

# IST timezone helper (+5:30)
IST = timezone(timedelta(hours=5, minutes=30))

class AutopilotService:
    """
    Hands-Free Automated Viral Scheduling & Upload Daemon
    - Automatically maps clips to peak algorithmic traffic windows (IST).
    - Slot 1 (Lunch Rush): 1:00 PM IST
    - Slot 2 (Prime Evening Golden Peak): 6:00 PM IST
    - Slot 3 (Late Night Gaming): 8:30 PM IST
    - Uploads using verified YouTube Data API v3 OAuth credentials.
    """

    DB_PATH = "clipforge.db"

    @classmethod
    def get_connection(cls):
        return sqlite3.connect(cls.DB_PATH)

    @classmethod
    def schedule_clip(cls, clip_id: str, scheduled_time_ist: datetime) -> bool:
        """Sets target scheduled upload time for a clip in IST."""
        conn = cls.get_connection()
        c = conn.cursor()
        c.execute("""
            UPDATE clips 
            SET scheduled_publish_time = ?,
                status = 'scheduled'
            WHERE id = ?
        """, (scheduled_time_ist.strftime("%Y-%m-%d %H:%M:%S"), clip_id))
        conn.commit()
        conn.close()
        logger.info(f"Scheduled clip {clip_id} for viral window: {scheduled_time_ist.strftime('%Y-%m-%d %H:%M:%S %Z')}")
        return True

    @classmethod
    def setup_initial_viral_queue(cls):
        """Sets up default 3-slot daily peak viral schedule: Carry, Speed, and Daily Trending."""
        now_ist = datetime.now(IST)
        today_date = now_ist.date()

        # Slot 1: 1:30 PM IST (13:30) - CarryisLive Lunch Rush Peak
        slot_1_today = datetime(today_date.year, today_date.month, today_date.day, 13, 30, 0, tzinfo=IST)
        if now_ist > slot_1_today:
            slot_1_today = now_ist + timedelta(minutes=15)

        # Slot 2: 6:00 PM IST (18:00) - IShowSpeed Global Golden Hour Peak
        slot_2_today = datetime(today_date.year, today_date.month, today_date.day, 18, 0, 0, tzinfo=IST)
        if now_ist > slot_2_today:
            slot_2_today = now_ist + timedelta(hours=1)

        # Slot 3: 9:30 PM IST (21:30) - Daily Trending Late Night Gaming Binge Peak
        slot_3_today = datetime(today_date.year, today_date.month, today_date.day, 21, 30, 0, tzinfo=IST)
        if now_ist > slot_3_today:
            slot_3_today = now_ist + timedelta(hours=2)

        # Slot 1: CarryisLive 1,000ft Stunt
        cls.schedule_clip("clip-inc-11-stunt", slot_1_today)

        # Slot 2: IShowSpeed AI Robot Dog Flamethrower Viral Freakout
        cls.schedule_clip("clip-speed-robotdog", slot_2_today)

        # Slot 3: Daily Trending Internet Viral Reel (MrBeast $456,000 Squid Game)
        cls.schedule_clip("clip-trend-01-mrbeast", slot_3_today)

        # Tomorrow Slots (2026-11-25 Peak Schedule)
        tomorrow_date = today_date + timedelta(days=1)
        slot_1_tomorrow = datetime(tomorrow_date.year, tomorrow_date.month, tomorrow_date.day, 13, 30, 0, tzinfo=IST)
        slot_2_tomorrow = datetime(tomorrow_date.year, tomorrow_date.month, tomorrow_date.day, 18, 0, 0, tzinfo=IST)
        slot_3_tomorrow = datetime(tomorrow_date.year, tomorrow_date.month, tomorrow_date.day, 21, 30, 0, tzinfo=IST)

        cls.schedule_clip("clip-tomorrow-carry-heist", slot_1_tomorrow)
        cls.schedule_clip("clip-tomorrow-speed-ronaldo", slot_2_tomorrow)
        cls.schedule_clip("clip-tomorrow-trend-yacht", slot_3_tomorrow)

    @classmethod
    def execute_daily_cycle(cls) -> Dict[str, Any]:
        """Executes full daily cycle, uploading clips across all 3 peak viral slots."""
        cls.setup_initial_viral_queue()
        queue = cls.get_queue()
        results = []
        for q in queue[:3]:
            res = cls.execute_upload_now(q["id"])
            results.append({"clip_id": q["id"], "title": q.get("title"), **res})
        return {"success": True, "executed_slots": results}

    @classmethod
    def get_queue(cls) -> List[Dict[str, Any]]:
        """Returns the current scheduled queue."""
        conn = cls.get_connection()
        conn.row_factory = sqlite3.Row
        c = conn.cursor()
        c.execute("""
            SELECT id, title, virality_score, status, scheduled_publish_time, youtube_video_id, output_path
            FROM clips
            WHERE scheduled_publish_time IS NOT NULL OR status IN ('scheduled', 'rendered', 'published')
            ORDER BY scheduled_publish_time ASC
        """)
        rows = [dict(r) for r in c.fetchall()]
        conn.close()
        return rows

    @classmethod
    def execute_upload_now(cls, clip_id: str) -> Dict[str, Any]:
        """Executes direct upload of a clip to YouTube via YouTubeService."""
        from backend.app.services.youtube_service import YouTubeService

        conn = cls.get_connection()
        conn.row_factory = sqlite3.Row
        c = conn.cursor()

        # Fetch clip
        c.execute("SELECT * FROM clips WHERE id = ?", (clip_id,))
        clip = c.fetchone()
        if not clip:
            conn.close()
            return {"success": False, "error": f"Clip {clip_id} not found"}

        # Fetch channel tokens
        c.execute("SELECT access_token, refresh_token, channel_title FROM channels WHERE platform='youtube'")
        chan = c.fetchone()
        if not chan or not chan["access_token"]:
            conn.close()
            return {"success": False, "error": "No connected YouTube channel found with valid OAuth token"}

        video_path = clip["output_path"]
        if not video_path or not os.path.exists(video_path):
            conn.close()
            return {"success": False, "error": f"Video file not found at {video_path}"}

        title = clip["title"]
        desc = clip["description"] or ""
        tags = json.loads(clip["tags"]) if clip["tags"] else ["Shorts", "Gaming"]

        logger.info(f"Starting automated upload to YouTube for '{title}'...")

        try:
            res = YouTubeService.upload_short(
                access_token=chan["access_token"],
                refresh_token=chan["refresh_token"],
                video_path=video_path,
                title=title,
                description=desc,
                tags=tags,
                privacy_status="public"
            )

            yt_id = res.get("video_id")
            now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")

            # Update DB
            c.execute("""
                UPDATE clips
                SET status = 'published',
                    youtube_video_id = ?,
                    youtube_publish_time = ?
                WHERE id = ?
            """, (yt_id, now_str, clip_id))
            conn.commit()
            conn.close()

            logger.info(f"SUCCESS: Uploaded '{title}' live to YouTube! Video ID: {yt_id} -> https://youtube.com/shorts/{yt_id}")
            return {
                "success": True,
                "video_id": yt_id,
                "video_url": f"https://youtube.com/shorts/{yt_id}",
                "title": title
            }

        except Exception as e:
            conn.close()
            logger.error(f"Upload error: {e}")
            return {"success": False, "error": str(e)}

    @classmethod
    def check_and_run_due_uploads(cls) -> List[Dict[str, Any]]:
        """Checks if any scheduled clips are due for upload right now."""
        now_ist = datetime.now(IST)
        now_str = now_ist.strftime("%Y-%m-%d %H:%M:%S")

        conn = cls.get_connection()
        conn.row_factory = sqlite3.Row
        c = conn.cursor()
        c.execute("""
            SELECT id, title, scheduled_publish_time 
            FROM clips
            WHERE status = 'scheduled'
              AND scheduled_publish_time <= ?
        """, (now_str,))
        due_clips = [dict(r) for r in c.fetchall()]
        conn.close()

        results = []
        for d in due_clips:
            logger.info(f"Due clip found: {d['title']} (scheduled: {d['scheduled_publish_time']}) -> Triggering live upload!")
            res = cls.execute_upload_now(d["id"])
            results.append({"clip_id": d["id"], **res})

        return results

    @classmethod
    def run_daemon_loop(cls, poll_interval_seconds: int = 30):
        """Runs continuous autopilot loop in background."""
        logger.info("Autopilot Scheduler Daemon started. Monitoring viral timing windows...")
        while True:
            try:
                cls.check_and_run_due_uploads()
            except Exception as e:
                logger.error(f"Autopilot daemon loop error: {e}")
            time.sleep(poll_interval_seconds)

if __name__ == "__main__":
    AutopilotService.setup_initial_viral_queue()
    AutopilotService.run_daemon_loop()

