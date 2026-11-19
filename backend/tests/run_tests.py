import sys
import os

# Add root directory to python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.app.services.virality_scorer import ViralityScorerService
from backend.app.services.caption_generator import CaptionGeneratorService
from backend.app.services.transcription import TranscriptionService, FILLER_WORDS
from backend.app.services.ingest import IngestService
from backend.app.core.config import settings

def run_all_tests():
    print("=== Running ClipForge AI Unit Tests ===")
    
    # 1. Rubric weights sum to 1.0
    total = (
        settings.WEIGHT_HOOK +
        settings.WEIGHT_EMOTION +
        settings.WEIGHT_PACING +
        settings.WEIGHT_STORY +
        settings.WEIGHT_TREND
    )
    assert round(total, 4) == 1.0, f"Weights sum {total} != 1.0"
    print("✔ [PASS] 5-Factor Virality Rubric weights sum to 100%")

    # 2. Trend keyword matching
    gta_score = ViralityScorerService.calculate_trend_score("Rockstar drops GTA 6 leak trailer")
    assert gta_score >= 90.0, f"Expected >= 90 for GTA 6, got {gta_score}"
    baseline_score = ViralityScorerService.calculate_trend_score("Regular tutorial on gardening")
    assert baseline_score <= 55.0, f"Expected <= 55, got {baseline_score}"
    print(f"✔ [PASS] Trend keyword detector (GTA 6: {gta_score}, Baseline: {baseline_score})")

    # 3. Pacing calculation
    pacing_160 = ViralityScorerService.calculate_pacing_score(160.0)
    pacing_80 = ViralityScorerService.calculate_pacing_score(80.0)
    assert pacing_160 == 95.0
    assert pacing_80 < 70.0
    print(f"✔ [PASS] Pacing score (160 WPM: {pacing_160}, 80 WPM: {pacing_80})")

    # 4. Virality evaluation heuristics
    eval_res = ViralityScorerService.evaluate_clip_heuristic(
        candidate_text="Yo did you see what Rockstar just leaked for GTA 6? It looks unbelievable!",
        start_time=0.0,
        end_time=30.0,
        audio_peaks=[2.5, 12.0],
        wpm=160.0
    )
    assert 70.0 <= eval_res["virality_score"] <= 100.0
    assert "hook" in eval_res["breakdown"]
    assert "why" in eval_res["virality_reason"].lower() or len(eval_res["virality_reason"]) > 10
    print(f"✔ [PASS] Virality rubric evaluation (Score: {eval_res['virality_score']}, Reason: {eval_res['virality_reason'][:40]}...)")

    # 5. ASS Timecode formatting
    assert CaptionGeneratorService.format_ass_time(0.0) == "0:00:00.00"
    assert CaptionGeneratorService.format_ass_time(65.42) == "0:01:05.42"
    print("✔ [PASS] ASS Subtitle Timecode formatting")

    # 6. ASS File generation
    import tempfile
    with tempfile.TemporaryDirectory() as tmpdir:
        ass_path = os.path.join(tmpdir, "test.ass")
        CaptionGeneratorService.generate_ass(
            words_data=[
                {"word": "GTA", "start": 1.0, "end": 1.5, "probability": 0.99},
                {"word": "SIX", "start": 1.5, "end": 2.0, "probability": 0.98}
            ],
            output_ass_path=ass_path,
            clip_start_time=0.0
        )
        assert os.path.exists(ass_path)
        with open(ass_path, "r", encoding="utf-8") as f:
            content = f.read()
            assert "[Script Info]" in content
            assert r"{\c&H0000FFFF" in content
    print("✔ [PASS] Word-by-word animated ASS subtitle generator")

    # 7. Permission validation check
    try:
        IngestService.validate_permission(False)
        assert False, "Should have raised ValueError"
    except ValueError as e:
        assert "Permission Denied" in str(e)
    print("✔ [PASS] Content ownership & permission enforcement check")

    # 8. FilmCraft Filtergraph (storytold/filmcraft)
    from backend.app.services.filmcraft_engine import FilmcraftEngineService
    fg, out = FilmcraftEngineService.build_cinematic_filter_complex(
        crop_w=608,
        crop_h=1080,
        crop_x=420,
        zoom_punch_ins=[0.5],
        color_preset="viral_vibrant",
        split_screen=False,
        retention_bar=True,
        duration=30.0
    )
    assert "crop=608:1080:420:0" in fg
    assert "zoompan=" in fg
    assert "drawbox=" in fg
    print("✔ [PASS] FilmCraft Cinematic multi-track filtergraph engine")

    # 9. HyperFrames Declarative Manifest (heygen-com/hyperframes)
    from backend.app.services.hyperframes_engine import HyperframesEngineService
    manifest = HyperframesEngineService.generate_hyperframes_manifest(
        clip_id="test_clip_1",
        title="GTA 6 Insane Leak",
        duration=30.0,
        words_data=[{"word": "insane", "start": 1.2, "end": 1.5, "probability": 0.99}],
    )
    assert manifest["version"] == "1.0.0"
    assert manifest["metadata"]["width"] == 1080
    assert len(manifest["tracks"]) >= 4
    # Check sticker emoji trigger for 'insane' (should be 🤯)
    stickers = [t for t in manifest["tracks"] if t["name"] == "Reaction_Stickers"][0]
    assert len(stickers["elements"]) > 0
    assert stickers["elements"][0]["emoji"] == "🤯"
    print("✔ [PASS] HyperFrames declarative motion graphics & kinetic reactions engine")

    print("\nALL 9 TESTS PASSED SUCCESSFULLY! 🚀")

if __name__ == "__main__":
    run_all_tests()

