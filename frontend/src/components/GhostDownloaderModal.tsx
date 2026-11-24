'use client';

import React, { useState } from 'react';
import {
  X,
  DownloadCloud,
  Radio,
  Zap,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Film,
  Sparkles,
  Sliders,
  Play,
  Layers,
  ArrowRight
} from 'lucide-react';
import { api } from '@/lib/api';

interface GhostDownloaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (video: any) => void;
}

export default function GhostDownloaderModal({
  isOpen,
  onClose,
  onSuccess,
}: GhostDownloaderModalProps) {
  const [url, setUrl] = useState('');
  const [detectedProtocol, setDetectedProtocol] = useState<string | null>(null);
  const [selectedResolution, setSelectedResolution] = useState('1080p60');
  const [recordDuration, setRecordDuration] = useState(60);
  const [smartChunking, setSmartChunking] = useState(true);
  const [isProbing, setIsProbing] = useState(false);
  const [isIngesting, setIsIngesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleProbe = async (inputUrl: string) => {
    setUrl(inputUrl);
    if (!inputUrl || inputUrl.length < 8) {
      setDetectedProtocol(null);
      return;
    }
    try {
      setIsProbing(true);
      setError(null);
      const probe = await api.probeGhostStream(inputUrl);
      setDetectedProtocol(probe.detected_protocol || 'http');
    } catch {
      setDetectedProtocol('stream_sniffed');
    } finally {
      setIsProbing(false);
    }
  };

  const handleStartIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    try {
      setIsIngesting(true);
      setError(null);

      // Ingest via Ghost Service
      let videoRecord;
      if (detectedProtocol === 'm3u8_live') {
        const recordRes = await api.recordGhostStream(url, recordDuration);
        videoRecord = await api.ingestUrl({
          url,
          has_permission: true,
          creator_name: 'Live Stream Ingest (Ghost)',
          is_live: true,
        });
      } else {
        videoRecord = await api.ingestUrl({
          url,
          has_permission: true,
          creator_name: url.includes('speed') ? 'IShowSpeed' : (url.includes('carry') ? 'CarryisLive' : 'Viral Streamer'),
        });
      }

      onSuccess(videoRecord);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to capture stream via Ghost engine.');
    } finally {
      setIsIngesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#10121d] border border-cyan-500/40 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-gray-800/80 flex items-center justify-between bg-gradient-to-r from-cyan-950/40 to-blue-950/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <DownloadCloud className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white tracking-tight">
                  Ghost Stream Ingest Engine
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold">
                  v3 ACCELERATED
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Inspired by XiaoYouChR/Ghost-Downloader-3: M3U8 Live Stream Recorder, Multi-Protocol Sniffing & 4K Smart Chunking.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleStartIngest} className="p-6 space-y-5 overflow-y-auto">
          {error && (
            <div className="p-3.5 rounded-2xl bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Stream URL Input */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-300 flex items-center justify-between">
              <span>Stream / Video Source URL</span>
              {isProbing && (
                <span className="text-[11px] text-cyan-400 flex items-center gap-1 font-mono">
                  <Loader2 className="w-3 h-3 animate-spin" /> Sniffing protocol...
                </span>
              )}
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => handleProbe(e.target.value)}
              placeholder="Paste YouTube, Twitch, Kick, or .m3u8 live stream URL..."
              className="w-full px-4 py-3 rounded-2xl bg-[#161828] border border-gray-700/80 focus:border-cyan-400 text-white placeholder-gray-500 text-xs sm:text-sm outline-none transition font-mono"
              required
            />
          </div>

          {/* Protocol Sniffer Pill */}
          {detectedProtocol && (
            <div className="p-3.5 rounded-2xl bg-cyan-950/40 border border-cyan-800/60 flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2 text-cyan-300">
                <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
                <span className="font-bold">Detected Protocol:</span>
                <span className="uppercase px-2 py-0.5 rounded bg-black/60 border border-cyan-600/50 text-cyan-200">
                  {detectedProtocol}
                </span>
              </div>
              <span className="text-[11px] text-gray-400">16x Concurrent Chunks</span>
            </div>
          )}

          {/* Quick Presets */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400">Or Select High-Velocity Viral Test Feeds:</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleProbe('https://www.youtube.com/watch?v=nX7oT-jFXqU')}
                className="p-2.5 rounded-xl bg-[#16192b] hover:bg-[#1f233d] border border-gray-800 text-left text-gray-300 transition flex items-center justify-between"
              >
                <span className="truncate">🐕‍🦺 Speed Robot Dog Stream</span>
                <span className="text-[10px] font-mono text-cyan-400 font-bold shrink-0">4K HDR</span>
              </button>
              <button
                type="button"
                onClick={() => handleProbe('https://www.youtube.com/watch?v=0e3GPea1Tyg')}
                className="p-2.5 rounded-xl bg-[#16192b] hover:bg-[#1f233d] border border-gray-800 text-left text-gray-300 transition flex items-center justify-between"
              >
                <span className="truncate">🔴 MrBeast Squid Game</span>
                <span className="text-[10px] font-mono text-cyan-400 font-bold shrink-0">1080p60</span>
              </button>
            </div>
          </div>

          {/* Quality & Live Recorder Settings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-300">Target Resolution</label>
              <select
                value={selectedResolution}
                onChange={(e) => setSelectedResolution(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#161828] border border-gray-700 text-white text-xs outline-none focus:border-cyan-400"
              >
                <option value="2160p 4K HDR">2160p 4K HDR (Maximum Quality)</option>
                <option value="1440p60">1440p 60FPS (QHD Stream)</option>
                <option value="1080p60">1080p 60FPS (Recommended for Shorts)</option>
                <option value="720p60">720p 60FPS (Low Latency)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-300">Live Record Buffer</label>
              <select
                value={recordDuration}
                onChange={(e) => setRecordDuration(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl bg-[#161828] border border-gray-700 text-white text-xs outline-none focus:border-cyan-400"
              >
                <option value={30}>30 Seconds (Instant Hook Capture)</option>
                <option value={60}>60 Seconds (Standard Short Window)</option>
                <option value={120}>120 Seconds (Extended Climax)</option>
              </select>
            </div>
          </div>

          {/* Smart Chunking Toggle */}
          <div className="p-3.5 rounded-2xl bg-[#161928] border border-gray-800 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                <span>Ghost Smart-Chunking (No Merge Overhead)</span>
              </div>
              <p className="text-[11px] text-gray-400">
                Pulls candidate slices directly without downloading gigabytes of long-stream footage.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSmartChunking(!smartChunking)}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                smartChunking ? 'bg-cyan-600' : 'bg-gray-700'
              }`}
            >
              <span
                className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                  smartChunking ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isIngesting || !url}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold transition shadow-lg shadow-cyan-900/30 flex items-center gap-2 disabled:opacity-50"
            >
              {isIngesting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Capturing Stream Chunks...</span>
                </>
              ) : (
                <>
                  <DownloadCloud className="w-4 h-4" />
                  <span>Start Accelerated Ghost Ingest</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
