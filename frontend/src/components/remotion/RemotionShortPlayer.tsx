'use client';

import React, { useRef, useEffect } from 'react';
import { Player, PlayerRef } from '@remotion/player';
import { ShortsComposition, ShortsCompositionProps } from './ShortsComposition';
import { Clip, Video, RenderOptions } from '@/lib/types';

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

    const onPlay = () => onPlayStateChange?.(true);
    const onPause = () => onPlayStateChange?.(false);

    player.addEventListener('timeupdate', onFrameUpdate);
    player.addEventListener('play', onPlay);
    player.addEventListener('pause', onPause);

    return () => {
      player.removeEventListener('timeupdate', onFrameUpdate);
      player.removeEventListener('play', onPlay);
      player.removeEventListener('pause', onPause);
    };
  }, [clip.start_time, fps, onTimeUpdate, onPlayStateChange]);

  return (
    <div className="w-full h-full relative flex items-center justify-center bg-black">
      <Player
        ref={playerRef}
        component={ShortsComposition}
        inputProps={inputProps}
        durationInFrames={durationInFrames}
        fps={fps}
        compositionWidth={1080}
        compositionHeight={1920}
        controls
        loop
        autoPlay={false}
        style={{
          width: '100%',
          height: '100%',
          maxHeight: '100%',
          objectFit: 'contain',
        }}
      />
    </div>
  );
}
