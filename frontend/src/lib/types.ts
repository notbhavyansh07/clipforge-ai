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
  status: 'candidate' | 'rendering' | 'rendered' | 'published' | 'scheduled' | 'failed';
  output_path?: string;
  thumbnail_path?: string;
  location?: string;
  incident_type?: string;
  stream_time_formatted?: string;
  caption_style?: Record<string, any>;
  tags?: string[];
  youtube_video_id?: string;
  youtube_publish_time?: string | null;
  instagram_media_id?: string;
  instagram_url?: string;
  instagram_publish_time?: string | null;
  views_count?: number;
  retention_rate?: number;
  created_at?: string;
  chat_burst_score?: number;
  peak_chatters?: number;
  reaction_emojis?: string[];
  framing_mode?: string;
  swear_masked?: boolean;
  caption_position?: string;
  scheduled_publish_time?: string | null;
  captions_data?: any;
  updated_at?: string;
}

export interface Video {
  id: string;
  title: string;
  source_type: 'upload' | 'youtube' | 'twitch' | 'livestream';
  source_url?: string;
  file_path?: string;
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
  audio_metrics?: any;
  scene_cuts?: any;
  stream_chunk_count?: number;
  updated_at?: string;
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
  framing_mode?: 'fill_player_track' | 'fit_blurred' | 'split_facecam';
  lead_in_seconds?: number;
  enable_swear_masking?: boolean;
  caption_language?: 'auto' | 'en' | 'hinglish';
  caption_position?: 'lower_third' | 'middle' | 'bottom';
  gta_cams_evasion?: boolean;
}

export interface PublishPayload {
  clip_id: string;
  title?: string;
  description?: string;
  tags?: string[];
  scheduled_at?: string;
  include_attribution: boolean;
  privacy_status?: string;
  platforms?: ('youtube' | 'instagram')[];
  instagram_access_token?: string;
  instagram_account_id?: string;
}

export interface AutopilotSlot {
  slot_number: 1 | 2 | 3;
  target_time_label: string;
  target_time_ist: string;
  target_date?: string;
  creator_name: string;
  video_id: string;
  clip: Clip | null;
  status: 'scheduled' | 'publishing' | 'published' | 'queued';
  peak_strategy: string;
  youtube_video_id?: string;
  youtube_publish_time?: string;
  youtube_url?: string;
}

export interface AutopilotStatus {
  daemon_running: boolean;
  channel_title: string;
  daily_target: number;
  today_label?: string;
  tomorrow_label?: string;
  today_iso?: string;
  tomorrow_iso?: string;
  ist_time_24?: string;
  last_cycle_run?: string;
  next_slot?: AutopilotSlot;
  slots: AutopilotSlot[];
  tomorrow_slots?: AutopilotSlot[];
  logs?: any[];
}

