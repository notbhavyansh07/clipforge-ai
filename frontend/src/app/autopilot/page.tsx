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
  Cpu,
  Activity,
  Layers,
  X,
} from 'lucide-react';
import { api } from '@/lib/api';
import { AutopilotStatus, AutopilotSlot } from '@/lib/types';
import AIModelHarnessModal from '@/components/AIModelHarnessModal';

export default function AutoPilotPage() {
  const [status, setStatus] = useState<AutopilotStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [runningCycle, setRunningCycle] = useState(false);
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);
  const [cycleResult, setCycleResult] = useState<any | null>(null);
  const [squadData, setSquadData] = useState<any | null>(null);
  const [heartbeating, setHeartbeating] = useState(false);
  const [isAIHarnessOpen, setIsAIHarnessOpen] = useState(false);
  const [activeAIModel, setActiveAIModel] = useState<string>('gemini-free');
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('');
  const [previewClip, setPreviewClip] = useState<any | null>(null);
  const [scheduleDay, setScheduleDay] = useState<'today' | 'tomorrow'>('today');

  useEffect(() => {
    setActiveAIModel(api.getActiveAIProvider());
    const onProviderChange = (e: any) => {
      if (e.detail?.providerId) setActiveAIModel(e.detail.providerId);
    };
    window.addEventListener('clipforge_ai_provider_changed', onProviderChange);
    return () => window.removeEventListener('clipforge_ai_provider_changed', onProviderChange);
  }, []);

  // Live IST Clock & 15-second background sync
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
      const ist = new Date(utc + (3600000 * 5.5));
      setCurrentTimeStr(ist.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const timeInterval = setInterval(updateTime, 1000);
    const syncInterval = setInterval(loadStatus, 15000);
    return () => {
      clearInterval(timeInterval);
      clearInterval(syncInterval);
    };
  }, []);

  const loadStatus = async () => {
    try {
      setLoading(true);
      const [data, squad] = await Promise.all([
        api.getAutopilotStatus(),
        api.getPaperclipSquad(),
      ]);
      setStatus(data);
      setSquadData(squad);
    } catch (e) {
      console.error('Failed to load autopilot status:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerHeartbeat = async () => {
    try {
      setHeartbeating(true);
      await api.triggerSquadHeartbeat();
      const updatedSquad = await api.getPaperclipSquad();
      setSquadData(updatedSquad);
    } catch (e) {
      console.error(e);
    } finally {
      setHeartbeating(false);
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
      await api.triggerSlotUpload(slotNumber, scheduleDay === 'tomorrow');
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
            onClick={() => setIsAIHarnessOpen(true)}
            className="px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold bg-[#151726] hover:bg-[#1e2136] text-purple-300 border border-purple-500/40 hover:border-purple-400 transition flex items-center gap-2 shadow-sm"
            title="Switch Free AI Model Gateway (Gemini, DeepSeek, Ollama, Claude)"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>AI: {activeAIModel === 'openrouter-free' ? 'DeepSeek R1' : activeAIModel === 'ollama-local' ? 'Local Ollama' : activeAIModel === 'claude-code-proxy' ? 'Claude Proxy' : 'Gemini 2.5 Flash'}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </button>

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

      {/* 2.5 Paperclip Autonomous AI Agent Squad Dashboard */}
      <div className="p-6 rounded-3xl bg-[#10121d] border border-indigo-500/30 space-y-5 shadow-2xl relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <Cpu className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                <span>Paperclip Autonomous Agent Squad</span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                  4 AGENTS LIVE
                </span>
              </h2>
            </div>
            <p className="text-xs text-gray-400">
              Inspired by paperclipai/paperclip: Autonomous virtual company org-chart executing continuous scout, edit, audit, and upload pipelines.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleTriggerHeartbeat}
              disabled={heartbeating}
              className="px-4 py-2 rounded-xl bg-[#171a2e] hover:bg-[#202540] border border-indigo-500/40 text-indigo-300 text-xs font-bold transition flex items-center gap-2 shadow-md"
            >
              <Activity className={`w-3.5 h-3.5 text-indigo-400 ${heartbeating ? 'animate-spin' : 'animate-pulse'}`} />
              <span>{heartbeating ? 'Pulsing Squad...' : 'Trigger Agent Heartbeat'}</span>
            </button>
            <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-950/80 px-2.5 py-1.5 rounded-xl border border-emerald-800">
              Tokens: {squadData?.total_tokens_consumed || '102.8k / 2.0M'}
            </span>
          </div>
        </div>

        {/* 4 Agent Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {squadData?.members?.map((agent: any) => (
            <div
              key={agent.id}
              className="p-4 rounded-2xl bg-[#141624] border border-gray-800/80 hover:border-indigo-500/40 transition-all space-y-3 relative group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{agent.avatar}</span>
                  <div>
                    <div className="text-xs font-bold text-white tracking-tight leading-tight">
                      {agent.name}
                    </div>
                    <div className="text-[10px] text-indigo-300 font-mono">
                      {agent.role}
                    </div>
                  </div>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Heartbeat Online" />
              </div>

              <div className="p-2.5 rounded-xl bg-black/40 border border-gray-800 text-[11px] text-gray-300 font-mono line-clamp-2 leading-relaxed">
                {agent.current_focus}
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono text-gray-400 pt-1 border-t border-gray-800/60">
                <span>Done: <strong className="text-white">{agent.tasks_completed}</strong></span>
                <span>Eff: <strong className="text-emerald-400">{agent.efficiency_rating}</strong></span>
              </div>
            </div>
          ))}
        </div>

        {/* Real-time Agent Handoff Stream */}
        <div className="pt-2 border-t border-gray-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-gray-400">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span className="font-bold text-white">Latest Autonomous Handoff:</span>
            <span className="text-gray-300 truncate font-mono">
              {squadData?.recent_handoffs?.[0]?.from_agent} → {squadData?.recent_handoffs?.[0]?.to_agent}
            </span>
          </div>
          <span className="text-[11px] font-mono text-indigo-300 bg-indigo-950/60 px-2.5 py-1 rounded-lg border border-indigo-800">
            {squadData?.recent_handoffs?.[0]?.action}
          </span>
        </div>
      </div>

      {/* 3. Daily 3-Slot Peak Viral Schedule Radar */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-400" />
              <span>Daily 3-Slot YouTube Peak Viral Schedule</span>
            </h2>
            <p className="text-xs text-gray-400">
              Each slot targets peak viewer attention on YouTube Shorts with automatic algorithmic timing.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-xl border border-emerald-800 flex items-center gap-1.5 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>IST Clock: {currentTimeStr || '11:28:00 AM'}</span>
            </span>
            <span className="text-xs font-mono text-purple-300 bg-purple-950/80 px-3 py-1 rounded-xl border border-purple-800">
              Auto-Sync: Connected to @salviashu02
            </span>
          </div>
        </div>

        {/* Day Selector Tabs */}
        <div className="flex items-center gap-2 border-b border-gray-800/80 pb-3">
          <button
            type="button"
            onClick={() => setScheduleDay('today')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              scheduleDay === 'today'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'bg-[#151726] text-gray-400 hover:text-white border border-gray-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Today's Peak Schedule (Nov 24)</span>
            <span className="text-[10px] bg-purple-900/80 text-purple-200 px-2 py-0.5 rounded-full font-mono">
              3 Slots
            </span>
          </button>

          <button
            type="button"
            onClick={() => setScheduleDay('tomorrow')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              scheduleDay === 'tomorrow'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/30'
                : 'bg-[#151726] text-gray-400 hover:text-white border border-gray-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Tomorrow's Viral Queue (Nov 25)</span>
            <span className="text-[10px] bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded-full font-mono border border-emerald-800">
              3 NEW CLIPS LOCKED
            </span>
          </button>
        </div>

        {/* Live Timing Window Banner */}
        <div className="p-3.5 rounded-2xl bg-[#141727] border border-purple-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-4 h-4 text-purple-400 shrink-0" />
            <span className="text-gray-300">
              {scheduleDay === 'today' ? (
                <>Next algorithmic upload: <strong className="text-white">Slot #1 (CarryisLive - 1:30 PM IST Lunch Break Surge)</strong></>
              ) : (
                <>Tomorrow's Viral Lineup (Nov 25): <strong className="text-emerald-300">3 Fresh Viral Clips with 99+ Retention Ready for 1:30 PM, 6:00 PM, and 9:30 PM IST</strong></>
              )}
            </span>
          </div>
          <span className="text-[11px] font-mono text-purple-300 font-bold bg-purple-900/50 px-2.5 py-1 rounded-lg border border-purple-700">
            {scheduleDay === 'today' ? 'Autonomous Daemon: Active & Ready' : 'Tomorrow Queue: Locked & Synced'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(scheduleDay === 'tomorrow' ? (status?.tomorrow_slots || []) : (status?.slots || [])).map((slot: AutopilotSlot) => {
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
                    <div className="flex items-center justify-between text-xs mt-1">
                      <span className="text-purple-300 font-semibold">Target Creator: {slot.creator_name}</span>
                      <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800">
                        {isPublished ? '● Live on Shorts' : `Peak: ${slot.target_time_ist} IST`}
                      </span>
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
                <div className="pt-2 flex flex-col gap-2">
                  {isPublished ? (
                    <>
                      <a
                        href={slot.youtube_url || (slot.youtube_video_id ? `https://youtube.com/shorts/${slot.youtube_video_id}` : 'https://youtube.com')}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:opacity-95 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40"
                      >
                        <Youtube className="w-4 h-4 text-red-300 fill-current" />
                        <span>Watch Live on YouTube Shorts</span>
                        <ExternalLink className="w-3.5 h-3.5 ml-1" />
                      </a>
                      {slot.clip && (
                        <button
                          type="button"
                          onClick={() => setPreviewClip(slot.clip)}
                          className="w-full py-2 px-3 rounded-xl bg-[#161928] hover:bg-[#20253d] text-purple-300 hover:text-white text-xs font-semibold border border-purple-900/40 transition flex items-center justify-center gap-2 shadow-sm"
                        >
                          <Play className="w-3.5 h-3.5 fill-current text-purple-400" />
                          <span>Preview Rendered Short (In-App)</span>
                        </button>
                      )}
                    </>
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

      {/* Free Multi-Provider AI Harness Modal */}
      <AIModelHarnessModal
        isOpen={isAIHarnessOpen}
        onClose={() => setIsAIHarnessOpen(false)}
        activeProviderId={activeAIModel}
        onSelectProvider={(id) => {
          api.setActiveAIProvider(id);
          setActiveAIModel(id);
        }}
      />

      {/* In-App 1080x1920 Short Video Player Modal */}
      {previewClip && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="relative w-full max-w-sm rounded-3xl bg-[#0f111a] border border-purple-500/40 p-4 shadow-2xl flex flex-col items-center">
            <div className="w-full flex items-center justify-between pb-3 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                  1080×1920 Short Preview
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewClip(null)}
                className="p-1.5 rounded-lg bg-gray-800/80 hover:bg-gray-700 text-gray-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="w-full my-3 aspect-[9/16] rounded-2xl overflow-hidden bg-black border border-gray-800 relative shadow-inner">
              <video
                src={previewClip.output_path?.startsWith('/') ? previewClip.output_path : `/${previewClip.output_path}`}
                poster={previewClip.thumbnail_path}
                controls
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            </div>

            <div className="w-full space-y-2 text-left">
              <h4 className="text-xs font-bold text-white line-clamp-1">{previewClip.title}</h4>
              <div className="flex items-center justify-between text-[11px] font-mono text-gray-400">
                <span className="text-emerald-400 font-bold">Virality: {previewClip.virality_score}/100</span>
                <span>{previewClip.duration}s • 60 FPS</span>
              </div>
              {previewClip.youtube_video_id && (
                <a
                  href={`https://youtube.com/shorts/${previewClip.youtube_video_id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full mt-2 py-2 px-3 rounded-xl bg-red-600/90 hover:bg-red-500 text-white text-xs font-bold transition flex items-center justify-center gap-2"
                >
                  <Youtube className="w-4 h-4 fill-current" />
                  <span>Open on YouTube Shorts</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
