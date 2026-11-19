export interface WordTimestamp {
  word: string;
  start: number;
  end: number;
  probability: number;
  is_filler?: boolean;
}

export interface TranscriptSegment {
  id: number;
  start: number;
  end: number;
  text: string;
  words: WordTimestamp[];
  wpm: number;
  filler_count?: number;
}

export interface ScoreBreakdown {
  hook: number;
  emotion: number;
  pacing: number;
  story: number;
  trend: number;
}

export interface Clip {
  id: string;
  video_id: string;
  title: string;
  hook_text?: string;
  description?: string;
  start_time: number;
  end_time: number;
  duration: number;
  virality_score: number;
  score_breakdown?: ScoreBreakdown;
  virality_reason?: string;
  status: 'candidate' | 'rendering' | 'rendered' | 'published' | 'failed';
  output_path?: string;
  thumbnail_path?: string;
  location?: string;
  incident_type?: string;
  stream_time_formatted?: string;
  caption_style?: Record<string, any>;
  tags: string[];
  youtube_video_id?: string;
  views_count: number;
  retention_rate: number;
  created_at: string;
}

export interface Video {
  id: string;
  title: string;
  source_type: 'upload' | 'youtube' | 'twitch' | 'livestream';
  source_url?: string;
  duration: number;
  fps: number;
  width: number;
  height: number;
  has_permission: boolean;
  creator_name?: string;
  creator_url?: string;
  status: 'pending' | 'downloading' | 'transcribing' | 'analyzing' | 'ready' | 'failed';
  error_message?: string;
  is_live: boolean;
  created_at: string;
  transcript?: TranscriptSegment[];
  clips?: Clip[];
}

export interface RenderOptions {
  aspect_ratio?: string;
  enable_face_tracking?: boolean;
  enable_animated_captions?: boolean;
  enable_silence_trim?: boolean;
  enable_audio_normalization?: boolean;
  caption_preset?: string;
  color_preset?: string;
  enable_punch_in_zoom?: boolean;
  enable_retention_bar?: boolean;
  split_screen?: boolean;
  split_layout?: string;
  hook_headline?: string;
}

export interface PublishPayload {
  clip_id: string;
  title?: string;
  description?: string;
  tags?: string[];
  scheduled_at?: string;
  include_attribution: boolean;
  privacy_status?: string;
}

