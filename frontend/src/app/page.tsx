'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  Link2,
  Loader2,
} from 'lucide-react';
import IngestModal from '@/components/IngestModal';
import GhostDownloaderModal from '@/components/GhostDownloaderModal';
import AIModelHarnessModal from '@/components/AIModelHarnessModal';
import { api } from '@/lib/api';
import { Video } from '@/lib/types';
import { INITIAL_VIDEOS } from '@/lib/seedData';

export default function DashboardPage() {
  const router = useRouter();
  const [videos, setVideos] = useState<Video[]>(INITIAL_VIDEOS);
  const [loading, setLoading] = useState(false);
  const [quickUrl, setQuickUrl] = useState('');
  const [quickClipping, setQuickClipping] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGhostModalOpen, setIsGhostModalOpen] = useState(false);
  const [isAIHarnessOpen, setIsAIHarnessOpen] = useState(false);
  const [activeAIProvider, setActiveAIProvider] = useState('gemini-free');
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [activeVisualizerTab, setActiveVisualizerTab] = useState<'preview' | 'benchmark'>('preview');
  const [justIngestedVideo, setJustIngestedVideo] = useState<Video | null>(null);

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

  const handleQuickClip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickUrl.trim() || quickClipping) return;
    try {
      setQuickClipping(true);
      const created = await api.ingestUrl({
        url: quickUrl.trim(),
        has_permission: true,
      });
      await fetchVideos();
      router.push(`/editor/${created.id}`);
    } catch (err: any) {
      alert(err.message || 'Could not ingest URL');
      setQuickClipping(false);
    }
  };

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
    <div className="space-y-8 pb-16">
      {/* 🚀 SLEEK PREMIUM STUDIO COMMAND HERO */}
      <div className="relative rounded-3xl p-6 md:p-9 overflow-hidden bg-gradient-to-br from-[#141126] via-[#0e1019] to-[#090a0f] border border-white/10 shadow-2xl">
        <div className="absolute -top-24 right-1/4 w-[420px] h-[420px] bg-purple-600/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-24 -left-16 w-[320px] h-[320px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-semibold bg-white/[0.04] border border-white/10 text-purple-300 backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>ClipForge Studio • 60 FPS AI Viral Engine</span>
            </div>

            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white leading-[1.08]">
              Turn Streams into <span className="gradient-text">Viral Shorts</span> in 1 Click.
            </h1>

            <p className="text-sm text-gray-400 leading-relaxed max-w-xl">
              Drop any YouTube link below to auto-curate viral clips, rank virality (0–100), reframe 9:16, and publish in 1 click.
            </p>

            {/* Opus-Style 1-Click Quick-Clip Bar */}
            <form
              onSubmit={handleQuickClip}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-1.5 rounded-2xl bg-black/50 border border-white/15 focus-within:border-purple-500/70 shadow-xl backdrop-blur-md"
            >
              <div className="flex items-center gap-2.5 px-3 flex-1 min-w-0">
                <Link2 className="w-4 h-4 text-purple-400 shrink-0" />
                <input
                  type="url"
                  value={quickUrl}
                  onChange={(e) => setQuickUrl(e.target.value)}
                  placeholder="Paste YouTube video or stream link..."
                  className="w-full bg-transparent text-sm text-white placeholder-gray-500 outline-none py-2"
                />
              </div>
              <button
                type="submit"
                disabled={quickClipping || !quickUrl.trim()}
                className="px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 text-white hover:opacity-95 disabled:opacity-50 transition shadow-lg shadow-purple-600/25 flex items-center justify-center gap-2 shrink-0"
              >
                {quickClipping ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Generating Clips...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-200" />
                    <span>Get Viral Clips</span>
                  </>
                )}
              </button>
            </form>

            {/* Secondary Tools Bar */}
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2.5 rounded-xl font-semibold text-xs bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-gray-200 transition flex items-center gap-2"
              >
                <PlusCircle className="w-3.5 h-3.5 text-purple-400" />
                <span>Upload MP4</span>
              </button>

              <button
                onClick={() => setIsGhostModalOpen(true)}
                className="px-4 py-3 rounded-2xl font-semibold text-xs bg-white/[0.04] hover:bg-white/[0.08] border border-cyan-500/30 text-cyan-300 transition flex items-center gap-2"
                title="M3U8 Live Stream Sniffer & Smart Chunking"
              >
                <DownloadCloud className="w-4 h-4 text-cyan-400" />
                <span>Ghost Sniffer</span>
              </button>

              <button
                onClick={() => setIsAIHarnessOpen(true)}
                className="px-4 py-3 rounded-2xl font-semibold text-xs bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-gray-200 transition flex items-center gap-2"
                title="Switch Free AI Model Gateway"
              >
                <Cpu className="w-4 h-4 text-purple-400" />
                <span>AI Models</span>
              </button>

              <Link
                href="/autopilot"
                className="px-4 py-3 rounded-2xl font-semibold text-xs bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 transition flex items-center gap-2"
              >
                <Zap className="w-4 h-4 text-emerald-400" />
                <span>Auto-Pilot</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Compact Quick-Jump Creator Deck */}
          <div className="flex flex-col gap-2.5 lg:min-w-[280px] p-4 rounded-2xl bg-black/35 border border-white/[0.07] backdrop-blur-md">
            <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400">
              Quick-Launch Studios
            </span>
            <Link
              href="/editor/vid-speed-gta-crash"
              className="px-3.5 py-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] text-xs font-semibold text-white transition flex items-center justify-between"
            >
              <span>⚡ IShowSpeed</span>
              <span className="text-[10px] text-purple-400 font-mono">12 Clips →</span>
            </Link>
            <Link
              href="/editor/a5d7460f-90e1-4e4e-9051-210d35430446"
              className="px-3.5 py-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] text-xs font-semibold text-white transition flex items-center justify-between"
            >
              <span>👑 CarryisLive</span>
              <span className="text-[10px] text-blue-400 font-mono">14 Clips →</span>
            </Link>
            <Link
              href="/editor/vid-trending-daily-viral"
              className="px-3.5 py-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] text-xs font-semibold text-white transition flex items-center justify-between"
            >
              <span>🌐 MrBeast Viral</span>
              <span className="text-[10px] text-amber-400 font-mono">3 Clips →</span>
            </Link>
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

      {justIngestedVideo && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/80 to-purple-950/60 border border-emerald-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl animate-in fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <div className="text-sm font-bold text-white">
                Ingested &amp; Clips Generated: {justIngestedVideo.title}
              </div>
              <div className="text-xs text-emerald-300">
                Creator: {justIngestedVideo.creator_name || 'Creator'} • Starter 9:16 viral clips are ready in Studio!
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={`/editor/${justIngestedVideo.id}`}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-emerald-600/30"
            >
              <span>Open Viral Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <button
              type="button"
              onClick={() => setJustIngestedVideo(null)}
              className="px-2.5 py-2 rounded-xl bg-black/40 hover:bg-black/60 text-gray-400 hover:text-white text-xs transition"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <IngestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={(vid) => {
          setIsModalOpen(false);
          if (vid) setJustIngestedVideo(vid);
          fetchVideos();
        }}
      />

      <GhostDownloaderModal
        isOpen={isGhostModalOpen}
        onClose={() => setIsGhostModalOpen(false)}
        onSuccess={(vid) => {
          setIsGhostModalOpen(false);
          if (vid) setJustIngestedVideo(vid);
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
