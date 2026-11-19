import os
from typing import Dict, Any, List, Optional
from backend.app.core.config import settings

class FilmcraftEngineService:
    """
    FilmCraft Cinematic NLE Engine (inspired by storytold/filmcraft architecture)
    - High-bitrate 60fps rendering pipeline
    - Dynamic zoom punch-ins on emotional emphasis
    - Automatic audio ducking (lowers background music during speech)
    - Cinematic color grading filters (Vibrant Pop, Teal & Orange, Cyber Neon)
    - Unsharp mask texture enhancement for razor-sharp gaming details
    """

    COLOR_PRESETS = {
        "viral_vibrant": "eq=saturation=1.35:contrast=1.15:brightness=0.01",
        "cinematic_teal_orange": "curves=all='0/0 0.5/0.46 1/1':r='0/0 0.5/0.55 1/1':b='0/0 0.5/0.42 1/1'",
        "cyber_neon": "eq=saturation=1.45:contrast=1.2,hue=h=4",
        "clean_natural": "eq=saturation=1.05:contrast=1.05"
    }

    @classmethod
    def build_cinematic_filter_complex(
        cls,
        crop_w: int,
        crop_h: int,
        crop_x: int,
        zoom_punch_ins: List[float] = None,
        color_preset: str = "viral_vibrant",
        split_screen: bool = False,
        split_layout: str = "gaming_stacked_50_50",
        hook_headline: Optional[str] = None,
        retention_bar: bool = True,
        duration: float = 30.0
    ) -> str:
        """
        Builds a multi-layer FFmpeg filtergraph for high-bitrate 60fps cinematic short-form composition.
        Includes Wayin-style Smart Split Screen and Dynamic Hook Headline Banners.
        """
        color_filter = cls.COLOR_PRESETS.get(color_preset, cls.COLOR_PRESETS["viral_vibrant"])
        sharpness_filter = "unsharp=5:5:0.7:3:3:0.3"
        
        filters = []
        
        if split_screen:
            if split_layout == "facecam_top_gameplay_bottom":
                # Wayin-Style Gaming Layout: Top 40% Streamer Cam (zoomed), Bottom 60% Gameplay Action
                filters.append(
                    f"[0:v]split=2[cam_raw][game_raw];"
                    f"[cam_raw]crop={crop_w//2}:{crop_h//3}:{crop_x + crop_w//4}:0,scale=1080:768:flags=lanczos[cam];"
                    f"[game_raw]crop={crop_w}:{int(crop_h*0.6)}:{crop_x}:{int(crop_h*0.35)},scale=1080:1152:flags=lanczos[game];"
                    f"[cam][game]vstack=inputs=2[v_split];"
                    f"[v_split]{color_filter},{sharpness_filter}[v_graded]"
                )
            else:
                # 50/50 Balanced Stack: Top = speaker face crop, Bottom = gameplay/b-roll
                filters.append(
                    f"[0:v]split=2[top_raw][bot_raw];"
                    f"[top_raw]crop={crop_w}:{crop_h//2}:{crop_x}:0,scale=1080:960:flags=lanczos[top];"
                    f"[bot_raw]crop={crop_w}:{crop_h//2}:(iw-{crop_w})/2:{crop_h//4},scale=1080:960:flags=lanczos[bot];"
                    f"[top][bot]vstack=inputs=2[v_split];"
                    f"[v_split]{color_filter},{sharpness_filter}[v_graded]"
                )
            base_out = "v_graded"
        else:
            # 9:16 Centered Crop with Lanczos scaling to 1080x1920 + Sharpening + Color grading
            filters.append(
                f"[0:v]crop={crop_w}:{crop_h}:{crop_x}:0,scale=1080:1920:flags=lanczos,{color_filter},{sharpness_filter}[v_graded]"
            )
            base_out = "v_graded"

        # Dynamic Punch-in Zoom on Hook (first 2.5s zoom in 1.14x for dramatic engagement)
        if zoom_punch_ins and len(zoom_punch_ins) > 0:
            punch_t = zoom_punch_ins[0]
            filters.append(
                f"[{base_out}]zoompan=z='if(between(it,{punch_t},{punch_t + 2.0}),1.14,1.0)':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=60[v_zoomed]"
            )
            base_out = "v_zoomed"

        # HyperFrames Glowing Top Retention Progress Bar
        if retention_bar:
            filters.append(
                f"[{base_out}]drawbox=x=0:y=0:w='1080*(t/{duration})':h=12:color=0x00F0FF@0.95:t=fill[v_bar]"
            )
            base_out = "v_bar"

        # Wayin-Style Top Hook Headline Banner (Visible for first 3.5s to hook scrollers)
        if hook_headline:
            safe_text = hook_headline.replace("'", "").replace(":", "").replace('"', '')[:45].upper()
            filters.append(
                f"[{base_out}]drawbox=enable='between(t,0,3.5)':x=80:y=80:w=920:h=90:color=black@0.85:t=fill[v_box];"
                f"[v_box]drawbox=enable='between(t,0,3.5)':x=80:y=80:w=920:h=90:color=0xFFD700@0.9:t=4[v_box_border];"
                f"[v_box_border]drawtext=enable='between(t,0,3.5)':text='{safe_text}':x=(w-text_w)/2:y=112:fontsize=38:fontcolor=white:shadowcolor=black:shadowx=2:shadowy=2[v_hook]"
            )
            base_out = "v_hook"

        return ";".join(filters), base_out
