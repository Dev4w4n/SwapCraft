import React, { useState, useRef, useCallback } from 'react';
import {
  Download,
  RotateCcw,
  Sparkles,
  Columns,
  SplitSquareVertical,
  Check,
  ZoomIn,
  Copy,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { downloadImage } from '../utils/image-helpers.ts';

interface ComparisonSliderProps {
  originalImage: string;
  editedImage: string;
  targetObjectName: string;
  onRegenerate: () => void;
  onUndoToDetect: () => void;
  onReset: () => void;
  isRegenerating: boolean;
  modelUsedInfo?: string;
}

export const ComparisonSlider: React.FC<ComparisonSliderProps> = ({
  originalImage,
  editedImage,
  targetObjectName,
  onRegenerate,
  onUndoToDetect,
  onReset,
  isRegenerating,
  modelUsedInfo,
}) => {
  const [sliderPosition, setSliderPosition] = useState<number>(50);
  const [viewMode, setViewMode] = useState<'slider' | 'sideBySide'>('slider');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percent);
  }, []);

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches[0]) {
      handleMove(e.touches[0].clientX);
    }
  };

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      handleMove(e.clientX);
    }
  };

  const handleDownload = () => {
    downloadImage(editedImage, `swapcraft-${targetObjectName.toLowerCase().replace(/\s+/g, '-')}-edited.png`);
  };

  return (
    <div className={`space-y-6 ${isFullscreen ? 'fixed inset-0 z-50 bg-slate-950 p-6 overflow-y-auto' : ''}`}>
      {/* Top Banner / Actions Bar */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
              3
            </span>
            <h2 className="text-xl font-extrabold text-white">
              Object Inpainting Result
            </h2>
            {modelUsedInfo && (
              <span className={`hidden sm:inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${
                modelUsedInfo.includes('Canvas')
                  ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                  : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20'
              }`}>
                <Sparkles className="h-3 w-3 text-amber-400" />
                {modelUsedInfo}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-400">
            {modelUsedInfo?.includes('Canvas')
              ? 'Client-side 2D geometry simulation. (AI neural model was blocked by Free Tier Quota = 0).'
              : `Original [${targetObjectName}] successfully erased and replaced with matching 3D perspective and lighting.`}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View mode toggle */}
          <div className="flex items-center rounded-lg border border-slate-800 bg-slate-950 p-1 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('slider')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1 font-semibold transition ${
                viewMode === 'slider'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <SplitSquareVertical className="h-3.5 w-3.5" />
              <span>Slider</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('sideBySide')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1 font-semibold transition ${
                viewMode === 'sideBySide'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Columns className="h-3.5 w-3.5" />
              <span>Side-by-Side</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-300 hover:text-white"
            title="Toggle fullscreen view"
          >
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{isFullscreen ? 'Exit Full' : 'Expand'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-500 hover:scale-[1.02]"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download Result</span>
          </button>
        </div>
      </div>

      {/* Notice when running on 2D Canvas simulation rather than Neural Diffusion AI */}
      {modelUsedInfo?.includes('Canvas') && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4 text-xs text-amber-200">
          <div className="flex items-start gap-3">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 font-bold">!</span>
            <div className="space-y-1">
              <p className="font-bold text-amber-300">
                Notice: Why does this result look different from ChatGPT / DALL-E 3?
              </p>
              <p className="text-slate-300 leading-relaxed">
                ChatGPT uses a deep neural diffusion model to regenerate pixels photorealistically.
                In this app, Google&apos;s neural image models (<strong>Gemini Nano Banana 2.1</strong> and <strong>Flash Lite Image</strong>) have a free-tier quota of <strong>0 requests</strong> and require a paid API key.
                Because the API request was rejected by quota (Limit: 0), this preview was generated by an emergency fallback <strong>2D HTML5 canvas script</strong> rather than the neural AI model.
              </p>
              <p className="text-amber-400 font-medium pt-1">
                👉 Solution: Activate Google Gemini&apos;s generative image model (<strong>Gemini Nano Banana 2.1</strong>) with a paid API key to generate genuine 1K–4K photorealistic neural inpainting.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Comparison Area */}
      {viewMode === 'slider' ? (
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          onTouchMove={handleTouchMove}
          onClick={(e) => handleMove(e.clientX)}
          className="relative mx-auto flex h-[520px] w-full max-w-5xl cursor-ew-resize select-none items-center justify-center overflow-hidden rounded-2xl border-2 border-slate-800 bg-slate-950 shadow-2xl"
        >
          {/* Before Layer (Original Image A) */}
          <div className="absolute inset-0 flex items-center justify-center">
            <img
              src={originalImage}
              alt="Original Photograph (Before)"
              className="h-full w-full object-contain pointer-events-none"
            />
            <span className="absolute top-4 left-4 z-10 rounded-md bg-slate-950/80 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-slate-300 backdrop-blur border border-slate-800">
              Before (Original)
            </span>
          </div>

          {/* After Layer (Inpainted Edited Image) clipped by slider percentage */}
          <div
            className="absolute inset-0 flex items-center justify-center overflow-hidden"
            style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
          >
            <img
              src={editedImage}
              alt="Inpainted Result (After)"
              className="h-full w-full object-contain pointer-events-none"
            />
            <span className="absolute top-4 right-4 z-10 rounded-md bg-indigo-950/90 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-indigo-300 backdrop-blur border border-indigo-500/40 shadow-lg">
              After (In-Situ Swap)
            </span>
          </div>

          {/* Divider Line & Handle */}
          <div
            className="absolute top-0 bottom-0 z-20 w-1 bg-white shadow-[0_0_12px_rgba(255,255,255,0.7)]"
            style={{ left: `${sliderPosition}%` }}
          >
            <div className="absolute top-1/2 -left-4 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-indigo-600 text-white shadow-xl shadow-indigo-600/50">
              <div className="flex items-center -space-x-1">
                <ChevronLeft className="h-3 w-3" />
                <ChevronRight className="h-3 w-3" />
              </div>
            </div>
          </div>

          {/* Bottom helper tooltip */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 rounded-full bg-slate-950/80 px-4 py-1 text-[11px] font-medium text-slate-400 backdrop-blur border border-slate-800 pointer-events-none">
            Drag slider left &amp; right to compare before &amp; after
          </div>
        </div>
      ) : (
        /* Side by Side Mode */
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="relative flex h-[460px] flex-col items-center justify-center overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 p-2 shadow-lg">
            <span className="absolute top-4 left-4 z-10 rounded-md bg-slate-950/80 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-slate-300 backdrop-blur border border-slate-800">
              Before (Original Scene)
            </span>
            <img
              src={originalImage}
              alt="Original Photograph"
              className="h-full w-full object-contain"
            />
          </div>

          <div className="relative flex h-[460px] flex-col items-center justify-center overflow-hidden rounded-2xl border border-indigo-500/30 bg-slate-950 p-2 shadow-lg">
            <span className="absolute top-4 right-4 z-10 rounded-md bg-indigo-950/90 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-indigo-300 backdrop-blur border border-indigo-500/40">
              After (Generative Inpainting)
            </span>
            <img
              src={editedImage}
              alt="Edited Photograph"
              className="h-full w-full object-contain"
            />
          </div>
        </div>
      )}

      {/* Bottom Workflow Action Bar (Step 7: Regenerate, Undo, Download, Reset) */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onUndoToDetect}
            className="rounded-xl border border-slate-800 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-700 hover:text-white"
          >
            ← Refine Detection / Mask
          </button>
          <button
            type="button"
            onClick={onReset}
            className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-xs font-semibold text-slate-400 transition hover:bg-slate-800 hover:text-white"
          >
            Start Another Swap
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onRegenerate}
            disabled={isRegenerating}
            className="flex items-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-950/40 px-4 py-2 text-xs font-bold text-indigo-300 transition hover:bg-indigo-900/50 hover:text-white disabled:opacity-50"
          >
            <RotateCcw className={`h-3.5 w-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
            <span>{isRegenerating ? 'Regenerating...' : 'Regenerate Variation'}</span>
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:scale-[1.02] active:scale-[0.98]"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download High-Res</span>
          </button>
        </div>
      </div>
    </div>
  );
};
