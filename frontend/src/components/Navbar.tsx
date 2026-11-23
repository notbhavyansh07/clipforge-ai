'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Scissors, Youtube, CheckCircle2, ShieldCheck, X, Loader2, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';
import { INITIAL_CHANNEL } from '@/lib/seedData';

export default function Navbar() {
  const [channelStatus, setChannelStatus] = useState<{ connected: boolean; channel_title?: string }>(INITIAL_CHANNEL);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [channelInput, setChannelInput] = useState('salviashu02');
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const status = await api.getYouTubeStatus();
      setChannelStatus(status);
    } catch (e) {
      // Ignore initial connection errors
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleOAuthConnect = async () => {
    try {
      setConnecting(true);
      setError(null);
      const res = await api.getYouTubeOAuthUrl();
      if (res.configured && res.authorization_url) {
        window.location.href = res.authorization_url;
      } else {
        // Fallback to direct connection if Google Cloud app is not set in .env
        await handleDirectConnect();
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setConnecting(false);
    }
  };

  const handleDirectConnect = async () => {
    try {
      setConnecting(true);
      setError(null);
      const res = await api.connectYouTubeDirect(channelInput || 'salviashu02');
      setChannelStatus({ connected: true, channel_title: res.channel_title });
      setIsModalOpen(false);
    } catch (e: any) {
      setError(e.message || 'Connection failed.');
    } finally {
      setConnecting(false);
    }
  };

  return (
    <header className="border-b border-gray-800 bg-[#0d0f17]/90 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 h-16 flex items-center justify-between gap-2">
        <Link href="/" className="flex items-center gap-2 sm:gap-2.5 group shrink-0">
          <div className="p-1.5 sm:p-2 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-500 text-white shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform">
            <Scissors className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <span className="font-extrabold text-base sm:text-xl tracking-tight text-white flex items-center gap-1.5">
              ClipForge <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30 font-mono">PRO</span>
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Link
            href="/autopilot"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-950/80 to-pink-950/80 hover:from-purple-900 hover:to-pink-900 text-purple-200 border border-purple-500/40 transition shadow-md shadow-purple-900/30"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="hidden sm:inline">⚡ Auto-Pilot (3/Day)</span>
            <span className="sm:hidden">⚡ 3/Day</span>
          </Link>

          {channelStatus.connected ? (
            <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-xl border border-green-500/30 bg-green-500/10 text-green-400 text-[11px] sm:text-xs font-semibold shadow-sm shadow-green-500/10">
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-400 shrink-0" />
              <span className="max-w-[110px] sm:max-w-none truncate">{channelStatus.channel_title}</span>
            </div>
          ) : (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1.5 text-xs font-semibold px-2.5 sm:px-3.5 py-1.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all shadow-md shadow-red-500/10"
            >
              <Youtube className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500" />
              <span className="hidden sm:inline">Connect YouTube Channel</span>
              <span className="sm:hidden">Connect</span>
            </button>
          )}
        </div>
      </div>

      {/* YouTube Connection Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#12141e] border border-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="p-2 rounded-xl bg-red-600/20 text-red-500">
                <Youtube className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Connect YouTube Channel</h3>
                <p className="text-xs text-gray-400">Authorize 1-click publishing for your viral Shorts.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                  YouTube Channel Handle or Email
                </label>
                <input
                  type="text"
                  value={channelInput}
                  onChange={(e) => setChannelInput(e.target.value)}
                  placeholder="@salviashu02"
                  className="w-full bg-[#181b28] border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
                />
              </div>

              {error && (
                <p className="text-xs text-red-400 bg-red-950/40 p-2.5 rounded-lg border border-red-800/40">
                  {error}
                </p>
              )}

              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleDirectConnect}
                  disabled={connecting}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white transition flex items-center justify-center gap-2 shadow-lg shadow-red-600/30"
                >
                  {connecting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Connect Channel ({channelInput ? `@${channelInput.replace('@','')}` : 'Creator Account'})</span>
                </button>

                <p className="text-[11px] text-gray-500 text-center mt-1">
                  Enables 1-click instant publishing & scheduling for YouTube Shorts.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
