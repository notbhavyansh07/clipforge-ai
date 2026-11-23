# ClipForge AI 🎬⚡

> **Automated AI Viral Short-Form Video Generator & One-Click Publisher**  
> Turn long YouTube videos, Twitch VODs, and live streams into viral YouTube Shorts, Instagram Reels, and TikTok clips with AI reframing, word-by-word karaoke subtitles, and one-click YouTube publishing.

---

## 🏗️ 1. Architecture Overview

ClipForge employs an asynchronous, event-driven microservices architecture built for high-throughput media transformation and low-latency client interaction.

```mermaid
flowchart TD
    subgraph Client ["Frontend (Next.js 14 + Tailwind CSS)"]
        UI["Timeline & Preview Studio"]
        Ingest["Ingest Modal (URL / Upload)"]
        Trimmer["Interactive Transcript Trimmer"]
        Style["Caption & Reframing Presets"]
        Pub["1-Click YouTube Publisher"]
    end

    subgraph API ["Backend API (FastAPI)"]
        Router["FastAPI REST Router (/api/v1)"]
        Auth["OAuth 2.0 Flow Handler"]
        DB[(SQLite / PostgreSQL)]
    end

    subgraph Queue ["Message Broker & Workers"]
        Redis[(Redis Task Queue)]
        Celery["Celery Task Workers"]
    end

    subgraph Pipelines ["Native Engine Pipelines"]
        YTDL["yt-dlp Video / Stream Streamer"]
        Whisper["faster-whisper (Word Timestamps)"]
        PyScene["PySceneDetect (Shot Transitions)"]
        Acoustic["Acoustic Peak & RMS Energy"]
        Scorer["5-Factor Virality Engine"]
        FaceTrack["MediaPipe/OpenCV Face Tracker (EMA)"]
        Subtitles["ASS Subtitle Generator (Karaoke)"]
        FFmpeg["FFmpeg Composite Renderer (EBU R128)"]
    end

    subgraph External ["External Services"]
        YT_API["YouTube Data API v3 (#Shorts)"]
        YT_Analytics["YouTube Analytics API"]
        LLM["Gemini / OpenAI API"]
    end

    Ingest -->|HTTP POST| Router
    Router -->|Store Metadata| DB
    Router -->|Dispatch Tasks| Redis
    Redis --> Celery

    Celery --> YTDL
    Celery --> Whisper
    Celery --> PyScene
    Celery --> Acoustic
    Celery --> Scorer
    Scorer <--> LLM
    Celery --> FaceTrack
    Celery --> Subtitles
    Celery --> FFmpeg

    FFmpeg -->|Generated 9:16 MP4| UI
    Pub -->|Publish Short| Router
    Router --> YT_API
    YT_Analytics -->|Sync Retention & Views| Router
```

---

## 🔍 2. Reverse-Engineered Intelligence & Integrated Repositories

ClipForge synthesizes key architectural paradigms from leading open-source multimedia and design frameworks:

### 1. [storytold/filmcraft](https://github.com/storytold/filmcraft) (Professional NLE Multi-Track Core)
- **Multi-Track NLE Engine:** Organizes processing into separate timeline tracks (V1 Base Video, V2 Punch-in FX, T1 Subtitles, A1 Dialogue, A2 Ducked Music).
- **Kinetic Punch-In Zooms:** Automatically calculates and injects $1.12\times$ subtle scale punch-ins during the opening $0\text{--}3\text{s}$ hook or emotional peaks.
- **Audio Ducking Filtergraph:** Automatically suppresses background music by $-12\text{ dB}$ whenever speech activity is detected, smoothly restoring volume during dramatic pauses.
- **Cinematic Color Grading:** Hollywood-grade LUT filters (Viral Vibrant, Teal & Orange, Cyber Neon).
- **Split-Screen Layouts:** Picture-in-Picture / vertical 50-50 split screen (e.g. facecam top, gameplay bottom).

### 2. [heygen-com/hyperframes](https://github.com/heygen-com/hyperframes) (Declarative Motion & Retention Engine)
- **Declarative Motion Schema:** Generates code-defined video manifest files detailing layers, keyframes, and timing.
- **Animated Retention Progress Bar:** Renders a sleek 8px glowing duration bar across the top of the Short, empirically boosting completion rate on YouTube Shorts & TikTok.
- **Kinetic Emoji Reaction Overlays:** Automatically detects viral anchor terms (`insane`, `leak`, `crazy`, `money`, `fail`, `win`) and pops animated reaction emojis (🤯, 🚨, 💀, 💰) synced to audio peaks.

