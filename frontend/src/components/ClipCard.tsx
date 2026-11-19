'use client';

import React from 'react';
import Link from 'next/link';
import { Play, Sparkles, Youtube, CheckCircle, Clock, Zap, ArrowRight, MapPin, AlertCircle, Timer, MessageSquare, ShieldCheck, Crosshair } from 'lucide-react';
import { Clip } from '@/lib/types';

interface ClipCardProps {
  clip: Clip;
  isChampion?: boolean;
  onSelect: (clip: Clip) => void;
  onPublishClick: (clip: Clip) => void;
}

export default function ClipCard({ clip, isChampion, onSelect, onPublishClick }: ClipCardProps) {
  const isHighViral = clip.virality_score >= 80;

  return (
    <div className={`bg-[#12141e] border rounded-2xl overflow-hidden transition-all duration-300 flex flex-col justify-between group shadow-lg ${
      isChampion ? 'border-yellow-500/80 shadow-yellow-500/10 ring-1 ring-yellow-500/30' : 'border-gray-800 hover:border-purple-500/50'
    }`}>
      <div className="p-4 space-y-3">
        {/* Top badges: Duration, Champion, Stream Hour, Virality */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-purple-950/60 border border-purple-800 text-purple-300">
              <Clock className="w-3 h-3" />
              {clip.duration}s
            </span>
            {isChampion && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-yellow-500/20 border border-yellow-500/50 text-yellow-300">
                👑 #1 WINNER
              </span>
            )}
            {clip.stream_time_formatted && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-blue-950/50 border border-blue-800/60 text-blue-300">
                <Timer className="w-2.5 h-2.5 text-blue-400" />
                {clip.stream_time_formatted}
              </span>
            )}
          </div>

          <div
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black border whitespace-nowrap ${
              clip.virality_score >= 98
                ? 'bg-[#00FF66]/20 text-[#00FF66] border-[#00FF66]/70 shadow-sm shadow-[#00FF66]/30'
                : clip.virality_score >= 95
                ? 'bg-[#00FF66]/15 text-[#00FF66] border-[#00FF66]/50'
                : 'bg-yellow-400/10 text-yellow-300 border-yellow-400/30'
            }`}
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>{clip.virality_score}</span>
            <span className="text-[10px] font-normal opacity-70">VIRAL</span>
          </div>
        </div>

        {/* Location, Incident, and GTA-Auto-Clipper Signals */}
        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
          {clip.location && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-gray-900 border border-gray-800 text-gray-300">
              <MapPin className="w-3 h-3 text-red-400 shrink-0" />
              <span className="truncate max-w-[140px]">{clip.location}</span>
            </span>
          )}
          {clip.incident_type && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-950/30 border border-amber-800/40 text-amber-300">
              <AlertCircle className="w-3 h-3 text-amber-400 shrink-0" />
              <span className="truncate max-w-[140px]">{clip.incident_type}</span>
            </span>
          )}
          {clip.chat_burst_score && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-purple-950/40 border border-purple-800/50 text-purple-300">
              <MessageSquare className="w-2.5 h-2.5 text-purple-400" />
              <span>{clip.chat_burst_score}x Chat Burst</span>
              {clip.reaction_emojis && <span>{clip.reaction_emojis.join('')}</span>}
            </span>
          )}
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-950/40 border border-emerald-800/50 text-emerald-300">
            <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
            <span>Safe Reach</span>
          </span>
        </div>

        {/* Title and Hook */}
        <div>
          <h4 className="font-bold text-sm text-white line-clamp-2 group-hover:text-purple-300 transition-colors">
            {clip.title}
          </h4>
          {clip.hook_text && (
            <p className="text-xs text-gray-400 line-clamp-2 mt-1 leading-snug">
              &ldquo;{clip.hook_text}&rdquo;
            </p>
          )}
        </div>

        {/* Why it virals */}
        {clip.virality_reason && (
          <div className="text-[11px] text-purple-300/80 bg-purple-950/20 p-2 rounded-lg border border-purple-900/30 line-clamp-2">
            {clip.virality_reason}
          </div>
        )}
      </div>

      {/* Card actions */}
      <div className="p-3 border-t border-gray-800/80 bg-[#151722]/60 flex items-center justify-between gap-2">
        <button
          onClick={() => onSelect(clip)}
          className="flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold bg-gray-800 hover:bg-gray-700 text-gray-200 transition flex items-center justify-center gap-1.5"
        >
          <span>Open Editor</span>
          <ArrowRight className="w-3 h-3" />
        </button>

        {clip.status === 'published' ? (
          <a
            href={
              clip.youtube_video_id && !clip.youtube_video_id.startsWith('CF_')
                ? `https://youtube.com/shorts/${clip.youtube_video_id}`
                : 'https://studio.youtube.com/channel/upload'
            }
            target="_blank"
            rel="noopener noreferrer"
            className="py-1.5 px-3 rounded-xl text-xs font-bold bg-green-600/90 hover:bg-green-600 text-white transition flex items-center gap-1 shadow-md shadow-green-600/20"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>{clip.youtube_video_id && !clip.youtube_video_id.startsWith('CF_') ? 'Shorts Live' : 'Studio Ready'}</span>
          </a>
        ) : clip.status === 'scheduled' ? (
          <span className="py-1.5 px-3 rounded-xl text-xs font-bold bg-blue-600/20 border border-blue-500/40 text-blue-300 transition flex items-center gap-1 shadow-sm">
            <Timer className="w-3.5 h-3.5 text-blue-400" />
            <span>Scheduled (6:00 PM)</span>
          </span>
        ) : clip.status === 'rendered' ? (
          <button
            onClick={() => onPublishClick(clip)}
            className="py-1.5 px-3 rounded-xl text-xs font-bold bg-red-600/90 hover:bg-red-600 text-white transition flex items-center gap-1 shadow-md shadow-red-600/20"
          >
            <Youtube className="w-3.5 h-3.5" />
            <span>Publish</span>
          </button>
        ) : null}
      </div>
    </div>
  );
}
