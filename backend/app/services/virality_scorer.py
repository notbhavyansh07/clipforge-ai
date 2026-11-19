import json
import re
from typing import List, Dict, Any, Optional
from backend.app.core.config import settings

# Reverse-engineered viral keywords and high-performing social anchors
TRENDING_ANCHORS = {
    "gta6": 95, "gta 6": 95, "rockstar": 90, "leak": 88, "trailer": 85,
    "insane": 82, "secret": 85, "banned": 88, "unbelievable": 80,
    "mrbeast": 92, "challenge": 84, "glitch": 86, "ai": 89, "hack": 83,
    "exposed": 87, "world record": 90, "easter egg": 85, "proof": 84
}

class ViralityScorerService:
    @staticmethod
    def calculate_trend_score(text: str) -> float:
        """Calculates trend relevance (0-100) based on keyword anchors."""
        lower_text = text.lower()
        score = 50.0 # baseline neutral
        matches = 0
        for kw, weight in TRENDING_ANCHORS.items():
            if kw in lower_text:
                score = max(score, float(weight))
                matches += 1
        bonus = min(15.0, matches * 3.5)
        return min(100.0, score + bonus)

    @staticmethod
    def calculate_pacing_score(wpm: float) -> float:
        """
        Reverse engineered optimal retention cadence:
        150-185 WPM = 90-100 pts (ideal for short-form retention)
        < 110 WPM = too slow (penalized)
        > 220 WPM = too fast/muddled
        """
        if 140 <= wpm <= 190:
            return 95.0
        elif 120 <= wpm < 140:
            return 80.0
        elif 190 < wpm <= 220:
            return 85.0
        elif wpm < 120:
            return max(40.0, 40.0 + (wpm / 120.0) * 35.0)
        else:
            return 70.0

    @classmethod
    def evaluate_clip_heuristic(
        cls,
        candidate_text: str,
        start_time: float,
        end_time: float,
        audio_peaks: List[float],
        wpm: float
    ) -> Dict[str, Any]:
        """
        Computes 5-factor weighted virality rubric:
        1. Hook strength in first 3s (30%)
        2. Emotional intensity (20%)
        3. Pacing and energy (20%)
        4. Story clarity and completeness (15%)
        5. Trend relevance (15%)
        """
        # 1. Hook strength (first 3s)
        # Look for question marks, exclamation marks, or provocative trigger words
        first_words = " ".join(candidate_text.split()[:12]).lower()
        hook_score = 65.0
        if any(w in first_words for w in ["why", "how", "what", "did you", "wait", "never", "look at", "yo"]):
            hook_score += 20.0
        if "?" in first_words or "!" in first_words:
            hook_score += 10.0
        hook_score = min(98.0, hook_score)

        # 2. Emotional intensity (Audio energy peaks within clip window)
        peaks_in_window = [p for p in audio_peaks if start_time <= p <= end_time]
        peak_density = len(peaks_in_window) / max(1.0, (end_time - start_time) / 10.0)
        emotion_score = min(96.0, 55.0 + peak_density * 18.0)

        # 3. Pacing and energy
        pacing_score = cls.calculate_pacing_score(wpm)

        # 4. Story clarity and completeness
        # Checks for intro hook, substantive body, and clean resolution punctuation (. / !)
        duration = end_time - start_time
        story_score = 70.0
        if 20.0 <= duration <= 50.0:
            story_score += 15.0 # Sweet spot for Shorts/Reels
        if candidate_text.strip().endswith((".", "!", "?")):
            story_score += 10.0
        story_score = min(95.0, story_score)

        # 5. Trend relevance
        trend_score = cls.calculate_trend_score(candidate_text)

        # Weighted calculation
        total_virality = (
            hook_score * settings.WEIGHT_HOOK +
            emotion_score * settings.WEIGHT_EMOTION +
            pacing_score * settings.WEIGHT_PACING +
            story_score * settings.WEIGHT_STORY +
            trend_score * settings.WEIGHT_TREND
        )

        breakdown = {
            "hook": round(hook_score, 1),
            "emotion": round(emotion_score, 1),
            "pacing": round(pacing_score, 1),
            "story": round(story_score, 1),
            "trend": round(trend_score, 1)
        }

        # Generate concise explanation "why"
        if total_virality >= 85:
            reason = f"High retention velocity: explosive 3s hook combined with viral keyword alignment ('{list(TRENDING_ANCHORS.keys())[0]}') and sharp cadence."
        elif total_virality >= 75:
            reason = "Strong narrative arc with high emotional audio peak, well-suited for algorithm feed pickup."
        else:
            reason = "Steady conversational pace with consistent engagement, ideal as a topical micro-highlight."

        return {
            "virality_score": round(total_virality, 1),
            "breakdown": breakdown,
            "virality_reason": reason
        }

    @classmethod
    def generate_candidate_clips(
        cls,
        transcript_segments: List[Dict[str, Any]],
        audio_peaks: List[float],
        scene_cuts: List[float],
        max_candidates: int = 15
    ) -> List[Dict[str, Any]]:
        """
        Proposes 10-20 candidate clips (15-60s) with hook, payoff, and clean endings.
        Uses LLM prompt when API key is provided, otherwise advanced sliding window heuristic.
        """
        if settings.OPENAI_API_KEY or settings.GEMINI_API_KEY:
            try:
                candidates = cls._generate_candidates_with_llm(transcript_segments, audio_peaks, scene_cuts)
                if candidates and len(candidates) >= 3:
                    return candidates
            except Exception as e:
                print(f"[ViralityScorer] LLM candidate generation failed ({e}), falling back to deterministic heuristic.")

        return cls._generate_candidates_heuristic(transcript_segments, audio_peaks, scene_cuts, max_candidates)

    @classmethod
    def _generate_candidates_heuristic(
        cls,
        transcript_segments: List[Dict[str, Any]],
        audio_peaks: List[float],
        scene_cuts: List[float],
        max_candidates: int = 15
    ) -> List[Dict[str, Any]]:
        """Window-based candidate extraction grouping segments into 15-55s stories."""
        if not transcript_segments:
            return []

        candidates = []
        n_segs = len(transcript_segments)

        for i in range(n_segs):
            seg_start = transcript_segments[i]["start"]
            collected_text = []
            total_words = 0
            
            for j in range(i, n_segs):
                current_seg = transcript_segments[j]
                collected_text.append(current_seg["text"])
                total_words += len(current_seg.get("words", [])) or len(current_seg["text"].split())
                candidate_end = current_seg["end"]
                duration = candidate_end - seg_start

                # Look for candidate duration between 18s and 55s
                if 18.0 <= duration <= 55.0:
                    full_text = " ".join(collected_text)
                    wpm = (total_words / duration) * 60.0
                    
                    # Snap end to closest scene cut if available
                    snapped_end = candidate_end
                    for cut in scene_cuts:
                        if abs(cut - candidate_end) <= 1.5:
                            snapped_end = cut
                            break

                    eval_res = cls.evaluate_clip_heuristic(
                        candidate_text=full_text,
                        start_time=seg_start,
                        end_time=snapped_end,
                        audio_peaks=audio_peaks,
                        wpm=wpm
                    )

                    hook_text = " ".join(full_text.split()[:8]) + "..."
                    first_words = full_text.split()[:5]
                    title_candidate = " ".join(first_words).title().replace(".", "").replace("!", "")

                    candidates.append({
                        "title": title_candidate or f"Viral Highlight @ {int(seg_start)}s",
                        "hook_text": hook_text,
                        "description": full_text[:280],
                        "start_time": round(seg_start, 2),
                        "end_time": round(snapped_end, 2),
                        "duration": round(snapped_end - seg_start, 2),
                        "virality_score": eval_res["virality_score"],
                        "score_breakdown": eval_res["breakdown"],
                        "virality_reason": eval_res["virality_reason"],
                        "tags": ["#Shorts", "#Trending", "#Viral", "#GTA6", "#Gaming"]
                    })
                    break

        # Sort descending by virality score
        candidates.sort(key=lambda c: c["virality_score"], reverse=True)
        return candidates[:max_candidates]

    @classmethod
    def _generate_candidates_with_llm(
        cls,
        transcript_segments: List[Dict[str, Any]],
        audio_peaks: List[float],
        scene_cuts: List[float]
    ) -> List[Dict[str, Any]]:
        """Invokes LLM with system prompt instructing extraction of high-virality short clips."""
        import httpx
        
        # Prepare condensed transcript
        condensed_transcript = []
        for s in transcript_segments:
            condensed_transcript.append(f"[{s['start']:.1f}s - {s['end']:.1f}s]: {s['text']}")
        transcript_str = "\n".join(condensed_transcript[:120]) # Limit tokens
        
        system_prompt = (
            "You are a master viral video editor specializing in YouTube Shorts, TikTok, and Instagram Reels. "
            "Analyze the following transcript with timestamps and select the top 10 most viral 15-60 second clips. "
            "Each clip MUST have:\n"
            "1. An irresistible hook in the first 3 seconds.\n"
            "2. High emotional pacing and narrative payoff.\n"
            "3. A clean, satisfying ending without mid-sentence cutoffs.\n"
            "Provide the response strictly as a JSON array of objects with keys: "
            "'title', 'hook_text', 'start_time', 'end_time', 'virality_score', 'score_breakdown', 'virality_reason', 'tags'."
        )
        
        # Check provider
        if settings.OPENAI_API_KEY:
            headers = {"Authorization": f"Bearer {settings.OPENAI_API_KEY}", "Content-Type": "application/json"}
            payload = {
                "model": "gpt-4o-mini",
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Transcript:\n{transcript_str}"}
                ],
                "response_format": {"type": "json_object"}
            }
            res = httpx.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload, timeout=30.0)
            if res.status_code == 200:
                data = res.json()
                content = data["choices"][0]["message"]["content"]
                parsed = json.loads(content)
                candidates = parsed if isinstance(parsed, list) else parsed.get("clips", [])
                return candidates

        return []