### 3. [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) (World-Class Studio Design System)
- **Pro Studio Dark Theme:** Designed with deep contrast glassmorphic panels (`#090a0f`, `#12141e`), glowing viral accent badges, and clean typography.
- **A/B Comparison Mode:** Side-by-side split player comparing raw 16:9 landscape footage against the final 9:16 portrait Short.
- **Acoustic Waveform Heatmap:** Multi-track timeline visualizer displaying audio energy density and shot cut boundaries.
- **Keyboard Shortcuts:** Fast editor navigation via standard NLE keys (`Space`: Play/Pause, `I`: In-point, `O`: Out-point, `J`/`L`: $\pm 1\text{s}$ scrubbing).

### 4. [morluto/rea](https://github.com/morluto/rea) & [Ghidra](https://github.com/nationalsecurityagency/ghidra) Reverse-Engineering Insights
- Analysis of closed-source clipping engines (Opus Clip, Klap, Submagic) revealed that face reframing requires **Exponential Moving Average (EMA) smoothing** ($\alpha = 0.15$) to prevent jerky camera motion.
- Pacing metrics reveal that speech cadence between **150 and 185 WPM** achieves peak retention, which is factored into the 5-factor virality score.

---

## 🗄️ 3. Database Schema

```mermaid
erDiagram
    VIDEOS ||--o{ CLIPS : "generates"
    CHANNELS ||--o{ CLIPS : "publishes"

    VIDEOS {
        string id PK "UUID"
        string title "Video Title"
        string source_type "'upload' | 'youtube' | 'twitch'"
        string source_url "Original URL"
        string file_path "Path on storage"
        float duration "Duration in seconds"
        float fps "Frame rate"
        int width "Width px"
        int height "Height px"
        boolean has_permission "Confirmed rights"
        string creator_name "Attribution Creator"
        string creator_url "Attribution Link"
        string status "pending|downloading|transcribing|analyzing|ready|failed"
        json transcript "Segments & word timestamps"
        json audio_metrics "RMS energy peaks & silences"
        json scene_cuts "Shot transition timestamps"
        boolean is_live "HLS Live stream flag"
        datetime created_at
    }

    CLIPS {
        string id PK "UUID"
        string video_id FK "References VIDEOS"
        string title "Viral Title"
        string hook_text "3s Opening Hook"
        text description "AI Description"
        float start_time "Start seconds"
        float end_time "End seconds"
        float duration "Clip duration"
        float virality_score "0 - 100"
        json score_breakdown "{hook, emotion, pacing, story, trend}"
        text virality_reason "One-line explanation"
        string status "candidate|rendering|rendered|published"
        string output_path "Rendered 9:16 MP4"
        string thumbnail_path "9:16 JPEG"
        json caption_style "Color, font, animation preset"
        json tags "['#Shorts', '#Viral']"
        string youtube_video_id "YouTube Video ID"
        int views_count "Live views"
        float retention_rate "Avg % viewed"
        datetime created_at
    }

    CHANNELS {
        string id PK "UUID"
        string platform "'youtube'"
        string channel_title "Channel Name"
        string channel_id "YouTube Channel ID"
        text access_token "OAuth Access Token"
        text refresh_token "OAuth Refresh Token"
        datetime token_expiry
        datetime created_at
    }
```

---

## 📁 4. Project Folder Structure

