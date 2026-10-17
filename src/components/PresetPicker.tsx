import React from 'react';
import { DEMO_PRESETS, PresetPair } from '../data/presets.ts';
import { Sparkles, ArrowRight, X } from 'lucide-react';

interface PresetPickerProps {
  onSelectPreset: (preset: PresetPair) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const PresetPicker: React.FC<PresetPickerProps> = ({
  onSelectPreset,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-400" />
              <h2 className="text-lg font-bold text-white">Select a Curated Demo Preset</h2>
            </div>
            <p className="text-xs text-slate-400">
              Test generative inpainting &amp; perspective matching immediately without uploading your own images.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
            aria-label="Close presets modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {DEMO_PRESETS.map((preset) => (
            <div
              key={preset.id}
              onClick={() => {
                onSelectPreset(preset);
                onClose();
              }}
              className="group relative flex cursor-pointer flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-950/60 p-3 transition hover:border-indigo-500/50 hover:bg-slate-800/40"
            >
              {/* Dual image preview thumbs */}
              <div className="relative mb-3 flex h-36 gap-1.5 overflow-hidden rounded-lg bg-slate-900">
                <div className="relative h-full w-1/2 overflow-hidden border-r border-slate-800/80">
                  <img
                    src={preset.imageA}
                    alt={`${preset.title} Original`}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                  <span className="absolute bottom-1 left-1 rounded bg-slate-950/80 px-1 py-0.5 text-[10px] font-semibold text-slate-300">
                    Image A
                  </span>
                </div>
                <div className="relative h-full w-1/2 overflow-hidden">
                  <img
                    src={preset.imageB}
                    alt={`${preset.title} Reference`}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                  <span className="absolute bottom-1 right-1 rounded bg-indigo-950/80 px-1 py-0.5 text-[10px] font-semibold text-indigo-300 border border-indigo-500/30">
                    Image B
                  </span>
                </div>
              </div>

              <div className="flex flex-1 flex-col">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-400">
                  {preset.category}
                </span>
                <h3 className="mt-0.5 text-sm font-bold text-white group-hover:text-indigo-300">
                  {preset.title}
                </h3>
                <p className="mt-1 line-clamp-2 text-xs text-slate-400">
                  {preset.description}
                </p>
                <div className="mt-3 flex items-center justify-between border-t border-slate-800/80 pt-2 text-[11px] font-medium text-slate-400">
                  <span className="truncate text-slate-400">
                    🎯 {preset.targetHint}
                  </span>
                  <span className="flex items-center gap-1 text-indigo-400 font-semibold group-hover:translate-x-0.5 transition-transform">
                    Load <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
