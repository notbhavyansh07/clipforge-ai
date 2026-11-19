'use client';

import React from 'react';
import { ScoreBreakdown } from '@/lib/types';
import { Zap, Heart, Gauge, BookOpen, Flame, HelpCircle } from 'lucide-react';

interface ViralityBreakdownProps {
  score: number;
  breakdown?: ScoreBreakdown;
  reason?: string;
}

export default function ViralityBreakdown({ score, breakdown, reason }: ViralityBreakdownProps) {
  const getScoreColor = (val: number) => {
    if (val >= 85) return 'text-[#00FF66] border-[#00FF66]/40 bg-[#00FF66]/10';
    if (val >= 70) return 'text-[#00F0FF] border-[#00F0FF]/40 bg-[#00F0FF]/10';
    return 'text-[#FFDD00] border-[#FFDD00]/40 bg-[#FFDD00]/10';
  };

  const factors = [
    {
      key: 'hook',
      label: 'Hook Strength (0-3s)',
      weight: '30%',
      icon: Zap,
      value: breakdown?.hook || 75,
      color: 'bg-purple-500',
    },
    {
      key: 'emotion',
      label: 'Emotional Intensity',
      weight: '20%',
      icon: Heart,
      value: breakdown?.emotion || 80,
      color: 'bg-pink-500',
    },
    {
      key: 'pacing',
      label: 'Pacing & Cadence',
      weight: '20%',
      icon: Gauge,
      value: breakdown?.pacing || 85,
      color: 'bg-cyan-500',
    },
    {
      key: 'story',
      label: 'Story & Resolution',
      weight: '15%',
      icon: BookOpen,
      value: breakdown?.story || 70,
      color: 'bg-emerald-500',
    },
    {
      key: 'trend',
      label: 'Trend Match (GTA/Viral)',
      weight: '15%',
      icon: Flame,
      value: breakdown?.trend || 90,
      color: 'bg-amber-500',
    },
  ];

  return (
    <div className="bg-[#12141e] border border-gray-800 rounded-2xl p-5 space-y-4">
      {/* Header with overall virality score */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Virality Engine</h3>
          <p className="text-xs text-gray-400">Algorithmic short-form retention prediction</p>
        </div>
        <div className={`px-3 py-1 rounded-xl border text-base font-black flex items-center gap-1.5 shadow-md ${getScoreColor(score)}`}>
          <span>{score}</span>
          <span className="text-[10px] font-normal opacity-70">/ 100</span>
        </div>
      </div>

      {/* Explanatory one-line why */}
      {reason && (
        <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-800/40 text-xs text-purple-200 flex items-start gap-2">
          <HelpCircle className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed"><strong className="text-white">Why it converts:</strong> {reason}</p>
        </div>
      )}

      {/* Breakdown progress meters */}
      <div className="space-y-3 pt-1">
        {factors.map((f) => {
          const Icon = f.icon;
          return (
            <div key={f.key} className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="flex items-center gap-1.5 text-gray-300 font-medium">
                  <Icon className="w-3.5 h-3.5 text-gray-400" />
                  {f.label}
                  <span className="text-[10px] text-gray-500">({f.weight})</span>
                </span>
                <span className="font-mono font-bold text-gray-200">{f.value}</span>
              </div>
              <div className="w-full bg-[#1e2230] h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${f.color}`}
                  style={{ width: `${Math.min(100, Math.max(0, f.value))}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