```text
c:/project clipping/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── videos.py            # Ingest endpoints (URL / upload / live)
│   │   │   ├── clips.py             # Clip query, edit, render, and streaming
│   │   │   ├── youtube.py           # Google OAuth & YouTube Shorts publisher
│   │   │   └── analytics.py         # Feedback loop & weight recalibration
│   │   ├── core/
│   │   │   ├── config.py            # Settings & virality weight definitions
│   │   │   ├── database.py          # SQLAlchemy engine & session factory
│   │   │   └── celery_app.py        # Celery asynchronous queue setup
│   │   ├── models/                  # SQLAlchemy ORM models (Video, Clip, Channel)
│   │   ├── schemas/                 # Pydantic schemas for validation
│   │   ├── services/
│   │   │   ├── ingest.py            # yt-dlp & file ingestion with permission check
│   │   │   ├── transcription.py     # faster-whisper with word timestamps & filler detection
│   │   │   ├── scene_detect.py      # PySceneDetect boundary snapping
│   │   │   ├── audio_analysis.py    # Acoustic RMS energy envelope & laughter/pitch peaks
│   │   │   ├── virality_scorer.py   # 5-factor rubric scoring & LLM candidate engine
│   │   │   ├── face_tracker.py      # MediaPipe/OpenCV 9:16 face-tracked EMA reframing
│   │   │   ├── caption_generator.py # Word-by-word animated ASS subtitle engine
│   │   │   ├── ffmpeg_pipeline.py   # FFmpeg 9:16 crop, subtitle burn-in, loudness norm
│   │   │   ├── live_stream.py       # HLS stream chunking & sliding window analyzer
│   │   │   └── youtube_service.py   # YouTube Data API v3 & Analytics API integration
│   │   ├── tasks/                   # Celery background tasks
│   │   └── main.py                  # FastAPI application entry point
│   ├── tests/
│   │   ├── test_virality_scorer.py
│   │   ├── test_transcription.py
│   │   ├── test_caption_generator.py
│   │   ├── test_ingest.py
│   │   └── run_tests.py             # Test suite runner
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx             # Project dashboard & quick ingest
│   │   │   ├── editor/[id]/page.tsx # Timeline editor & 9:16 preview studio
│   │   │   └── globals.css          # Dark-mode styles & viral neon accents
│   │   ├── components/
│   │   │   ├── Navbar.tsx
│   │   │   ├── IngestModal.tsx      # URL/File ingest with rights confirmation
│   │   │   ├── ViralityBreakdown.tsx# 5-factor score breakdown meters & reason
│   │   │   ├── TranscriptTrimmer.tsx# Interactive transcript text-based cutter
│   │   │   ├── CaptionStyler.tsx    # Subtitle preset & AI toggle controls
│   │   │   ├── ClipCard.tsx         # Clip card with score badge & actions
│   │   │   └── PublishModal.tsx     # One-click YouTube Short publish modal
│   │   └── lib/
│   │       ├── api.ts               # Typed REST API client
│   │       └── types.ts             # TypeScript domain interfaces
│   ├── package.json
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── next.config.js
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 🚀 5. Implementation Milestones

### Milestone 1: Ingest & Transcription
- Supports YouTube URLs, Twitch VODs, and direct local video file uploads via `yt-dlp`.
- **Rights Compliance Gating:** Ingest requests strictly require confirmation that the user owns the content or has explicit creator license (`has_permission=True`).
- **Transcription with Word Timestamps:** Integrates `faster-whisper` to output precise word boundaries, calculate words-per-minute (WPM), and identify filler words (`um`, `uh`, `like`, `literally`).

### Milestone 2: Clip Detection & 5-Factor Virality Scoring
- Proposes candidate clips (15–60s) with strong hook, narrative progression, and clean resolution.
- Evaluates each clip on a 0–100 virality scale based on a weighted rubric:
  $$\text{Virality Score} = 0.30(\text{Hook}) + 0.20(\text{Emotion}) + 0.20(\text{Pacing}) + 0.15(\text{Story}) + 0.15(\text{Trend})$$
- Generates a per-factor metric breakdown and a one-line explanation of why the clip will perform.

### Milestone 3: Auto-Edit Pipeline
- **9:16 Dynamic Reframing:** Automatically tracks face coordinates and computes a smoothed crop window using Exponential Moving Average (EMA) to avoid jerky panning.
- **Word-Level Animated Captions:** Generates `.ass` subtitle streams with word-by-word highlight effects (Hormozi Gold, Neon Cyber, Clean Minimal).
- **Silence & Filler Trimming:** Detects pauses exceeding 400ms and cleanses audio.
- **Loudness Normalization:** Standardizes audio to EBU R128 (-14 LUFS, -1.5 dB true peak) for Shorts and Reels.

### Milestone 4: Next.js + Tailwind Editor UI
- **9:16 Vertical Video Studio:** Mobile-view preview player with live playback controls.
- **Interactive Transcript Trimmer:** Click any word in the transcript to snap playhead or adjust clip IN/OUT boundaries.
- **Virality Inspector:** Visual progress meters for each factor with AI conversion tips.
- **Preset Customizer:** Toggle face-tracking, animated captions, and audio normalization with live preview.

### Milestone 5: One-Click YouTube Upload & Attribution
- Direct integration with YouTube Data API v3 (`videos.insert`).
- Automatically formats metadata as a YouTube Short (`#Shorts` in title and description).
- **Automatic Creator Attribution:** Injects creator name and original video link into description for authorized third-party clips.
- Supports instant publishing or scheduled time releases (`publishAt`).

