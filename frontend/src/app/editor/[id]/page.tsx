'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Play,
  Pause,
  Video as VideoIcon,
  Youtube,
  Sparkles,
  Loader2,
  Zap,
  Clock,
  Download,
  MapPin,
  Flame,
  PlusCircle,
  ArrowRight,
  Crop,
  Type,
  CheckCircle2,
  Calendar,
  Eye,
  Sliders,
  Share2,
  Maximize2,
  Volume2,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Video, Clip, RenderOptions } from '@/lib/types';
import PublishModal from '@/components/PublishModal';
import ClipGeneratorModal from '@/components/ClipGeneratorModal';
import ClipCard from '@/components/ClipCard';
import TranscriptTrimmer from '@/components/TranscriptTrimmer';
import ComparisonPlayer from '@/components/ComparisonPlayer';
import { INITIAL_VIDEOS, INITIAL_CLIPS } from '@/lib/seedData';

export default function ClipEditorPage() {
  const { id } = useParams<{ id: string }>();

  const initialVid = INITIAL_VIDEOS.find((v) => v.id === id) || null;
  const initialClipsList = INITIAL_CLIPS.filter((c) => c.video_id === id);
  const initialSelected =
    initialClipsList.length > 0
      ? [...initialClipsList].sort((a, b) => b.virality_score - a.virality_score)[0]
      : null;

  const [video, setVideo] = useState<Video | null>(initialVid);
  const [clips, setClips] = useState<Clip[]>(initialClipsList);
  const [selectedClip, setSelectedClip] = useState<Clip | null>(initialSelected);
  const [loading, setLoading] = useState(!initialVid);
  const [rendering, setRendering] = useState(false);
  const [isPublishOpen, setIsPublishOpen] = useState(false);
  const [isGenModalOpen, setIsGenModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'studio' | 'compare'>('studio');
  const [showSafeZoneOverlay, setShowSafeZoneOverlay] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [streamFilter, setStreamFilter] = useState<'all' | 'top' | 'crash' | 'drift'>('all');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Editable clip metadata
  const [clipTitle, setClipTitle] = useState('');
  const [clipHook, setClipHook] = useState('');

  // Pro Auto-edit presets (backend handles heavy execution)
  const [renderOptions, setRenderOptions] = useState<RenderOptions>({
    aspect_ratio: '9:16',
    framing_mode: 'split_facecam',
    lead_in_seconds: 6,
    enable_swear_masking: true,
    caption_language: 'auto',
    caption_position: 'lower_third',
    enable_face_tracking: true,
    enable_animated_captions: true,
    enable_silence_trim: true,
    enable_audio_normalization: true,
    caption_preset: 'karaoke_bold',
    color_preset: 'viral_vibrant',
    enable_punch_in_zoom: true,
    enable_retention_bar: true,
    split_screen: true,
  });

  // Playback sync state
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const selectedClipRef = useRef<Clip | null>(null);

  // Autopilot Video Scheduling state
  const [isScheduleEnabled, setIsScheduleEnabled] = useState(false);
  const [scheduledTimeInput, setScheduledTimeInput] = useState('');

  useEffect(() => {
    selectedClipRef.current = selectedClip;
    if (selectedClip) {
      setClipTitle(selectedClip.title || '');
      setClipHook(selectedClip.hook_text || '');

      const isSched = selectedClip.status === 'scheduled' || !!selectedClip.scheduled_publish_time;
      setIsScheduleEnabled(isSched);
      if (selectedClip.scheduled_publish_time) {
        const t = selectedClip.scheduled_publish_time.replace(' ', 'T').slice(0, 16);
        setScheduledTimeInput(t);
      } else {
        const d = new Date();
        d.setHours(18, 0, 0, 0);
        if (d.getTime() <= Date.now()) d.setDate(d.getDate() + 1);
        const pad = (n: number) => String(n).padStart(2, '0');
        setScheduledTimeInput(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T18:00`);
      }
    }
  }, [selectedClip]);

  const handleToggleSchedule = async () => {
    if (!selectedClip) return;
    const nextState = !isScheduleEnabled;
    setIsScheduleEnabled(nextState);
    if (!nextState) {
      const updated = await api.updateClip(selectedClip.id, {
        status: 'rendered',
        scheduled_publish_time: null,
      });
      setSelectedClip(updated);
      setClips((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    } else {
      const timeStr = scheduledTimeInput.replace('T', ' ') + ':00';
      const updated = await api.updateClip(selectedClip.id, {
        status: 'scheduled',
        scheduled_publish_time: timeStr,
      });
      setSelectedClip(updated);
      setClips((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    }
  };

  const handleSetScheduledPreset = async (hours: number, minutes: number) => {
    if (!selectedClip) return;
    const d = new Date();
    d.setHours(hours, minutes, 0, 0);
    if (d.getTime() <= Date.now()) d.setDate(d.getDate() + 1);
    const pad = (n: number) => String(n).padStart(2, '0');
    const inputVal = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(hours)}:${pad(minutes)}`;
    setScheduledTimeInput(inputVal);
    setIsScheduleEnabled(true);
    const timeStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(hours)}:${pad(minutes)}:00`;
    const updated = await api.updateClip(selectedClip.id, {
      status: 'scheduled',
      scheduled_publish_time: timeStr,
    });
    setSelectedClip(updated);
    setClips((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  const handleNudgeSchedule = async (deltaMinutes: number) => {
    if (!selectedClip) return;
    const current = scheduledTimeInput ? new Date(scheduledTimeInput) : new Date();
    current.setMinutes(current.getMinutes() + deltaMinutes);
    const pad = (n: number) => String(n).padStart(2, '0');
    const inputVal = `${current.getFullYear()}-${pad(current.getMonth() + 1)}-${pad(current.getDate())}T${pad(current.getHours())}:${pad(current.getMinutes())}`;
    setScheduledTimeInput(inputVal);
    setIsScheduleEnabled(true);
    const timeStr = `${current.getFullYear()}-${pad(current.getMonth() + 1)}-${pad(current.getDate())} ${pad(current.getHours())}:${pad(current.getMinutes())}:00`;
    const updated = await api.updateClip(selectedClip.id, {
      status: 'scheduled',
      scheduled_publish_time: timeStr,
    });
    setSelectedClip(updated);
    setClips((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  const handleCustomTimeChange = async (val: string) => {
    setScheduledTimeInput(val);
    if (!selectedClip || !val) return;
    setIsScheduleEnabled(true);
    const timeStr = val.replace('T', ' ') + ':00';
    const updated = await api.updateClip(selectedClip.id, {
      status: 'scheduled',
      scheduled_publish_time: timeStr,
    });
    setSelectedClip(updated);
    setClips((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  const handleTurnOffSchedule = async () => {
    if (!selectedClip) return;
    setIsScheduleEnabled(false);
    const updated = await api.updateClip(selectedClip.id, {
      status: 'rendered',
      scheduled_publish_time: null,
    });
    setSelectedClip(updated);
    setClips((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  const handleSelectClip = (c: Clip) => {
    setSelectedClip(c);
    const el = document.getElementById('studio-player');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    }, 200);
  };

  const loadData = async () => {
    try {
      const vidData = await api.getVideo(id);
      if (vidData) setVideo(vidData);

      const clipsData = await api.getClipsForVideo(id);
      if (Array.isArray(clipsData) && clipsData.length > 0) {
        setClips(clipsData);
        if (!selectedClipRef.current) {
          const sorted = [...clipsData].sort((a, b) => b.virality_score - a.virality_score);
          setSelectedClip(sorted[0]);
        }
      }
    } catch (e) {
      console.error('Error loading clip editor data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(async () => {
      if (id) {
        try {
          const updatedClips = await api.getClipsForVideo(id);
          setClips(updatedClips);
          if (selectedClipRef.current) {
            const matched = updatedClips.find((c) => c.id === selectedClipRef.current?.id);
            if (matched && matched.status !== selectedClipRef.current.status) {
              setSelectedClip(matched);
            }
          }
        } catch {
          // ignore background polling transient errors
        }
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [id]);

  const handleTimeUpdate = () => {
    if (videoRef.current && selectedClip) {
      const relTime = videoRef.current.currentTime;
      setCurrentTime(selectedClip.start_time + relTime);
    }
  };

  const handleSeek = (time: number) => {
    if (videoRef.current && selectedClip) {
      const relTime = Math.max(0, Math.min(selectedClip.duration, time - selectedClip.start_time));
      videoRef.current.currentTime = relTime;
      setCurrentTime(time);
    }
  };

  const handleUpdateBoundaries = async (newStart: number, newEnd: number) => {
    if (!selectedClip) return;
    try {
      const updated = await api.updateClip(selectedClip.id, {
        start_time: Math.round(newStart * 10) / 10,
        end_time: Math.round(newEnd * 10) / 10,
        duration: Math.round((newEnd - newStart) * 10) / 10,
      });
      setSelectedClip(updated);
      setClips((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    } catch (e) {
      console.error('Error updating clip boundaries:', e);
    }
  };

  const handleSaveChanges = async () => {
    if (!selectedClip) return;
    try {
      setRendering(true);
      const updated = await api.updateClip(selectedClip.id, {
        title: clipTitle,
        hook_text: clipHook,
      });
      setSelectedClip(updated);
      setClips((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (e) {
      console.error('Failed to save clip edits:', e);
    } finally {
      setRendering(false);
    }
  };

  const sortedClips = [...clips].sort((a, b) => (b.virality_score || 0) - (a.virality_score || 0));
  const topClip = sortedClips[0];

  const displayedClips = sortedClips.filter((c) => {
    if (streamFilter === 'top') return (c.virality_score || 0) >= 98;
    if (streamFilter === 'crash') return c.title.toLowerCase().includes('crash') || c.title.toLowerCase().includes('barrier');
    if (streamFilter === 'drift') return c.title.toLowerCase().includes('drift') || c.title.toLowerCase().includes('wanted');
    return true;
  });

  // Calculate clean video URL
  const getVideoUrl = (clip: Clip | null) => {
    if (!clip) return '';
    if (clip.output_path) {
      const clean = clip.output_path.replace(/^\/+/, '');
      return `/${clean}`;
    }
    return `/api/v1/clips/${clip.id}/stream`;
  };

  const getPosterUrl = (clip: Clip | null) => {
    if (!clip || !clip.thumbnail_path) return undefined;
    const clean = clip.thumbnail_path.replace(/^\/+/, '');
    return `/${clean}`;
  };

  return (
    <div className="space-y-6 pb-20">
      {/* 1. Unslop Clean Header Navigation */}
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
              <h1 className="text-lg md:text-xl font-bold text-white tracking-tight">
                {video?.title || 'Gaming Livestream Studio'}
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800">
                PRO ACTIVE
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Source: {video?.creator_name || 'Streamer'} • {video?.duration ? Math.round(video.duration / 60) : 10} min stream • {clips.length} viral Short moments identified
            </p>
          </div>
        </div>

        {/* Global Action Bar */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setIsGenModalOpen(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white transition flex items-center gap-2 shadow-md shadow-purple-600/30"
          >
            <PlusCircle className="w-4 h-4 text-purple-200" />
            <span>Generate More Clips</span>
          </button>

          {selectedClip && (
            <button
              onClick={() => setIsPublishOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white transition flex items-center gap-2 shadow-md shadow-red-600/30"
            >
              <Youtube className="w-4 h-4" />
              <span>Publish to Shorts</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Sleek Moment Switcher Ribbon (1-Click Instant Selector) */}
      {clips.length > 0 && (
        <div className="bg-[#10121c] border border-gray-800/90 p-2 rounded-2xl shadow-xl flex items-center gap-2 overflow-x-auto">
          <div className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold uppercase text-purple-300 tracking-wider whitespace-nowrap border-r border-gray-800/80">
            <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
            <span>Moments ({clips.length})</span>
          </div>

          <div className="flex items-center gap-1.5 flex-nowrap">
            {sortedClips.map((c, idx) => {
              const isSelected = selectedClip?.id === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => handleSelectClip(c)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all duration-200 border ${
                    isSelected
                      ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-600/40 scale-[1.02]'
                      : 'bg-[#151724] hover:bg-[#1e2133] text-gray-300 border-gray-800/80 hover:border-purple-500/40'
                  }`}
                >
                  <span className="font-mono text-[10px] opacity-75">#{idx + 1}</span>
                  <span className="line-clamp-1 max-w-[130px] md:max-w-[170px]">{c.title}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                      (c.virality_score || 0) >= 98
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-purple-950 text-purple-300 border border-purple-800'
                    }`}
                  >
                    {c.virality_score}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Main Pro Studio Workstation (Hero Left + Clean Inspector Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Pro 9:16 Shorts Monitor */}
        <div id="studio-player" className="lg:col-span-5 flex flex-col items-center space-y-3.5 scroll-mt-24">
          {/* Monitor Chassis Header */}
          <div className="w-[300px] sm:w-[320px] flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-mono font-bold text-gray-300">
                1080 × 1920 • 60 FPS
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowSafeZoneOverlay(!showSafeZoneOverlay)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono transition border ${
                  showSafeZoneOverlay
                    ? 'bg-cyan-600 text-white border-cyan-400'
                    : 'bg-gray-800 text-gray-400 border-gray-700 hover:text-white'
                }`}
                title="Toggle Shorts & TikTok UI Safe Area Overlay"
              >
                Safe Zone
              </button>
              <span className="text-[10px] font-mono text-purple-300 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-800">
                PRO MASTER
              </span>
            </div>
          </div>

          {/* 9:16 Video Player Container */}
          <div className="relative w-[300px] sm:w-[320px] h-[534px] sm:h-[568px] bg-black rounded-3xl overflow-hidden border-2 border-purple-500/40 shadow-2xl flex items-center justify-center group">
            {selectedClip ? (
              <video
                ref={videoRef}
                key={selectedClip.id}
                src={getVideoUrl(selectedClip)}
                poster={getPosterUrl(selectedClip)}
                onTimeUpdate={handleTimeUpdate}
                playsInline
                controls
                preload="auto"
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.currentTarget;
                  const fallback = `/api/v1/clips/${selectedClip.id}/stream`;
                  if (!target.src.includes('/stream')) {
                    target.src = fallback;
                  }
                }}
              />
            ) : (
              <div className="text-center p-6 space-y-3">
                <VideoIcon className="w-10 h-10 text-purple-400 mx-auto opacity-70" />
                <div className="text-xs text-gray-300 font-semibold">No Clip Selected</div>
              </div>
            )}

            {/* Virality Floating Metric */}
            {selectedClip && (
              <div className="absolute top-4 left-4 px-2.5 py-1 rounded-full bg-black/80 backdrop-blur border border-emerald-500/50 text-emerald-400 text-xs font-black pointer-events-none z-20 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>{selectedClip.virality_score} VIRAL</span>
              </div>
            )}

            {/* Shorts / TikTok Safe-Zone Guides */}
            {showSafeZoneOverlay && (
              <div className="absolute inset-0 pointer-events-none z-30 flex flex-col justify-between p-4 border border-dashed border-cyan-400/60 bg-black/20">
                <div className="text-center bg-cyan-950/90 border border-cyan-500/60 text-cyan-300 text-[10px] font-mono py-1 rounded">
                  HEADER SAFE ZONE (y: 0 - 200px)
                </div>
                <div className="flex-1 my-4 border border-dashed border-emerald-400/40 rounded flex items-center justify-center">
                  <span className="text-[10px] font-mono text-emerald-300 bg-black/80 px-2 py-0.5 rounded border border-emerald-800">
                    SUBTITLE & REACTION FOCUS AREA
                  </span>
                </div>
                <div className="text-center bg-pink-950/90 border border-pink-500/60 text-pink-300 text-[10px] font-mono py-1 rounded">
                  SHORTS UI BUTTONS (y: 1720 - 1920px)
                </div>
              </div>
            )}
          </div>

          {/* Timecode Readout & Speed Selectors */}
          {selectedClip && (
            <div className="w-[300px] sm:w-[320px] flex items-center justify-between text-xs text-gray-300 font-mono bg-[#12141f] px-3.5 py-2 rounded-xl border border-gray-800/80">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-purple-300 font-bold">{currentTime.toFixed(1)}s</span>
                <span className="text-gray-500">/</span>
                <span>{selectedClip.duration}s</span>
              </div>
              <div className="flex items-center gap-1">
                {[1.0, 1.25, 1.5].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => {
                      setPlaybackRate(rate);
                      if (videoRef.current) videoRef.current.playbackRate = rate;
                    }}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono transition ${
                      playbackRate === rate
                        ? 'bg-purple-600 text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Direct File Download & Shorts Export CTAs */}
          {selectedClip && (
            <div className="w-[300px] sm:w-[320px] flex flex-col gap-2">
              <a
                href={getVideoUrl(selectedClip)}
                download={`${selectedClip.id}.mp4`}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-[#171a2a] hover:bg-[#20243b] text-gray-200 hover:text-white border border-gray-700/80 transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <Download className="w-4 h-4 text-purple-400" />
                <span>Download Master MP4 (1080p 60FPS)</span>
              </a>

              <button
                type="button"
                onClick={() => setIsPublishOpen(true)}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white transition-all flex items-center justify-center gap-2 shadow-md shadow-red-600/20"
              >
                <Youtube className="w-4 h-4" />
                <span>Publish Directly to YouTube Shorts</span>
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Unslop Clean Studio Inspector */}
        <div className="lg:col-span-7 space-y-5">
          {/* 1. Clip Overview & Virality Index (Clean, No Slop) */}
          <div className="bg-[#12141e] border border-gray-800/80 rounded-2xl p-5 space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-gray-800/80 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                  Clip Intelligence &amp; Title
                </h3>
              </div>
              {selectedClip && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950/70 border border-emerald-800/80 px-2.5 py-0.5 rounded-full">
                    {selectedClip.virality_score} / 100 Virality Index
                  </span>
                </div>
              )}
            </div>

            {/* Editable Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300">Short Title</label>
              <input
                type="text"
                value={clipTitle}
                onChange={(e) => setClipTitle(e.target.value)}
                placeholder="Enter compelling Short title..."
                className="w-full bg-[#181a27] border border-gray-800 focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 outline-none transition"
              />
            </div>

            {/* Editable Hook Line */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300">Opening Hook Caption</label>
              <input
                type="text"
                value={clipHook}
                onChange={(e) => setClipHook(e.target.value)}
                placeholder="e.g. SPEED WENT FLYING AT 300MPH! 💀"
                className="w-full bg-[#181a27] border border-gray-800 focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-xs text-yellow-300 font-semibold placeholder-gray-500 outline-none transition font-mono"
              />
            </div>

            {/* Algorithmic Reason (Clean 1-liner) */}
            {selectedClip?.virality_reason && (
              <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-900/30 text-xs text-purple-300/90 leading-relaxed flex items-start gap-2">
                <Zap className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <span>{selectedClip.virality_reason}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <div className="text-[11px] text-gray-400 font-mono">
                Duration: <span className="text-gray-200 font-bold">{selectedClip?.duration}s</span> • Window: {selectedClip?.start_time}s – {selectedClip?.end_time}s
              </div>
              <button
                type="button"
                onClick={handleSaveChanges}
                disabled={rendering}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white transition flex items-center gap-1.5 shadow-sm"
              >
                {rendering ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : saveSuccess ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <span>Save Edits</span>
                )}
              </button>
            </div>
          </div>

          {/* 2. Pro Creative Framing & Captions (Clean One-Click Presets) */}
          <div className="bg-[#12141e] border border-gray-800/80 rounded-2xl p-5 space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-gray-800/80 pb-3">
              <div className="flex items-center gap-2">
                <Crop className="w-4 h-4 text-yellow-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                  Framing &amp; Subtitle Style
                </h3>
              </div>
              <span className="text-[10px] font-mono text-gray-400">
                1-Click Applied Automatically
              </span>
            </div>

            {/* Layout Presets */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-300">Layout Format</label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() =>
                    setRenderOptions({
                      ...renderOptions,
                      framing_mode: 'split_facecam',
                      split_screen: true,
                    })
                  }
                  className={`p-3 rounded-xl border text-left transition ${
                    renderOptions.split_screen
                      ? 'border-purple-500 bg-purple-950/30 text-white ring-1 ring-purple-500/50'
                      : 'border-gray-800 hover:border-gray-700 bg-[#161824] text-gray-300'
                  }`}
                >
                  <div className="text-xs font-bold flex items-center justify-between">
                    <span>👑 Carry Split-Screen</span>
                    {renderOptions.split_screen && (
                      <span className="w-2 h-2 rounded-full bg-purple-400" />
                    )}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-1">
                    Top streamer facecam + bottom 9:16 gameplay action with neon divider
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setRenderOptions({
                      ...renderOptions,
                      framing_mode: 'fill_player_track',
                      split_screen: false,
                    })
                  }
                  className={`p-3 rounded-xl border text-left transition ${
                    !renderOptions.split_screen
                      ? 'border-purple-500 bg-purple-950/30 text-white ring-1 ring-purple-500/50'
                      : 'border-gray-800 hover:border-gray-700 bg-[#161824] text-gray-300'
                  }`}
                >
                  <div className="text-xs font-bold flex items-center justify-between">
                    <span>🎬 9:16 Centered Focus</span>
                    {!renderOptions.split_screen && (
                      <span className="w-2 h-2 rounded-full bg-purple-400" />
                    )}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-1">
                    Auto-pans player/vehicle and evades corner camera overlays
                  </div>
                </button>
              </div>
            </div>

            {/* Subtitle Style Presets */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-semibold text-gray-300">Subtitle Style</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  {
                    id: 'karaoke_bold',
                    name: 'Hormozi Gold',
                    preview: 'TEXT',
                    previewClass: 'bg-black text-yellow-300 font-black',
                  },
                  {
                    id: 'neon_cyber',
                    name: 'Cyber Neon',
                    preview: 'GLITCH',
                    previewClass: 'bg-emerald-950 text-emerald-400 font-black',
                  },
                  {
                    id: 'minimal_white',
                    name: 'Clean Minimal',
                    preview: 'STORY',
                    previewClass: 'bg-gray-900 text-white font-bold',
                  },
                ].map((st) => {
                  const isSel = renderOptions.caption_preset === st.id;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() =>
                        setRenderOptions({ ...renderOptions, caption_preset: st.id as any })
                      }
                      className={`p-2.5 rounded-xl border text-center transition ${
                        isSel
                          ? 'border-purple-500 bg-purple-950/40 text-white'
                          : 'border-gray-800 hover:border-gray-700 bg-[#161824] text-gray-300'
                      }`}
                    >
                      <div className={`py-1 text-xs rounded mb-1.5 ${st.previewClass}`}>
                        {st.preview}
                      </div>
                      <div className="text-[11px] font-bold">{st.name}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Automated Backend Audio/Pacing Pipeline Info */}
            <div className="pt-2 border-t border-gray-800/80 flex items-center justify-between text-[11px] text-gray-400">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Backend Audio Pipeline: EBU R128 Normalized &bull; Swear Masked</span>
              </div>
              <span className="text-emerald-400 font-mono text-[10px]">60FPS LANCZOS</span>
            </div>
          </div>

          {/* 3. Autopilot Video Scheduling & Traffic Window (Web On/Off & Time Adjuster) */}
          <div className="bg-[#12141e] border border-gray-800/80 rounded-2xl p-5 space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-gray-800/80 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                  Autopilot Video Scheduling
                </h3>
              </div>

              {/* Master Web Switch Toggle */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-bold text-gray-400">
                  {isScheduleEnabled ? (
                    <span className="text-emerald-400">ON</span>
                  ) : (
                    <span className="text-gray-500">OFF</span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={handleToggleSchedule}
                  className={`w-11 h-6 rounded-full transition-colors relative p-0.5 border ${
                    isScheduleEnabled
                      ? 'bg-purple-600 border-purple-400 shadow-md shadow-purple-600/30'
                      : 'bg-gray-800 border-gray-700'
                  }`}
                  title={isScheduleEnabled ? 'Turn OFF scheduling' : 'Turn ON scheduling'}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      isScheduleEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {!isScheduleEnabled ? (
              <div className="p-3.5 rounded-xl bg-[#161824] border border-gray-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-gray-500" />
                    <span>Manual Mode (No Scheduling Active)</span>
                  </div>
                  <div className="text-[10px] text-gray-400">
                    Video scheduling is turned off. Clips publish or export immediately when you click Publish.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleSchedule()}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/40 transition whitespace-nowrap self-start sm:self-auto"
                >
                  Enable Scheduling
                </button>
              </div>
            ) : (
              <div className="space-y-3.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-300 font-semibold">Peak High-Traffic Windows:</span>
                  <span className="text-emerald-400 font-mono text-[10px] font-bold bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded">
                    AUTOPILOT UPLOAD QUEUE
                  </span>
                </div>

                {/* 1-Click Peak Traffic Presets */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSetScheduledPreset(18, 0)}
                    className="p-3 rounded-xl border border-gray-800 hover:border-purple-500/60 bg-[#161824] hover:bg-[#1f2235] text-left transition"
                  >
                    <div className="text-xs font-bold text-white flex items-center justify-between">
                      <span>🔥 6:00 PM IST</span>
                      <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950 px-1 py-0.5 rounded">PRIME</span>
                    </div>
                    <div className="text-[10px] text-gray-400 mt-1">Evening Peak Audience Traffic</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSetScheduledPreset(20, 30)}
                    className="p-3 rounded-xl border border-gray-800 hover:border-purple-500/60 bg-[#161824] hover:bg-[#1f2235] text-left transition"
                  >
                    <div className="text-xs font-bold text-white flex items-center justify-between">
                      <span>🌙 8:30 PM IST</span>
                      <span className="text-[9px] font-mono text-purple-300 bg-purple-950 px-1 py-0.5 rounded">GAMING</span>
                    </div>
                    <div className="text-[10px] text-gray-400 mt-1">Night Live Session Engagement</div>
                  </button>
                </div>

                {/* Custom Time Adjuster Input with Nudge Buttons */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11px] text-gray-400">
                    <span className="font-semibold text-gray-300">Adjust Custom Schedule Time:</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleNudgeSchedule(-30)}
                        className="px-2 py-0.5 rounded bg-[#1f2235] hover:bg-purple-600 text-gray-300 hover:text-white text-[10px] font-mono border border-gray-700/80 transition"
                        title="Move back 30 minutes"
                      >
                        -30m
                      </button>
                      <button
                        type="button"
                        onClick={() => handleNudgeSchedule(30)}
                        className="px-2 py-0.5 rounded bg-[#1f2235] hover:bg-purple-600 text-gray-300 hover:text-white text-[10px] font-mono border border-gray-700/80 transition"
                        title="Move forward 30 minutes"
                      >
                        +30m
                      </button>
                      <button
                        type="button"
                        onClick={() => handleNudgeSchedule(60)}
                        className="px-2 py-0.5 rounded bg-[#1f2235] hover:bg-purple-600 text-gray-300 hover:text-white text-[10px] font-mono border border-gray-700/80 transition"
                        title="Move forward 1 hour"
                      >
                        +1h
                      </button>
                    </div>
                  </div>

                  <input
                    type="datetime-local"
                    value={scheduledTimeInput}
                    onChange={(e) => handleCustomTimeChange(e.target.value)}
                    className="w-full bg-[#181a27] border border-gray-700 focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none transition font-mono"
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-800/80">
                  <button
                    type="button"
                    onClick={handleTurnOffSchedule}
                    className="text-xs font-semibold text-red-400 hover:text-red-300 transition"
                  >
                    Turn Off Scheduling (Cancel)
                  </button>
                  <span className="text-[10px] font-mono text-emerald-400">
                    ● Autopilot Daemon Active
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 3. Word-Level Transcript Trimmer */}
          {video?.transcript && selectedClip && (
            <div className="bg-[#12141e] border border-gray-800/80 rounded-2xl p-5 shadow-lg">
              <TranscriptTrimmer
                transcript={video.transcript}
                startTime={selectedClip.start_time}
                endTime={selectedClip.end_time}
                currentTime={currentTime}
                onSetStartTime={(t) => handleUpdateBoundaries(t, selectedClip.end_time)}
                onSetEndTime={(t) => handleUpdateBoundaries(selectedClip.start_time, t)}
                onSeek={handleSeek}
              />
            </div>
          )}
        </div>
      </div>

      {/* 4. Stream Moments Grid (All Incidents With True 9:16 Shorts Previews) */}
      <div className="pt-8 border-t border-gray-800/80 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>All Viral Moments for this Stream</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-purple-950/80 border border-purple-800 text-purple-300">
                {displayedClips.length} Clips
              </span>
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Click any card to immediately load, preview, and edit in the studio monitor above.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 bg-[#12141e] p-1 rounded-xl border border-gray-800/80">
            <button
              onClick={() => setStreamFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                streamFilter === 'all'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              All ({sortedClips.length})
            </button>
            <button
              onClick={() => setStreamFilter('top')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                streamFilter === 'top'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-emerald-400'
              }`}
            >
              🔥 Top 98+
            </button>
            <button
              onClick={() => setStreamFilter('crash')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                streamFilter === 'crash'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              💥 Crashes
            </button>
            <button
              onClick={() => setStreamFilter('drift')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                streamFilter === 'drift'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              🏎️ Drifts
            </button>
          </div>
        </div>

        {/* 4-Column Grid with True 9:16 Shorts Aspect Ratio */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {displayedClips.map((clip) => (
            <ClipCard
              key={clip.id}
              clip={clip}
              isSelected={clip.id === selectedClip?.id}
              isChampion={clip.id === topClip?.id}
              onSelect={(c) => handleSelectClip(c)}
              onPublishClick={(c) => {
                setSelectedClip(c);
                setIsPublishOpen(true);
              }}
            />
          ))}
        </div>
      </div>

      {/* Publish Modal */}
      {selectedClip && video && (
        <PublishModal
          clip={selectedClip}
          video={video}
          isOpen={isPublishOpen}
          onClose={() => setIsPublishOpen(false)}
          onSuccess={loadData}
        />
      )}

      {/* AI Clip Generator Modal */}
      {video && (
        <ClipGeneratorModal
          video={video}
          isOpen={isGenModalOpen}
          onClose={() => setIsGenModalOpen(false)}
          onClipCreated={(newClip) => {
            setClips((prev) => [newClip, ...prev.filter((c) => c.id !== newClip.id)]);
            setSelectedClip(newClip);
            const el = document.getElementById('studio-player');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        />
      )}
    </div>
  );
}
