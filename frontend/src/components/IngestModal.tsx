'use client';

import React, { useState } from 'react';
import { X, Upload, Link2, Radio, AlertTriangle, ShieldCheck, Sparkles, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

interface IngestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (video?: any) => void;
}

export default function IngestModal({ isOpen, onClose, onSuccess }: IngestModalProps) {
  const [activeTab, setActiveTab] = useState<'url' | 'upload'>('url');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [creatorName, setCreatorName] = useState('');
  const [creatorUrl, setCreatorUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!hasPermission) {
      setError('You must explicitly confirm you own this content or have creator permission.');
      return;
    }

    try {
      setLoading(true);
      let createdVideo: any = null;
      if (activeTab === 'url') {
        if (!url.trim()) {
          setError('Please provide a valid YouTube or Twitch URL.');
          setLoading(false);
          return;
        }
        createdVideo = await api.ingestUrl({
          url: url.trim(),
          has_permission: hasPermission,
          creator_name: creatorName.trim() || undefined,
          creator_url: creatorUrl.trim() || undefined,
          is_live: isLive,
        });
      } else {
        if (!file) {
          setError('Please select a video file to upload.');
          setLoading(false);
          return;
        }
        const formData = new FormData();
        formData.append('file', file);
        formData.append('has_permission', String(hasPermission));
        if (creatorName) formData.append('creator_name', creatorName);
        if (creatorUrl) formData.append('creator_url', creatorUrl);

        createdVideo = await api.ingestUpload(formData);
      }

      onSuccess(createdVideo);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit ingest request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#12141e] border border-gray-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 rounded-lg bg-purple-600/20 text-purple-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Ingest New Video or Stream</h2>
            <p className="text-xs text-gray-400">Transcribe, detect high-virality hooks, and auto-crop to 9:16.</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-800 mb-5">
          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`flex-1 pb-3 text-sm font-semibold flex items-center justify-center gap-2 transition ${
              activeTab === 'url'
                ? 'border-b-2 border-purple-500 text-purple-400'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Link2 className="w-4 h-4" />
            Paste Video / Stream URL
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex-1 pb-3 text-sm font-semibold flex items-center justify-center gap-2 transition ${
              activeTab === 'upload'
                ? 'border-b-2 border-purple-500 text-purple-400'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Upload className="w-4 h-4" />
            Upload File (MP4/MOV)
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {activeTab === 'url' ? (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                YouTube or Twitch Link
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=... or Twitch VOD"
                className="w-full bg-[#181b28] border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition"
              />

              <div className="flex items-center gap-2 mt-3 p-2.5 rounded-lg bg-purple-950/20 border border-purple-800/30">
                <input
                  type="checkbox"
                  id="live-toggle"
                  checked={isLive}
                  onChange={(e) => setIsLive(e.target.checked)}
                  className="rounded border-gray-700 text-purple-600 focus:ring-0"
                />
                <label htmlFor="live-toggle" className="text-xs text-purple-300 font-medium flex items-center gap-1.5 cursor-pointer">
                  <Radio className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                  This is an ongoing Live Stream (Chunked Real-Time Processing)
                </label>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                Video File
              </label>
              <div className="border-2 border-dashed border-gray-700 rounded-xl p-6 text-center hover:border-purple-500 transition cursor-pointer">
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                  className="w-full text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700 cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* Third-Party Attribution info */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Creator Name (Attribution)</label>
              <input
                type="text"
                value={creatorName}
                onChange={(e) => setCreatorName(e.target.value)}
                placeholder="e.g. Rockstar Games, xQc"
                className="w-full bg-[#181b28] border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-600"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Creator Source URL</label>
              <input
                type="url"
                value={creatorUrl}
                onChange={(e) => setCreatorUrl(e.target.value)}
                placeholder="https://youtube.com/@channel"
                className="w-full bg-[#181b28] border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-600"
              />
            </div>
          </div>

          {/* Strict Permission Confirmation */}
          <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-200 text-xs space-y-2">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="font-semibold leading-tight">Content Ownership & Rights Compliance</p>
            </div>
            <div className="flex items-start gap-2 pt-1">
              <input
                type="checkbox"
                id="permission-checkbox"
                checked={hasPermission}
                onChange={(e) => setHasPermission(e.target.checked)}
                className="mt-0.5 rounded border-amber-600 text-purple-600 focus:ring-0"
              />
              <label htmlFor="permission-checkbox" className="leading-snug cursor-pointer select-none">
                I explicitly confirm that I own this video or have direct license/permission from the creator to clip and republish.
              </label>
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-950/40 p-2.5 rounded-lg border border-red-800/40">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-400 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !hasPermission}
              className="px-5 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-90 disabled:opacity-50 transition flex items-center gap-2 shadow-lg shadow-purple-600/30"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{loading ? 'Processing...' : 'Start AI Analysis'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

