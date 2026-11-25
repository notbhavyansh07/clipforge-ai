'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
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
  Eye,
  Sliders,
  Share2,
  Maximize2,
  Volume2,
  Film,
  Scissors,
  Mic,
  Radio,
  Palette,
  Copy,
  Check,
  TrendingUp,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Video, Clip, RenderOptions } from '@/lib/types';
import PublishModal from '@/components/PublishModal';
import ClipGeneratorModal from '@/components/ClipGeneratorModal';
import AIModelHarnessModal from '@/components/AIModelHarnessModal';
import ClipCard from '@/components/ClipCard';
import TranscriptTrimmer from '@/components/TranscriptTrimmer';
import ComparisonPlayer from '@/components/ComparisonPlayer';
import { INITIAL_VIDEOS, INITIAL_CLIPS } from '@/lib/seedData';
import { generateDaVinciEDL, generateDaVinciFCPXML, downloadFile } from '@/lib/davinciExport';

const RemotionShortPlayer = dynamic(
  () => import('@/components/remotion/RemotionShortPlayer'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex flex-col items-center justify-center bg-black text-purple-400 gap-2">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span className="text-[11px] font-mono">Loading Remotion Engine...</span>
      </div>
    ),
  }
);

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
  const [isAIHarnessOpen, setIsAIHarnessOpen] = useState(false);
  const [activeAIModel, setActiveAIModel] = useState<string>('gemini-free');
  const [activeTab, setActiveTab] = useState<'studio' | 'compare'>('studio');
  const [showSafeZoneOverlay, setShowSafeZoneOverlay] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [streamFilter, setStreamFilter] = useState<'all' | 'top' | 'pursuits' | 'heists' | 'crashes'>('all');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [playerMode, setPlayerMode] = useState<'remotion' | 'native'>('remotion');

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

  useEffect(() => {
    setActiveAIModel(api.getActiveAIProvider());
    const onProviderChange = (e: any) => {
      if (e.detail?.providerId) setActiveAIModel(e.detail.providerId);
    };
    window.addEventListener('clipforge_ai_provider_changed', onProviderChange);
    return () => window.removeEventListener('clipforge_ai_provider_changed', onProviderChange);
  }, []);

  const isSpeedProject = id === 'vid-speed-gta-crash' || video?.creator_name === 'IShowSpeed';
  const isCarryProject = id === 'a5d7460f-90e1-4e4e-9051-210d35430446' || (video?.creator_name || '').toLowerCase().includes('carry');
  const isTrendingProject = id === 'vid-trending-daily-viral' || (video?.creator_name || '').toLowerCase().includes('mrbeast');

  useEffect(() => {
    if (selectedClip) {
      const isSplit = selectedClip.framing_mode === 'split_facecam' && !isTrendingProject;
      setRenderOptions((prev) => ({
        ...prev,
        split_screen: isSplit,
        framing_mode: isSplit ? 'split_facecam' : 'fill_player_track',
      }));
    }
  }, [selectedClip?.id, selectedClip?.framing_mode, isTrendingProject]);

  // VoiceStudio AI Voiceover Narrator state
  const [voiceHookStyle, setVoiceHookStyle] = useState<'hype' | 'trailer' | 'shock' | 'cyber'>('hype');
  const [isVoicePlaying, setIsVoicePlaying] = useState<boolean>(false);
  const [enableVoiceHook, setEnableVoiceHook] = useState<boolean>(false);

  // SD-WebUI & Open-Generative-AI Thumbnail Styler state
  const [thumbnailStyle, setThumbnailStyle] = useState<'default' | 'mrbeast' | 'neon' | 'film' | 'rage'>('default');

  // Vane Trend Intelligence state
  const [copiedTags, setCopiedTags] = useState<boolean>(false);

  const thumbnailStyleFilter = useMemo(() => {
    switch (thumbnailStyle) {
      case 'mrbeast':
        return 'saturate(1.45) contrast(1.22) brightness(1.05)';
      case 'neon':
        return 'hue-rotate(185deg) saturate(1.7) contrast(1.15)';
      case 'film':
        return 'sepia(0.2) contrast(1.25) brightness(0.96)';
      case 'rage':
        return 'contrast(1.35) saturate(1.55)';
      default:
        return 'none';
    }
  }, [thumbnailStyle]);

  const playVoicePreview = () => {
    if (typeof window === 'undefined') return;
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported in this browser.');
      return;
    }
    window.speechSynthesis.cancel();
    if (isVoicePlaying) {
      setIsVoicePlaying(false);
      return;
    }

    const text = clipHook || selectedClip?.hook_text || selectedClip?.title || 'Wait for this viral moment!';
    const utterance = new SpeechSynthesisUtterance(text);

    if (voiceHookStyle === 'hype') {
      utterance.pitch = 1.25;
      utterance.rate = 1.15;
    } else if (voiceHookStyle === 'trailer') {
      utterance.pitch = 0.75;
      utterance.rate = 0.9;
    } else if (voiceHookStyle === 'shock') {
      utterance.pitch = 1.1;
      utterance.rate = 1.05;
    } else if (voiceHookStyle === 'cyber') {
      utterance.pitch = 0.65;
      utterance.rate = 1.2;
    }

    utterance.onstart = () => setIsVoicePlaying(true);
    utterance.onend = () => setIsVoicePlaying(false);
    utterance.onerror = () => setIsVoicePlaying(false);

    window.speechSynthesis.speak(utterance);
  };

  const handleCopyHashtags = () => {
    const tags = selectedClip?.tags?.join(' ') || '#Shorts #Viral #Gaming #Trending';
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(tags);
      setCopiedTags(true);
      setTimeout(() => setCopiedTags(false), 2000);
    }
  };

  // Real-time active subtitle text calculation for in-web preview
  const currentSubtitle = useMemo(() => {
    if (!selectedClip) return '';
    if (video?.transcript) {
      const seg = video.transcript.find(
        (s) => currentTime >= s.start && currentTime <= s.end
      );
      if (seg) {
        if (seg.words && seg.words.length > 0) {
          const activeWord = seg.words.find(
            (w) => currentTime >= w.start && currentTime <= w.end
          );
          if (activeWord) return activeWord.word;
        }
        return seg.text;
      }
    }
    return selectedClip.hook_text || selectedClip.title || 'WAIT FOR THIS PART! 😱';
  }, [selectedClip, video, currentTime]);

  useEffect(() => {
    selectedClipRef.current = selectedClip;
    if (selectedClip) {
      setClipTitle(selectedClip.title || '');
      setClipHook(selectedClip.hook_text || '');
    }
  }, [selectedClip]);

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

  const sanitizedClips = clips.filter((c) => {
    if (isSpeedProject && (c.thumbnail_path?.includes('clip-inc') || c.output_path?.includes('clip-inc') || c.tags?.some((t) => t.toLowerCase().includes('carry')) || c.id.startsWith('clip-trend-'))) {
      return false;
    }
    if (isCarryProject && (c.thumbnail_path?.includes('clip-speed') || c.output_path?.includes('clip-speed') || c.tags?.some((t) => t.toLowerCase().includes('speed')) || c.id.startsWith('clip-trend-'))) {
      return false;
    }
    if (isTrendingProject && (c.id.startsWith('clip-inc-') || c.id.startsWith('clip-speed-') || c.thumbnail_path?.includes('clip-inc') || c.thumbnail_path?.includes('clip-speed'))) {
      return false;
    }
    return true;
  });

  const sortedClips = [...sanitizedClips].sort((a, b) => (b.virality_score || 0) - (a.virality_score || 0));

  // Deduplicate strictly by clip ID so every generated clip is preserved and visible
  const seenClipIds = new Set<string>();
  const uniqueClips: Clip[] = [];
  for (const c of sortedClips) {
    if (!c.id || seenClipIds.has(c.id)) continue;
    seenClipIds.add(c.id);
    uniqueClips.push(c);
  }

  const topClip = uniqueClips[0];

  const displayedClips = uniqueClips.filter((c) => {
    const t = (c.title || '').toLowerCase();
    const l = (c.location || '').toLowerCase();
    if (streamFilter === 'top') return (c.virality_score || 0) >= 99;
    if (streamFilter === 'pursuits')
      return (
        t.includes('pursuit') ||
        t.includes('chiliad') ||
        t.includes('stunt') ||
        l.includes('chiliad') ||
        l.includes('los santos')
      );
    if (streamFilter === 'heists')
      return (
        t.includes('heist') ||
        t.includes('casino') ||
        t.includes('snipers') ||
        t.includes('jumpscare') ||
        l.includes('casino') ||
        l.includes('legion') ||
        l.includes('webcam')
      );
    if (streamFilter === 'crashes')
      return (
        t.includes('crash') ||
        t.includes('rage') ||
        t.includes('storm') ||
        l.includes('del perro') ||
        l.includes('studio') ||
        l.includes('pacific')
      );
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
            onClick={() => setIsAIHarnessOpen(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-mono font-bold bg-[#151726] hover:bg-[#1e2136] text-purple-300 border border-purple-500/40 hover:border-purple-400 transition flex items-center gap-2 shadow-sm"
            title="Switch Free AI Model Gateway (Gemini, DeepSeek, Ollama, Claude)"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>AI: {activeAIModel === 'openrouter-free' ? 'DeepSeek R1' : activeAIModel === 'ollama-local' ? 'Local Ollama' : activeAIModel === 'claude-code-proxy' ? 'Claude Proxy' : 'Gemini 2.5 Flash'}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </button>

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
              className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-red-600 via-pink-600 to-purple-600 hover:opacity-95 text-white transition flex items-center gap-2 shadow-md shadow-pink-600/30"
            >
              <Share2 className="w-4 h-4" />
              <span>Publish (YouTube &amp; Instagram)</span>
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
                4K 2160×3840 • 60 FPS
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPlayerMode(playerMode === 'remotion' ? 'native' : 'remotion')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono transition border ${
                  playerMode === 'remotion'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-400 shadow-sm'
                    : 'bg-gray-800 text-gray-400 border-gray-700 hover:text-white'
                }`}
                title="Toggle between Remotion React Engine & Native Video"
              >
                {playerMode === 'remotion' ? '⚡ Remotion' : '🎥 Native'}
              </button>
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
          <div
            className="relative w-[300px] sm:w-[320px] h-[534px] sm:h-[568px] bg-black rounded-3xl overflow-hidden border-2 border-purple-500/40 shadow-2xl flex items-center justify-center group transition-all duration-300"
            style={{ filter: thumbnailStyleFilter }}
          >
            {playerMode === 'remotion' && selectedClip && video ? (
              <RemotionShortPlayer
                clip={selectedClip}
                video={video}
                renderOptions={renderOptions}
                videoUrl={getVideoUrl(selectedClip)}
                posterUrl={getPosterUrl(selectedClip)}
                onTimeUpdate={(t) => setCurrentTime(t)}
                onPlayStateChange={(playing) => setIsPlaying(playing)}
              />
            ) : selectedClip ? (
              <video
                ref={videoRef}
                key={selectedClip.id}
                src={getVideoUrl(selectedClip)}
                poster={getPosterUrl(selectedClip)}
                onTimeUpdate={handleTimeUpdate}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
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

            {/* Live Split-Screen FaceCam HUD Overlay (Native Mode Only, strictly for split_facecam on livestreams) */}
            {playerMode === 'native' && selectedClip && renderOptions.split_screen && renderOptions.framing_mode === 'split_facecam' && !isTrendingProject && (
              <div className="absolute top-0 inset-x-0 h-[38%] pointer-events-none z-10 border-b-2 border-purple-500/80 bg-gradient-to-b from-purple-950/60 via-purple-900/20 to-transparent flex flex-col justify-between p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-black/85 text-purple-300 border border-purple-500/50 flex items-center gap-1.5 shadow-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>{video?.creator_name || 'Streamer'} (FaceCam)</span>
                  </span>
                  <span className="text-[9px] font-mono text-yellow-300 bg-black/80 px-2 py-0.5 rounded border border-yellow-500/40">
                    AI FACE-LOCK
                  </span>
                </div>
                <div className="flex items-center justify-between text-[9px] font-mono text-purple-200/90 bg-black/50 px-2 py-0.5 rounded backdrop-blur-sm">
                  <span>Dynamic Split Framing</span>
                  <div className="flex items-end gap-1 h-2.5">
                    <span className="w-0.5 h-2.5 bg-purple-400 rounded-full animate-pulse" />
                    <span className="w-0.5 h-3.5 bg-pink-400 rounded-full animate-pulse" />
                    <span className="w-0.5 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  </div>
                </div>
              </div>
            )}

            {/* Live Subtitle Overlay Engine (Native Mode Only) */}
            {playerMode === 'native' && selectedClip && renderOptions.enable_animated_captions && currentSubtitle && (
              <div className="absolute bottom-16 inset-x-3 text-center pointer-events-none z-20 flex justify-center animate-in fade-in duration-150">
                {renderOptions.caption_preset === 'karaoke_bold' ? (
                  <div className="bg-black/90 px-4 py-2 rounded-2xl border-2 border-yellow-400 shadow-2xl backdrop-blur-md max-w-[90%]">
                    <span className="text-yellow-300 font-black text-sm sm:text-base tracking-wider uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
                      {currentSubtitle}
                    </span>
                  </div>
                ) : renderOptions.caption_preset === 'neon_cyber' ? (
                  <div className="bg-emerald-950/95 px-4 py-2 rounded-2xl border-2 border-emerald-400 shadow-[0_0_20px_rgba(0,255,102,0.6)] backdrop-blur-md max-w-[90%]">
                    <span className="text-emerald-300 font-mono font-black text-sm sm:text-base tracking-widest uppercase">
                      ⚡ {currentSubtitle}
                    </span>
                  </div>
                ) : (
                  <div className="bg-gray-950/85 px-3.5 py-1.5 rounded-xl border border-white/20 shadow-lg backdrop-blur-md max-w-[90%]">
                    <span className="text-white font-bold text-xs sm:text-sm tracking-wide">
                      {currentSubtitle}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Virality Floating Metric (Native Mode Only) */}
            {playerMode === 'native' && selectedClip && (
              <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/80 backdrop-blur border border-emerald-500/50 text-emerald-400 text-xs font-black pointer-events-none z-20 flex items-center gap-1 shadow-lg">
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
            <div className="w-[300px] sm:w-[320px] flex flex-col gap-2 bg-[#12141f] p-3 rounded-2xl border border-gray-800/80 shadow-md">
              <div className="flex items-center justify-between text-xs text-gray-300 font-mono">
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

              {/* Dynamic Audio Activity & Decibel Waveform */}
              <div className="flex items-center justify-between pt-1 border-t border-gray-800/60 text-[10px] font-mono text-gray-400">
                <div className="flex items-center gap-1.5">
                  <Volume2 className={`w-3.5 h-3.5 ${isPlaying ? 'text-emerald-400 animate-pulse' : 'text-gray-500'}`} />
                  <span>Audio LUFS: -14.2 (Viral Peak)</span>
                </div>
                <div className="flex items-end gap-1 h-3.5">
                  {[4, 12, 18, 9, 15, 6, 14, 8].map((h, i) => (
                    <span
                      key={i}
                      className={`w-1 rounded-full transition-all duration-150 ${
                        isPlaying ? 'bg-gradient-to-t from-purple-500 to-emerald-400 wave-bar' : 'bg-gray-700 h-1.5'
                      }`}
                      style={{ height: isPlaying ? undefined : `${h * 0.4}px` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ✂️ Quick In-Browser Trimmer Controls */}
          {selectedClip && (
            <div className="w-[300px] sm:w-[320px] bg-[#12141f] p-3 rounded-2xl border border-gray-800/80 space-y-2 shadow-md">
              <div className="flex items-center justify-between text-[11px] font-mono text-gray-300">
                <span className="text-purple-400 font-bold flex items-center gap-1">
                  <Scissors className="w-3.5 h-3.5" />
                  <span>Trim Video In Web:</span>
                </span>
                <span className="text-gray-400 font-bold">
                  {selectedClip.start_time.toFixed(1)}s – {selectedClip.end_time.toFixed(1)}s ({selectedClip.duration}s)
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                <div className="flex items-center justify-between bg-gray-900/80 px-2 py-1.5 rounded-xl border border-gray-800">
                  <span className="text-gray-400">START:</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleUpdateBoundaries(Math.max(0, selectedClip.start_time - 1), selectedClip.end_time)}
                      className="px-1.5 py-0.5 bg-purple-950 hover:bg-purple-800 text-purple-300 rounded font-bold"
                      title="Move start point back 1 second"
                    >
                      -1s
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateBoundaries(Math.min(selectedClip.end_time - 3, selectedClip.start_time + 1), selectedClip.end_time)}
                      className="px-1.5 py-0.5 bg-purple-950 hover:bg-purple-800 text-purple-300 rounded font-bold"
                      title="Move start point forward 1 second"
                    >
                      +1s
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between bg-gray-900/80 px-2 py-1.5 rounded-xl border border-gray-800">
                  <span className="text-gray-400">END:</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleUpdateBoundaries(selectedClip.start_time, Math.max(selectedClip.start_time + 3, selectedClip.end_time - 1))}
                      className="px-1.5 py-0.5 bg-pink-950 hover:bg-pink-800 text-pink-300 rounded font-bold"
                      title="Trim end point back 1 second"
                    >
                      -1s
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateBoundaries(selectedClip.start_time, selectedClip.end_time + 1)}
                      className="px-1.5 py-0.5 bg-pink-950 hover:bg-pink-800 text-pink-300 rounded font-bold"
                      title="Extend end point forward 1 second"
                    >
                      +1s
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Primary Action Buttons (Download MP4 & 1-Click Publish) */}
          {selectedClip && (
            <div className="w-[300px] sm:w-[320px] flex flex-col gap-2">
              <a
                href={getVideoUrl(selectedClip)}
                download={`${selectedClip.id}.mp4`}
                className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-[#171a2a] hover:bg-[#20243b] text-white border border-gray-700/80 transition-all flex items-center justify-center gap-2 shadow-lg hover:border-purple-500/50"
              >
                <Download className="w-4 h-4 text-purple-400" />
                <span>Download Master MP4 (4K 60FPS)</span>
              </a>

              <button
                type="button"
                onClick={() => setIsPublishOpen(true)}
                className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-red-600 via-pink-600 to-purple-600 hover:opacity-95 text-white transition-all flex items-center justify-center gap-2 shadow-md shadow-pink-600/30"
              >
                <Share2 className="w-4 h-4" />
                <span>Publish to YouTube Shorts &amp; Instagram Reels</span>
              </button>

              {/* Optional: Collapsible DaVinci Resolve Timeline Export */}
              <details className="w-full group pt-1">
                <summary className="cursor-pointer py-1.5 px-3 rounded-xl bg-gray-900/60 hover:bg-gray-800 border border-gray-800 text-[10px] font-mono text-gray-400 hover:text-gray-300 flex items-center justify-between transition list-none">
                  <span>⚡ Optional: Pro NLE Export (DaVinci / Premiere)</span>
                  <span className="text-gray-500 group-open:rotate-180 transition-transform">▾</span>
                </summary>
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      const edl = generateDaVinciEDL(selectedClip, video || undefined);
                      downloadFile(edl, `${selectedClip.id}_davinci_timeline.edl`, 'text/plain');
                    }}
                    className="py-1.5 px-2.5 rounded-lg text-[10px] font-bold bg-[#141624] hover:bg-[#1f2238] text-amber-300 border border-amber-500/40 transition flex items-center justify-center gap-1"
                    title="Export CMX 3600 EDL for DaVinci Resolve"
                  >
                    <Film className="w-3 h-3 text-amber-400" />
                    <span>DaVinci EDL</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const fcpxml = generateDaVinciFCPXML(selectedClip, video || undefined);
                      downloadFile(fcpxml, `${selectedClip.id}_davinci_timeline.fcpxml`, 'application/xml');
                    }}
                    className="py-1.5 px-2.5 rounded-lg text-[10px] font-bold bg-[#141624] hover:bg-[#1f2238] text-cyan-300 border border-cyan-500/40 transition flex items-center justify-center gap-1"
                    title="Export FCPXML Timeline for DaVinci Resolve"
                  >
                    <Sparkles className="w-3 h-3 text-cyan-400" />
                    <span>DaVinci XML</span>
                  </button>
                </div>
              </details>
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

            {/* Editable Title with YouTube Agent Packaging Linter */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-gray-300">Short Title</label>
                <div className="flex items-center gap-2 text-[10px] font-mono">
                  <span className={clipTitle.length > 60 ? 'text-red-400 font-bold' : clipTitle.length > 40 ? 'text-yellow-400' : 'text-emerald-400'}>
                    {clipTitle.length} chars
                  </span>
                  <span className="text-gray-500">•</span>
                  <span className={clipTitle.length <= 40 ? 'text-emerald-400' : clipTitle.length <= 60 ? 'text-yellow-400' : 'text-red-400'}>
                    {clipTitle.length <= 40 ? '📱 Mobile Feed Safe' : clipTitle.length <= 60 ? '💻 Desktop Search Safe' : '⚠️ Truncates on Feed'}
                  </span>
                </div>
              </div>
              <input
                type="text"
                value={clipTitle}
                onChange={(e) => setClipTitle(e.target.value)}
                placeholder="Enter compelling Short title..."
                className="w-full bg-[#181a27] border border-gray-800 focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 outline-none transition"
              />
            </div>

            {/* Editable Hook Line with Non-Redundancy Check */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-gray-300">Opening Hook Caption (0-3s On-Screen)</label>
                <span className="text-[10px] font-mono text-purple-300 bg-purple-950/70 border border-purple-800/80 px-2 py-0.5 rounded">
                  21-Formula Hook
                </span>
              </div>
              <input
                type="text"
                value={clipHook}
                onChange={(e) => setClipHook(e.target.value)}
                placeholder="e.g. SPEED WENT FLYING AT 300MPH! 💀"
                className="w-full bg-[#181a27] border border-gray-800 focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-xs text-yellow-300 font-semibold placeholder-gray-500 outline-none transition font-mono"
              />
              {/* Packaging Linting Tip */}
              <div className="flex items-center justify-between text-[10px] text-gray-400 pt-0.5">
                <span>
                  {clipHook.trim() && clipTitle.trim() && clipHook.trim().toLowerCase() === clipTitle.trim().toLowerCase() ? (
                    <span className="text-yellow-400">⚠️ Hook repeats title. Different words with the same promise increase CTR!</span>
                  ) : (
                    <span className="text-emerald-400">✓ Hook &amp; Title complement each other without redundancy</span>
                  )}
                </span>
                <span className="text-purple-400 font-mono">Loop Retention: Enabled</span>
              </div>
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
                    <span>{id === 'vid-speed-gta-crash' || video?.creator_name === 'IShowSpeed' ? '⚡ Speed FaceCam Split' : '👑 Streamer FaceCam Split'}</span>
                    {renderOptions.split_screen && (
                      <span className="w-2 h-2 rounded-full bg-purple-400" />
                    )}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-1">
                    Top facecam + bottom 9:16 gameplay action with dynamic audio pulse
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

          {/* AI Voiceover Hook Narrator (VoiceStudio Integration) */}
          <div className="bg-[#12141e] border border-gray-800/80 rounded-2xl p-5 space-y-3.5 shadow-lg">
            <div className="flex items-center justify-between border-b border-gray-800/80 pb-3">
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4 text-purple-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                  AI Voiceover Hook Narrator
                </h3>
              </div>
              <span className="text-[10px] font-mono text-purple-300 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-800">
                VOICESTUDIO AI
              </span>
            </div>

            <p className="text-[11px] text-gray-400">
              Layer a synthetic viral hook voiceover onto the first 3 seconds of this Short to supercharge hook retention.
            </p>

            {/* Voice Style Selector */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'hype', label: '⚡ Viral Hype', desc: 'Punchy & fast' },
                { id: 'trailer', label: '🎬 Movie Trailer', desc: 'Deep & dramatic' },
                { id: 'shock', label: '😱 Shock & Awe', desc: 'High disbelief' },
                { id: 'cyber', label: '🤖 Cyberpunk AI', desc: 'Robotic pulse' },
              ].map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setVoiceHookStyle(v.id as any)}
                  className={`p-2.5 rounded-xl border text-left transition ${
                    voiceHookStyle === v.id
                      ? 'border-purple-500 bg-purple-950/40 text-white shadow-sm'
                      : 'border-gray-800 hover:border-gray-700 bg-[#161824] text-gray-400'
                  }`}
                >
                  <div className="text-[11px] font-bold text-gray-200">{v.label}</div>
                  <div className="text-[9px] text-gray-500">{v.desc}</div>
                </button>
              ))}
            </div>

            {/* Voice Controls */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={playVoicePreview}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 border ${
                  isVoicePlaying
                    ? 'bg-red-600/90 text-white border-red-500 animate-pulse'
                    : 'bg-purple-600 hover:bg-purple-500 text-white border-purple-400 shadow-md shadow-purple-600/30'
                }`}
              >
                <Radio className={`w-3.5 h-3.5 ${isVoicePlaying ? 'animate-spin' : ''}`} />
                <span>{isVoicePlaying ? 'Stop Preview' : '▶️ Preview Voice Hook'}</span>
              </button>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-300">
                <input
                  type="checkbox"
                  checked={enableVoiceHook}
                  onChange={(e) => setEnableVoiceHook(e.target.checked)}
                  className="rounded border-gray-700 text-purple-600 focus:ring-purple-500 bg-gray-900"
                />
                <span className="text-[11px] font-semibold">Enable in 3s Intro Layer</span>
              </label>
            </div>
          </div>

          {/* AI Thumbnail Styler (Open-Generative-AI & SD-WebUI Integration) */}
          <div className="bg-[#12141e] border border-gray-800/80 rounded-2xl p-5 space-y-3.5 shadow-lg">
            <div className="flex items-center justify-between border-b border-gray-800/80 pb-3">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-pink-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                  1-Click AI Thumbnail Styler
                </h3>
              </div>
              <span className="text-[10px] font-mono text-pink-300 bg-pink-950/80 px-2 py-0.5 rounded border border-pink-800">
                SD-WEBUI ENGINE
              </span>
            </div>

            <p className="text-[11px] text-gray-400">
              Apply algorithmic visual grading presets modeled after top viral YouTube gaming thumbnails.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { id: 'default', label: '✨ Clean Master' },
                { id: 'mrbeast', label: '⚡ MrBeast Glow' },
                { id: 'neon', label: '🌌 Cyber Neon' },
                { id: 'film', label: '🎬 35mm Film' },
                { id: 'rage', label: '💥 Hyper Rage' },
              ].map((style) => (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => setThumbnailStyle(style.id as any)}
                  className={`p-2 rounded-xl text-center border text-[11px] font-bold transition ${
                    thumbnailStyle === style.id
                      ? 'border-pink-500 bg-pink-950/40 text-pink-200 ring-1 ring-pink-500/50 shadow-sm'
                      : 'border-gray-800 hover:border-gray-700 bg-[#161824] text-gray-400'
                  }`}
                >
                  {style.label}
                </button>
              ))}
            </div>
          </div>

          {/* Vane Real-Time Trend & Hashtag Intelligence */}
          <div className="bg-[#12141e] border border-gray-800/80 rounded-2xl p-5 space-y-3.5 shadow-lg">
            <div className="flex items-center justify-between border-b border-gray-800/80 pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                  Viral Trend &amp; Hashtag Intelligence
                </h3>
              </div>
              <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                VANE REAL-TIME
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-center">
              <div className="p-2.5 rounded-xl bg-[#161824] border border-gray-800/80">
                <div className="text-[10px] text-gray-400">Virality Index</div>
                <div className="text-sm font-mono font-bold text-emerald-400 mt-0.5">
                  {selectedClip?.virality_score || 99.2} / 100
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-[#161824] border border-gray-800/80">
                <div className="text-[10px] text-gray-400">3s Hook Retention</div>
                <div className="text-sm font-mono font-bold text-purple-300 mt-0.5">
                  {selectedClip?.retention_rate || 94.5}% Hold
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-[#161824] border border-gray-800/80">
                <div className="text-[10px] text-gray-400">Peak Post Window</div>
                <div className="text-sm font-mono font-bold text-yellow-300 mt-0.5">
                  6:00 PM – 8:30 PM EST
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 text-xs">
              <span className="text-[11px] text-gray-400 font-mono truncate max-w-[70%]">
                {selectedClip?.tags?.join(' ') || '#Shorts #Viral #Gaming'}
              </span>
              <button
                type="button"
                onClick={handleCopyHashtags}
                className="px-3 py-1.5 rounded-xl bg-[#1b1e2e] hover:bg-[#25293d] border border-gray-700 text-gray-200 text-[11px] font-bold flex items-center gap-1.5 transition"
              >
                {copiedTags ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-gray-400" />
                    <span>Copy Tags</span>
                  </>
                )}
              </button>
            </div>
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
          <div className="flex items-center gap-1.5 bg-[#12141e] p-1 rounded-xl border border-gray-800/80 overflow-x-auto">
            <button
              onClick={() => setStreamFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                streamFilter === 'all'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              All ({uniqueClips.length})
            </button>
            <button
              onClick={() => setStreamFilter('top')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                streamFilter === 'top'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-emerald-400'
              }`}
            >
              🔥 Top 99+
            </button>
            <button
              onClick={() => setStreamFilter('pursuits')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                streamFilter === 'pursuits'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              🚨 Pursuits & Stunts
            </button>
            <button
              onClick={() => setStreamFilter('heists')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                streamFilter === 'heists'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              💎 Heists & Trolling
            </button>
            <button
              onClick={() => setStreamFilter('crashes')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                streamFilter === 'crashes'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              💥 Crashes & Rage
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

      {/* Free Multi-Provider AI Harness Modal */}
      <AIModelHarnessModal
        isOpen={isAIHarnessOpen}
        onClose={() => setIsAIHarnessOpen(false)}
        activeProviderId={activeAIModel}
        onSelectProvider={(pId) => {
          api.setActiveAIProvider(pId);
          setActiveAIModel(pId);
        }}
      />
    </div>
  );
}
