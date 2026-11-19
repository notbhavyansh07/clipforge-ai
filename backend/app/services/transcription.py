import os
import re
from typing import List, Dict, Any, Optional
from backend.app.core.config import settings

FILLER_WORDS = {"um", "uh", "er", "ah", "like", "you know", "basically", "literally", "actually"}

class TranscriptionService:
    _model = None

    @classmethod
    def get_model(cls):
        if cls._model is None:
            try:
                from faster_whisper import WhisperModel
                print(f"[TranscriptionService] Loading WhisperModel: {settings.WHISPER_MODEL_SIZE} on {settings.WHISPER_DEVICE}")
                cls._model = WhisperModel(
                    settings.WHISPER_MODEL_SIZE,
                    device=settings.WHISPER_DEVICE,
                    compute_type=settings.WHISPER_COMPUTE_TYPE
                )
            except Exception as e:
                print(f"[TranscriptionService] Warning: Could not initialize faster_whisper ({e}). Falling back to mock/heuristics mode.")
                cls._model = False
        return cls._model

    @classmethod
    def transcribe(cls, audio_or_video_path: str, language: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Transcribe audio/video file with word-level timestamps.
        Returns a list of segment dicts:
        [
          {
            "id": 0,
            "start": 0.0,
            "end": 4.5,
            "text": "Hey guys welcome back to the channel!",
            "words": [
               {"word": "Hey", "start": 0.0, "end": 0.4, "probability": 0.99},
               ...
            ],
            "wpm": 160.0,
            "filler_count": 0
          }
        ]
        """
        model = cls.get_model()

        if model and model is not False:
            segments, info = model.transcribe(
                audio_or_video_path,
                beam_size=5,
                word_timestamps=True,
                language=language,
                vad_filter=True,
                vad_parameters=dict(min_silence_duration_ms=500)
            )

            result = []
            for idx, segment in enumerate(segments):
                words_data = []
                filler_count = 0
                if segment.words:
                    for w in segment.words:
                        cleaned = re.sub(r'[^\w\s]', '', w.word.strip().lower())
                        is_filler = cleaned in FILLER_WORDS
                        if is_filler:
                            filler_count += 1
                        words_data.append({
                            "word": w.word.strip(),
                            "start": round(w.start, 2),
                            "end": round(w.end, 2),
                            "probability": round(w.probability, 2),
                            "is_filler": is_filler
                        })
                
                duration = max(0.1, segment.end - segment.start)
                word_count = len(words_data)
                wpm = round((word_count / duration) * 60, 1)

                result.append({
                    "id": idx,
                    "start": round(segment.start, 2),
                    "end": round(segment.end, 2),
                    "text": segment.text.strip(),
                    "words": words_data,
                    "wpm": wpm,
                    "filler_count": filler_count
                })
            return result
        else:
            # Fallback mock transcription for testing without large whisper weights
            return cls._generate_mock_transcript(audio_or_video_path)

    @classmethod
    def _generate_mock_transcript(cls, file_path: str) -> List[Dict[str, Any]]:
        """Provides realistic mock transcript with word timestamps for testing."""
        phrases = [
            ("Yo did you see what Rockstar just dropped for GTA 6?", 3.5),
            ("This is completely insane, they literally redesigned the entire Vice City physics engine.", 5.0),
            ("Look at this scene right here, the crowd reaction AI is unmatched.", 4.5),
            ("Everybody was doubting if it could run at 60 fps on next gen.", 4.0),
            ("And this leak just proved everyone wrong!", 3.0),
            ("Let me know in the comments if you are preordering day one.", 3.5)
        ]
        
        segments = []
        current_time = 0.5
        for idx, (text, dur) in enumerate(phrases):
            words_list = text.split()
            word_dur = dur / len(words_list)
            words_data = []
            w_start = current_time
            for w in words_list:
                clean_w = re.sub(r'[^\w\s]', '', w.lower())
                words_data.append({
                    "word": w,
                    "start": round(w_start, 2),
                    "end": round(w_start + word_dur, 2),
                    "probability": 0.98,
                    "is_filler": clean_w in FILLER_WORDS
                })
                w_start += word_dur
                
            segments.append({
                "id": idx,
                "start": round(current_time, 2),
                "end": round(current_time + dur, 2),
                "text": text,
                "words": words_data,
                "wpm": round((len(words_list) / dur) * 60, 1),
                "filler_count": sum(1 for w in words_data if w["is_filler"])
            })
            current_time += dur + 0.5
            
        return segments

