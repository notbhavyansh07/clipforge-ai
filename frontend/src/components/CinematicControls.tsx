'use client';

import React from 'react';
import { Palette, Zap, Sparkles, Layout, Flame, Layers } from 'lucide-react';
import { RenderOptions } from '@/lib/types';

interface CinematicControlsProps {
  options: RenderOptions;
  onChange: (opts: RenderOptions) => void;
}

export default function CinematicControls({ options, onChange }: CinematicControlsProps) {
  const colorPresets = [
    { id: 'viral_vibrant', name: 'Viral Vibrant', desc: '+35% Saturation, High Contrast', color: 'bg-gradient-to-r from-amber-500 to-pink-500' },
    { id: 'cinematic_teal_orange', name: 'Teal & Orange', desc: 'Hollywood Blockbuster Curve', color: 'bg-gradient-to-r from-cyan-600 to-amber-600' },
    { id: 'cyber_neon', name: 'Cyber Neon', desc: 'High Hue Shift for Gaming/GTA', color: 'bg-gradient-to-r from-purple-600 to-emerald-500' },
    { id: 'clean_natural', name: 'Clean Natural', desc: 'True-to-life broadcast tone', color: 'bg-gradient-to-r from-gray-600 to-gray-400' },
  ];

  return (
    <div className="bg-[#12141e] border border-gray-800 rounded-2xl p-5 space-y-5">
      <div className="flex items-center justify-between border-b border-gray-800 pb-3">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-purple-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">FilmCraft & HyperFrames Engine</h3>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">
          PRO FX
        </span>
      </div>

      {/* Cinematic Color Grading */}
      <div>
        <label className="block text-xs text-gray-400 mb-2 font-medium">Cinematic Color LUT Preset</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {colorPresets.map((p) => {
            const isSelected = (options.color_preset || 'viral_vibrant') === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onChange({ ...options, color_preset: p.id })}
                className={`p-2.5 rounded-xl border text-left transition relative ${
                  isSelected
                    ? 'border-purple-500 bg-purple-950/40 shadow-sm shadow-purple-500/20'
                    : 'border-gray-800 hover:border-gray-700 bg-[#161824]'
                }`}
              >
                <div className={`h-2.5 rounded-md mb-2 ${p.color}`} />
                <div className="text-xs font-bold text-white">{p.name}</div>
                <div className="text-[10px] text-gray-400 leading-tight mt-0.5">{p.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* HyperFrames Motion & Layout Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-gray-800/80">
        <label className="flex items-center justify-between p-3 rounded-xl bg-[#161824] border border-gray-800/80 cursor-pointer hover:border-purple-500/40 transition">
          <div className="flex items-center gap-2 text-xs text-gray-200">
            <Zap className="w-4 h-4 text-amber-400" />
            <div>
              <div className="font-semibold">Hook Punch-In Zoom</div>
              <div className="text-[10px] text-gray-400">1.12x scale on first 3s</div>
            </div>
          </div>
          <input
            type="checkbox"
            checked={options.enable_punch_in_zoom !== false}
            onChange={(e) => onChange({ ...options, enable_punch_in_zoom: e.target.checked })}
            className="rounded border-gray-700 text-purple-600 focus:ring-0"
          />
        </label>

        <label className="flex items-center justify-between p-3 rounded-xl bg-[#161824] border border-gray-800/80 cursor-pointer hover:border-purple-500/40 transition">
          <div className="flex items-center gap-2 text-xs text-gray-200">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <div>
              <div className="font-semibold">Retention Progress Bar</div>
              <div className="text-[10px] text-gray-400">Top animated duration bar</div>
            </div>
          </div>
          <input
            type="checkbox"
            checked={options.enable_retention_bar !== false}
            onChange={(e) => onChange({ ...options, enable_retention_bar: e.target.checked })}
            className="rounded border-gray-700 text-purple-600 focus:ring-0"
          />
        </label>

        <label className="flex items-center justify-between p-3 rounded-xl bg-[#161824] border border-gray-800/80 cursor-pointer hover:border-purple-500/40 transition">
          <div className="flex items-center gap-2 text-xs text-gray-200">
            <Layout className="w-4 h-4 text-pink-400" />
            <div>
              <div className="font-semibold">Split-Screen Layout</div>
              <div className="text-[10px] text-gray-400">Streamer Cam + Gameplay</div>
            </div>
          </div>
          <input
            type="checkbox"
            checked={options.split_screen === true}
            onChange={(e) => onChange({ ...options, split_screen: e.target.checked })}
            className="rounded border-gray-700 text-purple-600 focus:ring-0"
          />
        </label>
      </div>

      {/* Wayin-Style Smart Split Layout & Hook Banner Options */}
      {options.split_screen && (
        <div className="p-3 rounded-xl bg-[#161824] border border-pink-500/30 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-pink-300">Smart Split Layout Mode</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onChange({ ...options, split_layout: 'gaming_stacked_50_50' })}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                  (options.split_layout || 'gaming_stacked_50_50') === 'gaming_stacked_50_50'
                    ? 'bg-pink-600 text-white shadow-sm'
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                50/50 Equal Stack
              </button>
              <button
                type="button"
                onClick={() => onChange({ ...options, split_layout: 'facecam_top_gameplay_bottom' })}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                  options.split_layout === 'facecam_top_gameplay_bottom'
                    ? 'bg-pink-600 text-white shadow-sm'
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                Wayin Gaming (40% Cam / 60% Game)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Wayin-Style Top Hook Headline Banner */}
      <div className="p-3 rounded-xl bg-[#161824] border border-yellow-500/20 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-yellow-300">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Wayin-Style Hook Headline Banner</span>
          </div>
          <span className="text-[10px] text-gray-400 font-mono">FIRST 3.5 SECONDS</span>
        </div>
        <input
          type="text"
          placeholder="e.g. WAIT FOR HIS REACTION! 😱"
          value={options.hook_headline || ''}
          onChange={(e) => onChange({ ...options, hook_headline: e.target.value })}
          className="w-full bg-[#10121a] border border-gray-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/50"
        />
      </div>
    </div>
  );
}

