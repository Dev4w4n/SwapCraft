import React, { useState, useEffect } from 'react';
import { Sparkles, Eye, Wand2, Box, SunMedium, ShieldCheck } from 'lucide-react';

interface ProcessingModalProps {
  isOpen: boolean;
  type: 'analyze' | 'generate';
  targetObjectName?: string;
}

const ANALYZE_STAGES = [
  { icon: Eye, title: 'Inspecting Image A & Image B', desc: 'Parsing scene composition, camera viewpoint & reference object features...' },
  { icon: Box, title: 'Semantic Object Matching', desc: 'Matching reference object to candidate objects in the scene by category & scale...' },
  { icon: Sparkles, title: 'Spatial Localization', desc: 'Pinpointing precise bounding boxes, multiple instances & segmentation zones...' },
];

const GENERATE_STAGES = [
  { icon: Wand2, title: 'Erasing Target Pixels', desc: 'Completely eliminating original object pixels to prevent ghosting or blending...' },
  { icon: Box, title: 'Generative 3D Warp & Perspective', desc: 'Re-rendering new object conforming to scene vanishing lines & curvature...' },
  { icon: SunMedium, title: 'Lighting & Shadow Integration', desc: 'Synthesizing ambient occlusion, specular highlights & contact shadows...' },
  { icon: ShieldCheck, title: 'Final Pixel Preservation', desc: 'Preserving 100% of surrounding background, controls & occluding hands...' },
];

export const ProcessingModal: React.FC<ProcessingModalProps> = ({
  isOpen,
  type,
  targetObjectName,
}) => {
  const [currentStageIndex, setCurrentStageIndex] = useState<number>(0);
  const stages = type === 'analyze' ? ANALYZE_STAGES : GENERATE_STAGES;

  useEffect(() => {
    if (!isOpen) {
      setCurrentStageIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentStageIndex((prev) => (prev < stages.length - 1 ? prev + 1 : prev));
    }, 2400);

    return () => clearInterval(interval);
  }, [isOpen, stages.length]);

  if (!isOpen) return null;

  const ActiveIcon = stages[currentStageIndex].icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-indigo-500/30 bg-slate-900 p-6 shadow-2xl">
        {/* Ambient background glow */}
        <div className="absolute -top-24 -left-24 h-48 w-48 rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-violet-600/20 blur-3xl" />

        <div className="relative flex flex-col items-center text-center">
          {/* Animated radar/spinner pulse */}
          <div className="relative mb-5 flex h-16 w-16 items-center justify-center">
            <div className="absolute inset-0 rounded-2xl bg-indigo-500/20 animate-ping opacity-75" />
            <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 shadow-xl shadow-indigo-500/30">
              <ActiveIcon className="h-7 w-7 text-white animate-pulse" />
            </div>
          </div>

          <h3 className="text-lg font-bold text-white">
            {type === 'analyze' ? 'Analyzing Scene with Gemini Vision' : `Replacing [${targetObjectName || 'Target'}]`}
          </h3>
          <p className="mt-1 text-xs text-indigo-300 font-medium">
            {stages[currentStageIndex].title}
          </p>
          <p className="mt-1.5 text-xs text-slate-400">
            {stages[currentStageIndex].desc}
          </p>

          {/* Stepper bar */}
          <div className="mt-6 flex w-full gap-1.5">
            {stages.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                  idx <= currentStageIndex
                    ? 'bg-gradient-to-r from-indigo-500 to-violet-500'
                    : 'bg-slate-800'
                }`}
              />
            ))}
          </div>

          <p className="mt-4 text-[11px] text-slate-500">
            Gemini Multimodal Inpainting Pipeline • Powered by Google AI Studio
          </p>
        </div>
      </div>
    </div>
  );
};