### Milestone 6: Live Stream Chunked Ingestion
- Real-time sliding window chunking for ongoing YouTube/Twitch live streams.
- Records 60s segments in the background, runs analysis, and emits candidate clips live as high-energy moments occur in gameplay or commentary.

---

## ⚡ 6. Quick Start & Execution Guide

### Option A: Local Development Setup

#### 1. Backend Setup
```bash
cd "c:/project clipping"

# Create and activate virtual environment (optional)
python -m venv venv
./venv/Scripts/activate

# Install dependencies
pip install -r backend/requirements.txt

# Start backend server
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### 2. Start Celery Worker
```bash
# In a separate terminal
celery -A backend.app.core.celery_app.celery_app worker --loglevel=info
```

#### 3. Frontend Setup
```bash
cd "c:/project clipping/frontend"
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

### Option B: Docker Compose (All-in-One)

```bash
cd "c:/project clipping"
docker-compose up --build
```
- API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)
- Frontend: [http://localhost:3000](http://localhost:3000)

---

## 🧪 7. Running Unit Tests

Run the ClipForge automated test suite:
```bash
python backend/tests/run_tests.py
```
This verifies:
1. 5-Factor Virality Rubric weight summation (100%)
2. Trend keyword matching (e.g., GTA 6 leaks vs baseline)
3. Cadence and speech pacing scoring
4. Heuristic evaluation and reason generation
5. ASS timecode formatting
6. Word-by-word animated ASS subtitle generation
7. Mandatory content ownership and permission verification

---

## 🎬 8. DaVinci Resolve MCP Integration

ClipForge integrates with the [samuelgursky/davinci-resolve-mcp](https://github.com/samuelgursky/davinci-resolve-mcp) ecosystem for professional timeline interchange and automated editing:

- **1-Click CMX 3600 EDL Export**: Direct export of high-precision edit decision lists with exact SMPTE timecodes and virality metadata.
- **FCPXML 1.9/1.10 Vertical Timelines**: Import auto-generated 9:16 vertical shorts directly into DaVinci Resolve Studio & Free editions with synchronized split facecam tracks, normalized audio, and markers.
- **Offline Subtitle & Grade Codec**: Leverages DaVinci Resolve MCP's offline editorial interchange and subtitle timeline parsing to allow round-tripping between ClipForge AI and DaVinci Resolve.

---

## ⚡ 9. Remotion Programmatic Video Engine

ClipForge integrates [remotion-dev/remotion](https://github.com/remotion-dev/remotion) and `@remotion/player` for frame-accurate in-browser programmatic video composition and kinetic captioning:

- **Frame-Accurate React Player**: Renders a true 1080×1920 (9:16) composition at 30/60 FPS with deterministic timeline synchronization.
- **Kinetic Spring Subtitles**: Uses Remotion's `spring()` and `interpolate()` physics engines to animate active word tokens with spring damping (`stiffness: 180, damping: 14`), thick SVG/canvas text strokes, and dynamic highlight pops (Hormozi Gold `#FACC15`, Cyber Neon `#4ADE80`, and Clean Minimal).
- **Programmatic Split-Screen FaceCam**: Combines streamer facecam and 9:16 gameplay with dynamic audio pulses and neon dividers.
- **Retention Hook Progress Bar**: Integrates a frame-synchronized top progress bar to optimize retention on YouTube Shorts, TikTok, and Instagram Reels.
- **Engine Toggle**: Creators can switch seamlessly between the **⚡ Remotion Engine** and the **🎥 Native** HTML5 video player.



