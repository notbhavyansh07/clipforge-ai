'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  PlusCircle,
  Film,
  Radio,
  Clock,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Trash2,
  AlertCircle,
  Zap,
  Play,
  Volume2,
  Flame,
  CheckCircle2,
  TrendingUp,
  Sliders,
  Share2,
  ExternalLink,
  Layers,
  ChevronRight,
  ShieldCheck,
  Video as VideoIcon,
  DownloadCloud,
  Cpu,
} from 'lucide-react';
import IngestModal from '@/components/IngestModal';
import GhostDownloaderModal from '@/components/GhostDownloaderModal';
import AIModelHarnessModal from '@/components/AIModelHarnessModal';
import { api } from '@/lib/api';
import { Video } from '@/lib/types';
import { INITIAL_VIDEOS } from '@/lib/seedData';

export default function DashboardPage() {
  const [videos, setVideos] = useState<Video[]>(INITIAL_VIDEOS);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGhostModalOpen, setIsGhostModalOpen] = useState(false);
  const [isAIHarnessOpen, setIsAIHarnessOpen] = useState(false);
  const [activeAIProvider, setActiveAIProvider] = useState('gemini-free');
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [activeVisualizerTab, setActiveVisualizerTab] = useState<'preview' | 'benchmark'>('preview');

  useEffect(() => {
    setActiveAIProvider(api.getActiveAIProvider());
    const onProviderChange = (e: any) => {
      if (e.detail?.providerId) setActiveAIProvider(e.detail.providerId);
    };
    window.addEventListener('clipforge_ai_provider_changed', onProviderChange);
    return () => window.removeEventListener('clipforge_ai_provider_changed', onProviderChange);
  }, []);

  const fetchVideos = async () => {
    try {
      const data = await api.listVideos();
      if (Array.isArray(data) && data.length > 0) {
        setVideos(data);
      } else {
        setVideos(INITIAL_VIDEOS);
      }
    } catch (e) {
      console.error('Error fetching videos:', e);
      setVideos(INITIAL_VIDEOS);
    }
  };

  useEffect(() => {
    fetchVideos();
    const interval = setInterval(fetchVideos, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleRetry = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      setRetryingId(id);
      await api.retryVideo(id);
      await fetchVideos();
    } catch (err: any) {
      alert(`Retry error: ${err.message}`);
    } finally {
      setRetryingId(null);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this video project?')) return;
    try {
      await api.deleteVideo(id);
      await fetchVideos();
    } catch (err: any) {
      alert(`Delete error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-10 pb-16">
      {/* 🚀 ELITE HERO SECTION WITH REANIMATE SPRING INTERACTIONS */}
      <div className="relative rounded-3xl p-8 md:p-12 overflow-hidden bg-gradient-to-br from-[#16122a] via-[#10121b] to-[#0a0b10] border border-purple-800/40 shadow-2xl">
        {/* Ambient radial glows */}
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] bg-cyan-600/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Headline, Value Prop & Direct Ingest */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-purple-500/10 border border-purple-500/30 text-purple-300 backdrop-blur-md">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Next-Gen AI Virality &amp; DaVinci Resolve MCP Engine</span>
            </div>

            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.1]">
              Turn Long Streams into <span className="gradient-text">Viral Shorts</span> in 1 Click.
            </h1>

            <p className="text-sm md:text-base text-gray-300 leading-relaxed max-w-xl">
              Automatic 9:16 face-tracking, kinetic Hormozi captions, peak emotional spike detection, and instant simultaneous publishing to YouTube Shorts &amp; Instagram Reels.
            </p>

            {/* Quick-Launch CTA & Presets */}
            <div className="space-y-3 pt-1">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-6 py-3.5 rounded-2xl font-bold text-sm bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 text-white hover:opacity-95 transition shadow-xl shadow-purple-600/30 flex items-center gap-2.5 reanimate-card"
                >
                  <PlusCircle className="w-5 h-5" />
                  <span>Ingest Stream URL or MP4</span>
                </button>

                <button
                  onClick={() => setIsGhostModalOpen(true)}
                  className="px-5 py-3.5 rounded-2xl font-bold text-sm bg-[#11192e] hover:bg-[#162240] border border-cyan-500/50 text-cyan-300 transition flex items-center gap-2 shadow-lg shadow-cyan-950/30"
                  title="Accelerated M3U8 Live Stream Sniffer & Smart Chunking"
                >
                  <DownloadCloud className="w-4 h-4 text-cyan-400" />
                  <span>Ghost Stream Sniffer (4K/M3U8)</span>
                </button>

                <button
                  onClick={() => setIsAIHarnessOpen(true)}
                  className="px-4 py-3.5 rounded-2xl font-bold text-sm bg-[#161226] hover:bg-[#1f1a36] border border-purple-500/40 text-purple-200 transition flex items-center gap-2"
                  title="Multi-Provider Free AI Gateway"
                >
                  <Cpu className="w-4 h-4 text-purple-400" />
                  <span>Free AI Models</span>
                </button>

                <Link
                  href="/editor/vid-speed-gta-crash"
                  className="px-5 py-3.5 rounded-2xl font-bold text-sm bg-[#161826] hover:bg-[#1d2033] border border-purple-500/40 text-purple-300 transition flex items-center gap-2"
                >
                  <Flame className="w-4 h-4 text-red-400" />
                  <span>Open Speed 300MPH Crash</span>
                </Link>
              </div>

              {/* 1-Click Creator Jump Chips */}
              <div className="flex items-center gap-2 text-xs text-gray-400 pt-1 flex-wrap">
                <span className="text-[11px] font-mono text-gray-500">Live Projects:</span>
                <Link
                  href="/editor/vid-speed-gta-crash"
                  className="px-2.5 py-1 rounded-lg bg-gray-900/80 hover:bg-gray-800 border border-gray-800 text-gray-300 text-xs transition flex items-center gap-1.5"
                >
                  <span>⚡ IShowSpeed</span>
                  <span className="text-[10px] text-purple-400 font-mono">12 Clips</span>
                </Link>
                <Link
                  href="/editor/a5d7460f-90e1-4e4e-9051-210d35430446"
                  className="px-2.5 py-1 rounded-lg bg-gray-900/80 hover:bg-gray-800 border border-gray-800 text-gray-300 text-xs transition flex items-center gap-1.5"
                >
                  <span>👑 CarryisLive</span>
                  <span className="text-[10px] text-blue-400 font-mono">14 Clips</span>
                </Link>
                <Link
                  href="/editor/vid-trending-daily-viral"
                  className="px-2.5 py-1 rounded-lg bg-gray-900/80 hover:bg-gray-800 border border-gray-800 text-gray-300 text-xs transition flex items-center gap-1.5"
                >
                  <span>🌐 Internet Viral (MrBeast)</span>
                  <span className="text-[10px] text-amber-400 font-mono">3 Clips</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column: Reanimate Live Comparison & Virality Radar Visualizer */}
          <div className="lg:col-span-5">
            <div className="bg-[#12141f]/90 border border-purple-900/50 rounded-3xl p-5 shadow-2xl relative overflow-hidden backdrop-blur-xl">
              <div className="flex items-center justify-between pb-3 border-b border-gray-800/80 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold text-white tracking-wide uppercase font-mono">
                    AI Multimodal Pipeline
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-mono px-2 py-0.5 rounded-full bg-purple-950/60 border border-purple-800/60 text-purple-300">
                  <span>60 FPS</span>
                  <span>•</span>
                  <span>CUDA Lanczos</span>
                </div>
              </div>

              {/* Dynamic Before/After Split Visualizer */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {/* 16:9 Raw Source Stream Box */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-gray-400 font-mono">
                    <span>Source 16:9</span>
                    <span className="text-gray-500">Uncropped</span>
                  </div>
                  <div className="relative aspect-video rounded-xl bg-gray-950 border border-gray-800 overflow-hidden flex items-center justify-center">
                    <img
                      src="/clips/clip-speed-01-crash_thumb.jpg"
                      alt="Source Stream"
                      className="w-full h-full object-cover opacity-60"
                    />
                    {/* Simulated FaceCam Bounding Box */}
                    <div className="absolute top-2 right-2 w-10 h-10 border-2 border-emerald-400 rounded-md animate-pulse">
                      <span className="absolute -top-3.5 left-0 text-[8px] font-mono bg-emerald-500 text-black px-1 rounded font-bold">
                        FACE
                      </span>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2">
                      <span className="text-[10px] text-gray-300 font-mono">Raw Livestream</span>
                    </div>
                  </div>
                </div>

                {/* 9:16 Viral Face-tracked Short Output */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-emerald-400 font-mono font-bold">
                    <span>Short 9:16</span>
                    <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 text-[9px]">99.7 VIRAL</span>
                  </div>
                  <div className="relative aspect-video rounded-xl bg-gradient-to-b from-purple-950/80 to-black border border-purple-500/60 overflow-hidden flex flex-col justify-between p-2 shadow-lg shadow-purple-900/30">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-600 text-white font-mono">
                        SHORTS
                      </span>
                      <div className="flex items-end gap-0.5 h-3">
                        <span className="w-1 bg-emerald-400 wave-bar rounded-full" />
                        <span className="w-1 bg-emerald-400 wave-bar rounded-full" />
                        <span className="w-1 bg-emerald-400 wave-bar rounded-full" />
                        <span className="w-1 bg-emerald-400 wave-bar rounded-full" />
                      </div>
                    </div>

                    {/* Kinetic Captions Preview */}
                    <div className="text-center py-1">
                      <span className="text-[10px] font-black uppercase text-yellow-300 tracking-wider bg-black/70 px-2 py-0.5 rounded border border-yellow-400/40">
                        WAIT FOR IT! 😱
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[9px] text-gray-300 font-mono">
                      <span>Face-Tracked</span>
                      <span className="text-amber-400 font-bold">1080p 60FPS</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Real-time Virality Radar Metrics */}
              <div className="space-y-2 pt-1 border-t border-gray-800/60">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Emotional Spike (Voice + Chat)</span>
                  <span className="font-mono text-emerald-400 font-bold">99.8 / 100</span>
                </div>
                <div className="w-full bg-gray-800/80 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-emerald-400 h-full rounded-full w-[99%]" />
                </div>

                <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1">
                  <span>DaVinci Resolve MCP:</span>
                  <span className="text-purple-300 font-mono font-bold">CMX 3600 &amp; FCPXML Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 🏆 INDUSTRY COMPARISON: CLIPFORGE VS COMPETITION */}
      <div className="p-6 rounded-3xl bg-[#0f111a] border border-gray-800/80 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Architected to Outperform: Industry Benchmark Comparison</span>
            </h2>
            <p className="text-xs text-gray-400">
              Why top gaming streamers and agency repurposers choose ClipForge AI over Opus Clip and Submagic.
            </p>
          </div>
          <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
            100% Free &amp; Uncapped
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
          <div className="p-3.5 rounded-2xl bg-[#141624] border border-purple-900/40 space-y-1">
            <span className="text-[11px] text-gray-400 block font-mono">Render Framerate</span>
            <span className="text-lg font-black text-white block">60 FPS Lanczos</span>
            <span className="text-[10px] text-emerald-400 font-medium">Competitors cap at 30 FPS</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#141624] border border-purple-900/40 space-y-1">
            <span className="text-[11px] text-gray-400 block font-mono">Pro NLE Integration</span>
            <span className="text-lg font-black text-white block">DaVinci Resolve MCP</span>
            <span className="text-[10px] text-purple-400 font-medium">1-Click EDL &amp; XML Export</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#141624] border border-purple-900/40 space-y-1">
            <span className="text-[11px] text-gray-400 block font-mono">Publishing Speed</span>
            <span className="text-lg font-black text-white block">1-Click Dual</span>
            <span className="text-[10px] text-pink-400 font-medium">Shorts + Instagram Reels</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#141624] border border-purple-900/40 space-y-1">
            <span className="text-[11px] text-gray-400 block font-mono">Livestream Safety</span>
            <span className="text-lg font-black text-white block">Zero Cross-Leak</span>
            <span className="text-[10px] text-emerald-400 font-medium">Strict Creator Segmentation</span>
          </div>
        </div>
      </div>

      {/* 🤖 3-SLOT DAILY AUTONOMOUS AUTO-PILOT RADAR */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-[#17142b] via-[#121422] to-[#0f111c] border border-purple-500/40 shadow-2xl relative overflow-hidden space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800 mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>3 CLIPS/DAY AUTONOMOUS YOUTUBE PIPELINE ACTIVE</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <span>Daily Peak Timing Auto-Upload Queue</span>
              <span className="text-xs font-normal text-purple-300 font-mono">(@salviashu02)</span>
            </h2>
            <p className="text-xs text-gray-300 max-w-2xl mt-1">
              Autonomous scheduling automatically uploads 3 viral Short clips daily at peak algorithmic viewing windows: CarryisLive (Lunch Rush), IShowSpeed (Prime Evening), and Daily Trending Viral Moments (Late Night).
            </p>
          </div>

          <Link
            href="/autopilot"
            className="px-5 py-3 rounded-2xl text-xs font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:opacity-95 text-white transition flex items-center gap-2 shadow-lg shadow-purple-600/30 shrink-0 self-start md:self-auto"
          >
            <Zap className="w-4 h-4 text-amber-300" />
            <span>Open Auto-Pilot Command Center</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* 3 Peak Timing Slot Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          <div className="p-4 rounded-2xl bg-[#161828] border border-purple-900/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                SLOT #1 • 1:30 PM IST
              </span>
              <span className="text-[10px] font-mono text-emerald-400 font-bold">Lunch Rush</span>
            </div>
            <div className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>👑 CarryisLive</span>
            </div>
            <p className="text-[11px] text-gray-400">
              India peak gaming surge: Cargo plane landing &amp; 1,000ft dirtbike stunt.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#161828] border border-purple-900/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                SLOT #2 • 6:00 PM IST
              </span>
              <span className="text-[10px] font-mono text-amber-400 font-bold">Global Golden Hour</span>
            </div>
            <div className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>⚡ IShowSpeed</span>
            </div>
            <p className="text-[11px] text-gray-400">
              US &amp; Europe prime time: 400ft mega ramp rocket jump &amp; tank barking chaos.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#161828] border border-purple-900/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                SLOT #3 • 9:30 PM IST
              </span>
              <span className="text-[10px] font-mono text-blue-400 font-bold">Late Night Binge</span>
            </div>
            <div className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>🔥 Daily Trending Radar</span>
            </div>
            <p className="text-[11px] text-gray-400">
              Auto-discovered viral leak: GTA 6 fluid simulation &amp; crowd panic AI.
            </p>
          </div>
        </div>
      </div>

      {/* 🎬 VIDEO PROJECTS LIBRARY */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-white tracking-tight">Your Video Projects</h2>
            <p className="text-xs text-gray-400">Processed livestream source streams and generated viral clips</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white transition shadow-md shadow-purple-600/20"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Video</span>
          </button>
        </div>

        {loading && videos.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm font-mono">Loading projects...</div>
        ) : videos.length === 0 ? (
          <div className="border border-dashed border-gray-800 rounded-3xl p-12 text-center space-y-4 bg-[#12141e]/50">
            <div className="p-4 bg-purple-950/40 text-purple-400 rounded-2xl w-14 h-14 mx-auto flex items-center justify-center">
              <Film className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">No Videos Ingested Yet</h3>
              <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                Paste a YouTube or Twitch URL or upload an MP4 to let the AI detect viral hooks.
              </p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-purple-600 text-white hover:bg-purple-700 transition"
            >
              Get Started
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {videos.map((vid) => (
              <div
                key={vid.id}
                className="bg-[#11131c] border border-gray-800 hover:border-purple-500/50 rounded-3xl p-5 flex flex-col justify-between transition-all group shadow-xl reanimate-card"
              >
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-gray-800/80 text-gray-300 uppercase border border-gray-700/60">
                      {vid.source_type}
                    </span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${
                          vid.status === 'ready'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-mono'
                            : vid.status === 'failed'
                            ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                            : 'bg-purple-500/15 text-purple-400 animate-pulse'
                        }`}
                      >
                        {vid.status.toUpperCase()}
                      </span>
                      <button
                        onClick={(e) => handleDelete(e, vid.id)}
                        className="text-gray-500 hover:text-red-400 p-1 transition rounded-lg hover:bg-white/5"
                        title="Delete project"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-base text-white group-hover:text-purple-300 transition-colors line-clamp-1">
                      {vid.title}
                    </h3>
                    {vid.creator_name && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        Creator: <span className="text-purple-300 font-semibold">{vid.creator_name}</span>
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-gray-400 font-mono">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {vid.duration ? `${Math.round(vid.duration)}s` : 'Processing'}
                    </span>
                    {vid.is_live && (
                      <span className="flex items-center gap-1 text-red-400 font-bold">
                        <Radio className="w-3 h-3 animate-pulse" />
                        <span>LIVE</span>
                      </span>
                    )}
                    <span className="text-gray-600">•</span>
                    <span className="text-emerald-400 font-semibold">1080p 60FPS</span>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-gray-800/80 flex items-center justify-between">
                  <Link
                    href={`/editor/${vid.id}`}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold bg-purple-600/20 group-hover:bg-purple-600 text-purple-300 group-hover:text-white border border-purple-500/30 transition-all shadow-sm group-hover:shadow-purple-600/30"
                  >
                    <span>Open Viral Studio</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <IngestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false);
          fetchVideos();
        }}
      />

      <GhostDownloaderModal
        isOpen={isGhostModalOpen}
        onClose={() => setIsGhostModalOpen(false)}
        onSuccess={() => {
          setIsGhostModalOpen(false);
          fetchVideos();
        }}
      />

      <AIModelHarnessModal
        isOpen={isAIHarnessOpen}
        onClose={() => setIsAIHarnessOpen(false)}
        activeProviderId={activeAIProvider}
        onSelectProvider={(id) => {
          api.setActiveAIProvider(id);
          setActiveAIProvider(id);
        }}
      />
    </div>
  );
}
