'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Cpu,
  Sparkles,
  Zap,
  CheckCircle2,
  Server,
  Layers,
  ShieldCheck,
  Activity,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { api } from '@/lib/api';

interface AIModelHarnessModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeProviderId: string;
  onSelectProvider: (providerId: string) => void;
}

export default function AIModelHarnessModal({
  isOpen,
  onClose,
  activeProviderId,
  onSelectProvider,
}: AIModelHarnessModalProps) {
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadProviders();
    }
  }, [isOpen]);

  const loadProviders = async () => {
    try {
      setLoading(true);
      const data = await api.getAIProviders();
      setProviders(data.providers || []);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0e101c] border border-purple-500/40 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-gray-800 flex items-center justify-between bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white tracking-tight">
                  Free Multi-Provider AI Harness
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">
                  $0.00 SUBSCRIPTION
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Inspired by alishahryar1/free-claude-code: Zero-cost LLM reverse proxy router across Gemini, DeepSeek, Ollama & Claude Code.
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

        {/* Providers List */}
        <div className="p-6 space-y-4 overflow-y-auto">
          <div className="text-xs text-gray-400 leading-relaxed bg-[#141626] p-3.5 rounded-2xl border border-gray-800/80 flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-purple-400 shrink-0" />
            <span>
              All short-form hook generation, virality rubric grading, and Hormozi subtitle timing run through the selected free provider with automatic failover.
            </span>
          </div>

          <div className="space-y-3">
            {providers.map((p) => {
              const isSelected = activeProviderId === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => {
                    api.setActiveAIProvider(p.id);
                    onSelectProvider(p.id);
                    onClose();
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                    isSelected
                      ? 'bg-purple-950/40 border-purple-400 shadow-lg shadow-purple-950/40'
                      : 'bg-[#141624] border-gray-800 hover:border-gray-700 hover:bg-[#1a1d30]'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        isSelected ? 'border-purple-400 bg-purple-500' : 'border-gray-600'
                      }`}
                    >
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white tracking-tight truncate">
                          {p.name}
                        </span>
                        {p.recommended && (
                          <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-900/60 text-purple-300 border border-purple-700">
                            RECOMMENDED
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-gray-400 font-mono">
                        <span>Provider: {p.provider}</span>
                        <span>•</span>
                        <span>Context: {p.context_window}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs font-mono font-bold text-emerald-400 px-2.5 py-1 rounded-xl bg-emerald-950/70 border border-emerald-800/80">
                      {p.cost}
                    </span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 text-center">
            <span className="text-[11px] text-gray-500 font-mono">
              Auto-Fallback Engine: If a provider hits rate limit, requests automatically cascade to the next free node.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
