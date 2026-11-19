import json
from typing import List, Dict, Any, Optional

class HyperframesEngineService:
    """
    HyperFrames Declarative Motion Engine (inspired by heygen-com/hyperframes)
    - Declarative JSON motion project schema
    - Kinetic typography keyframes with spring bounce
    - High-energy emoji and sticker triggers (🔥, 🤯, 💀, 🚨)
    - Retention progress bar & frame-accurate animations
    """

    REACTION_EMOJIS = {
        "insane": "🤯", "unbelievable": "🤯", "leak": "🚨", "secret": "🤫",
        "gta6": "🎮", "fire": "🔥", "crazy": "💀", "money": "💰",
        "fail": "🤦", "win": "🏆", "huge": "⚡"
    }

    @classmethod
    def generate_hyperframes_manifest(
        cls,
        clip_id: str,
        title: str,
        duration: float,
        words_data: List[Dict[str, Any]],
        aspect_ratio: str = "9:16",
        fps: int = 30
    ) -> Dict[str, Any]:
        """
        Builds a HyperFrames declarative video specification compatible with
        HyperFrames CLI / runtime execution.
        """
        total_frames = int(duration * fps)

        # Detect emoji triggers
        animated_stickers = []
        for w in words_data:
            clean_word = w["word"].lower().strip("!?,.")
            if clean_word in cls.REACTION_EMOJIS:
                start_frame = int(w["start"] * fps)
                animated_stickers.append({
                    "id": f"sticker_{clean_word}_{start_frame}",
                    "emoji": cls.REACTION_EMOJIS[clean_word],
                    "start_frame": start_frame,
                    "duration_frames": int(1.2 * fps),
                    "position": {"x": 540, "y": 720},
                    "animation": "pop_bounce",
                    "scale": [0.0, 1.3, 1.0]
                })

        manifest = {
            "version": "1.0.0",
            "metadata": {
                "id": clip_id,
                "title": title,
                "generator": "ClipForge HyperFrames Engine",
                "width": 1080,
                "height": 1920,
                "fps": fps,
                "duration_frames": total_frames,
            },
            "tracks": [
                {
                    "name": "Base_Video_Reframed",
                    "type": "video",
                    "layer": 0,
                    "source": f"clips/{clip_id}_base.mp4"
                },
                {
                    "name": "Retention_Indicator",
                    "type": "shape",
                    "layer": 2,
                    "element": "progress_bar",
                    "props": {
                        "height": 10,
                        "color": "#00F0FF",
                        "glow": "#a855f7"
                    }
                },
                {
                    "name": "Kinetic_Captions",
                    "type": "subtitles",
                    "layer": 3,
                    "style": {
                        "fontFamily": "Montserrat",
                        "fontWeight": 900,
                        "fontSize": 72,
                        "highlightColor": "#00FF66",
                        "stroke": "#000000",
                        "strokeWidth": 12
                    },
                    "words": words_data
                },
                {
                    "name": "Reaction_Stickers",
                    "type": "overlay",
                    "layer": 4,
                    "elements": animated_stickers
                }
            ]
        }

        return manifest

