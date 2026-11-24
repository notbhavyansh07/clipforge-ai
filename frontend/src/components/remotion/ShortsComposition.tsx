'use client';

import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Video as RemotionVideo,
} from 'remotion';
import { Clip, Video, RenderOptions } from '@/lib/types';

export interface ShortsCompositionProps {
  clip: Clip;
  video: Video;
  renderOptions: RenderOptions;
  videoUrl: string;
  posterUrl?: string;
}

export const ShortsComposition: React.FC<ShortsCompositionProps> = ({
  clip,
  video,
  renderOptions,
  videoUrl,
  posterUrl,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, width, height } = useVideoConfig();

  // Current time in seconds within the clip
  const clipTime = (frame / fps);
  // Stream absolute time in seconds
  const absoluteTime = clip.start_time + clipTime;

  // Find active transcript word
  const activeWordInfo = React.useMemo(() => {
    // 1. Check clip.captions_data first (relative to clipTime)
    if (clip.captions_data) {
      try {
        const parsed = typeof clip.captions_data === 'string' ? JSON.parse(clip.captions_data) : clip.captions_data;
        if (Array.isArray(parsed)) {
          const match = parsed.find((w: any) => clipTime >= w.start && clipTime <= w.end);
          if (match) return { word: match.word, start: clip.start_time + match.start, end: clip.start_time + match.end };
        }
      } catch {}
    }

    // 2. Check video.transcript (absolute time)
    if (video.transcript) {
      for (const seg of video.transcript) {
        if (absoluteTime >= seg.start && absoluteTime <= seg.end) {
          if (seg.words && seg.words.length > 0) {
            const w = seg.words.find(
              (item) => absoluteTime >= item.start && absoluteTime <= item.end
            );
            if (w) return { word: w.word, start: w.start, end: w.end };
          }
          return { word: seg.text, start: seg.start, end: seg.end };
        }
      }
    }
    return null;
  }, [clip.captions_data, video.transcript, clipTime, absoluteTime, clip.start_time]);

  const activeWord = activeWordInfo?.word || clip.hook_text || clip.title || 'WAIT FOR THIS PART! 😱';

  // Remotion spring bounce for the active word
  const wordStartFrame = activeWordInfo ? Math.round((activeWordInfo.start - clip.start_time) * fps) : 0;
  const relativeWordFrame = Math.max(0, frame - wordStartFrame);

  const bounce = spring({
    frame: relativeWordFrame,
    fps,
    config: {
      damping: 14,
      stiffness: 180,
    },
  });

  const wordScale = interpolate(bounce, [0, 1], [0.85, 1.1]);

  // Retention progress bar at top of video
  const progressPercent = (frame / durationInFrames) * 100;

  // Split-screen calculation: only split if explicitly requested AND not MrBeast / trending internet video
  const isTrending = video.id === 'vid-trending-daily-viral' || (video.creator_name || '').toLowerCase().includes('mrbeast');
  const isSplitScreen = !isTrending && renderOptions.split_screen && renderOptions.framing_mode === 'split_facecam';

  return (
    <AbsoluteFill style={{ backgroundColor: '#000000', overflow: 'hidden' }}>
      {/* Retention Progress Bar */}
      {renderOptions.enable_retention_bar && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: `${progressPercent}%`,
            height: 12,
            background: 'linear-gradient(90deg, #a855f7, #ec4899, #eab308)',
            zIndex: 40,
            boxShadow: '0 0 15px rgba(234, 179, 8, 0.8)',
          }}
        />
      )}

      {/* Main Video Background Layer */}
      {isSplitScreen ? (
        // Split-screen mode: Top FaceCam + Bottom Action
        <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Top Half: Streamer FaceCam (42%) */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '42%',
              overflow: 'hidden',
              backgroundColor: '#0a0b12',
              borderBottom: '4px solid #a855f7',
            }}
          >
            <RemotionVideo
              src={videoUrl}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center 20%',
              }}
              volume={0}
              muted
            />

            {/* FaceCam HUD overlay */}
            <div
              style={{
                position: 'absolute',
                top: 24,
                left: 24,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 16px',
                borderRadius: 9999,
                backgroundColor: 'rgba(0, 0, 0, 0.85)',
                border: '2px solid rgba(168, 85, 247, 0.6)',
                color: '#d8b4fe',
                fontFamily: 'monospace',
                fontSize: 24,
                fontWeight: 'bold',
              }}
            >
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: '#10b981',
                }}
              />
              <span>{video.creator_name || 'Streamer'} (FaceCam)</span>
            </div>

            <div
              style={{
                position: 'absolute',
                top: 24,
                right: 24,
                padding: '6px 14px',
                borderRadius: 8,
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                border: '1px solid rgba(234, 179, 8, 0.5)',
                color: '#fde047',
                fontFamily: 'monospace',
                fontSize: 20,
                fontWeight: 'bold',
              }}
            >
              AI FACE-LOCK
            </div>
          </div>

          {/* Neon Divider Bar with Animated Audio Wave */}
          <div
            style={{
              height: 16,
              background: 'linear-gradient(90deg, #ec4899, #a855f7, #06b6d4)',
              boxShadow: '0 0 25px rgba(168, 85, 247, 0.9)',
              zIndex: 30,
            }}
          />

          {/* Bottom Half: Action Stream (58%) */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '58%',
              overflow: 'hidden',
              backgroundColor: '#000000',
            }}
          >
            <RemotionVideo
              src={videoUrl}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center 88%',
              }}
            />
          </div>
        </div>
      ) : (
        // Fullscreen 9:16 Centered Crop
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          <RemotionVideo
            src={videoUrl}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        </div>
      )}

      {/* Remotion Kinetic Subtitle Overlay Engine */}
      {renderOptions.enable_animated_captions && activeWord && (
        <div
          style={{
            position: 'absolute',
            bottom: height * 0.22,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 35,
            padding: '0 32px',
          }}
        >
          {renderOptions.caption_preset === 'karaoke_bold' ? (
            // Hormozi Gold Style (Bold Black Stroke + Yellow Pop)
            <div
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.88)',
                padding: '16px 36px',
                borderRadius: 28,
                border: '4px solid #facc15',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.9)',
                transform: `scale(${wordScale})`,
                transition: 'transform 0.08s ease-out',
                maxWidth: '92%',
                textAlign: 'center',
              }}
            >
              <span
                style={{
                  color: '#facc15',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  fontWeight: 900,
                  fontSize: 54,
                  textTransform: 'uppercase',
                  letterSpacing: '2px',
                  textShadow: '0 4px 12px rgba(0, 0, 0, 1)',
                  display: 'inline-block',
                }}
              >
                {activeWord}
              </span>
            </div>
          ) : renderOptions.caption_preset === 'neon_cyber' ? (
            // Cyber Neon Style (Glitch Green + Cyan Glow)
            <div
              style={{
                backgroundColor: 'rgba(5, 46, 22, 0.92)',
                padding: '16px 36px',
                borderRadius: 24,
                border: '4px solid #4ade80',
                boxShadow: '0 0 35px rgba(74, 222, 128, 0.7)',
                transform: `scale(${wordScale})`,
                maxWidth: '92%',
                textAlign: 'center',
              }}
            >
              <span
                style={{
                  color: '#4ade80',
                  fontFamily: 'monospace',
                  fontWeight: 900,
                  fontSize: 52,
                  textTransform: 'uppercase',
                  letterSpacing: '3px',
                  display: 'inline-block',
                }}
              >
                ⚡ {activeWord}
              </span>
            </div>
          ) : (
            // Clean Minimal Style
            <div
              style={{
                backgroundColor: 'rgba(17, 24, 39, 0.85)',
                padding: '14px 32px',
                borderRadius: 20,
                border: '2px solid rgba(255, 255, 255, 0.25)',
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.8)',
                maxWidth: '92%',
                textAlign: 'center',
              }}
            >
              <span
                style={{
                  color: '#ffffff',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  fontWeight: 700,
                  fontSize: 44,
                  letterSpacing: '1px',
                  display: 'inline-block',
                }}
              >
                {activeWord}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Virality Floating Score Pill */}
      <div
        style={{
          position: 'absolute',
          top: 32,
          right: 32,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 20px',
          borderRadius: 9999,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          border: '2px solid rgba(16, 185, 129, 0.7)',
          color: '#34d399',
          fontFamily: 'system-ui, sans-serif',
          fontSize: 26,
          fontWeight: 900,
          zIndex: 35,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.8)',
        }}
      >
        <span>⚡</span>
        <span>{clip.virality_score} VIRAL</span>
      </div>
    </AbsoluteFill>
  );
};
