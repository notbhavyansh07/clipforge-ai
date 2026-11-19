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
  Sliders,
  Layers,
  Eye,
  CheckCircle2,
  Search,
  Zap,
  Clock,
  Download,
  MapPin,
  Flame,
  Filter,
  Timer,
  PlusCircle,
  ArrowRight,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Video, Clip, RenderOptions } from '@/lib/types';
import ViralityBreakdown from '@/components/ViralityBreakdown';
import TranscriptTrimmer from '@/components/TranscriptTrimmer';
import CaptionStyler from '@/components/CaptionStyler';
import PublishModal from '@/components/PublishModal';
import ClipGeneratorModal from '@/components/ClipGeneratorModal';
import ClipCard from '@/components/ClipCard';
import MultiTrackTimeline from '@/components/MultiTrackTimeline';
import ComparisonPlayer from '@/components/ComparisonPlayer';
import CinematicControls from '@/components/CinematicControls';
import { INITIAL_VIDEOS, INITIAL_CLIPS } from '@/lib/seedData';

export default function ClipEditorPage() {
  const { id } = useParams<{ id: string }>();

  const initialVid = INITIAL_VIDEOS.find((v) => v.id === id) || null;
  const initialClipsList = INITIAL_CLIPS.filter((c) => c.video_id === id);
  const initialSelected = initialClipsList.length > 0
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
  const [streamFilter, setStreamFilter] = useState<'all' | 'h1_3' | 'h4_6' | 'h7_10' | 'top'>('all');

  // Multi-track playback sync state
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const selectedClipRef = useRef<Clip | null>(null);

  useEffect(() => {
    selectedClipRef.current = selectedClip;
  }, [selectedClip]);

  // Prompt-to-Clip Moment Search
  const [promptQuery, setPromptQuery] = useState('');
  const [searchingMoment, setSearchingMoment] = useState(false);

  // Auto-edit options including FilmCraft & HyperFrames & GTA-Auto-Clipper
  const [renderOptions, setRenderOptions] = useState<RenderOptions>({
    aspect_ratio: '9:16',
    framing_mode: 'fill_player_track',
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
    split_screen: false,
  });

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
            if (matched && (matched.status !== selectedClipRef.current.status || matched.output_path !== selectedClipRef.current.output_path)) {
              setSelectedClip(matched);
            }
          }
        } catch {
          // ignore background polling transient errors
        }
      }
    }, 2000);
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
      const relTime = time >= selectedClip.start_time ? time - selectedClip.start_time : time;
      videoRef.current.currentTime = Math.max(0, Math.min(relTime, selectedClip.duration));
    }
    setCurrentTime(time);
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const handleRender = async () => {
    if (!selectedClip) return;
    try {
      setRendering(true);
      await api.renderClip(selectedClip.id, renderOptions);
      
      const startTime = Date.now();
      const pollTimer = setInterval(async () => {
        try {
          const updated = await api.getClip(selectedClip.id);
          const isDone = (updated.status === 'rendered' || updated.status === 'published' || updated.status === 'failed') && (Date.now() - startTime > 2000);
          if (isDone || Date.now() - startTime > 45000) {
            clearInterval(pollTimer);
            setSelectedClip(updated);
            setClips((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
            setRendering(false);
          }
        } catch {
          clearInterval(pollTimer);
          setRendering(false);
        }
      }, 1500);
    } catch (e: any) {
      alert(`Render error: ${e.message}`);
      setRendering(false);
    }
  };

  const handleUpdateBoundaries = async (start: number, end: number) => {
    if (!selectedClip) return;
    try {
      const updated = await api.updateClip(selectedClip.id, {
        start_time: start,
        end_time: end,
      });
      setSelectedClip(updated);
      setClips((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    } catch (e) {
      console.error(e);
    }
  };

  const handleFindMoment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptQuery.trim() || !id) return;
    try {
      setSearchingMoment(true);
      const newClip = await api.findMomentByPrompt(id, promptQuery.trim());
      setClips((prev) => [newClip, ...prev]);
      setSelectedClip(newClip);
      setPromptQuery('');
    } catch (err: any) {
      alert(`Moment search error: ${err.message}`);
    } finally {
      setSearchingMoment(false);
    }
  };

  if (loading && !video) {
    return <div className="text-center py-24 text-gray-400">Loading ClipForge Studio...</div>;
  }

  const sortedClips = [...clips].sort((a, b) => b.virality_score - a.virality_score);
  const topClip = sortedClips.length > 0 ? sortedClips[0] : null;

  const displayedClips = sortedClips.filter((c) => {
    if (streamFilter === 'h1_3') {
      return (
        c.stream_time_formatted?.includes('Hour 1') ||
        c.stream_time_formatted?.includes('Hour 2') ||
        c.stream_time_formatted?.includes('Hour 3')
      );
    }
    if (streamFilter === 'h4_6') {
      return (
        c.stream_time_formatted?.includes('Hour 4') ||
        c.stream_time_formatted?.includes('Hour 5') ||
        c.stream_time_formatted?.includes('Hour 6')
      );
    }
    if (streamFilter === 'h7_10') {
      return (
        c.stream_time_formatted?.includes('Hour 7') ||
        c.stream_time_formatted?.includes('Hour 8') ||
        c.stream_time_formatted?.includes('Hour 9') ||
        c.stream_time_formatted?.includes('Hour 10')
      );
    }
    if (streamFilter === 'top') {
      return c.virality_score >= 98;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top action & navigation bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2 rounded-xl bg-gray-900 border border-gray-800 text-gray-400 hover:text-white transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-lg md:text-xl font-bold text-white line-clamp-1">{video?.title}</h1>
            <p className="text-xs text-gray-400">
              Source: <span className="uppercase text-gray-300 font-mono">{video?.source_type}</span> &bull; Status:{' '}
              <span className="text-purple-400 font-semibold">{video?.status}</span>
            </p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2 bg-[#12141e] p-1 rounded-xl border border-gray-800">
          <button
            onClick={() => setActiveTab('studio')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'studio'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Studio View</span>
          </button>
          <button
            onClick={() => setActiveTab('compare')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'compare'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>A/B Comparison Mode</span>
          </button>
        </div>

        {selectedClip && (
          <div className="flex items-center flex-wrap gap-2 sm:gap-3">
            <button
              onClick={() => setIsGenModalOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 via-pink-600 to-purple-600 hover:opacity-95 text-white transition flex items-center gap-1.5 shadow-lg shadow-purple-600/30"
            >
              <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
              <span>+ Generate More Clips</span>
            </button>

            <button
              onClick={handleRender}
              disabled={rendering || selectedClip.status === 'rendering'}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white transition flex items-center gap-2 shadow-lg shadow-purple-600/30 disabled:opacity-50"
            >
              {rendering || selectedClip.status === 'rendering' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Rendering 9:16 Short...</span>
                </>
              ) : selectedClip.output_path ? (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Re-Render Short</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Render 9:16 Short</span>
                </>
              )}
            </button>

            {selectedClip.youtube_video_id && !selectedClip.youtube_video_id.startsWith('CF_') && (
              <a
                href={`https://youtube.com/shorts/${selectedClip.youtube_video_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-green-600 hover:bg-green-700 text-white transition flex items-center gap-1.5 shadow-lg shadow-green-600/30"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>View on YouTube Shorts</span>
              </a>
            )}
            {(selectedClip.status === 'rendered' || selectedClip.output_path) && (
              <>
                <a
                  href={api.getClipStreamUrl(selectedClip.id)}
                  download={`${selectedClip.title}.mp4`}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#1b1e2c] hover:bg-[#252a3d] border border-gray-700 text-white transition flex items-center gap-1.5 shadow-md"
                >
                  <Download className="w-4 h-4 text-purple-400" />
                  <span>Download MP4</span>
                </a>
                <button
                  onClick={() => setIsPublishOpen(true)}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white transition flex items-center gap-2 shadow-lg shadow-red-600/30"
                >
                  <Youtube className="w-4 h-4" />
                  <span>Publish & Export</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* 🎮 GTA-AUTO-CLIPPER SYSTEM STATUS BANNER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-yellow-500/10 via-purple-500/10 to-emerald-500/10 border border-yellow-500/30 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-yellow-400/20 text-yellow-300 font-bold border border-yellow-400/30 text-[11px]">
            🎮 GTA GAMEPLAY VERIFIED
          </span>
          <span className="text-gray-300 text-xs">
            YOLOX 9:16 Player-Centric Crop &bull; Facecam Evasion &bull; 6s Lead-In &bull; Swear-Masked Hinglish Subtitles
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="px-2 py-0.5 rounded-md bg-emerald-950/60 border border-emerald-800 text-emerald-400 font-mono text-[10px] font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            REACH SAFE
          </span>
          <span className="font-mono text-[10px] text-yellow-400 bg-yellow-950/40 px-2 py-0.5 rounded border border-yellow-800">
            BURST RADAR ACTIVE
          </span>
        </div>
      </div>

      {/* 🚀 QUICK INCIDENT SWITCHER BAR (All 11 Moments) */}
      {clips.length > 0 && (
        <div className="bg-[#12141e] border border-purple-900/50 p-2.5 rounded-2xl shadow-xl flex items-center gap-2 overflow-x-auto">
          <div className="flex items-center gap-1.5 px-3 py-1 text-xs font-black uppercase text-purple-300 tracking-wider whitespace-nowrap border-r border-gray-800">
            <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
            <span>All {clips.length} Clips:</span>
          </div>

          <div className="flex items-center gap-2">
            {sortedClips.map((c, idx) => {
              const isSelected = selectedClip?.id === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedClip(c)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all duration-200 border ${
                    isSelected
                      ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-600/40 scale-[1.02]'
                      : 'bg-[#181a27] hover:bg-[#202334] text-gray-300 border-gray-800 hover:border-purple-500/40'
                  }`}
                >
                  <span className="font-mono text-[11px] opacity-70">#{idx + 1}</span>
                  <span className="line-clamp-1 max-w-[150px] md:max-w-[200px]">{c.title}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-black font-mono ${
                    c.virality_score >= 98
                      ? 'bg-[#00FF66]/20 text-[#00FF66] border border-[#00FF66]/40'
                      : 'bg-yellow-400/20 text-yellow-300 border border-yellow-400/40'
                  }`}>
                    {c.virality_score}
                  </span>
                </button>
              );
            })}

            <button
              onClick={() => setIsGenModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:opacity-90 text-white flex items-center gap-1.5 whitespace-nowrap transition border border-purple-400 shadow-md shadow-purple-600/30 shrink-0"
            >
              <PlusCircle className="w-3.5 h-3.5 text-yellow-300" />
              <span>+ Generate Clip</span>
            </button>
          </div>
        </div>
      )}

      {/* ⚡ DIRECT AI CLIP GENERATOR BANNER */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-900/40 via-[#161825] to-[#12141e] border border-purple-500/30 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-600/30 text-purple-300 border border-purple-500/40">
            <Sparkles className="w-4 h-4 text-yellow-300" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white flex items-center gap-2">
              Generate More Viral Moments
              <span className="text-[10px] text-emerald-400 font-mono font-normal">● 1-Click Autopilot &bull; 0 Typing Needed</span>
            </h4>
            <p className="text-[11px] text-gray-400">
              Detect more moments from this stream automatically or slice custom timestamps directly in the studio.
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsGenModalOpen(true)}
          className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:opacity-95 text-white transition flex items-center justify-center gap-1.5 shadow-md shadow-purple-600/20 shrink-0"
        >
          <Zap className="w-3.5 h-3.5 text-yellow-300" />
          <span>Open AI Clip Generator</span>
        </button>
      </div>

      {activeTab === 'compare' && selectedClip && video ? (
        <ComparisonPlayer clip={selectedClip} video={video} />
      ) : (
        <>
          {/* Main Studio Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: 9:16 Portrait Preview Player */}
            <div className="lg:col-span-4 flex flex-col items-center">
              <div className="relative w-[280px] h-[498px] bg-black rounded-3xl overflow-hidden border-2 border-purple-500/40 shadow-2xl flex items-center justify-center group">
                {selectedClip?.output_path && (selectedClip.status === 'rendered' || selectedClip.status === 'published' || selectedClip.status === 'scheduled') ? (
                  <video
                    ref={videoRef}
                    key={selectedClip.id + (selectedClip.output_path || '')}
                    src={api.getClipStreamUrl(selectedClip.id)}
                    poster={selectedClip.thumbnail_path ? (selectedClip.thumbnail_path.startsWith('/') ? selectedClip.thumbnail_path : `/${selectedClip.thumbnail_path}`) : undefined}
                    onTimeUpdate={handleTimeUpdate}
                    playsInline
                    controls
                    preload="metadata"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (!target.src.includes('/stream')) {
                        target.src = `/api/v1/clips/${selectedClip.id}/stream`;
                      }
                    }}
                  />
                ) : selectedClip?.thumbnail_path ? (
                  <div className="relative w-full h-full flex flex-col items-center justify-center bg-black">
                    <img
                      src={selectedClip.thumbnail_path.startsWith('/') ? selectedClip.thumbnail_path : `/${selectedClip.thumbnail_path}`}
                      alt={selectedClip.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20 flex flex-col items-center justify-end p-5 text-center">
                      <div className="p-2.5 rounded-full bg-purple-600/80 text-white shadow-lg mb-2">
                        <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
                      </div>
                      <span className="text-xs font-bold text-white line-clamp-2">{selectedClip.title}</span>
                      <span className="text-[10px] text-purple-300 mt-1 font-mono">
                        {selectedClip.status === 'scheduled' ? 'Scheduled for YouTube Autopilot' : 'Ready to Render'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-6 space-y-3">
                    <VideoIcon className="w-10 h-10 text-purple-400 mx-auto opacity-70" />
                    <div className="text-xs text-gray-300 font-semibold">9:16 Dynamic Framing Preview</div>
                    <div className="text-[11px] text-gray-500 leading-tight">
                      Click &ldquo;Render 9:16 Short&rdquo; to composite face-tracking, animated subtitles, and audio normalization.
                    </div>
                  </div>
                )}

                {/* Virality score floating pill */}
                {selectedClip && (
                  <div className="absolute top-4 left-4 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur border border-[#00FF66]/40 text-[#00FF66] text-xs font-black pointer-events-none">
                    {selectedClip.virality_score} VIRAL
                  </div>
                )}
              </div>

              {selectedClip && (
                <div className="w-[280px] mt-4 flex items-center justify-between text-xs text-gray-400 font-mono">
                  <span>{selectedClip.start_time.toFixed(1)}s</span>
                  <span className="text-purple-300 font-bold">Duration: {selectedClip.duration}s</span>
                  <span>{selectedClip.end_time.toFixed(1)}s</span>
                </div>
              )}
            </div>

            {/* Right Column: Virality Rubric, Transcript Trimmer, and Caption Controls */}
            <div className="lg:col-span-8 space-y-5">
              {selectedClip && (
                <ViralityBreakdown
                  score={selectedClip.virality_score}
                  breakdown={selectedClip.score_breakdown}
                  reason={selectedClip.virality_reason}
                />
              )}

              {video?.transcript && selectedClip && (
                <TranscriptTrimmer
                  transcript={video.transcript}
                  startTime={selectedClip.start_time}
                  endTime={selectedClip.end_time}
                  currentTime={currentTime}
                  onSetStartTime={(t) => handleUpdateBoundaries(t, selectedClip.end_time)}
                  onSetEndTime={(t) => handleUpdateBoundaries(selectedClip.start_time, t)}
                  onSeek={handleSeek}
                />
              )}

              {/* FilmCraft & HyperFrames Controls */}
              <CinematicControls options={renderOptions} onChange={setRenderOptions} />

              {/* Subtitle Styler */}
              <CaptionStyler options={renderOptions} onChange={setRenderOptions} />
            </div>
          </div>

          {/* FilmCraft Multi-Track NLE Timeline */}
          {video && selectedClip && (
            <div className="pt-2">
              <MultiTrackTimeline
                duration={video.duration || 180}
                currentTime={currentTime}
                startTime={selectedClip.start_time}
                endTime={selectedClip.end_time}
                isPlaying={isPlaying}
                transcript={video.transcript || []}
                onSeek={handleSeek}
                onSetStartTime={(t) => handleUpdateBoundaries(t, selectedClip.end_time)}
                onSetEndTime={(t) => handleUpdateBoundaries(selectedClip.start_time, t)}
                onTogglePlay={togglePlay}
              />
            </div>
          )}
        </>
      )}

      {/* Candidate Clips Shelf & AI Virality Decision */}
      <div className="pt-6 border-t border-gray-800 space-y-4">
        {/* AI Virality Decision Banner */}
        {topClip && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 via-[#131627] to-amber-950/20 border border-yellow-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 flex items-center gap-1">
                  👑 AI VIRALITY DECISION WINNER
                </span>
                <span className="text-xs font-mono text-purple-300 font-bold">
                  Score: {topClip.virality_score} / 100
                </span>
              </div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                {topClip.title}
              </h3>
              <p className="text-xs text-gray-400 max-w-2xl">
                {topClip.virality_reason}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedClip(topClip)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-gray-800 hover:bg-gray-700 text-white transition"
              >
                Inspect in Studio
              </button>
              {topClip.status === 'published' ? (
                <a
                  href={topClip.youtube_video_id ? `https://youtube.com/shorts/${topClip.youtube_video_id}` : '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-green-600 hover:bg-green-700 text-white transition flex items-center gap-1.5 shadow-lg shadow-green-600/20"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>View on YouTube Shorts</span>
                </a>
              ) : (
                <button
                  onClick={() => {
                    setSelectedClip(topClip);
                    setIsPublishOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white transition flex items-center gap-1.5 shadow-lg shadow-red-600/30"
                >
                  <Youtube className="w-4 h-4" />
                  <span>1-Click Upload Winner</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Wayin-Style AI Prompt-to-Clip Moment Finder */}
        <div className="p-4 rounded-2xl bg-[#12141e] border border-purple-500/30 shadow-lg space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                Wayin-Style AI Prompt Moment Finder
              </h3>
            </div>
            <span className="text-[10px] text-gray-400 font-mono">NATURAL LANGUAGE SEARCH</span>
          </div>
          <form onSubmit={handleFindMoment} className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="e.g. Find the crazy car crash, streamer screaming reaction, or physics engine shock..."
                value={promptQuery}
                onChange={(e) => setPromptQuery(e.target.value)}
                className="w-full bg-[#161824] border border-gray-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              />
            </div>
            <button
              type="submit"
              disabled={searchingMoment || !promptQuery.trim()}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-white transition flex items-center gap-2 shadow-lg shadow-purple-600/30 disabled:opacity-50"
            >
              {searchingMoment ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Scanning Stream...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Find & Generate Clip</span>
                </>
              )}
            </button>
          </form>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>10-Hour Live Stream Incident Matrix</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-purple-950 border border-purple-800 text-purple-300">
                {displayedClips.length} of {sortedClips.length} Clips
              </span>
            </h2>
            <p className="text-xs text-gray-400">
              Categorized by live stream timestamp, map location &amp; viral incident type
            </p>
          </div>

          {/* 10-Hour Timeline Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap bg-[#12141e] p-1 rounded-xl border border-gray-800">
            <button
              onClick={() => setStreamFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                streamFilter === 'all'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              All Moments ({sortedClips.length})
            </button>
            <button
              onClick={() => setStreamFilter('h1_3')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                streamFilter === 'h1_3'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Hour 1-3 (Reveal & Pursuits)
            </button>
            <button
              onClick={() => setStreamFilter('h4_6')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                streamFilter === 'h4_6'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Hour 4-6 (Crashes & Freakouts)
            </button>
            <button
              onClick={() => setStreamFilter('h7_10')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                streamFilter === 'h7_10'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Hour 7-10 (Heists & Finale)
            </button>
            <button
              onClick={() => setStreamFilter('top')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                streamFilter === 'top'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-emerald-400'
              }`}
            >
              🔥 Top 98+ Virality
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {displayedClips.map((clip) => (
            <ClipCard
              key={clip.id}
              clip={clip}
              isChampion={clip.id === topClip?.id}
              onSelect={(c) => setSelectedClip(c)}
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

      {/* AI Clip Generator Modal (No Prompt Needed) */}
      {video && (
        <ClipGeneratorModal
          video={video}
          isOpen={isGenModalOpen}
          onClose={() => setIsGenModalOpen(false)}
          onClipCreated={(newClip) => {
            setClips((prev) => [newClip, ...prev.filter((c) => c.id !== newClip.id)]);
            setSelectedClip(newClip);
          }}
        />
      )}
    </div>
  );
}
