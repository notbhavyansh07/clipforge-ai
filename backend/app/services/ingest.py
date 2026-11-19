import os
import re
import json
import subprocess
from typing import Dict, Any, Optional
from backend.app.core.config import settings

class IngestService:
    @staticmethod
    def validate_permission(has_permission: bool):
        if not has_permission:
            raise ValueError(
                "Permission Denied: ClipForge requires explicit confirmation that you own the video "
                "or have authorized rights/licensing from the content creator."
            )

    @staticmethod
    def get_media_info(file_path: str) -> Dict[str, Any]:
        """Probe video dimensions, duration, and FPS using ffprobe or fallback."""
        default_info = {
            "duration": 60.0,
            "width": 1920,
            "height": 1080,
            "fps": 30.0,
            "audio_channels": 2
        }
        
        try:
            cmd = [
                settings.FFPROBE_PATH,
                "-v", "error",
                "-show_entries", "format=duration:stream=width,height,r_frame_rate,channels",
                "-of", "json",
                file_path
            ]
            result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=10)
            if result.returncode == 0:
                data = json.loads(result.stdout)
                fmt = data.get("format", {})
                duration = float(fmt.get("duration", 60.0))
                
                width, height, fps = 1920, 1080, 30.0
                for stream in data.get("streams", []):
                    if "width" in stream and "height" in stream:
                        width = int(stream["width"])
                        height = int(stream["height"])
                        r_fps = stream.get("r_frame_rate", "30/1")
                        if "/" in r_fps:
                            num, den = r_fps.split("/")
                            fps = float(num) / float(den) if float(den) != 0 else 30.0
                        else:
                            fps = float(r_fps)
                        break
                        
                return {
                    "duration": duration,
                    "width": width,
                    "height": height,
                    "fps": round(fps, 2),
                    "audio_channels": 2
                }
        except Exception as e:
            print(f"[IngestService] ffprobe check fallback: {e}")
            
        return default_info

    @classmethod
    def download_stream_or_url(cls, url: str, output_dir: str) -> Dict[str, Any]:
        """Download high quality MP4 using yt-dlp with automatic format negotiation & live stream support."""
        import yt_dlp
        os.makedirs(output_dir, exist_ok=True)
        out_template = os.path.join(output_dir, "%(id)s.%(ext)s")
        
        # Phase 1: Probe metadata without rigid format constraints
        probe_opts = {
            "noplaylist": True,
            "quiet": True,
            "no_warnings": True,
        }
        
        with yt_dlp.YoutubeDL(probe_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            is_live = bool(info.get("is_live", False))
            creator = info.get("uploader") or info.get("channel") or "Unknown Creator"
            creator_url = info.get("uploader_url") or info.get("channel_url") or ""
            title = info.get("title", "Imported Stream")
            video_id = info.get("id", "stream_vid")
            
            if is_live:
                # Live stream: extract direct video + audio manifests and capture 30s working chunk via FFmpeg
                target_file = os.path.join(output_dir, f"{video_id}.mp4")
                
                vf = [f for f in info.get("formats", []) if f.get("vcodec") and f.get("vcodec") != "none" and f.get("url")]
                af = [f for f in info.get("formats", []) if f.get("resolution") == "audio only" and f.get("url")]

                if vf and af:
                    best_vf = max(vf, key=lambda f: f.get("height") or 0)
                    capture_cmd = [
                        settings.FFMPEG_PATH,
                        "-y",
                        "-i", best_vf["url"],
                        "-i", af[0]["url"],
                        "-t", "30",
                        "-c:v", "copy",
                        "-c:a", "aac",
                        target_file
                    ]
                else:
                    stream_url = info.get("url") or (vf[0]["url"] if vf else url)
                    capture_cmd = [
                        settings.FFMPEG_PATH,
                        "-y",
                        "-i", stream_url,
                        "-t", "30",
                        "-c", "copy",
                        target_file
                    ]

                print(f"[IngestService] Recording live stream chunk: {' '.join(capture_cmd)}")
                res = subprocess.run(capture_cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=60)
                
                media_info = cls.get_media_info(target_file) if (res.returncode == 0 and os.path.exists(target_file)) else {
                    "duration": 45.0, "width": 1920, "height": 1080, "fps": 30.0
                }
                
                return {
                    "file_path": target_file,
                    "title": f"[LIVE] {title}",
                    "duration": media_info.get("duration", 45.0),
                    "creator_name": creator,
                    "creator_url": creator_url,
                    "width": media_info.get("width", 1920),
                    "height": media_info.get("height", 1080),
                    "fps": media_info.get("fps", 30.0),
                    "is_live": True,
                }
            else:
                # Standard VOD: download MP4 using best available format
                download_opts = {
                    "format": "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best/b",
                    "outtmpl": out_template,
                    "noplaylist": True,
                    "quiet": False,
                    "no_warnings": True,
                    "merge_output_format": "mp4",
                    "ffmpeg_location": settings.FFMPEG_PATH,
                }
                with yt_dlp.YoutubeDL(download_opts) as dl_ydl:
                    dl_ydl.download([url])
                    filename = dl_ydl.prepare_filename(info)
                    base, _ = os.path.splitext(filename)
                    mp4_file = f"{base}.mp4"
                    target_file = mp4_file if os.path.exists(mp4_file) else filename
                    media_info = cls.get_media_info(target_file)
                    
                    return {
                        "file_path": target_file,
                        "title": title,
                        "duration": media_info.get("duration", info.get("duration", 0.0)),
                        "creator_name": creator,
                        "creator_url": creator_url,
                        "width": media_info.get("width", 1920),
                        "height": media_info.get("height", 1080),
                        "fps": media_info.get("fps", 30.0),
                        "is_live": False,
                    }

    @classmethod
    def save_upload(cls, file_obj, filename: str, output_dir: str) -> str:
        """Save an uploaded video stream to disk."""
        os.makedirs(output_dir, exist_ok=True)
        clean_name = re.sub(r'[^a-zA-Z0-9_.-]', '_', filename)
        dest_path = os.path.join(output_dir, clean_name)
        
        with open(dest_path, "wb") as buffer:
            if hasattr(file_obj, "read"):
                buffer.write(file_obj.read())
            else:
                buffer.write(file_obj)
        return dest_path
