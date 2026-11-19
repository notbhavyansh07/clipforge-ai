'use client';

import React from 'react';
import { Eye, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { Clip, Video } from '@/lib/types';
import { api } from '@/lib/api';

interface ComparisonPlayerProps {
  clip: Clip;
  video: Video;
}

export default function ComparisonPlayer({ clip, video }: ComparisonPlayerProps) {
  return (
    <div className="bg-[#12141e] border border-gray-800 rounded-3xl p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-gray-800 pb-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Eye className="w-4 h-4 text-cyan-400" />
            <span>A/B Viral Reframing Comparison</span>
          </h2>
          <p className="text-xs text-gray-400">
            Compare original 16:9 landscape master with AI 9:16 portrait composite.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-800/40 text-cyan-300">
          <Sparkles className="w-3.5 h-3.5" />
          <span>FilmCraft + HyperFrames Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        {/* Original 16:9 Source */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-400 font-mono">
            <span>ORIGINAL SOURCE (16:9)</span>
            <span>{video.width}x{video.height}</span>
          </div>
          <div className="relative aspect-video bg-black rounded-2xl overflow-hidden border border-gray-800 flex items-center justify-center group shadow-lg">
            <div className="text-center p-4 space-y-2">
              <span className="text-xs text-gray-400 font-mono">Original Wide VOD</span>
              <p className="text-[11px] text-gray-500 max-w-xs mx-auto">
                Horizontal framing with wide perspective.
              </p>
            </div>
            {/* 9:16 Bounding Box Overlay visualizer */}
            <div className="absolute inset-y-0 w-[31.6%] border-2 border-dashed border-purple-500 bg-purple-500/10 pointer-events-none flex items-center justify-center">
              <span className="text-[10px] text-purple-300 font-mono bg-black/60 px-1 rounded">
                AI Crop Window
              </span>
            </div>
          </div>
        </div>

        {/* Reframed 9:16 Short */}
        <div className="space-y-2 flex flex-col items-center">
          <div className="w-[240px] flex items-center justify-between text-xs text-gray-400 font-mono">
            <span className="text-[#00FF66] font-bold">VIRAL SHORT (9:16)</span>
            <span>1080x1920</span>
          </div>
          <div className="relative w-[240px] h-[426px] bg-black rounded-3xl overflow-hidden border-2 border-[#00FF66]/50 shadow-2xl flex items-center justify-center">
            {clip.output_path && clip.status === 'rendered' ? (
              <video
                src={api.getClipStreamUrl(clip.id)}
                controls
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center p-4 space-y-2">
                <Sparkles className="w-8 h-8 text-purple-400 mx-auto" />
                <div className="text-xs font-bold text-white">9:16 Render Preview</div>
                <p className="text-[10px] text-gray-400">
                  Ready to render with face-tracking & karaoke captions.
                </p>
              </div>
            )}
            <div className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-black/80 text-[10px] font-black text-[#00FF66] border border-[#00FF66]/30">
              {clip.virality_score} SCORE
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

