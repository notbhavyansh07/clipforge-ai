'use client';

import React from 'react';
import { Palette, Zap, Sparkles, Layout, Flame, Crosshair, ShieldCheck, Languages, MoveHorizontal, Radio } from 'lucide-react';
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

  const framingModes = [
    {
      id: 'fill_player_track',
      name: 'Fill: Player Track (GTA)',
      desc: 'Auto-pans player/vehicle & evades corner facecams',
    },
    {
      id: 'fit_blurred',
      name: 'Fit: Cinematic Blurred Canvas',
      desc: '16:9 gameplay center with ambient blur background',
    },
    {
      id: 'split_facecam',
      name: 'Split: Facecam + Action',
      desc: 'Top streamer cam + bottom 9:16 gameplay crop',
    },
  ];

  return (
    <div className="bg-[#12141e] border border-gray-800 rounded-2xl p-5 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-800 pb-3">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-purple-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">FilmCraft & GTA-Auto-Clipper Engine</h3>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold">
          AI HYPERFRAMES + GTA-CLIPPER
        </span>
      </div>

      {/* GTA-Auto-Clipper Framing & Facecam Evasion Engine */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs text-gray-300 font-semibold flex items-center gap-1.5">
            <Crosshair className="w-3.5 h-3.5 text-yellow-400" />
            <span>GTA 9:16 Player-Centric Framing & Facecam Evasion</span>
          </label>
          <span className="text-[10px] font-mono text-yellow-400/80 bg-yellow-400/10 px-2 py-0.5 rounded border border-yellow-400/20">
            YOLOX Player Tracking
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {framingModes.map((fm) => {
            const isSelected = (options.framing_mode || 'fill_player_track') === fm.id;
            return (
              <button
                key={fm.id}
                type="button"
                onClick={() => {
                  onChange({
                    ...options,
                    framing_mode: fm.id as any,
                    split_screen: fm.id === 'split_facecam',
                  });
                }}
                className={`p-3 rounded-xl border text-left transition ${
                  isSelected
                    ? 'border-yellow-500 bg-yellow-950/20 text-yellow-200 shadow-sm shadow-yellow-500/20 ring-1 ring-yellow-500/40'
                    : 'border-gray-800 hover:border-gray-700 bg-[#161824] text-gray-300'
                }`}
              >
                <div className="text-xs font-bold flex items-center justify-between">
                  <span>{fm.name}</span>
                  {isSelected && <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />}
                </div>
                <div className="text-[10px] text-gray-400 leading-tight mt-1">{fm.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* GTA-Auto-Clipper Lead-In Slider & Swear Masking */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-gray-800/80">
        {/* Dynamic 6s Lead-In Pre-Roll */}
        <div className="p-3.5 rounded-xl bg-[#161824] border border-gray-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-gray-200 font-semibold">
              <MoveHorizontal className="w-4 h-4 text-cyan-400" />
              <span>Highlight Lead-In Pre-Roll</span>
            </div>
            <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800">
              {options.lead_in_seconds ?? 6}s
            </span>
          </div>
          <p className="text-[10px] text-gray-400 leading-tight">
            Starts clip before peak reaction spike to capture the suspense build-up.
          </p>
          <input
            type="range"
            min={2}
            max={12}
            step={1}
            value={options.lead_in_seconds ?? 6}
            onChange={(e) => onChange({ ...options, lead_in_seconds: Number(e.target.value) })}
            className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-gray-700 rounded-lg"
          />
        </div>

        {/* Platform Reach Safety: Profanity Masking */}
        <label className="flex items-center justify-between p-3.5 rounded-xl bg-[#161824] border border-gray-800/80 cursor-pointer hover:border-purple-500/40 transition">
          <div className="space-y-1 pr-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-200">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Platform Reach Safe: Swear Masking</span>
            </div>
            <p className="text-[10px] text-gray-400 leading-tight">
              Masks curse words (F***, S***) in burned-in captions to prevent TikTok/Shorts shadowbans while preserving raw audio.
            </p>
          </div>
          <input
            type="checkbox"
            checked={options.enable_swear_masking !== false}
            onChange={(e) => onChange({ ...options, enable_swear_masking: e.target.checked })}
            className="w-4 h-4 rounded border-gray-700 text-emerald-500 focus:ring-0 accent-emerald-500"
          />
        </label>
      </div>

      {/* Language & Transliteration + Caption Positioning */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-gray-800/80">
        {/* Caption Language & Hinglish Transliteration */}
        <div className="p-3.5 rounded-xl bg-[#161824] border border-gray-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-gray-200 font-semibold">
              <Languages className="w-4 h-4 text-purple-400" />
              <span>Subtitles & Hinglish Transliteration</span>
            </div>
            <span className="text-[10px] font-mono text-purple-400">GTA-Auto-Clipper</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 pt-1">
            {[
              { id: 'auto', label: 'Auto Detect' },
              { id: 'hinglish', label: 'Hinglish (Carry)' },
              { id: 'en', label: 'English Only' },
            ].map((lang) => (
              <button
                key={lang.id}
                type="button"
                onClick={() => onChange({ ...options, caption_language: lang.id as any })}
                className={`py-1 px-2 rounded-lg text-[11px] font-medium transition ${
                  (options.caption_language || 'auto') === lang.id
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>

        {/* Lower-Third Gameplay Placement */}
        <div className="p-3.5 rounded-xl bg-[#161824] border border-gray-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-gray-200 font-semibold">
              <Radio className="w-4 h-4 text-pink-400" />
              <span>Captions Safe-Zone Placement</span>
            </div>
            <span className="text-[10px] font-mono text-pink-400">Shorts UI Shield</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 pt-1">
            {[
              { id: 'lower_third', label: 'Lower Third' },
              { id: 'middle', label: 'Center Screen' },
              { id: 'bottom', label: 'Bottom Edge' },
            ].map((pos) => (
              <button
                key={pos.id}
                type="button"
                onClick={() => onChange({ ...options, caption_position: pos.id as any })}
                className={`py-1 px-2 rounded-lg text-[11px] font-medium transition ${
                  (options.caption_position || 'lower_third') === pos.id
                    ? 'bg-pink-600 text-white shadow-sm'
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                {pos.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Cinematic Color Grading */}
      <div className="pt-2 border-t border-gray-800/80">
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

      {/* HyperFrames Motion & Split Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-gray-800/80">
        <label className="flex items-center justify-between p-3 rounded-xl bg-[#161824] border border-gray-800/80 cursor-pointer hover:border-purple-500/40 transition">
          <div className="flex items-center gap-2 text-xs text-gray-200">
            <Zap className="w-4 h-4 text-amber-400" />
            <div>
              <div className="font-semibold">Hook Punch-In Zoom</div>
              <div className="text-[10px] text-gray-400">1.12x scale on first 3s for dopamine spike</div>
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
              <div className="text-[10px] text-gray-400">Top animated duration gradient bar</div>
            </div>
          </div>
          <input
            type="checkbox"
            checked={options.enable_retention_bar !== false}
            onChange={(e) => onChange({ ...options, enable_retention_bar: e.target.checked })}
            className="rounded border-gray-700 text-purple-600 focus:ring-0"
          />
        </label>
      </div>

      {/* Top Hook Headline Banner */}
      <div className="p-3.5 rounded-xl bg-[#161824] border border-yellow-500/20 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-yellow-300">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Top Hook Headline Banner</span>
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
