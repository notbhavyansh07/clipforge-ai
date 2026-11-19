import os
import subprocess
import time
from typing import Dict, Any, Generator
from backend.app.core.config import settings

class LiveStreamService:
    @staticmethod
    def capture_stream_chunk(stream_url: str, output_chunk_path: str, duration_sec: int = 60) -> bool:
        """
        Records a fixed-length chunk from a live HLS / RTMP / YouTube / Twitch stream using FFmpeg.
        """
        os.makedirs(os.path.dirname(output_chunk_path), exist_ok=True)
        cmd = [
            settings.FFMPEG_PATH,
            "-y",
            "-i", stream_url,
            "-t", str(duration_sec),
            "-c:v", "copy",
            "-c:a", "copy",
            output_chunk_path
        ]
        try:
            print(f"[LiveStreamService] Capturing {duration_sec}s chunk to {output_chunk_path}")
            res = subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=duration_sec + 25)
            return res.returncode == 0 and os.path.exists(output_chunk_path)
        except Exception as e:
            print(f"[LiveStreamService] Error recording live chunk: {e}")
            return False

    @classmethod
    def live_chunk_monitor(
        cls,
        stream_url: str,
        video_id: str,
        chunk_duration: int = 60,
        max_chunks: int = 10
    ) -> Generator[Dict[str, Any], None, None]:
        """
        Sliding-window live stream analyzer.
        Yields analysis results for each captured chunk in real-time.
        """
        from backend.app.services.transcription import TranscriptionService
        from backend.app.services.virality_scorer import ViralityScorerService
        from backend.app.services.audio_analysis import AudioAnalysisService

        chunk_dir = os.path.join(settings.TEMP_DIR, f"live_{video_id}")
        os.makedirs(chunk_dir, exist_ok=True)

        for chunk_idx in range(max_chunks):
            chunk_file = os.path.join(chunk_dir, f"chunk_{chunk_idx:04d}.mp4")
            wav_file = os.path.join(chunk_dir, f"chunk_{chunk_idx:04d}.wav")

            success = cls.capture_stream_chunk(stream_url, chunk_file, duration_sec=chunk_duration)
            if not success:
                print(f"[LiveStreamService] Chunk {chunk_idx} capture timed out or ended.")
                break

            # 1. Transcribe chunk
            transcript = TranscriptionService.transcribe(chunk_file)
            
            # 2. Analyze acoustic peaks
            AudioAnalysisService.extract_audio_wav(chunk_file, wav_file, settings.FFMPEG_PATH)
            audio_metrics = AudioAnalysisService.analyze_audio_peaks(wav_file)

            # 3. Detect clip candidates within chunk
            candidates = ViralityScorerService.generate_candidate_clips(
                transcript_segments=transcript,
                audio_peaks=audio_metrics.get("energy_peaks", []),
                scene_cuts=[],
                max_candidates=3
            )

            # Offset timestamps to global live timeline
            time_offset = chunk_idx * chunk_duration
            for c in candidates:
                c["start_time"] = round(c["start_time"] + time_offset, 2)
                c["end_time"] = round(c["end_time"] + time_offset, 2)
                c["chunk_source"] = chunk_file

            yield {
                "chunk_index": chunk_idx,
                "global_offset": time_offset,
                "candidates": candidates,
                "transcript": transcript
            }

