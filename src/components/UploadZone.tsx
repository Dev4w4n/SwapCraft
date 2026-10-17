import React, { useRef } from 'react';
import { UploadCloud, Image as ImageIcon, Sparkles, X, ArrowRight, Zap, CheckCircle2 } from 'lucide-react';
import { fileToDataUrl, rasterizeToPng } from '../utils/image-helpers.ts';

interface UploadZoneProps {
  imageA: string | null;
  imageB: string | null;
  onImageAChange: (url: string | null) => void;
  onImageBChange: (url: string | null) => void;
  onAnalyze: () => void;
  onSelectPreset: (presetId: string) => void;
  isAnalyzing: boolean;
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  imageA,
  imageB,
  onImageAChange,
  onImageBChange,
  onAnalyze,
  onSelectPreset,
  isAnalyzing,
}) => {
  const fileInputARef = useRef<HTMLInputElement>(null);
  const fileInputBRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File, target: 'A' | 'B') => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG, JPG, WebP, etc.)');
      return;
    }
    try {
      const rawUrl = await fileToDataUrl(file);
      const cleanPng = await rasterizeToPng(rawUrl);
      if (target === 'A') onImageAChange(cleanPng);
      else onImageBChange(cleanPng);
    } catch (e) {
      console.error('Failed to read image:', e);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, target: 'A' | 'B') => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0], target);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const canProceed = Boolean(imageA && imageB);

  return (
    <div className="space-y-6">
      {/* Intro hero banner */}
      <div className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-950 p-6">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-400">
            <Zap className="h-3.5 w-3.5" />
            <span>Generative In-Situ Object Replacement</span>
          </div>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            Intelligently swap any object with photorealistic 3D warp
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">
            Upload the scene photo containing an object to replace, and a reference photo of the replacement object. Gemini AI automatically detects the target, removes it, and realistically renders the new object matching the scene’s camera angle, lighting, and occlusions.
          </p>
        </div>

        {/* Quick preset chips */}
        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-800/80 pt-4">
          <span className="text-xs font-semibold text-slate-400">Try a demo:</span>
          <button
            type="button"
            onClick={() => onSelectPreset('motorcycle-grips')}
            className="rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-1 text-xs font-medium text-slate-200 transition hover:border-indigo-500 hover:bg-indigo-950/50 hover:text-white"
          >
            🏍️ Motorcycle Grips
          </button>
          <button
            type="button"
            onClick={() => onSelectPreset('living-room-chair')}
            className="rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-1 text-xs font-medium text-slate-200 transition hover:border-indigo-500 hover:bg-indigo-950/50 hover:text-white"
          >
            🛋️ Velvet Armchair
          </button>
          <button
            type="button"
            onClick={() => onSelectPreset('streetwear-sneakers')}
            className="rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-1 text-xs font-medium text-slate-200 transition hover:border-indigo-500 hover:bg-indigo-950/50 hover:text-white"
          >
            👟 Cyber Sneakers
          </button>
        </div>
      </div>

      {/* Dual Upload Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Slot A: Image A - Original Photo */}
        <div className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-slate-300">
                  A
                </span>
                <h3 className="font-bold text-white">Original Photograph</h3>
              </div>
              <p className="text-xs text-slate-400">The scene containing the object to remove &amp; replace</p>
            </div>
            {imageA && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="h-3 w-3" /> Ready
              </span>
            )}
          </div>

          <div
            onDrop={(e) => handleDrop(e, 'A')}
            onDragOver={handleDragOver}
            onClick={() => !imageA && fileInputARef.current?.click()}
            className={`relative flex min-h-[300px] flex-1 flex-col items-center justify-center overflow-hidden rounded-xl border-2 transition ${
              imageA
                ? 'border-slate-700 bg-slate-950'
                : 'cursor-pointer border-dashed border-slate-700 hover:border-indigo-500 hover:bg-indigo-950/10'
            }`}
          >
            <input
              ref={fileInputARef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0], 'A')}
            />

            {imageA ? (
              <div className="relative h-full w-full">
                <img
                  src={imageA}
                  alt="Original Photograph (Image A)"
                  className="h-full max-h-[420px] w-full object-contain p-2"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onImageAChange(null);
                  }}
                  className="absolute top-3 right-3 rounded-lg bg-slate-900/80 p-1.5 text-slate-300 backdrop-blur transition hover:bg-red-600 hover:text-white"
                  title="Remove image"
                  aria-label="Remove Image A"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center p-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 text-indigo-400 mb-3 shadow-inner">
                  <UploadCloud className="h-6 w-6" />
                </div>
                <p className="text-sm font-semibold text-slate-200">
                  Drag &amp; drop Image A or <span className="text-indigo-400 underline">browse</span>
                </p>
                <p className="mt-1 text-xs text-slate-500">Supports PNG, JPG, WebP up to 25MB</p>
                <div className="mt-4 rounded-lg bg-slate-800/60 px-3 py-1.5 text-[11px] text-slate-400">
                  Example: Motorcycle cockpit, room interior, model with shoes
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Slot B: Image B - Replacement Reference */}
        <div className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                  B
                </span>
                <h3 className="font-bold text-white">Replacement Reference</h3>
              </div>
              <p className="text-xs text-slate-400">Photo of the new object to insert into the scene</p>
            </div>
            {imageB && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="h-3 w-3" /> Ready
              </span>
            )}
          </div>

          <div
            onDrop={(e) => handleDrop(e, 'B')}
            onDragOver={handleDragOver}
            onClick={() => !imageB && fileInputBRef.current?.click()}
            className={`relative flex min-h-[300px] flex-1 flex-col items-center justify-center overflow-hidden rounded-xl border-2 transition ${
              imageB
                ? 'border-slate-700 bg-slate-950'
                : 'cursor-pointer border-dashed border-slate-700 hover:border-indigo-500 hover:bg-indigo-950/10'
            }`}
          >
            <input
              ref={fileInputBRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0], 'B')}
            />

            {imageB ? (
              <div className="relative h-full w-full">
                <img
                  src={imageB}
                  alt="Replacement Reference (Image B)"
                  className="h-full max-h-[420px] w-full object-contain p-2"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onImageBChange(null);
                  }}
                  className="absolute top-3 right-3 rounded-lg bg-slate-900/80 p-1.5 text-slate-300 backdrop-blur transition hover:bg-red-600 hover:text-white"
                  title="Remove image"
                  aria-label="Remove Image B"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center p-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 text-indigo-400 mb-3 shadow-inner">
                  <ImageIcon className="h-6 w-6" />
                </div>
                <p className="text-sm font-semibold text-slate-200">
                  Drag &amp; drop Image B or <span className="text-indigo-400 underline">browse</span>
                </p>
                <p className="mt-1 text-xs text-slate-500">Product photo or clean object reference</p>
                <div className="mt-4 rounded-lg bg-slate-800/60 px-3 py-1.5 text-[11px] text-slate-400">
                  Example: Product catalog shot, isolated grips, armchair, watch
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Primary Action Button */}
      <div className="flex flex-col items-center justify-center pt-2">
        <button
          type="button"
          onClick={onAnalyze}
          disabled={!canProceed || isAnalyzing}
          className={`flex items-center gap-2.5 rounded-xl px-8 py-3.5 text-sm font-bold shadow-xl transition-all ${
            canProceed && !isAnalyzing
              ? 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 text-white shadow-indigo-500/25 hover:from-indigo-500 hover:to-violet-500 hover:scale-[1.02] active:scale-[0.98]'
              : 'cursor-not-allowed bg-slate-800 text-slate-500 shadow-none'
          }`}
        >
          <Sparkles className="h-4 w-4 text-amber-300" />
          <span>{isAnalyzing ? 'Analyzing with Gemini Vision...' : 'Analyze Objects with Gemini'}</span>
          <ArrowRight className="h-4 w-4" />
        </button>
        {!canProceed && (
          <p className="mt-2 text-xs text-slate-500">
            Upload both Image A and Image B (or choose a demo preset above) to begin analysis
          </p>
        )}
      </div>
    </div>
  );
};
