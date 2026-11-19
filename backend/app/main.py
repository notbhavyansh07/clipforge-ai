import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.app.core.config import settings
from backend.app.core.database import engine, Base
from backend.app.api import videos, clips, youtube, analytics

# Create tables & auto-seed initial clips
Base.metadata.create_all(bind=engine)
try:
    from backend.app.core.db_seeder import seed_database_if_empty
    seed_database_if_empty()
except Exception as e:
    print(f"[Main] Seeder notice: {e}")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="ClipForge AI Engine - Turn long videos & live streams into viral short-form clips with one-click upload."
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(videos.router, prefix=settings.API_V1_STR)
app.include_router(clips.router, prefix=settings.API_V1_STR)
app.include_router(youtube.router, prefix=settings.API_V1_STR)
app.include_router(analytics.router, prefix=settings.API_V1_STR)

# Serve generated clips statically if needed
if os.path.exists(settings.CLIPS_DIR):
    app.mount("/static/clips", StaticFiles(directory=settings.CLIPS_DIR), name="static_clips")

@app.get("/")
def root():
    return {
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "docs_url": "/docs"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}

