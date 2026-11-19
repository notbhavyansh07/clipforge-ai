import os
from datetime import datetime
from typing import Dict, Any, Optional, List
from backend.app.core.config import settings

SCOPES = [
    "https://www.googleapis.com/auth/youtube.upload",
    "https://www.googleapis.com/auth/youtube.readonly",
    "https://www.googleapis.com/auth/yt-analytics.readonly"
]

class YouTubeService:
    @staticmethod
    def get_oauth_authorization_url() -> Dict[str, str]:
        """Generates Google OAuth 2.0 consent URL for YouTube."""
        try:
            from google_auth_oauthlib.flow import Flow
            client_config = {
                "web": {
                    "client_id": settings.GOOGLE_CLIENT_ID or "mock-client-id",
                    "client_secret": settings.GOOGLE_CLIENT_SECRET or "mock-client-secret",
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "redirect_uris": [settings.GOOGLE_REDIRECT_URI]
                }
            }
            flow = Flow.from_client_config(
                client_config,
                scopes=SCOPES,
                redirect_uri=settings.GOOGLE_REDIRECT_URI
            )
            auth_url, state = flow.authorization_url(
                access_type="offline",
                include_granted_scopes="true",
                prompt="consent"
            )
            return {"authorization_url": auth_url, "state": state}
        except ImportError:
            return {"authorization_url": "https://accounts.google.com/o/oauth2/auth?mock=true", "state": "mock_state"}

    @staticmethod
    def exchange_code_for_tokens(code: str) -> Dict[str, Any]:
        """Exchanges auth code for access & refresh tokens."""
        from google_auth_oauthlib.flow import Flow
        client_config = {
            "web": {
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [settings.GOOGLE_REDIRECT_URI]
            }
        }
        flow = Flow.from_client_config(
            client_config,
            scopes=SCOPES,
            redirect_uri=settings.GOOGLE_REDIRECT_URI
        )
        flow.fetch_token(code=code)
        credentials = flow.credentials
        return {
            "token": credentials.token,
            "refresh_token": credentials.refresh_token,
            "token_uri": credentials.token_uri,
            "client_id": credentials.client_id,
            "client_secret": credentials.client_secret,
            "scopes": credentials.scopes
        }

    @classmethod
    def upload_short(
        cls,
        access_token: str,
        refresh_token: Optional[str],
        video_path: str,
        title: str,
        description: str,
        tags: List[str],
        creator_name: Optional[str] = None,
        creator_url: Optional[str] = None,
        scheduled_time: Optional[datetime] = None,
        privacy_status: str = "public"
    ) -> Dict[str, Any]:
        """
        Uploads a rendered 9:16 vertical video to YouTube as a Short.
        Automatically attaches attribution credit to description.
        """
        from google.oauth2.credentials import Credentials
        from googleapiclient.discovery import build
        from googleapiclient.http import MediaFileUpload
        # Ensure #Shorts is present in title/description for algorithm grouping
        final_title = title if "#Shorts" in title else f"{title} #Shorts"
        
        # Attribution block
        attrib_block = ""
        if creator_name:
            attrib_block = f"\n\n---\nOriginal Creator Credit: {creator_name}\n"
            if creator_url:
                attrib_block += f"Original Source: {creator_url}\n"
            attrib_block += "Clipped with authorized creator permission via ClipForge AI.\n"

        final_description = f"{description}{attrib_block}\n#Shorts #Viral"

        # Prepare YouTube credentials
        creds = Credentials(
            token=access_token,
            refresh_token=refresh_token,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=settings.GOOGLE_CLIENT_ID,
            client_secret=settings.GOOGLE_CLIENT_SECRET,
            scopes=SCOPES
        )

        youtube = build("youtube", "v3", credentials=creds)

        body: Dict[str, Any] = {
            "snippet": {
                "title": final_title[:100],
                "description": final_description[:5000],
                "tags": tags + ["Shorts", "Viral"],
                "categoryId": "20" # Gaming / Entertainment
            },
            "status": {
                "privacyStatus": "private" if scheduled_time else privacy_status,
                "selfDeclaredMadeForKids": False
            }
        }

        if scheduled_time:
            # Scheduled publish must have privacyStatus="private" and publishAt in ISO 8601
            body["status"]["publishAt"] = scheduled_time.isoformat() + "Z"

        media = MediaFileUpload(video_path, chunksize=-1, resumable=True, mimetype="video/mp4")
        request = youtube.videos().insert(
            part="snippet,status",
            body=body,
            media_body=media
        )

        response = request.execute()
        video_id = response.get("id")
        return {
            "success": True,
            "video_id": video_id,
            "video_url": f"https://youtube.com/shorts/{video_id}",
            "title": final_title,
            "response": response
        }

    @classmethod
    def fetch_clip_analytics(cls, access_token: str, refresh_token: Optional[str], video_id: str) -> Dict[str, Any]:
        """Fetch view counts and retention percentage via YouTube Data & Analytics API."""
        from google.oauth2.credentials import Credentials
        from googleapiclient.discovery import build
        creds = Credentials(
            token=access_token,
            refresh_token=refresh_token,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=settings.GOOGLE_CLIENT_ID,
            client_secret=settings.GOOGLE_CLIENT_SECRET,
            scopes=SCOPES
        )
        youtube = build("youtube", "v3", credentials=creds)
        res = youtube.videos().list(part="statistics", id=video_id).execute()
        items = res.get("items", [])
        if items:
            stats = items[0].get("statistics", {})
            return {
                "views": int(stats.get("viewCount", 0)),
                "likes": int(stats.get("likeCount", 0)),
                "comments": int(stats.get("commentCount", 0))
            }
        return {"views": 0, "likes": 0, "comments": 0}

