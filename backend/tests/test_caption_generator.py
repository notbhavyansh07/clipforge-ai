import os
import pytest
from backend.app.services.caption_generator import CaptionGeneratorService

def test_ass_time_format():
    assert CaptionGeneratorService.format_ass_time(0.0) == "0:00:00.00"
    assert CaptionGeneratorService.format_ass_time(65.42) == "0:01:05.42"
    assert CaptionGeneratorService.format_ass_time(3661.05) == "1:01:01.05"

def test_generate_ass_file(tmp_path):
    output_ass = os.path.join(str(tmp_path), "test_subs.ass")
    mock_words = [
        {"word": "GTA", "start": 1.0, "end": 1.5, "probability": 0.99},
        {"word": "SIX", "start": 1.5, "end": 2.0, "probability": 0.98},
        {"word": "CONFIRMED", "start": 2.0, "end": 2.8, "probability": 0.97}
    ]
    path = CaptionGeneratorService.generate_ass(mock_words, output_ass, clip_start_time=0.0)
    assert os.path.exists(path)
    
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    
    assert "[Script Info]" in content
    assert "PlayResX: 1080" in content
    assert "PlayResY: 1920" in content
    assert "Dialogue:" in content
    assert "GTA" in content
    assert r"{\c&H0000FFFF" in content # Karaoke highlight tag

