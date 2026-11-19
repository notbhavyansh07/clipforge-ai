import { Video, Clip, RenderOptions, PublishPayload } from './types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export const api = {
  // Video endpoints
  async listVideos(): Promise<Video[]> {
    const res = await fetch(`${BASE_URL}/videos`);
    if (!res.ok) throw new Error('Failed to fetch videos');
    return res.json();
  },

  async getVideo(id: string): Promise<Video> {
    const res = await fetch(`${BASE_URL}/videos/${id}`);
    if (!res.ok) throw new Error('Failed to fetch video details');
    return res.json();
  },

  async ingestUrl(data: {
    url: string;
    has_permission: boolean;
    creator_name?: string;
    creator_url?: string;
    is_live?: boolean;
  }): Promise<Video> {
    const res = await fetch(`${BASE_URL}/videos/ingest/url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to ingest URL');
    }
    return res.json();
  },

  async ingestUpload(formData: FormData): Promise<Video> {
    const res = await fetch(`${BASE_URL}/videos/ingest/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to upload video');
    }
    return res.json();
  },

  async deleteVideo(id: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/videos/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete video');
  },

  async retryVideo(id: string): Promise<Video> {
    const res = await fetch(`${BASE_URL}/videos/${id}/retry`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to retry video processing');
    return res.json();
  },

  // Clips endpoints
  async getClipsForVideo(videoId: string): Promise<Clip[]> {
    const res = await fetch(`${BASE_URL}/clips/video/${videoId}`);
    if (!res.ok) throw new Error('Failed to fetch clips');
    return res.json();
  },

  async getClip(clipId: string): Promise<Clip> {
    const res = await fetch(`${BASE_URL}/clips/${clipId}`);
    if (!res.ok) throw new Error('Failed to fetch clip');
    return res.json();
  },

  async updateClip(clipId: string, data: Partial<Clip>): Promise<Clip> {
    const res = await fetch(`${BASE_URL}/clips/${clipId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update clip');
    return res.json();
  },

  async renderClip(clipId: string, options: RenderOptions): Promise<{ message: string }> {
    const res = await fetch(`${BASE_URL}/clips/${clipId}/render`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    });
    if (!res.ok) throw new Error('Failed to trigger clip rendering');
    return res.json();
  },

  getClipStreamUrl(clipId: string): string {
    return `${BASE_URL}/clips/${clipId}/stream`;
  },

  async findMomentByPrompt(videoId: string, query: string): Promise<Clip> {
    const res = await fetch(`${BASE_URL}/clips/video/${videoId}/find-moment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to locate moment');
    }
    return res.json();
  },

  // YouTube Publish
  async getYouTubeOAuthUrl(): Promise<any> {
    const res = await fetch(`${BASE_URL}/youtube/oauth/url`);
    if (!res.ok) throw new Error('Failed to get OAuth URL');
    return res.json();
  },

  async getYouTubeStatus(): Promise<{ connected: boolean; channel_title?: string }> {
    const res = await fetch(`${BASE_URL}/youtube/status`);
    if (!res.ok) return { connected: false };
    return res.json();
  },

  async connectYouTubeDirect(channelName: string): Promise<any> {
    const res = await fetch(`${BASE_URL}/youtube/connect/direct`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel_name: channelName }),
    });
    if (!res.ok) throw new Error('Failed to connect YouTube channel');
    return res.json();
  },

  async publishToYouTube(payload: PublishPayload): Promise<any> {
    const res = await fetch(`${BASE_URL}/youtube/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to publish to YouTube');
    }
    return res.json();
  },
};

