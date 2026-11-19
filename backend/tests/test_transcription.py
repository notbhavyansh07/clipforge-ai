import pytest
from backend.app.services.transcription import TranscriptionService, FILLER_WORDS

def test_mock_transcription_structure():
    transcript = TranscriptionService._generate_mock_transcript("dummy_path.mp4")
    assert len(transcript) > 0
    seg = transcript[0]
    assert "start" in seg
    assert "end" in seg
    assert "text" in seg
    assert "words" in seg
    assert "wpm" in seg
    assert len(seg["words"]) > 0

    word_obj = seg["words"][0]
    assert "word" in word_obj
    assert "start" in word_obj
    assert "end" in word_obj
    assert "probability" in word_obj
    assert "is_filler" in word_obj

def test_filler_word_flagging():
    assert "um" in FILLER_WORDS
    assert "literally" in FILLER_WORDS
    assert "like" in FILLER_WORDS

