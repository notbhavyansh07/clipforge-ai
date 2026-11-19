'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { PlusCircle, Film, Radio, Clock, ArrowRight, Sparkles, RefreshCw, Trash2, AlertCircle } from 'lucide-react';
import IngestModal from '@/components/IngestModal';
import { api } from '@/lib/api';
import { Video } from '@/lib/types';

export default function DashboardPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const data = await api.listVideos();
      setVideos(data);
    } catch (e) {
      console.error('Error fetching videos:', e);
    } finally {
      setLoading(false);
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
    if (!confirm('Are you sure you want to delete this video?')) return;
    try {
      await api.deleteVideo(id);
      await fetchVideos();
    } catch (err: any) {
      alert(`Delete error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero section */}
      <div className="relative rounded-3xl p-8 overflow-hidden bg-gradient-to-br from-[#1b1233] via-[#12141e] to-[#0c0d14] border border-purple-900/40 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 border border-purple-500/30 text-purple-300">
            <Sparkles className="w-3.5 h-3.5" />
            AI Virality & Reframing Engine
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white leading-tight">
            Turn Long VODs & Streams into <span className="gradient-text">Viral Shorts</span> in Seconds.
          </h1>
          <p className="text-sm md:text-base text-gray-300 leading-relaxed">
            Ingest any YouTube or Twitch URL. Faster-whisper transcription, 9:16 face-tracked reframing, Hormozi-style animated captions, and instant 1-click YouTube publishing.
          </p>

          <div className="pt-2">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-3 rounded-2xl font-bold text-sm bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 text-white hover:opacity-95 transition shadow-xl shadow-purple-600/30 flex items-center gap-2"
            >
              <PlusCircle className="w-5 h-5" />
              <span>Ingest Video or Live Stream</span>
            </button>
          </div>
        </div>
      </div>

      {/* Video library */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Your Video Projects</h2>
            <p className="text-xs text-gray-400">Processed source streams and candidate generation</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600/30 transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Video</span>
          </button>
        </div>

        {loading && videos.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">Loading projects...</div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {videos.map((vid) => (
              <div
                key={vid.id}
                className="bg-[#12141e] border border-gray-800 hover:border-purple-500/40 rounded-2xl p-5 flex flex-col justify-between transition-all group shadow-md"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-gray-800 text-gray-300 uppercase">
                      {vid.source_type}
                    </span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                          vid.status === 'ready'
                            ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                            : vid.status === 'failed'
                            ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                            : 'bg-purple-500/10 text-purple-400 animate-pulse'
                        }`}
                      >
                        {vid.status}
                      </span>
                      <button
                        onClick={(e) => handleDelete(e, vid.id)}
                        className="text-gray-500 hover:text-red-400 p-1 transition"
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
                        Attribution: <span className="text-gray-300">{vid.creator_name}</span>
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-gray-400 font-mono">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {vid.duration ? `${Math.round(vid.duration)}s` : 'Processing'}
                    </span>
                    {vid.is_live && (
                      <span className="flex items-center gap-1 text-red-400">
                        <Radio className="w-3 h-3 animate-pulse" />
                        Live
                      </span>
                    )}
                  </div>

                  {vid.status === 'failed' && (
                    <div className="p-2.5 rounded-xl bg-red-950/40 border border-red-800/40 text-[11px] text-red-300 space-y-2">
                      <div className="flex items-start gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{vid.error_message || 'Ingestion encountered an error.'}</span>
                      </div>
                      <button
                        onClick={(e) => handleRetry(e, vid.id)}
                        disabled={retryingId === vid.id}
                        className="w-full py-1.5 px-3 rounded-lg bg-red-600/80 hover:bg-red-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition"
                      >
                        <RefreshCw className={`w-3 h-3 ${retryingId === vid.id ? 'animate-spin' : ''}`} />
                        <span>{retryingId === vid.id ? 'Retrying...' : 'Retry Processing'}</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="pt-4 mt-4 border-t border-gray-800/80 flex justify-end">
                  <Link
                    href={`/editor/${vid.id}`}
                    className="w-full py-2 px-4 rounded-xl text-xs font-bold bg-purple-600/90 hover:bg-purple-600 text-white transition flex items-center justify-center gap-2 shadow-md shadow-purple-600/20"
                  >
                    <span>Open Clip Studio</span>
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
        onSuccess={fetchVideos}
      />
    </div>
  );
}
