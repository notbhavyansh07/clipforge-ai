import pytest
from backend.app.services.virality_scorer import ViralityScorerService
from backend.app.core.config import settings

def test_rubric_weights_sum_to_one():
    total_weights = (
        settings.WEIGHT_HOOK +
        settings.WEIGHT_EMOTION +
        settings.WEIGHT_PACING +
        settings.WEIGHT_STORY +
        settings.WEIGHT_TREND
    )
    assert round(total_weights, 4) == 1.0, "Virality rubric weights must sum to exactly 1.0 (100%)"

def test_calculate_trend_score():
    gta_text = "Rockstar just dropped the official GTA 6 trailer leak!"
    score = ViralityScorerService.calculate_trend_score(gta_text)
    assert score >= 90.0, f"Expected viral score >= 90 for GTA 6 leak, got {score}"

    boring_text = "The weather today in the park was somewhat mild."
    score_boring = ViralityScorerService.calculate_trend_score(boring_text)
    assert score_boring <= 55.0, f"Expected baseline score <= 55 for non-trending text, got {score_boring}"

def test_pacing_score_sweet_spot():
    # 165 WPM is prime short-form cadence
    assert ViralityScorerService.calculate_pacing_score(165.0) == 95.0
    # < 100 WPM is sluggish
    assert ViralityScorerService.calculate_pacing_score(80.0) < 70.0

def test_evaluate_clip_heuristic():
    text = "Wait, did you see what Rockstar just confirmed for GTA 6? It changes everything!"
    res = ViralityScorerService.evaluate_clip_heuristic(
        candidate_text=text,
        start_time=0.0,
        end_time=30.0,
        audio_peaks=[2.5, 8.0, 15.0],
        wpm=160.0
    )
    assert "virality_score" in res
    assert 0.0 <= res["virality_score"] <= 100.0
    assert "breakdown" in res
    assert "hook" in res["breakdown"]
    assert "emotion" in res["breakdown"]
    assert "pacing" in res["breakdown"]
    assert "story" in res["breakdown"]
    assert "trend" in res["breakdown"]
    assert len(res["virality_reason"]) > 10

def test_candidate_generation():
    mock_segments = [
        {"start": 0.0, "end": 5.0, "text": "Yo did you see what just happened in GTA 6?", "words": []},
        {"start": 5.0, "end": 15.0, "text": "The entire map was revealed and it is massive.", "words": []},
        {"start": 15.0, "end": 28.0, "text": "Everyone who said it was fake was completely wrong!", "words": []}
    ]
    candidates = ViralityScorerService.generate_candidate_clips(
        transcript_segments=mock_segments,
        audio_peaks=[2.0, 12.0],
        scene_cuts=[15.0],
        max_candidates=5
    )
    assert len(candidates) > 0
    top_clip = candidates[0]
    assert top_clip["virality_score"] > 60
    assert top_clip["duration"] >= 15.0

