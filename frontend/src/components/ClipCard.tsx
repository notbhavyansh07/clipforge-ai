'use client';

import React from 'react';
import {
  Play,
  Sparkles,
  Youtube,
  CheckCircle,
  Clock,
  Zap,
  ArrowRight,
  MapPin,
  AlertCircle,
  Timer,
  MessageSquare,
  ShieldCheck,
  Film,
  Flame,
} from 'lucide-react';
import { Clip } from '@/lib/types';

interface ClipCardProps {
  clip: Clip;
  isSelected?: boolean;
  isChampion?: boolean;
  onSelect: (clip: Clip) => void;
  onPublishClick: (clip: Clip) => void;
}

export default function ClipCard({
  clip,
  isSelected,
  isChampion,
  onSelect,
  onPublishClick,
}: ClipCardProps) {
  return (
    <div
      onClick={() => onSelect(clip)}
      className={`bg-[#12141e] rounded-3xl overflow-hidden transition-all duration-300 flex flex-col justify-between group shadow-xl cursor-pointer border-2 relative ${
        isSelected
          ? 'border-purple-500 ring-4 ring-purple-500/30 shadow-purple-600/30 scale-[1.02] bg-[#161827]'
          : isChampion
          ? 'border-yellow-500/80 shadow-yellow-500/10 ring-1 ring-yellow-500/40 hover:border-purple-500/60'
          : 'border-gray-800/90 hover:border-purple-500/60 hover:shadow-purple-600/10 hover:scale-[1.01]'
      }`}
    >
      {/* Selected Indicator Banner */}
      {isSelected && (
        <div className="absolute top-0 left-0 right-0 py-1 bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 text-white text-[10px] font-black uppercase tracking-wider text-center flex items-center justify-center gap-1.5 shadow-md z-10">
          <Sparkles className="w-3 h-3 text-yellow-300 animate-pulse" />
          <span>CURRENTLY LOADED IN STUDIO PLAYER</span>
        </div>
      )}

      <div className={`p-4 space-y-3.5 ${isSelected ? 'pt-7' : ''}`}>
        {/* Top badges: Duration, Champion, Stream Hour, Virality */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-purple-950/70 border border-purple-800/80 text-purple-300">
              <Clock className="w-3 h-3" />
              {clip.duration}s
            </span>
            {isChampion && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-yellow-500/20 border border-yellow-500/50 text-yellow-300">
                👑 #1 WINNER
              </span>
            )}
            {clip.stream_time_formatted && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-blue-950/60 border border-blue-800/70 text-blue-300">
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

        {/* Location, Incident, and Signals */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {clip.location && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-gray-900 border border-gray-800 text-gray-300">
              <MapPin className="w-3 h-3 text-red-400 shrink-0" />
              <span className="truncate max-w-[130px]">{clip.location}</span>
            </span>
          )}
          {clip.incident_type && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-purple-950/40 border border-purple-800/40 text-purple-300">
              <Zap className="w-2.5 h-2.5 text-yellow-400 shrink-0" />
              <span className="truncate max-w-[140px]">{clip.incident_type}</span>
            </span>
          )}
          {clip.chat_burst_score && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-purple-950/50 border border-purple-800/60 text-purple-300">
              <MessageSquare className="w-2.5 h-2.5 text-purple-400" />
              <span>{clip.chat_burst_score}x</span>
              {clip.reaction_emojis && <span>{clip.reaction_emojis.join('')}</span>}
            </span>
          )}
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-950/40 border border-emerald-800/50 text-emerald-300">
            <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
            <span>Reach Safe</span>
          </span>
        </div>

        {/* True 9:16 Portrait Shorts Thumbnail Preview (Shows full stacked facecam + game) */}
        {clip.thumbnail_path && (
          <div className="relative w-full aspect-[9/16] rounded-2xl overflow-hidden bg-black border border-gray-800/90 group-hover:border-purple-400 transition-all shadow-inner">
            <img
              src={clip.thumbnail_path.startsWith('/') ? clip.thumbnail_path : `/${clip.thumbnail_path}`}
              alt={clip.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-transparent to-black/30 pointer-events-none" />

            <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-black/80 backdrop-blur border border-purple-500/50 text-purple-300">
                9:16 SHORT
              </span>
            </div>

            <div className="absolute bottom-2.5 left-2.5 right-2.5 flex flex-col gap-1">
              <span className="text-xs font-bold text-yellow-300 line-clamp-1 drop-shadow">
                {clip.hook_text || clip.title}
              </span>
              <div className="flex items-center justify-between text-[10px] font-mono text-gray-300">
                <span>⏱️ {clip.duration}s</span>
                <span className="text-purple-300 font-bold group-hover:text-white transition">
                  CLICK TO LOAD &bull;
                </span>
              </div>
            </div>

            {/* Hover Play Button Overlay */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-[2px]">
              <div className="p-3.5 rounded-full bg-purple-600 text-white shadow-xl shadow-purple-600/50 scale-90 group-hover:scale-100 transition-transform">
                <Play className="w-5 h-5 fill-current ml-0.5" />
              </div>
            </div>
          </div>
        )}

        {/* Title and Hook */}
        <div>
          <h4 className="font-bold text-sm text-white group-hover:text-purple-300 transition line-clamp-2 leading-tight">
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
          <div className="text-[11px] text-purple-300/90 bg-purple-950/30 p-2.5 rounded-xl border border-purple-900/40 line-clamp-2 leading-relaxed">
            {clip.virality_reason}
          </div>
        )}
      </div>

      {/* Card actions */}
      <div className="p-3 border-t border-gray-800/80 bg-[#151722]/80 flex items-center justify-between gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect(clip);
          }}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm ${
            isSelected
              ? 'bg-purple-600 text-white'
              : 'bg-gray-800 hover:bg-purple-600 text-gray-200 hover:text-white'
          }`}
        >
          <span>{isSelected ? 'Editing in Studio' : 'Open in Editor'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
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
            onClick={(e) => e.stopPropagation()}
            className="py-2 px-3 rounded-xl text-xs font-bold bg-green-600 hover:bg-green-700 text-white transition flex items-center gap-1 shadow-md shadow-green-600/20"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Live</span>
          </a>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPublishClick(clip);
            }}
            className="py-2 px-3 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white transition flex items-center gap-1 shadow-md shadow-red-600/20"
          >
            <Youtube className="w-3.5 h-3.5" />
            <span>Publish</span>
          </button>
        )}
      </div>
    </div>
  );
}
