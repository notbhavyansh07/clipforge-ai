'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Sparkles,
  Zap,
  Clock,
  Youtube,
  CheckCircle2,
  Share2,
  Calendar,
  Flame,
  Loader2,
  Play,
  TrendingUp,
  Radio,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { api } from '@/lib/api';
import { AutopilotStatus, AutopilotSlot } from '@/lib/types';

export default function AutoPilotPage() {
  const [status, setStatus] = useState<AutopilotStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [runningCycle, setRunningCycle] = useState(false);
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);
  const [cycleResult, setCycleResult] = useState<any | null>(null);

  const loadStatus = async () => {
    try {
      setLoading(true);
      const data = await api.getAutopilotStatus();
      setStatus(data);
    } catch (e) {
      console.error('Failed to load autopilot status:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleRunDailyCycle = async () => {
    try {
      setRunningCycle(true);
      setCycleResult(null);
      const res = await api.triggerDailyAutoPilotCycle();
      setCycleResult(res);
      await loadStatus();
    } catch (e: any) {
      alert(`Auto-pilot cycle error: ${e.message}`);
    } finally {
      setRunningCycle(false);
    }
  };

  const handleUploadSingleSlot = async (slotNumber: number) => {
    try {
      setUploadingSlot(slotNumber);
      await api.triggerSlotUpload(slotNumber);
      await loadStatus();
    } catch (e: any) {
      alert(`Upload error: ${e.message}`);
    } finally {
      setUploadingSlot(null);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      {/* 1. Header Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-800/80">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2.5 rounded-xl bg-[#141624] hover:bg-[#1c1f32] text-gray-400 hover:text-white transition border border-gray-800 shadow-sm"
            title="Return to Projects Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <span>Autonomous Auto-Pilot</span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  3 UPLOADS/DAY TARGET
                </span>
              </h1>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Hands-free scheduling: 3 daily viral clips uploaded automatically to YouTube at peak traffic windows (Carry, Speed, and Daily Trending).
            </p>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={loadStatus}
            disabled={loading}
            className="p-2.5 rounded-xl bg-[#151724] hover:bg-[#1e2133] border border-gray-800 text-gray-300 hover:text-white transition"
            title="Refresh Schedule Status"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleRunDailyCycle}
            disabled={runningCycle}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:opacity-95 text-white transition flex items-center gap-2 shadow-lg shadow-purple-600/30"
          >
            {runningCycle ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Publishing All 3 Slots...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 text-amber-300" />
                <span>Run Daily Auto-Pilot Cycle Now</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. Success Banner After Cycle Execution */}
      {cycleResult && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/80 to-purple-950/60 border border-emerald-500/40 shadow-xl space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-emerald-300 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>{cycleResult.message}</span>
            </div>
            <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-950 px-2.5 py-1 rounded-lg border border-emerald-800">
              Channel: {cycleResult.channel}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            {cycleResult.published_clips?.map((c: any) => (
              <div key={c.slot} className="p-3 rounded-xl bg-black/60 border border-emerald-500/30 text-xs space-y-1">
                <div className="text-[10px] text-gray-400 font-mono">
                  Slot #{c.slot} • {c.creator}
                </div>
                <div className="font-bold text-white line-clamp-1">{c.title}</div>
                <div className="pt-1 flex items-center justify-between">
                  <span className="text-[10px] text-emerald-400 font-mono">Status: Live</span>
                  <a
                    href={c.youtube_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-purple-300 hover:text-white flex items-center gap-1 font-bold underline"
                  >
                    <span>View Short</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Daily 3-Slot Peak Viral Schedule Radar */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-400" />
              <span>Daily 3-Slot YouTube Peak Viral Schedule</span>
            </h2>
            <p className="text-xs text-gray-400">
              Each slot targets peak viewer attention on YouTube Shorts with automatic algorithmic timing.
            </p>
          </div>
          <span className="text-xs font-mono text-purple-300 bg-purple-950/80 px-3 py-1 rounded-xl border border-purple-800">
            Auto-Sync: Connected to @salviashu02
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {status?.slots?.map((slot: AutopilotSlot) => {
            const isPublished = slot.status === 'published';
            const isTargetLoading = uploadingSlot === slot.slot_number;

            return (
              <div
                key={slot.slot_number}
                className={`rounded-3xl p-5 border transition-all duration-300 relative flex flex-col justify-between space-y-4 ${
                  isPublished
                    ? 'bg-[#0f141f] border-emerald-500/40 shadow-lg shadow-emerald-950/20'
                    : 'bg-[#12141e] border-purple-900/40 hover:border-purple-500/50 shadow-xl'
                }`}
              >
                {/* Slot Header */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-purple-950 text-purple-300 border border-purple-800">
                      SLOT #{slot.slot_number}
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold font-mono border flex items-center gap-1.5 ${
                        isPublished
                          ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                          : 'bg-yellow-950 text-yellow-300 border-yellow-800'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isPublished ? 'bg-emerald-400' : 'bg-yellow-400 animate-pulse'}`} />
                      <span>{isPublished ? 'PUBLISHED LIVE' : 'SCHEDULED FOR PEAK'}</span>
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-black text-white">{slot.target_time_label}</h3>
                    <div className="text-xs text-purple-300 font-semibold mt-0.5">
                      Target Creator: {slot.creator_name}
                    </div>
                  </div>

                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    {slot.peak_strategy}
                  </p>
                </div>

                {/* Assigned Clip Preview Box */}
                {slot.clip ? (
                  <div className="p-3 rounded-2xl bg-[#161826] border border-gray-800/80 space-y-2.5">
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-24 rounded-xl overflow-hidden bg-black shrink-0 border border-gray-700 relative">
                        <img
                          src={slot.clip.thumbnail_path || '/clips/clip-speed-01-crash_thumb.jpg'}
                          alt={slot.clip.title}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute bottom-1 right-1 text-[8px] font-mono bg-black/80 text-white px-1 rounded">
                          {slot.clip.duration}s
                        </span>
                      </div>
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="text-[10px] font-mono text-gray-400 flex items-center gap-1">
                          <Flame className="w-3 h-3 text-red-400" />
                          <span>Virality: {slot.clip.virality_score}/100</span>
                        </div>
                        <h4 className="text-xs font-bold text-white line-clamp-2 leading-tight">
                          {slot.clip.title}
                        </h4>
                        <div className="text-[10px] text-gray-400 line-clamp-1">
                          📍 {slot.clip.location || 'Los Santos'}
                        </div>
                      </div>
                    </div>

                    <div className="pt-1 flex items-center justify-between text-[11px] text-gray-400 border-t border-gray-800/60">
                      <span>YouTube Shorts:</span>
                      <span className="font-mono text-emerald-400 font-bold">1080×1920 60FPS</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs text-gray-500 border border-dashed border-gray-800 rounded-2xl">
                    No clip queued for this slot yet.
                  </div>
                )}

                {/* Slot Action Footer */}
                <div className="pt-2">
                  {isPublished ? (
                    <a
                      href={slot.youtube_url || 'https://youtube.com'}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-2.5 px-3 rounded-xl bg-[#1c2236] hover:bg-[#252d47] text-emerald-400 text-xs font-bold transition flex items-center justify-center gap-2 border border-emerald-500/30"
                    >
                      <span>Watch Live on YouTube Shorts</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleUploadSingleSlot(slot.slot_number)}
                      disabled={isTargetLoading}
                      className="w-full py-2.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-md shadow-purple-600/20"
                    >
                      {isTargetLoading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Publishing to YouTube...</span>
                        </>
                      ) : (
                        <>
                          <Youtube className="w-3.5 h-3.5 text-red-400" />
                          <span>Auto-Upload Slot #{slot.slot_number} Now</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Daily Trending Discovery Radar */}
      <div className="p-6 rounded-3xl bg-[#12141f] border border-gray-800/90 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Internet Viral Video Discovery Radar (Slot #3 Engine)</span>
            </h2>
            <p className="text-xs text-gray-400">
              Scans YouTube Trending &amp; Internet viral sensations 24/7 to auto-ingest and clip viral videos from top internet creators alongside Carry and Speed.
            </p>
          </div>
          <Link
            href="/editor/vid-trending-daily-viral"
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#181c2e] hover:bg-[#232842] text-purple-300 border border-purple-500/30 transition flex items-center gap-1.5 shrink-0"
          >
            <span>Open Internet Viral Editor</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          <div className="p-3.5 rounded-2xl bg-[#161828] border border-gray-800 space-y-1">
            <span className="text-[10px] text-gray-400 font-mono">Today's Internet Viral Source</span>
            <div className="text-xs font-bold text-white">MrBeast - $456,000 Squid Game In Real Life!</div>
            <span className="text-[10px] text-emerald-400 font-mono">● 650M+ Views Worldwide</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#161828] border border-gray-800 space-y-1">
            <span className="text-[10px] text-gray-400 font-mono">Top Viral Moment</span>
            <div className="text-xs font-bold text-white">🔴 Red Light, Green Light Elimination</div>
            <span className="text-[10px] text-purple-400 font-mono">99.9 Virality Index</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#161828] border border-gray-800 space-y-1">
            <span className="text-[10px] text-gray-400 font-mono">Assigned Daily Peak</span>
            <div className="text-xs font-bold text-white">Slot #3: 9:30 PM IST (Late Night Binge)</div>
            <span className="text-[10px] text-amber-400 font-mono">Peak Retention Hold</span>
          </div>
        </div>
      </div>
    </div>
  );
}
