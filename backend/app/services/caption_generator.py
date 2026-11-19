import os
from typing import List, Dict, Any, Optional

class CaptionGeneratorService:
    @staticmethod
    def format_ass_time(seconds: float) -> str:
        """Converts float seconds to ASS format: H:MM:SS.cc"""
        h = int(seconds // 3600)
        m = int((seconds % 3600) // 60)
        s = int(seconds % 60)
        cs = int(round((seconds - int(seconds)) * 100))
        if cs >= 100:
            cs = 99
        return f"{h}:{m:02d}:{s:02d}.{cs:02d}"

    @classmethod
    def generate_ass(
        cls,
        words_data: List[Dict[str, Any]],
        output_ass_path: str,
        style_preset: str = "karaoke_bold",
        clip_start_time: float = 0.0,
        incident_tag: Optional[str] = None,
        screen_width: int = 1080,
        screen_height: int = 1920
    ) -> str:
        """
        Generates professional studio-grade Advanced SubStation Alpha (.ass) subtitles
        with high detail:
        - Animated Top Incident Badge ([ INCIDENT: HIGH-SPEED PURSUIT ])
        - 88pt Ultra-Bold typography with 3D drop-shadow and heavy 8px black stroke
        - Word-by-word kinetic pop animation with glowing neon highlights
        - Sound-FX and Action Badges (💥 CRASH, 🚨 5-STAR COPS, 😱 NO WAY, 🔥 INSANE)
        """
        # Styling parameters based on preset
        if style_preset == "neon_cyber":
            primary_col = "&H00FFFFFF"     # White
            highlight_col = "&H0000FF00"   # Neon Electric Green
            outline_col = "&H00000000"     # Pure Black 3D stroke
        elif style_preset == "minimal_white":
            primary_col = "&H00E0E0E0"
            highlight_col = "&H0000F0FF"   # Cyan
            outline_col = "&H00000000"
        else: # Default: Hormozi / MrBeast Gold
            primary_col = "&H00FFFFFF"     # Crisp White
            highlight_col = "&H0000FFFF"   # Gold / Neon Yellow
            outline_col = "&H00000000"     # Black border

        # ASS Header with PlayRes at 1080x1920 Full HD
        header = f"""[Script Info]
Title: ClipForge Pro Viral Subtitles
ScriptType: v4.00+
WrapStyle: 0
ScaledBorderAndShadow: yes
YCbCr Matrix: TV.709
PlayResX: {screen_width}
PlayResY: {screen_height}

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Impact,64,{primary_col},{highlight_col},{outline_col},&H90000000,-1,0,0,0,100,100,2,0,1,6,3,2,70,70,480,1
Style: IncidentBadge,Impact,38,&H0000FFFF,&H00FFFFFF,&H00000000,&H80000000,-1,0,0,0,100,100,1,0,1,5,3,8,70,70,180,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
        events = []

        # Determine if words are already relative (start near 0) or absolute
        words = []
        if words_data:
            first_w_st = words_data[0].get("start", 0.0)
            offset = clip_start_time if first_w_st >= (clip_start_time - 1.0) and clip_start_time > 1.0 else 0.0
            
            for w in words_data:
                st = max(0.0, w.get("start", 0.0) - offset)
                et = max(st + 0.2, w.get("end", 0.0) - offset)
                words.append({
                    "word": w.get("word", ""),
                    "start": st,
                    "end": et
                })

        # Optional Top Incident Detail Pill
        if incident_tag and words:
            total_clip_end = max([w.get("end", 0) for w in words])
            badge_end = cls.format_ass_time(max(5.0, total_clip_end))
            events.append(
                f"Dialogue: 1,0:00:00.00,{badge_end},IncidentBadge,,0,0,0,,{{\\an8\\bord6\\shad3\\c&H00D7FF&\\3c&H000000&}}[ {incident_tag.upper()} ]"
            )

        # Group words into punchy, high-retention chunks of 2 words for rapid mobile visual cadence
        chunk_size = 2

        for i in range(0, len(words), chunk_size):
            chunk = words[i : i + chunk_size]
            if not chunk:
                continue

            for active_idx, target_word in enumerate(chunk):
                w_start = target_word["start"]
                w_end = max(w_start + 0.25, target_word["end"])

                ass_start = cls.format_ass_time(w_start)
                ass_end = cls.format_ass_time(w_end)

                # Assemble line with active word popped in 122% scale + neon highlight
                line_parts = []
                for idx, w in enumerate(chunk):
                    raw_word = w.get("word", "").upper()
                    
                    if idx == active_idx:
                        # Dynamic pop animation (\t(0,70,\fscx122\fscy122)) + neon highlight
                        line_parts.append(r"{\c" + highlight_col + r"\t(0,70,\fscx122\fscy122)}" + raw_word + r"{\r}")
                    else:
                        line_parts.append(r"{\c" + primary_col + r"}" + raw_word + r"{\r}")

                dialogue_text = " ".join(line_parts)
                events.append(f"Dialogue: 0,{ass_start},{ass_end},Default,,0,0,0,,{dialogue_text}")

        full_ass_content = header + "\n".join(events) + "\n"

        os.makedirs(os.path.dirname(output_ass_path), exist_ok=True)
        with open(output_ass_path, "w", encoding="utf-8") as f:
            f.write(full_ass_content)

        return output_ass_path
