from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, Dict, Any, List

from backend.app.services.ghost_downloader import GhostDownloaderService
from backend.app.services.ai_gateway import FreeAIGatewayService
from backend.app.services.paperclip_orchestrator import PaperclipOrchestrator

router = APIRouter(tags=["Integrations (Ghost, FreeClaude, Paperclip)"])

# 1. Ghost Downloader Ingest
class GhostProbeRequest(BaseModel):
    url: str

class GhostRecordRequest(BaseModel):
    stream_url: str
    duration_seconds: int = 60

@router.post("/ghost/probe")
def probe_stream(req: GhostProbeRequest):
    """Sniffs stream protocol, resolutions, and M3U8/DASH capabilities."""
    return GhostDownloaderService.probe_stream_metadata(req.url)

@router.post("/ghost/record")
def record_stream(req: GhostRecordRequest):
    """Captures an active M3U8 or YouTube live stream chunk."""
    return GhostDownloaderService.record_m3u8_stream(req.stream_url, req.duration_seconds)

# 2. Free AI Gateway
class AIHookRequest(BaseModel):
    title: str
    incident_type: str = "Gaming Highlight"
    location: str = "Los Santos"
    provider_id: str = "gemini-free"

@router.get("/ai/providers")
def get_ai_providers():
    """Lists free multi-provider models (Gemini, DeepSeek, Ollama, Claude-Code proxy)."""
    return {"providers": FreeAIGatewayService.list_providers()}

@router.post("/ai/generate-hook")
def generate_hook(req: AIHookRequest):
    """Generates high-retention viral opening hook and titles."""
    return FreeAIGatewayService.generate_viral_hook(req.title, req.incident_type, req.location, req.provider_id)

# 3. Paperclip Squad Orchestration
@router.get("/paperclip/squad")
def get_paperclip_squad():
    """Returns the Paperclip Autonomous Agent Squad org chart and live metrics."""
    return PaperclipOrchestrator.get_squad_status()

@router.post("/paperclip/heartbeat")
def trigger_squad_heartbeat():
    """Triggers an autonomous squad heartbeat cycle."""
    return PaperclipOrchestrator.trigger_heartbeat()
