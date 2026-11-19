'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Scissors, ZoomIn, ZoomOut, Volume2, Sparkles, Film, Eye, Layers } from 'lucide-react';
import { TranscriptSegment } from '@/lib/types';

interface MultiTrackTimelineProps {
  duration: number;
  currentTime: number;
  startTime: number;
  endTime: number;
  isPlaying: boolean;
  transcript?: TranscriptSegment[];
  sceneCuts?: number[];
  audioPeaks?: number[];
  onSeek: (t: number) => void;
  onSetStartTime: (t: number) => void;
  onSetEndTime: (t: number) => void;
  onTogglePlay: () => void;
}

export default function MultiTrackTimeline({
  duration,
  currentTime,
  startTime,
  endTime,
  isPlaying,
  transcript = [],
  sceneCuts = [],
  audioPeaks = [],
  onSeek,
  onSetStartTime,
  onSetEndTime,
  onTogglePlay,
}: MultiTrackTimelineProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const totalDuration = Math.max(1, duration || 60);

  // Keyboard shortcuts (Space = Play/Pause, I = In, O = Out, J/L = Seek)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        onTogglePlay();
      } else if (e.key === 'i' || e.key === 'I') {
        e.preventDefault();
        onSetStartTime(currentTime);
      } else if (e.key === 'o' || e.key === 'O') {
        e.preventDefault();
        onSetEndTime(currentTime);
      } else if (e.key === 'j' || e.key === 'J') {
        e.preventDefault();
        onSeek(Math.max(0, currentTime - 1.0));
      } else if (e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        onSeek(Math.min(totalDuration, currentTime + 1.0));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTime, totalDuration, onTogglePlay, onSetStartTime, onSetEndTime, onSeek]);

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const progress = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek(progress * totalDuration);
  };

  const getPercent = (time: number) => `${(time / totalDuration) * 100}%`;

  return (
    <div className="bg-[#10121b] border border-gray-800 rounded-2xl p-4 space-y-3 select-none">
      {/* Header with Transport Controls & Keyboard Hint */}
      <div className="flex items-center justify-between text-xs pb-2 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <button
            onClick={onTogglePlay}
            className="p-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition flex items-center justify-center"
            title="Space: Play/Pause"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>
          <span className="font-mono text-gray-200 font-bold">
            {currentTime.toFixed(2)}s <span className="text-gray-500 font-normal">/ {totalDuration.toFixed(2)}s</span>
          </span>
        </div>

        {/* Shortcuts pill */}
        <div className="hidden md:flex items-center gap-3 text-[11px] text-gray-400 font-mono">
          <span><kbd className="px-1.5 py-0.5 rounded bg-gray-800 text-gray-300">Space</kbd> Play</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-gray-800 text-gray-300">I</kbd> Mark In</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-gray-800 text-gray-300">O</kbd> Mark Out</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-gray-800 text-gray-300">J</kbd>/<kbd className="px-1.5 py-0.5 rounded bg-gray-800 text-gray-300">L</kbd> &plusmn;1s</span>
        </div>
      </div>

      {/* Multi-Track NLE Canvas */}
      <div
        ref={containerRef}
        onClick={handleTimelineClick}
        className="relative h-44 bg-[#0a0b10] border border-gray-800/80 rounded-xl overflow-hidden cursor-pointer"
      >
        {/* Selected Clip Highlight Window */}
        <div
          className="absolute top-0 bottom-0 bg-purple-600/15 border-x-2 border-purple-500 z-10 transition-all pointer-events-none"
          style={{
            left: getPercent(startTime),
            width: `${((endTime - startTime) / totalDuration) * 100}%`,
          }}
        >
          <div className="absolute top-1 left-1.5 text-[9px] font-mono font-bold text-purple-300 bg-purple-950/80 px-1 rounded">
            IN: {startTime.toFixed(1)}s
          </div>
          <div className="absolute top-1 right-1.5 text-[9px] font-mono font-bold text-pink-300 bg-pink-950/80 px-1 rounded">
            OUT: {endTime.toFixed(1)}s
          </div>
        </div>

        {/* Track 1: Video & Visual Scene Cuts */}
        <div className="h-10 border-b border-gray-900 px-2 flex items-center relative bg-blue-950/10">
          <div className="absolute left-2 text-[10px] text-blue-400 font-bold flex items-center gap-1 z-20">
            <Film className="w-3 h-3" /> V1 (Video Cuts)
          </div>
          {sceneCuts.map((cut, idx) => (
            <div
              key={idx}
              className="absolute top-0 bottom-0 w-[1px] bg-cyan-400/60 z-10"
              style={{ left: getPercent(cut) }}
              title={`Scene Cut @ ${cut}s`}
            />
          ))}
        </div>

        {/* Track 2: Audio Waveform with Acoustic Heatmap */}
        <div className="h-12 border-b border-gray-900 px-2 flex items-center relative bg-emerald-950/10">
          <div className="absolute left-2 text-[10px] text-emerald-400 font-bold flex items-center gap-1 z-20">
            <Volume2 className="w-3 h-3" /> A1 (Acoustic Peaks)
          </div>
          {/* Simulated audio waveform bars */}
          <div className="w-full h-full flex items-center gap-[2px] opacity-40">
            {Array.from({ length: 64 }).map((_, i) => {
              const heightPct = 20 + Math.sin(i * 0.4) * 30 + (i % 5 === 0 ? 35 : 0);
              return (
                <div
                  key={i}
                  className="flex-1 bg-emerald-500 rounded-full"
                  style={{ height: `${heightPct}%` }}
                />
              );
            })}
          </div>
          {/* Audio energy peaks markers */}
          {audioPeaks.map((peak, idx) => (
            <div
              key={idx}
              className="absolute top-2 bottom-2 w-1.5 bg-yellow-400/80 rounded-full z-15 shadow-sm shadow-yellow-400/40"
              style={{ left: getPercent(peak) }}
              title={`High Energy Peak @ ${peak}s`}
            />
          ))}
        </div>

        {/* Track 3: Subtitles / Kinetic Word Density */}
        <div className="h-10 border-b border-gray-900 px-2 flex items-center relative bg-purple-950/10">
          <div className="absolute left-2 text-[10px] text-purple-400 font-bold flex items-center gap-1 z-20">
            <Sparkles className="w-3 h-3" /> T1 (Kinetic Subtitles)
          </div>
          {transcript.map((seg) => (
            <div
              key={seg.id}
              className="absolute top-2.5 bottom-2.5 bg-purple-500/40 border border-purple-400/60 rounded px-1 text-[9px] text-purple-200 truncate"
              style={{
                left: getPercent(seg.start),
                width: `${((seg.end - seg.start) / totalDuration) * 100}%`,
              }}
              title={seg.text}
            >
              {seg.text}
            </div>
          ))}
        </div>

        {/* Track 4: Retention Indicator & Zoom Punches */}
        <div className="h-10 px-2 flex items-center relative bg-amber-950/10">
          <div className="absolute left-2 text-[10px] text-amber-400 font-bold flex items-center gap-1 z-20">
            <Layers className="w-3 h-3" /> FX (Punch-Ins & Retention)
          </div>
          <div className="absolute left-[5%] text-[9px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-1.5 py-0.5 rounded">
            ⚡ Hook Punch-In
          </div>
        </div>

        {/* Real-time Playhead Scrubber */}
        <div
          className="absolute top-0 bottom-0 w-[2px] bg-red-500 z-30 shadow-lg shadow-red-500 pointer-events-none transition-all"
          style={{ left: getPercent(currentTime) }}
        >
          <div className="w-3 h-3 bg-red-500 rounded-full -ml-[5px] -mt-1 shadow-md" />
        </div>
      </div>
    </div>
  );
}

