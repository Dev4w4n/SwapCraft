import React from 'react';
import { Sparkles, RefreshCw, Wand2, ShieldCheck, Layers } from 'lucide-react';

interface HeaderProps {
  onReset: () => void;
  onOpenPresets: () => void;
  currentStep: number;
}

export const Header: React.FC<HeaderProps> = ({ onReset, onOpenPresets, currentStep }) => {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-500 to-amber-400 p-0.5 shadow-lg shadow-indigo-500/20">
            <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-slate-950">
              <Wand2 className="h-5 w-5 text-indigo-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-white">SwapCraft</span>
              <span className="rounded-md bg-indigo-500/10 px-2 py-0.5 text-xs font-semibold text-indigo-400 border border-indigo-500/20">
                Gemini Inpainter
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Intelligent generative object substitution with 3D perspective match
            </p>
          </div>
        </div>

        {/* Workflow indicator pills */}
        <div className="hidden md:flex items-center gap-1.5 text-xs font-medium text-slate-400 bg-slate-900/60 p-1 rounded-lg border border-slate-800">
          <div className={`px-2.5 py-1 rounded-md transition-colors ${currentStep === 1 ? 'bg-indigo-600 text-white font-semibold shadow-sm' : ''}`}>
            1. Upload Images
          </div>
          <span className="text-slate-600">→</span>
          <div className={`px-2.5 py-1 rounded-md transition-colors ${currentStep === 2 ? 'bg-indigo-600 text-white font-semibold shadow-sm' : ''}`}>
            2. AI Target Analysis
          </div>
          <span className="text-slate-600">→</span>
          <div className={`px-2.5 py-1 rounded-md transition-colors ${currentStep === 3 ? 'bg-indigo-600 text-white font-semibold shadow-sm' : ''}`}>
            3. Inpainting Result
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenPresets}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-slate-800 hover:border-slate-600"
            aria-label="Browse Sample Presets"
          >
            <Layers className="h-3.5 w-3.5 text-indigo-400" />
            <span>Sample Presets</span>
          </button>

          {currentStep > 1 && (
            <button
              type="button"
              onClick={onReset}
              className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
              aria-label="Start new swap replacement"
            >
              <RefreshCw className="h-3.5 w-3.5 text-slate-400" />
              <span className="hidden sm:inline">New Swap</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
