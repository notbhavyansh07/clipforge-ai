'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Player, PlayerRef } from '@remotion/player';
import { ShortsComposition, ShortsCompositionProps } from './ShortsComposition';
import { Clip, Video, RenderOptions } from '@/lib/types';
import { Play } from 'lucide-react';

interface RemotionShortPlayerProps {
  clip: Clip;
  video: Video;
  renderOptions: RenderOptions;
  videoUrl: string;
  posterUrl?: string;
  onTimeUpdate?: (time: number) => void;
  onPlayStateChange?: (isPlaying: boolean) => void;
}

export default function RemotionShortPlayer({
  clip,
  video,
  renderOptions,
  videoUrl,
  posterUrl,
  onTimeUpdate,
  onPlayStateChange,
}: RemotionShortPlayerProps) {
  const playerRef = useRef<PlayerRef>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const fps = 30;
  const durationInFrames = Math.max(30, Math.round(clip.duration * fps));

  const inputProps: ShortsCompositionProps = {
    clip,
    video,
    renderOptions,
    videoUrl,
    posterUrl,
  };

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    const onFrameUpdate = () => {
      const currentFrame = player.getCurrentFrame();
      const relativeTime = currentFrame / fps;
      onTimeUpdate?.(clip.start_time + relativeTime);
    };

    const onPlay = () => {
      setIsPlaying(true);
      onPlayStateChange?.(true);
    };
    const onPause = () => {
      setIsPlaying(false);
      onPlayStateChange?.(false);
    };

    player.addEventListener('timeupdate', onFrameUpdate);
    player.addEventListener('play', onPlay);
    player.addEventListener('pause', onPause);

    return () => {
      player.removeEventListener('timeupdate', onFrameUpdate);
      player.removeEventListener('play', onPlay);
      player.removeEventListener('pause', onPause);
    };
  }, [clip.start_time, fps, onTimeUpdate, onPlayStateChange]);

  const togglePlay = () => {
    const player = playerRef.current;
    if (!player) return;
    if (player.isPlaying()) {
      player.pause();
    } else {
      player.play();
    }
  };

  return (
    <div
      onClick={togglePlay}
      className="w-full h-full relative flex items-center justify-center bg-black cursor-pointer select-none group"
    >
      <Player
        ref={playerRef}
        component={ShortsComposition}
        inputProps={inputProps}
        durationInFrames={durationInFrames}
        fps={fps}
        compositionWidth={1080}
        compositionHeight={1920}
        controls={false}
        loop
        autoPlay={false}
        style={{
          width: '100%',
          height: '100%',
          maxHeight: '100%',
          objectFit: 'contain',
        }}
      />

      {/* Floating Center Play Button When Paused */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 bg-black/25 transition-opacity duration-200">
          <div className="w-16 h-16 rounded-full bg-black/75 border-2 border-white/40 backdrop-blur-md flex items-center justify-center text-white shadow-2xl group-hover:scale-110 transition-transform">
            <Play className="w-8 h-8 fill-white ml-1 text-white" />
          </div>
        </div>
      )}
    </div>
  );
}
