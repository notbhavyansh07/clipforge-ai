'use client';

import React, { useState } from 'react';
import {
  X,
  Youtube,
  Calendar,
  Tag,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  Sparkles,
  Download,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';
import { Clip, Video } from '@/lib/types';
import { api } from '@/lib/api';

interface PublishModalProps {
  clip: Clip;
  video: Video;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PublishModal({ clip, video, isOpen, onClose, onSuccess }: PublishModalProps) {
  const [title, setTitle] = useState(clip.title || '');
  const [description, setDescription] = useState(
    clip.description ||
      `Watch this insane GTA 6 moment! 🔥\n\nCredit: ${video.creator_name || 'Streamer'}\n#Shorts #GTA6 #Gaming #Viral`
  );
  const [tags, setTags] = useState<string>(clip.tags?.join(', ') || '#Shorts, #Viral, #GTA6, #CarryMinati');
  const [scheduledAt, setScheduledAt] = useState('');
  const [includeAttribution, setIncludeAttribution] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedTitle, setCopiedTitle] = useState(false);
  const [copiedDesc, setCopiedDesc] = useState(false);
  const [publishedData, setPublishedData] = useState<any | null>(null);

  if (!isOpen) return null;

  const downloadUrl = api.getClipStreamUrl(clip.id);

  const handleSetPeakTime = (hours: number, minutes: number) => {
    const d = new Date();
    d.setHours(hours, minutes, 0, 0);
    if (d.getTime() <= Date.now()) {
      d.setDate(d.getDate() + 1);
    }
    const pad = (n: number) => String(n).padStart(2, '0');
    const formatted = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    setScheduledAt(formatted);
  };

  const handleCopyTitle = () => {
    navigator.clipboard.writeText(title);
    setCopiedTitle(true);
    setTimeout(() => setCopiedTitle(false), 2000);
  };

  const handleCopyDesc = () => {
    const fullText = `${description}\n\n${tags}`;
    navigator.clipboard.writeText(fullText);
    setCopiedDesc(true);
    setTimeout(() => setCopiedDesc(false), 2000);
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      setLoading(true);
      const res = await api.publishToYouTube({
        clip_id: clip.id,
        title: title.trim(),
        description: description.trim(),
        tags: tags.split(',').map((t) => t.trim()),
        scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
        include_attribution: includeAttribution,
      });
      setPublishedData(res);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to upload to YouTube.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#12141e] border border-gray-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-5">
          <div className="p-2 rounded-xl bg-red-600/20 text-red-500">
            <Youtube className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Publish & Export Short
              <span className="text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-400 font-mono">60 FPS Ready</span>
            </h2>
            <p className="text-xs text-gray-400">Download rendered MP4 or publish directly to your YouTube channel.</p>
          </div>
        </div>

        {/* 🚀 QUICK EXPORT OPTIONS (Direct Download & Studio Link) */}
        <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-[#171926] border border-purple-900/40 mb-4">
          <a
            href={downloadUrl}
            download={`${clip.title}.mp4`}
            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition shadow-lg shadow-purple-600/20 text-center"
          >
            <Download className="w-4 h-4" />
            <span>Download MP4</span>
          </a>

          <a
            href="https://studio.youtube.com/channel/upload"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition shadow-lg shadow-red-600/20 text-center"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Open YouTube Studio</span>
          </a>
        </div>

        {publishedData ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-12 h-12 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Export & Publishing Ready!</h3>
              <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">{publishedData.message}</p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <a
                href={downloadUrl}
                download={`${clip.title}.mp4`}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                <span>Download MP4</span>
              </a>
              <a
                href="https://studio.youtube.com/channel/upload"
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition flex items-center gap-1.5"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Go to YouTube Studio</span>
              </a>
            </div>
          </div>
        ) : (
          <form onSubmit={handlePublish} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-gray-400">Viral Title (Max 100 chars)</label>
                <button
                  type="button"
                  onClick={handleCopyTitle}
                  className="text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1 transition"
                >
                  {copiedTitle ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedTitle ? 'Copied!' : 'Copy Title'}</span>
                </button>
              </div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
                required
                className="w-full bg-[#181b28] border border-gray-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-gray-400">Description & Attribution</label>
                <button
                  type="button"
                  onClick={handleCopyDesc}
                  className="text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1 transition"
                >
                  {copiedDesc ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedDesc ? 'Copied Description!' : 'Copy Text & Tags'}</span>
                </button>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full bg-[#181b28] border border-gray-700 rounded-xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Viral Hashtags</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full bg-[#181b28] border border-gray-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500"
              />
            </div>

            {/* Source Attribution Notice */}
            {video.creator_name && (
              <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-800/30 flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="attrib"
                  checked={includeAttribution}
                  onChange={(e) => setIncludeAttribution(e.target.checked)}
                  className="mt-0.5 rounded border-purple-700 text-purple-600 focus:ring-0"
                />
                <label htmlFor="attrib" className="text-xs text-purple-200 cursor-pointer">
                  <strong>Automatic Creator Credit:</strong> Credit attached for{' '}
                  <span className="font-semibold text-white">{video.creator_name}</span>.
                </label>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-purple-400" />
                  <span>Automated Peak Traffic Scheduler</span>
                </label>
                {scheduledAt && (
                  <button
                    type="button"
                    onClick={() => setScheduledAt('')}
                    className="text-[10px] text-gray-400 hover:text-white"
                  >
                    Clear schedule (Publish Now)
                  </button>
                )}
              </div>

              {/* 1-Click Peak Algorithmic Traffic Windows */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleSetPeakTime(18, 0)}
                  className="px-3 py-2 rounded-xl text-left bg-[#181b28] hover:bg-[#202438] border border-gray-700/80 hover:border-purple-500/60 transition group"
                >
                  <div className="text-[11px] font-bold text-white flex items-center justify-between">
                    <span>🔥 6:00 PM IST</span>
                    <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950 px-1 rounded">PEAK</span>
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5">Prime Evening Traffic Window</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSetPeakTime(20, 30)}
                  className="px-3 py-2 rounded-xl text-left bg-[#181b28] hover:bg-[#202438] border border-gray-700/80 hover:border-purple-500/60 transition group"
                >
                  <div className="text-[11px] font-bold text-white flex items-center justify-between">
                    <span>🌙 8:30 PM IST</span>
                    <span className="text-[9px] font-mono text-purple-300 bg-purple-950 px-1 rounded">GAMING</span>
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5">Night Viral Engagement Rush</div>
                </button>
              </div>

              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full bg-[#181b28] border border-gray-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-purple-500 transition"
              />
              <p className="text-[10px] text-gray-400 leading-tight">
                {scheduledAt
                  ? `⚡ Autopilot daemon will upload this Short automatically at your selected time.`
                  : `Publishing immediately without schedule.`}
              </p>
            </div>

            {error && (
              <p className="text-xs text-red-400 bg-red-950/40 p-2.5 rounded-lg border border-red-800/40">
                {error}
              </p>
            )}

            <div className="flex justify-between items-center pt-2">
              <a
                href={downloadUrl}
                download={`${clip.title}.mp4`}
                className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 font-semibold transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save to Disk</span>
              </a>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white transition"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-5 py-2 rounded-xl text-xs font-bold text-white disabled:opacity-50 transition flex items-center gap-2 shadow-lg ${
                    scheduledAt
                      ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-600/30'
                      : 'bg-red-600 hover:bg-red-700 shadow-red-600/30'
                  }`}
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>
                    {loading
                      ? 'Processing...'
                      : scheduledAt
                      ? '📅 Schedule Autopilot Upload'
                      : 'One-Click Publish Now'}
                  </span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
