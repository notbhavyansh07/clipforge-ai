import os
from typing import Dict

def load_env_file():
    env_path = os.path.abspath(".env")
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    k = k.strip()
                    v = v.strip().strip("'").strip('"')
                    if k:
                        os.environ[k] = v

load_env_file()
try:
    from pydantic_settings import BaseSettings
    class BaseConfig(BaseSettings):
        class Config:
            env_file = ".env"
            extra = "allow"
except ImportError:
    class BaseConfig:
        pass

def get_default_ffmpeg():
    local_bin = os.path.abspath("ffmpeg.exe")
    if os.path.exists(local_bin):
        return local_bin
    if os.getenv("FFMPEG_PATH"):
        return os.getenv("FFMPEG_PATH")
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        return "ffmpeg"

class Settings(BaseConfig):
    PROJECT_NAME: str = "ClipForge AI"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Storage directories
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "uploads")
    CLIPS_DIR: str = os.getenv("CLIPS_DIR", "clips")
    TEMP_DIR: str = os.getenv("TEMP_DIR", "temp")
    
    # Database & Redis
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./clipforge.db")
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    CELERY_ALWAYS_EAGER: bool = os.getenv("CELERY_ALWAYS_EAGER", "False").lower() in ("true", "1")
    
    # FFmpeg binary path
    FFMPEG_PATH: str = get_default_ffmpeg()
    FFPROBE_PATH: str = os.getenv("FFPROBE_PATH", "ffprobe")
    
    # AI & LLM settings
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "gemini") # "gemini", "openai", "mock"
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    
    # Whisper settings
    WHISPER_MODEL_SIZE: str = os.getenv("WHISPER_MODEL_SIZE", "base")
    WHISPER_DEVICE: str = os.getenv("WHISPER_DEVICE", "cpu") # "cuda" or "cpu"
    WHISPER_COMPUTE_TYPE: str = os.getenv("WHISPER_COMPUTE_TYPE", "int8")
    
    # Virality Weights (Rubric based on reverse-engineered short-form engagement patterns)
    WEIGHT_HOOK: float = 0.30
    WEIGHT_EMOTION: float = 0.20
    WEIGHT_PACING: float = 0.20
    WEIGHT_STORY: float = 0.15
    WEIGHT_TREND: float = 0.15
    
    # Google OAuth & YouTube API
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")
    GOOGLE_CLIENT_SECRET: str = os.getenv("GOOGLE_CLIENT_SECRET", "")
    GOOGLE_REDIRECT_URI: str = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/api/v1/youtube/oauth/callback")
    
    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()

# Ensure directories exist
for directory in [settings.UPLOAD_DIR, settings.CLIPS_DIR, settings.TEMP_DIR]:
    os.makedirs(directory, exist_ok=True)
