'use client';

import React from 'react';
import { TranscriptSegment } from '@/lib/types';
import { Scissors, Clock, AlertCircle } from 'lucide-react';

interface TranscriptTrimmerProps {
  transcript: TranscriptSegment[];
  startTime: number;
  endTime: number;
  currentTime: number;
  onSetStartTime: (t: number) => void;
  onSetEndTime: (t: number) => void;
  onSeek: (t: number) => void;
}

export default function TranscriptTrimmer({
  transcript,
  startTime,
  endTime,
  currentTime,
  onSetStartTime,
  onSetEndTime,
  onSeek,
}: TranscriptTrimmerProps) {
  return (
    <div className="bg-[#12141e] border border-gray-800 rounded-2xl p-4 flex flex-col h-[480px]">
      <div className="flex items-center justify-between pb-3 border-b border-gray-800 mb-3">
        <div className="flex items-center gap-2">
          <Scissors className="w-4 h-4 text-purple-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">Transcript Trimmer</h3>
        </div>
        <div className="text-[11px] text-gray-400">
          Click word to play &bull; Click <span className="text-purple-400 font-mono">[IN]</span> or <span className="text-pink-400 font-mono">[OUT]</span> to cut
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-2">
        {transcript.map((seg) => {
          const isInsideClip = seg.end >= startTime && seg.start <= endTime;
          return (
            <div
              key={seg.id}
              className={`p-3 rounded-xl border text-xs transition ${
                isInsideClip
                  ? 'border-purple-600/50 bg-purple-950/20 text-gray-100'
                  : 'border-gray-800/60 bg-[#161824]/40 text-gray-400 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5 text-[10px] text-gray-400 font-mono">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {seg.start.toFixed(1)}s - {seg.end.toFixed(1)}s ({seg.wpm} WPM)
                </span>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => onSetStartTime(seg.start)}
                    className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 hover:bg-purple-500/40"
                  >
                    Set IN
                  </button>
                  <button
                    onClick={() => onSetEndTime(seg.end)}
                    className="px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-300 hover:bg-pink-500/40"
                  >
                    Set OUT
                  </button>
                </div>
              </div>

              {/* Words */}
              <div className="leading-relaxed flex flex-wrap gap-1">
                {seg.words && seg.words.length > 0 ? (
                  seg.words.map((w, wIdx) => {
                    const isWordActive = currentTime >= w.start && currentTime <= w.end;
                    return (
                      <span
                        key={wIdx}
                        onClick={() => onSeek(w.start)}
                        className={`cursor-pointer px-1 py-0.5 rounded transition ${
                          isWordActive
                            ? 'bg-yellow-400 text-black font-bold scale-105'
                            : w.is_filler
                            ? 'bg-red-500/20 text-red-300 line-through'
                            : 'hover:bg-gray-700/60'
                        }`}
                        title={`${w.start}s - ${w.end}s${w.is_filler ? ' (Filler Word)' : ''}`}
                      >
                        {w.word}
                      </span>
                    );
                  })
                ) : (
                  <span onClick={() => onSeek(seg.start)} className="cursor-pointer">
                    {seg.text}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

