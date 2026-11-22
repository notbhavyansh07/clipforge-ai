'use client';

import React, { useState } from 'react';
import {
  X,
  Youtube,
  Instagram,
  CheckCircle2,
  Loader2,
  Download,
  Copy,
  Check,
  ExternalLink,
  Share2,
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
  const [includeAttribution, setIncludeAttribution] = useState(true);
  const [selectedPlatforms, setSelectedPlatforms] = useState<('youtube' | 'instagram')[]>(['youtube', 'instagram']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedTitle, setCopiedTitle] = useState(false);
  const [copiedDesc, setCopiedDesc] = useState(false);
  const [copiedIgCaption, setCopiedIgCaption] = useState(false);
  const [publishedData, setPublishedData] = useState<any | null>(null);

  if (!isOpen) return null;

  const downloadUrl = api.getClipStreamUrl(clip.id);

  const togglePlatform = (p: 'youtube' | 'instagram') => {
    setSelectedPlatforms((prev) => {
      if (prev.includes(p)) {
        if (prev.length === 1) return prev; // Keep at least one
        return prev.filter((item) => item !== p);
      }
      return [...prev, p];
    });
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

  const handleCopyIgCaption = () => {
    const fullText = `${title}\n\n${description}\n\n${tags} #reels #viral`;
    navigator.clipboard.writeText(fullText);
    setCopiedIgCaption(true);
    setTimeout(() => setCopiedIgCaption(false), 2000);
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      setLoading(true);

      // Auto-copy caption to clipboard for effortless Instagram posting
      if (selectedPlatforms.includes('instagram')) {
        try {
          const igText = `${title}\n\n${description}\n\n${tags} #reels #viral`;
          navigator.clipboard.writeText(igText);
        } catch {}
      }

      const res = await api.publishToYouTube({
        clip_id: clip.id,
        title: title.trim(),
        description: description.trim(),
        tags: tags.split(',').map((t) => t.trim()),
        include_attribution: includeAttribution,
        platforms: selectedPlatforms,
      });

      setPublishedData(res);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to upload or publish.');
    } finally {
      setLoading(false);
    }
  };

  const isBothSelected = selectedPlatforms.includes('youtube') && selectedPlatforms.includes('instagram');

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
          <div className="p-2 rounded-xl bg-gradient-to-tr from-red-600 via-pink-600 to-purple-600 text-white shadow-md">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Publish & Export Short
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono">1080p 60FPS</span>
            </h2>
            <p className="text-xs text-gray-400">Simultaneous 1-click publishing to YouTube Shorts & Instagram Reels.</p>
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
            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-red-600/90 hover:bg-red-700 text-white text-xs font-bold transition shadow-lg shadow-red-600/20 text-center"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Open YouTube Studio</span>
          </a>
        </div>

        {publishedData ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">🎉 Published Successfully!</h3>
              <p className="text-xs text-gray-300 mt-1 max-w-sm mx-auto leading-relaxed">
                {publishedData.message || 'Your video is live and ready on your channels!'}
              </p>
            </div>

            {/* Platform Results Split Cards */}
            <div className="space-y-2.5 text-left pt-1">
              {/* YouTube Result */}
              {selectedPlatforms.includes('youtube') && (
                <div className="p-3.5 rounded-xl bg-[#161824] border border-red-900/40 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-red-600 text-white">
                      <Youtube className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>YouTube Shorts</span>
                        <span className="text-[10px] text-emerald-400 bg-emerald-950 px-1.5 py-0.2 rounded font-mono">LIVE</span>
                      </div>
                      <div className="text-[11px] text-gray-400">Channel: BOMBAYPLAYZ GAMING</div>
                    </div>
                  </div>
                  <a
                    href={publishedData.youtube_url || `https://youtube.com/shorts/${publishedData.youtube_video_id || '9HCuh7AmGzQ'}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-red-600/30"
                  >
                    <span>▶ Watch Short</span>
                  </a>
                </div>
              )}

              {/* Instagram Result */}
              {selectedPlatforms.includes('instagram') && (
                <div className="p-3.5 rounded-xl bg-[#161824] border border-pink-900/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-gradient-to-tr from-yellow-500 via-pink-600 to-purple-600 text-white">
                        <Instagram className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span>Instagram Reels</span>
                          <span className="text-[10px] text-pink-400 bg-pink-950 px-1.5 py-0.2 rounded font-mono">READY</span>
                        </div>
                        <div className="text-[11px] text-gray-400">Caption &amp; 1080p 60FPS video ready</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleCopyIgCaption}
                        className="px-2.5 py-1.5 rounded-lg bg-[#222538] hover:bg-[#2b2f48] text-[11px] font-semibold text-gray-200 border border-gray-700 transition flex items-center gap-1"
                        title="Copy caption with hashtags"
                      >
                        {copiedIgCaption ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedIgCaption ? 'Copied' : 'Copy Caption'}</span>
                      </button>
                      <a
                        href="https://www.instagram.com/reels/create"
                        target="_blank"
                        rel="noreferrer"
                        className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:opacity-90 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-pink-600/30"
                      >
                        <span>📸 Open Reels Web</span>
                      </a>
                    </div>
                  </div>

                  {/* Creator Guidance Banner */}
                  <div className="p-2.5 rounded-lg bg-[#1a1d2e] border border-pink-950 text-[11px] text-gray-300 leading-relaxed flex items-center justify-between">
                    <span>💡 <strong>Instagram Tip:</strong> If logged into Instagram on your PC, click <strong>Open Reels Web</strong>. On mobile, use <strong>Save Video</strong> and upload from the Instagram app with your copied caption.</span>
                    <a
                      href={downloadUrl}
                      download={`${clip.title}.mp4`}
                      className="ml-2 px-2.5 py-1 rounded-md bg-purple-600/40 hover:bg-purple-600 text-white text-[10px] font-bold whitespace-nowrap transition"
                    >
                      Save Video
                    </a>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-3 border-t border-gray-800">
              <a
                href={downloadUrl}
                download={`${clip.title}.mp4`}
                className="px-4 py-2 rounded-xl bg-[#1f2235] hover:bg-[#282c44] text-white text-xs font-semibold transition flex items-center gap-1.5 border border-gray-700"
              >
                <Download className="w-4 h-4" />
                <span>Save MP4 File</span>
              </a>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handlePublish} className="space-y-4">
            {/* 🎯 Simultaneous Platform Selector (YouTube + Instagram) */}
            <div>
              <label className="text-xs font-semibold text-gray-300 mb-2 block">
                Target Platforms (Select for simultaneous 1-click publishing):
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {/* YouTube Shorts Option */}
                <button
                  type="button"
                  onClick={() => togglePlatform('youtube')}
                  className={`p-3 rounded-xl border text-left transition flex items-center justify-between ${
                    selectedPlatforms.includes('youtube')
                      ? 'bg-red-950/30 border-red-500/80 ring-1 ring-red-500/50'
                      : 'bg-[#161824] border-gray-800 hover:border-gray-700 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-red-600 text-white">
                      <Youtube className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">YouTube Shorts</div>
                      <div className="text-[10px] text-gray-400">@salviashu02</div>
                    </div>
                  </div>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      selectedPlatforms.includes('youtube')
                        ? 'bg-red-600 border-red-500 text-white'
                        : 'border-gray-600'
                    }`}
                  >
                    {selectedPlatforms.includes('youtube') && <Check className="w-3 h-3" />}
                  </div>
                </button>

                {/* Instagram Reels Option */}
                <button
                  type="button"
                  onClick={() => togglePlatform('instagram')}
                  className={`p-3 rounded-xl border text-left transition flex items-center justify-between ${
                    selectedPlatforms.includes('instagram')
                      ? 'bg-pink-950/30 border-pink-500/80 ring-1 ring-pink-500/50'
                      : 'bg-[#161824] border-gray-800 hover:border-gray-700 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-gradient-to-tr from-yellow-500 via-pink-600 to-purple-600 text-white">
                      <Instagram className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Instagram Reels</div>
                      <div className="text-[10px] text-gray-400">Reels 9:16 Video</div>
                    </div>
                  </div>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      selectedPlatforms.includes('instagram')
                        ? 'bg-pink-600 border-pink-500 text-white'
                        : 'border-gray-600'
                    }`}
                  >
                    {selectedPlatforms.includes('instagram') && <Check className="w-3 h-3" />}
                  </div>
                </button>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-gray-400">Viral Title (Max 100 chars)</label>
                <button
                  type="button"
                  onClick={handleCopyTitle}
                  className="text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1 transition"
                >
                  {copiedTitle ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
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
                  {copiedDesc ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
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
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-lg disabled:opacity-50 transition flex items-center gap-2 ${
                    isBothSelected
                      ? 'bg-gradient-to-r from-red-600 via-pink-600 to-purple-600 hover:opacity-95 shadow-pink-600/30'
                      : selectedPlatforms.includes('youtube')
                      ? 'bg-red-600 hover:bg-red-700 shadow-red-600/30'
                      : 'bg-gradient-to-r from-pink-600 to-purple-600 hover:opacity-95 shadow-pink-600/30'
                  }`}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isBothSelected ? (
                    <Share2 className="w-4 h-4" />
                  ) : selectedPlatforms.includes('youtube') ? (
                    <Youtube className="w-4 h-4" />
                  ) : (
                    <Instagram className="w-4 h-4" />
                  )}
                  <span>
                    {loading
                      ? 'Publishing...'
                      : isBothSelected
                      ? '🚀 1-Click Publish to YouTube & Instagram'
                      : selectedPlatforms.includes('youtube')
                      ? 'One-Click Publish to YouTube Shorts'
                      : 'One-Click Publish to Instagram Reels'}
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
