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

  // Remotion spring bounce for the active word with smooth easing
  const wordStartFrame = activeWordInfo ? Math.round((activeWordInfo.start - clip.start_time) * fps) : 0;
  const relativeWordFrame = Math.max(0, frame - wordStartFrame);

  const bounce = spring({
    frame: relativeWordFrame,
    fps,
    config: {
      damping: 12,
      stiffness: 200,
      mass: 0.8,
    },
  });

  const wordScale = interpolate(bounce, [0, 1], [0.82, 1.08]);

  // Cinematic Entrance Animation for virality badge
  const badgeSpring = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 160 },
  });
  const badgeTranslateY = interpolate(badgeSpring, [0, 1], [-60, 0]);
  const badgeOpacity = interpolate(badgeSpring, [0, 1], [0, 1]);

  // Retention progress bar at top of video
  const progressPercent = (frame / durationInFrames) * 100;

  // Dynamic Punch-In Zoom on Hook & Word Beats (real viral Shorts pacing)
  const hookZoom = renderOptions.enable_punch_in_zoom
    ? interpolate(frame, [0, fps * 2, durationInFrames], [1.08, 1.0, 1.05], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    : 1;
  const wordBeatZoom = renderOptions.enable_punch_in_zoom
    ? interpolate(bounce, [0, 1], [1.03, 1.0])
    : 1;
  const dynamicZoom = Number((hookZoom * wordBeatZoom).toFixed(4));

  // Viral Color Grading
  const videoFilter =
    renderOptions.color_preset === 'viral_vibrant'
      ? 'contrast(1.08) saturate(1.18) brightness(1.02)'
      : 'none';

  // Opening 2.5s Hook Banner opacity
  const hookBannerOpacity = interpolate(
    frame,
    [0, 8, fps * 2.2, fps * 2.7],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

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
                transform: `scale(${dynamicZoom})`,
                filter: videoFilter,
              }}
            />
          </div>
        </div>
      ) : (
        // Fullscreen 9:16 Centered Crop with Dynamic Punch-In Zoom
        <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
          <RemotionVideo
            src={videoUrl}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: `scale(${dynamicZoom})`,
              filter: videoFilter,
            }}
          />
        </div>
      )}

      {/* Opening 2.5s Viral Hook Overlay */}
      {hookBannerOpacity > 0.02 && (clip.hook_text || clip.title) && (
        <div
          style={{
            position: 'absolute',
            top: 110,
            left: 36,
            right: 36,
            display: 'flex',
            justifyContent: 'center',
            opacity: hookBannerOpacity,
            zIndex: 36,
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              background: 'linear-gradient(90deg, rgba(168,85,247,0.92), rgba(236,72,153,0.92))',
              padding: '12px 28px',
              borderRadius: 20,
              border: '3px solid rgba(255,255,255,0.6)',
              boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
              textAlign: 'center',
              maxWidth: '90%',
            }}
          >
            <span
              style={{
                color: '#ffffff',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                fontWeight: 900,
                fontSize: 34,
                letterSpacing: '0.5px',
                textShadow: '0 2px 8px rgba(0,0,0,0.8)',
              }}
            >
              {clip.hook_text || clip.title}
            </span>
          </div>
        </div>
      )}

      {/* Remotion Kinetic Subtitle Overlay Engine (Studio-Grade Typography) */}
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
            // Hormozi Gold Style (Multi-layer 3D Shadow + Vibrant Pop)
            <div
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.92)',
                padding: '18px 40px',
                borderRadius: 24,
                border: '4px solid #facc15',
                boxShadow: '0 16px 48px rgba(0, 0, 0, 0.95), 0 0 25px rgba(250, 204, 21, 0.4)',
                transform: `scale(${wordScale})`,
                transition: 'transform 0.06s cubic-bezier(0.34, 1.56, 0.64, 1)',
                maxWidth: '92%',
                textAlign: 'center',
              }}
            >
              <span
                style={{
                  color: '#facc15',
                  fontFamily: 'Montserrat, Impact, system-ui, -apple-system, sans-serif',
                  fontWeight: 900,
                  fontSize: 56,
                  textTransform: 'uppercase',
                  letterSpacing: '3px',
                  textShadow: '3px 3px 0px #000, -2px -2px 0px #000, 2px -2px 0px #000, -2px 2px 0px #000, 0px 6px 16px rgba(0,0,0,0.9)',
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
                backgroundColor: 'rgba(5, 46, 22, 0.95)',
                padding: '18px 40px',
                borderRadius: 24,
                border: '3px solid #4ade80',
                boxShadow: '0 0 40px rgba(74, 222, 128, 0.8), 0 12px 36px rgba(0, 0, 0, 0.9)',
                transform: `scale(${wordScale})`,
                maxWidth: '92%',
                textAlign: 'center',
              }}
            >
              <span
                style={{
                  color: '#4ade80',
                  fontFamily: 'monospace, system-ui',
                  fontWeight: 900,
                  fontSize: 52,
                  textTransform: 'uppercase',
                  letterSpacing: '4px',
                  textShadow: '0 0 20px rgba(74, 222, 128, 0.9), 2px 2px 0px #000',
                  display: 'inline-block',
                }}
              >
                ⚡ {activeWord}
              </span>
            </div>
          ) : (
            // Clean Minimal Style (Polished Frosted Glass)
            <div
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.88)',
                backdropFilter: 'blur(12px)',
                padding: '16px 36px',
                borderRadius: 20,
                border: '2px solid rgba(255, 255, 255, 0.35)',
                boxShadow: '0 12px 36px rgba(0, 0, 0, 0.85)',
                transform: `scale(${wordScale})`,
                maxWidth: '92%',
                textAlign: 'center',
              }}
            >
              <span
                style={{
                  color: '#ffffff',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  fontWeight: 800,
                  fontSize: 46,
                  letterSpacing: '1.5px',
                  textShadow: '0 2px 10px rgba(0, 0, 0, 0.8)',
                  display: 'inline-block',
                }}
              >
                {activeWord}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Virality Floating Score Pill (With Smooth Spring Entry) */}
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
          backgroundColor: 'rgba(0, 0, 0, 0.88)',
          border: '2px solid rgba(16, 185, 129, 0.8)',
          color: '#34d399',
          fontFamily: 'system-ui, sans-serif',
          fontSize: 26,
          fontWeight: 900,
          zIndex: 35,
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.85)',
          transform: `translateY(${badgeTranslateY}px)`,
          opacity: badgeOpacity,
        }}
      >
        <span>⚡</span>
        <span>{clip.virality_score} VIRAL</span>
      </div>
    </AbsoluteFill>
  );
};
