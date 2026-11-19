import os
from backend.app.core.celery_app import celery_app
from backend.app.core.database import SessionLocal
from backend.app.core.config import settings
from backend.app.models.video import Video
from backend.app.models.clip import Clip
from backend.app.services.transcription import TranscriptionService
from backend.app.services.scene_detect import SceneDetectService
from backend.app.services.audio_analysis import AudioAnalysisService
from backend.app.services.virality_scorer import ViralityScorerService

@celery_app.task(name="tasks.process_video_analysis")
def process_video_analysis(video_id: str):
    db = SessionLocal()
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video or not video.file_path or not os.path.exists(video.file_path):
        db.close()
        return {"error": "Video file not found for analysis"}

    try:
        # 1. Transcribe with word timestamps
        video.status = "transcribing"
        db.commit()

        transcript = TranscriptionService.transcribe(video.file_path)
        video.transcript = transcript
        db.commit()

        # 2. Acoustic & Scene Analysis
        video.status = "analyzing"
        db.commit()

        wav_path = os.path.join(settings.TEMP_DIR, f"{video_id}_audio.wav")
        AudioAnalysisService.extract_audio_wav(video.file_path, wav_path, settings.FFMPEG_PATH)
        audio_metrics = AudioAnalysisService.analyze_audio_peaks(wav_path)
        video.audio_metrics = audio_metrics

        scene_cuts = SceneDetectService.detect_scenes(video.file_path)
        video.scene_cuts = scene_cuts
        db.commit()

        # Clean temp wav
        if os.path.exists(wav_path):
            try:
                os.remove(wav_path)
            except Exception:
                pass

        # 3. Virality Scoring & Candidate Proposing
        candidates = ViralityScorerService.generate_candidate_clips(
            transcript_segments=transcript,
            audio_peaks=audio_metrics.get("energy_peaks", []),
            scene_cuts=scene_cuts,
            max_candidates=15
        )

        # Clear existing candidates if re-running
        db.query(Clip).filter(Clip.video_id == video_id, Clip.status == "candidate").delete()

        for cand in candidates:
            # Extract word data relevant to this clip duration
            clip_words = []
            for seg in transcript:
                for w in seg.get("words", []):
                    if cand["start_time"] <= w["start"] <= cand["end_time"]:
                        clip_words.append(w)

            new_clip = Clip(
                video_id=video_id,
                title=cand["title"],
                hook_text=cand.get("hook_text"),
                description=cand.get("description"),
                start_time=cand["start_time"],
                end_time=cand["end_time"],
                duration=cand["duration"],
                virality_score=cand["virality_score"],
                score_breakdown=cand["score_breakdown"],
                virality_reason=cand["virality_reason"],
                captions_data=clip_words,
                tags=cand.get("tags", ["#Shorts", "#Viral"]),
                status="candidate"
            )
            db.add(new_clip)

        video.status = "ready"
        db.commit()
        return {"status": "analysis_complete", "video_id": video_id, "candidates_count": len(candidates)}

    except Exception as e:
        video.status = "failed"
        video.error_message = f"Analysis error: {str(e)}"
        db.commit()
        return {"error": str(e)}
    finally:
        db.close()

