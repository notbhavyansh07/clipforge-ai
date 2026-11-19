import os
import subprocess
from typing import Dict, Any, Optional, List
from backend.app.core.config import settings
from backend.app.services.filmcraft_engine import FilmcraftEngineService

class FFmpegPipelineService:
    @staticmethod
    def render_clip(
        input_video_path: str,
        output_clip_path: str,
        start_time: float,
        end_time: float,
        crop_x: Optional[int] = None,
        crop_w: Optional[int] = None,
        crop_h: Optional[int] = None,
        ass_subtitle_path: Optional[str] = None,
        enable_audio_norm: bool = True,
        color_preset: str = "viral_vibrant",
        enable_punch_in_zoom: bool = True,
        enable_retention_bar: bool = True,
        split_screen: bool = False,
        split_layout: str = "gaming_stacked_50_50",
        hook_headline: Optional[str] = None,
        ffmpeg_bin: Optional[str] = None
    ) -> bool:
        """
        Renders an Ultra High Quality 60FPS 9:16 Short using FFmpeg:
        - 1080x1920 (or 4K) Portrait Reframing with Lanczos scale
        - Unsharp mask texture sharpening filter
        - 60.0 FPS high framerate output
        - Visually lossless CRF 16 with 16 Mbps high bitrate
        - FilmCraft dynamic punch-in zoom & color grading
        - HyperFrames glowing retention progress bar
        - MrBeast / Hormozi 86pt 3D animated subtitles
        - EBU R128 loudness normalization
        """
        bin_path = ffmpeg_bin or settings.FFMPEG_PATH
        duration = max(0.5, end_time - start_time)
        os.makedirs(os.path.dirname(output_clip_path), exist_ok=True)

        w = crop_w or 608
        h = crop_h or 1080
        x = crop_x if crop_x is not None else 656

        # Build filtergraph using FilmCraft Engine
        punch_ins = [0.2] if enable_punch_in_zoom else []
        filter_graph, out_label = FilmcraftEngineService.build_cinematic_filter_complex(
            crop_w=w,
            crop_h=h,
            crop_x=x,
            zoom_punch_ins=punch_ins,
            color_preset=color_preset,
            split_screen=split_screen,
            split_layout=split_layout,
            hook_headline=hook_headline,
            retention_bar=enable_retention_bar,
            duration=duration
        )

        # Burn in SubStation Alpha subtitles with crisp font rendering
        final_video_label = out_label
        if ass_subtitle_path and os.path.exists(ass_subtitle_path):
            clean_ass_path = ass_subtitle_path.replace("\\", "/").replace(":", "\\:")
            filter_graph += f";[{out_label}]subtitles='{clean_ass_path}':fontsdir='temp'[v_final]"
            final_video_label = "v_final"

        # Audio filter chain: EBU R128 normalization to -14 LUFS
        a_filter = "loudnorm=I=-14:LRA=7:tp=-1.5" if enable_audio_norm else None

        cmd = [
            bin_path,
            "-y",
            "-threads", "0",                    # Utilize all CPU cores for maximum speed
            "-ss", str(start_time),
            "-t", str(duration),
            "-i", input_video_path,
            "-filter_complex", filter_graph,
            "-map", f"[{final_video_label}]",
            "-map", "0:a?",
            "-r", "60",                        # 60 FPS ultra smooth framerate
            "-c:v", "libx264",
            "-preset", "veryfast",             # Blazing fast pro render
            "-crf", "17",                      # Cinema-grade visually lossless quality
            "-b:v", "14M",                     # 14 Mbps high bitrate for crystal clear game textures
            "-maxrate", "20M",
            "-bufsize", "28M",
            "-pix_fmt", "yuv420p",
            "-profile:v", "high",
            "-level", "4.2",
            "-c:a", "aac",
            "-b:a", "256k",                    # 256k studio audio
            "-avoid_negative_ts", "make_zero",
            "-movflags", "+faststart",
            output_clip_path
        ]

        if a_filter:
            cmd.insert(cmd.index("-c:v"), "-af")
            cmd.insert(cmd.index("-c:v"), a_filter)

        try:
            print(f"[FFmpegPipeline] 60FPS Pro Render: {' '.join(cmd)}")
            res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=300)
            if res.returncode == 0 and os.path.exists(output_clip_path):
                return True
            else:
                err_msg = res.stderr.decode("utf-8", errors="ignore")
                print(f"[FFmpegPipeline] FFmpeg error:\n{err_msg[-500:]}")
                return False
        except Exception as e:
            print(f"[FFmpegPipeline] Execution error: {e}")
            return False

    @staticmethod
    def extract_thumbnail(
        video_path: str,
        output_thumbnail_path: str,
        timestamp: float = 1.0,
        ffmpeg_bin: Optional[str] = None
    ) -> bool:
        """Extract a high quality 9:16 thumbnail frame."""
        bin_path = ffmpeg_bin or settings.FFMPEG_PATH
        os.makedirs(os.path.dirname(output_thumbnail_path), exist_ok=True)
        cmd = [
            bin_path,
            "-y",
            "-ss", str(timestamp),
            "-i", video_path,
            "-vf", "crop=ih*(9/16):ih:(iw-ih*(9/16))/2:0,scale=1080:1920:flags=lanczos,unsharp=5:5:0.8:3:3:0.4",
            "-frames:v", "1",
            "-update", "1",
            "-q:v", "1",
            output_thumbnail_path
        ]
        try:
            res = subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=20)
            return res.returncode == 0 and os.path.exists(output_thumbnail_path)
        except Exception:
            return False
