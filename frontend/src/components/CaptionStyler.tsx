'use client';

import React from 'react';
import { Type, Sparkles, Check, Sliders, Volume2, Crop } from 'lucide-react';
import { RenderOptions } from '@/lib/types';

interface CaptionStylerProps {
  options: RenderOptions;
  onChange: (opts: RenderOptions) => void;
}

export default function CaptionStyler({ options, onChange }: CaptionStylerProps) {
  const presets = [
    {
      id: 'karaoke_bold',
      name: 'Hormozi Gold',
      desc: 'High contrast yellow pop-in, heavy black outline',
      preview: 'TEXT',
      previewBg: 'text-yellow-400 bg-black',
    },
    {
      id: 'neon_cyber',
      name: 'Cyber Neon',
      desc: 'Electric green and cyan glow for gaming/GTA',
      preview: 'GLITCH',
      previewBg: 'text-[#00FF66] bg-cyan-950',
    },
    {
      id: 'minimal_white',
      name: 'Clean Minimal',
      desc: 'Elegant white bold lettering with drop shadow',
      preview: 'STORY',
      previewBg: 'text-white bg-gray-900',
    },
  ];

  return (
    <div className="bg-[#12141e] border border-gray-800 rounded-2xl p-5 space-y-5">
      <div className="flex items-center gap-2">
        <Type className="w-4 h-4 text-purple-400" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-white">Auto-Edit & Subtitle Engine</h3>
      </div>

      {/* Preset selector */}
      <div>
        <label className="block text-xs text-gray-400 mb-2 font-medium">Viral Caption Style</label>
        <div className="grid grid-cols-3 gap-2">
          {presets.map((p) => {
            const isSelected = (options.caption_preset || 'karaoke_bold') === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onChange({ ...options, caption_preset: p.id })}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition relative ${
                  isSelected
                    ? 'border-purple-500 bg-purple-950/30'
                    : 'border-gray-800 hover:border-gray-700 bg-[#161824]'
                }`}
              >
                <div>
                  <div className={`w-full py-1 text-center font-black text-xs rounded mb-1.5 ${p.previewBg}`}>
                    {p.preview}
                  </div>
                  <div className="text-xs font-bold text-white">{p.name}</div>
                  <div className="text-[10px] text-gray-400 leading-tight mt-0.5">{p.desc}</div>
                </div>
                {isSelected && (
                  <span className="absolute top-2 right-2 p-0.5 bg-purple-500 rounded-full text-white">
                    <Check className="w-3 h-3" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* AI Editing Toggles */}
      <div className="space-y-2.5 pt-2 border-t border-gray-800/80">
        <label className="flex items-center justify-between text-xs text-gray-300 cursor-pointer">
          <span className="flex items-center gap-2">
            <Crop className="w-3.5 h-3.5 text-purple-400" />
            9:16 Face-Tracked Dynamic Reframing
          </span>
          <input
            type="checkbox"
            checked={options.enable_face_tracking !== false}
            onChange={(e) => onChange({ ...options, enable_face_tracking: e.target.checked })}
            className="rounded border-gray-700 text-purple-600 focus:ring-0"
          />
        </label>

        <label className="flex items-center justify-between text-xs text-gray-300 cursor-pointer">
          <span className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-pink-400" />
            Animated Word-by-Word Subtitles
          </span>
          <input
            type="checkbox"
            checked={options.enable_animated_captions !== false}
            onChange={(e) => onChange({ ...options, enable_animated_captions: e.target.checked })}
            className="rounded border-gray-700 text-purple-600 focus:ring-0"
          />
        </label>

        <label className="flex items-center justify-between text-xs text-gray-300 cursor-pointer">
          <span className="flex items-center gap-2">
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            Silence & Filler-Word Trimming
          </span>
          <input
            type="checkbox"
            checked={options.enable_silence_trim !== false}
            onChange={(e) => onChange({ ...options, enable_silence_trim: e.target.checked })}
            className="rounded border-gray-700 text-purple-600 focus:ring-0"
          />
        </label>

        <label className="flex items-center justify-between text-xs text-gray-300 cursor-pointer">
          <span className="flex items-center gap-2">
            <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
            Audio Loudness Normalization (EBU R128)
          </span>
          <input
            type="checkbox"
            checked={options.enable_audio_normalization !== false}
            onChange={(e) => onChange({ ...options, enable_audio_normalization: e.target.checked })}
            className="rounded border-gray-700 text-purple-600 focus:ring-0"
          />
        </label>
      </div>
    </div>
  );
}

