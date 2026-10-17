import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Layers,
  Wand2,
  Brush,
  Eraser,
  RotateCcw,
  Sliders,
  CheckCircle2,
  Eye,
  EyeOff,
  Crosshair,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ZoomIn,
  ZoomOut,
  ArrowUpDown,
  Move,
} from 'lucide-react';
import {
  ObjectDetectionAnalysis,
  ObjectInstance,
  normalizeBox,
  nudgeBox,
  invertVerticalBox,
  toCanvasCoords,
  fromCanvasCoords,
  formatConfidence,
} from '../utils/swap-logic.ts';

interface ObjectDetectionViewerProps {
  imageA: string;
  imageB: string;
  analysis: ObjectDetectionAnalysis;
  onConfirmAndGenerate: (params: {
    targetObjectName: string;
    targetCategory: string;
    instances: ObjectInstance[];
    userNotes: string;
    maskDataUrl?: string;
    model?: string;
    imageSize?: string;
  }) => void;
  onBackToUpload: () => void;
  isGenerating: boolean;
}

type DragMode = 'none' | 'move' | 'n' | 's' | 'e' | 'w' | 'nw' | 'ne' | 'sw' | 'se';

export const ObjectDetectionViewer: React.FC<ObjectDetectionViewerProps> = ({
  imageA,
  imageB,
  analysis,
  onConfirmAndGenerate,
  onBackToUpload,
  isGenerating,
}) => {
  const [selectedTargetName, setSelectedTargetName] = useState<string>(analysis.targetObjectName);
  const [selectedCategory, setSelectedCategory] = useState<string>(analysis.targetCategory);
  const [instances, setInstances] = useState<ObjectInstance[]>(analysis.instances || []);
  const [userNotes, setUserNotes] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'boxes' | 'brush'>('boxes');
  const [showOverlays, setShowOverlays] = useState<boolean>(true);

  // Model & Resolution selection (Flagship Gemini Nano Banana 2.1 for photorealistic neural inpainting)
  const [selectedModel, setSelectedModel] = useState<string>('gemini-nano-banana-2.1');
  const [selectedResolution, setSelectedResolution] = useState<'1K' | '2K' | '4K'>('2K');

  // Active target instance being fine-tuned
  const [selectedInstanceIdx, setSelectedInstanceIdx] = useState<number>(0);

  // Brush mask state
  const [brushSize, setBrushSize] = useState<number>(30);
  const [isErasing, setIsErasing] = useState<boolean>(false);
  const [hasDrawnMask, setHasDrawnMask] = useState<boolean>(false);

  // Canvas refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);

  // Direct Interactive Box Dragging & Resizing State
  const [dragMode, setDragMode] = useState<DragMode>('none');
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; box: [number, number, number, number] }>({
    mouseX: 0,
    mouseY: 0,
    box: [0, 0, 0, 0],
  });

  // Nudge active instance box vertically or horizontally
  const handleNudgeBox = (deltaX: number, deltaY: number, scale = 1.0) => {
    if (!instances[selectedInstanceIdx]) return;
    const updated = instances.map((inst, idx) => {
      if (idx !== selectedInstanceIdx) return inst;
      return {
        ...inst,
        box2d: nudgeBox(inst.box2d, deltaX, deltaY, scale),
      };
    });
    setInstances(updated);
  };

  // Flip vertical axis (Invert Y) for active instance
  const handleInvertVerticalAxis = (targetIdx = selectedInstanceIdx) => {
    if (!instances[targetIdx]) return;
    const updated = instances.map((inst, idx) => {
      if (idx !== targetIdx) return inst;
      return {
        ...inst,
        box2d: invertVerticalBox(inst.box2d),
      };
    });
    setInstances(updated);
  };

  // Reset boxes to initial analysis detection
  const handleResetBoxes = () => {
    if (analysis.instances) {
      setInstances(analysis.instances);
    }
  };

  // Render bounding boxes over Image A
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = imageA;
    img.onload = () => {
      canvas.width = img.naturalWidth || 800;
      canvas.height = img.naturalHeight || 600;

      // Ensure mask canvas matches dimensions
      if (maskCanvasRef.current) {
        maskCanvasRef.current.width = canvas.width;
        maskCanvasRef.current.height = canvas.height;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      if (!showOverlays) return;

      // Draw bounding boxes for target instances
      instances.forEach((inst, index) => {
        const isSelected = index === selectedInstanceIdx;
        const coords = toCanvasCoords(normalizeBox(inst.box2d), canvas.width, canvas.height);

        // Semi-transparent highlight box
        ctx.fillStyle = isSelected ? 'rgba(99, 102, 241, 0.28)' : 'rgba(99, 102, 241, 0.15)';
        ctx.fillRect(coords.x, coords.y, coords.width, coords.height);

        // Dashed animated-looking perimeter
        ctx.strokeStyle = isSelected ? '#a5b4fc' : '#6366f1';
        ctx.lineWidth = isSelected ? 3 : 2;
        ctx.setLineDash([8, 6]);
        ctx.strokeRect(coords.x, coords.y, coords.width, coords.height);
        ctx.setLineDash([]);

        // Corner accents
        const cornerLen = 14;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = isSelected ? 4 : 3;
        // Top-left
        ctx.beginPath();
        ctx.moveTo(coords.x, coords.y + cornerLen);
        ctx.lineTo(coords.x, coords.y);
        ctx.lineTo(coords.x + cornerLen, coords.y);
        ctx.stroke();

        // Top-right
        ctx.beginPath();
        ctx.moveTo(coords.x + coords.width - cornerLen, coords.y);
        ctx.lineTo(coords.x + coords.width, coords.y);
        ctx.lineTo(coords.x + coords.width, coords.y + cornerLen);
        ctx.stroke();

        // Bottom-left
        ctx.beginPath();
        ctx.moveTo(coords.x, coords.y + coords.height - cornerLen);
        ctx.lineTo(coords.x, coords.y + coords.height);
        ctx.lineTo(coords.x + cornerLen, coords.y + coords.height);
        ctx.stroke();

        // Bottom-right
        ctx.beginPath();
        ctx.moveTo(coords.x + coords.width - cornerLen, coords.y + coords.height);
        ctx.lineTo(coords.x + coords.width, coords.y + coords.height);
        ctx.lineTo(coords.x + coords.width, coords.y + coords.height - cornerLen);
        ctx.stroke();

        // Interactive resize handles for selected box
        if (isSelected && activeTab === 'boxes') {
          const handleSize = 8;
          ctx.fillStyle = '#ffffff';
          ctx.strokeStyle = '#4f46e5';
          ctx.lineWidth = 2;

          // Top middle (Y handle)
          ctx.fillRect(coords.x + coords.width / 2 - handleSize / 2, coords.y - handleSize / 2, handleSize, handleSize);
          ctx.strokeRect(coords.x + coords.width / 2 - handleSize / 2, coords.y - handleSize / 2, handleSize, handleSize);

          // Bottom middle (Y handle)
          ctx.fillRect(coords.x + coords.width / 2 - handleSize / 2, coords.y + coords.height - handleSize / 2, handleSize, handleSize);
          ctx.strokeRect(coords.x + coords.width / 2 - handleSize / 2, coords.y + coords.height - handleSize / 2, handleSize, handleSize);

          // Left middle (X handle)
          ctx.fillRect(coords.x - handleSize / 2, coords.y + coords.height / 2 - handleSize / 2, handleSize, handleSize);
          ctx.strokeRect(coords.x - handleSize / 2, coords.y + coords.height / 2 - handleSize / 2, handleSize, handleSize);

          // Right middle (X handle)
          ctx.fillRect(coords.x + coords.width - handleSize / 2, coords.y + coords.height / 2 - handleSize / 2, handleSize, handleSize);
          ctx.strokeRect(coords.x + coords.width - handleSize / 2, coords.y + coords.height / 2 - handleSize / 2, handleSize, handleSize);
        }

        // Label pill
        const labelText = `${inst.name || `Target ${index + 1}`} (${formatConfidence(inst.confidence || 0.95)})`;
        ctx.font = 'bold 13px "Plus Jakarta Sans", sans-serif';
        const textWidth = ctx.measureText(labelText).width;

        const tagX = Math.max(8, coords.x);
        const tagY = Math.max(24, coords.y - 8);

        ctx.fillStyle = isSelected ? '#4f46e5' : '#334155';
        ctx.beginPath();
        ctx.roundRect(tagX, tagY - 18, textWidth + 16, 22, 6);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.fillText(labelText, tagX + 8, tagY - 2);
      });
    };
  }, [imageA, instances, showOverlays, selectedInstanceIdx, activeTab]);

  // Handle Box Canvas Mouse Interactions (Dragging & Resizing)
  const getCanvasPoint = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleBoxMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTab !== 'boxes' || !showOverlays) return;
    const pt = getCanvasPoint(e);
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Check if clicked inside or on handles of selected box
    const activeInst = instances[selectedInstanceIdx];
    if (activeInst) {
      const coords = toCanvasCoords(normalizeBox(activeInst.box2d), canvas.width, canvas.height);
      const handleTolerance = 12;

      // Check vertical handles
      if (Math.abs(pt.y - coords.y) <= handleTolerance && Math.abs(pt.x - (coords.x + coords.width / 2)) <= coords.width / 2) {
        setDragMode('n');
        dragStartRef.current = { mouseX: pt.x, mouseY: pt.y, box: [...activeInst.box2d] };
        return;
      }
      if (Math.abs(pt.y - (coords.y + coords.height)) <= handleTolerance && Math.abs(pt.x - (coords.x + coords.width / 2)) <= coords.width / 2) {
        setDragMode('s');
        dragStartRef.current = { mouseX: pt.x, mouseY: pt.y, box: [...activeInst.box2d] };
        return;
      }
      // Check horizontal handles
      if (Math.abs(pt.x - coords.x) <= handleTolerance && Math.abs(pt.y - (coords.y + coords.height / 2)) <= coords.height / 2) {
        setDragMode('w');
        dragStartRef.current = { mouseX: pt.x, mouseY: pt.y, box: [...activeInst.box2d] };
        return;
      }
      if (Math.abs(pt.x - (coords.x + coords.width)) <= handleTolerance && Math.abs(pt.y - (coords.y + coords.height / 2)) <= coords.height / 2) {
        setDragMode('e');
        dragStartRef.current = { mouseX: pt.x, mouseY: pt.y, box: [...activeInst.box2d] };
        return;
      }

      // Check if inside box body to move
      if (pt.x >= coords.x && pt.x <= coords.x + coords.width && pt.y >= coords.y && pt.y <= coords.y + coords.height) {
        setDragMode('move');
        dragStartRef.current = { mouseX: pt.x, mouseY: pt.y, box: [...activeInst.box2d] };
        return;
      }
    }

    // Check if clicked another instance box
    for (let i = 0; i < instances.length; i++) {
      const coords = toCanvasCoords(normalizeBox(instances[i].box2d), canvas.width, canvas.height);
      if (pt.x >= coords.x && pt.x <= coords.x + coords.width && pt.y >= coords.y && pt.y <= coords.y + coords.height) {
        setSelectedInstanceIdx(i);
        setDragMode('move');
        dragStartRef.current = { mouseX: pt.x, mouseY: pt.y, box: [...instances[i].box2d] };
        return;
      }
    }
  };

  const handleBoxMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTab !== 'boxes' || !showOverlays) return;
    const pt = getCanvasPoint(e);
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (dragMode !== 'none') {
      const deltaX = (pt.x - dragStartRef.current.mouseX) / canvas.width;
      const deltaY = (pt.y - dragStartRef.current.mouseY) / canvas.height;
      const orig = dragStartRef.current.box;
      const origNorm = normalizeBox(orig);

      let newYmin = origNorm.ymin;
      let newXmin = origNorm.xmin;
      let newYmax = origNorm.ymax;
      let newXmax = origNorm.xmax;

      if (dragMode === 'move') {
        const w = origNorm.xmax - origNorm.xmin;
        const h = origNorm.ymax - origNorm.ymin;
        newXmin = Math.max(0, Math.min(1 - w, origNorm.xmin + deltaX));
        newYmin = Math.max(0, Math.min(1 - h, origNorm.ymin + deltaY));
        newXmax = newXmin + w;
        newYmax = newYmin + h;
      } else if (dragMode === 'n') {
        newYmin = Math.max(0, Math.min(origNorm.ymax - 0.01, origNorm.ymin + deltaY));
      } else if (dragMode === 's') {
        newYmax = Math.min(1, Math.max(origNorm.ymin + 0.01, origNorm.ymax + deltaY));
      } else if (dragMode === 'w') {
        newXmin = Math.max(0, Math.min(origNorm.xmax - 0.01, origNorm.xmin + deltaX));
      } else if (dragMode === 'e') {
        newXmax = Math.min(1, Math.max(origNorm.xmin + 0.01, origNorm.xmax + deltaX));
      }

      const updatedBox: [number, number, number, number] = [
        Math.round(newYmin * 1000),
        Math.round(newXmin * 1000),
        Math.round(newYmax * 1000),
        Math.round(newXmax * 1000),
      ];

      setInstances((prev) =>
        prev.map((inst, idx) => (idx === selectedInstanceIdx ? { ...inst, box2d: updatedBox } : inst))
      );
    }
  };

  const handleBoxMouseUp = () => {
    if (dragMode !== 'none') {
      setDragMode('none');
    }
  };

  // Handle drawing on custom mask canvas
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTab !== 'brush') return;
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    setHasDrawnMask(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing && e.type !== 'mousedown') return;
    const canvas = maskCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (isErasing) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(239, 68, 68, 0.6)';
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
      ctx.beginPath();
      ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const clearCustomMask = () => {
    const canvas = maskCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasDrawnMask(false);
    }
  };

  const handleSelectAlternative = (alt: {
    name: string;
    category: string;
    box2d: [number, number, number, number];
    confidence: number;
  }) => {
    setSelectedTargetName(alt.name);
    setSelectedCategory(alt.category);
    setInstances([
      {
        id: `alt-${Date.now()}`,
        name: alt.name,
        confidence: alt.confidence,
        box2d: alt.box2d,
        spatialContext: `User selected alternative object: ${alt.name}`,
      },
    ]);
  };

  const handleExecute = () => {
    let maskDataUrl: string | undefined = undefined;
    if (hasDrawnMask && maskCanvasRef.current) {
      maskDataUrl = maskCanvasRef.current.toDataURL('image/png');
    }

    onConfirmAndGenerate({
      targetObjectName: selectedTargetName,
      targetCategory: selectedCategory,
      instances,
      userNotes,
      maskDataUrl,
      model: selectedModel,
      imageSize: selectedResolution,
    });
  };

  const activeBox = instances[selectedInstanceIdx]?.box2d || [0, 0, 0, 0];

  return (
    <div className="space-y-6">
      {/* Top action header */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
              2
            </span>
            <h2 className="text-xl font-extrabold text-white">
              AI Object Detection &amp; Target Confirmation
            </h2>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Gemini identified target objects in Image A. Review, calibrate vertical/horizontal axis, drag boxes, or paint custom masks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBackToUpload}
            className="rounded-lg border border-slate-800 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-700 hover:text-white"
          >
            ← Change Images
          </button>
          <button
            type="button"
            onClick={handleExecute}
            disabled={isGenerating}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-500/25 transition hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            <Wand2 className="h-4 w-4" />
            <span>{isGenerating ? 'Inpainting Scene...' : 'Execute In-Situ Swap'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Visual Canvas Area (7 cols) */}
        <div className="lg:col-span-7 flex flex-col rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          {/* Canvas toolbar */}
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-1 rounded-lg bg-slate-950 p-1 border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('boxes')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1 font-semibold transition ${
                  activeTab === 'boxes'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Crosshair className="h-3.5 w-3.5" />
                <span>AI Detected Boxes ({instances.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('brush')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1 font-semibold transition ${
                  activeTab === 'brush'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Brush className="h-3.5 w-3.5" />
                <span>Custom Brush Mask</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowOverlays(!showOverlays)}
                className="flex items-center gap-1 rounded-md border border-slate-800 bg-slate-950 px-2.5 py-1 text-xs text-slate-400 hover:text-slate-200"
                title="Toggle bounding box highlights"
              >
                {showOverlays ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                <span>{showOverlays ? 'Hide Box' : 'Show Box'}</span>
              </button>
            </div>
          </div>

          {/* Interactive Bounding Box Axis Calibration & Nudge Controls */}
          {activeTab === 'boxes' && showOverlays && instances.length > 0 && (
            <div className="mb-3 space-y-2 rounded-xl bg-slate-950/80 p-3 border border-indigo-500/20 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-slate-400">Target:</span>
                  {instances.map((inst, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedInstanceIdx(idx)}
                      className={`rounded-md px-2.5 py-1 text-[11px] font-bold transition ${
                        selectedInstanceIdx === idx
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      {inst.name || `Target ${idx + 1}`}
                    </button>
                  ))}
                </div>

                {/* Coordinate Readout */}
                <div className="flex items-center gap-2 text-[10px] text-slate-400 bg-slate-900/90 px-2.5 py-1 rounded-md border border-slate-800 font-mono">
                  <span className="text-indigo-300 font-semibold">Vertical (Y):</span>
                  <span>{activeBox[0]}..{activeBox[2]}</span>
                  <span className="text-slate-600">|</span>
                  <span className="text-indigo-300 font-semibold">Horizontal (X):</span>
                  <span>{activeBox[1]}..{activeBox[3]}</span>
                </div>
              </div>

              {/* Axis Calibration Buttons: Vertical Inversion & Nudge */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
                {/* Vertical Invert Button */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleInvertVerticalAxis(selectedInstanceIdx)}
                    className="flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 transition shadow-sm"
                    title="Invert Vertical Axis (Flip Y top-to-bottom if detection was bottom-up)"
                  >
                    <ArrowUpDown className="h-3.5 w-3.5 text-amber-400" />
                    <span>Flip / Invert Y Axis</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetBoxes}
                    className="rounded-lg border border-slate-800 bg-slate-900 px-2 py-1 text-[11px] text-slate-400 hover:text-white"
                    title="Reset to default detection coordinates"
                  >
                    Reset
                  </button>
                </div>

                {/* Nudge Vertical (Y) & Horizontal (X) Controls */}
                <div className="flex flex-wrap items-center gap-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mr-1">
                    Nudge:
                  </span>
                  <button
                    type="button"
                    onClick={() => handleNudgeBox(0, -0.025)}
                    className="flex items-center gap-0.5 rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-slate-200 hover:border-indigo-500 hover:bg-slate-800"
                    title="Shift Box UP (decrease Y)"
                  >
                    <ArrowUp className="h-3 w-3 text-indigo-400" />
                    <span>Up (Y)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNudgeBox(0, 0.025)}
                    className="flex items-center gap-0.5 rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-slate-200 hover:border-indigo-500 hover:bg-slate-800"
                    title="Shift Box DOWN (increase Y)"
                  >
                    <ArrowDown className="h-3 w-3 text-indigo-400" />
                    <span>Down (Y)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNudgeBox(-0.025, 0)}
                    className="flex items-center gap-0.5 rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-slate-200 hover:border-indigo-500 hover:bg-slate-800"
                    title="Shift Box LEFT (decrease X)"
                  >
                    <ArrowLeft className="h-3 w-3 text-indigo-400" />
                    <span>Left (X)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNudgeBox(0.025, 0)}
                    className="flex items-center gap-0.5 rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-slate-200 hover:border-indigo-500 hover:bg-slate-800"
                    title="Shift Box RIGHT (increase X)"
                  >
                    <ArrowRight className="h-3 w-3 text-indigo-400" />
                    <span>Right (X)</span>
                  </button>

                  <div className="h-4 w-[1px] bg-slate-800 mx-1" />

                  <button
                    type="button"
                    onClick={() => handleNudgeBox(0, 0, 1.1)}
                    className="flex items-center gap-0.5 rounded-md border border-slate-700 bg-slate-900 px-1.5 py-1 text-slate-200 hover:border-indigo-500"
                    title="Enlarge Bounding Box"
                  >
                    <ZoomIn className="h-3 w-3 text-emerald-400" />
                    <span>+</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNudgeBox(0, 0, 0.9)}
                    className="flex items-center gap-0.5 rounded-md border border-slate-700 bg-slate-900 px-1.5 py-1 text-slate-200 hover:border-indigo-500"
                    title="Shrink Bounding Box"
                  >
                    <ZoomOut className="h-3 w-3 text-amber-400" />
                    <span>-</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Interactive Brush Controls when in Brush mode */}
          {activeTab === 'brush' && (
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-950/80 p-2.5 border border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsErasing(false)}
                  className={`flex items-center gap-1 rounded-md px-2.5 py-1 font-semibold ${
                    !isErasing
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <Brush className="h-3.5 w-3.5" />
                  Paint Mask
                </button>
                <button
                  type="button"
                  onClick={() => setIsErasing(true)}
                  className={`flex items-center gap-1 rounded-md px-2.5 py-1 font-semibold ${
                    isErasing
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <Eraser className="h-3.5 w-3.5" />
                  Eraser
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-400">Size: {brushSize}px</span>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={brushSize}
                  onChange={(e) => setBrushSize(Number(e.target.value))}
                  className="h-1.5 w-24 accent-indigo-500 cursor-pointer"
                />
                <button
                  type="button"
                  onClick={clearCustomMask}
                  className="rounded-md border border-slate-800 bg-slate-900 px-2 py-1 text-slate-400 hover:text-white"
                  title="Clear mask"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Canvas Viewport with Direct Drag & Resize */}
          <div
            ref={containerRef}
            className="relative flex flex-1 items-center justify-center overflow-hidden rounded-xl bg-slate-950 min-h-[380px] select-none"
          >
            {/* Base Image + Bounding Box Canvas */}
            <canvas
              ref={canvasRef}
              onMouseDown={handleBoxMouseDown}
              onMouseMove={handleBoxMouseMove}
              onMouseUp={handleBoxMouseUp}
              onMouseLeave={handleBoxMouseUp}
              className={`max-h-[500px] max-w-full object-contain ${
                activeTab === 'boxes' ? 'cursor-move' : ''
              }`}
            />

            {/* Brush Overlay Canvas */}
            <canvas
              ref={maskCanvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              className={`absolute inset-0 max-h-[500px] max-w-full object-contain ${
                activeTab === 'brush' ? 'cursor-crosshair z-10' : 'pointer-events-none'
              }`}
            />
          </div>

          <p className="mt-2 text-center text-[11px] text-slate-500">
            {activeTab === 'boxes'
              ? 'Click & drag the box on the image to position. Use handles or buttons above to adjust the vertical (Y) axis.'
              : 'Click and drag on the image above to paint or refine custom inpainting regions'}
          </p>
        </div>

        {/* Right Column: AI Analysis Card & Fine-Tuning (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Main Detected Target Card */}
          <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-b from-indigo-950/30 to-slate-900/60 p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Confidence: {formatConfidence(analysis.confidenceScore || 0.98)}
              </span>
              <span className="text-xs text-indigo-400 font-medium">
                {instances.length} {instances.length === 1 ? 'Instance' : 'Instances'} Detected
              </span>
            </div>

            <div className="mt-3">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Target Object to Replace
              </label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="text"
                  value={selectedTargetName}
                  onChange={(e) => setSelectedTargetName(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm font-bold text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            {/* AI Explanation / Rationale */}
            <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950/70 p-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-300">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Gemini Multimodal Match Rationale</span>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
                {analysis.explanation}
              </p>
            </div>

            {/* Target Instances Details with One-Click Flip Button */}
            <div className="mt-3 space-y-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Detected Target Instances:
              </span>
              {instances.map((inst, idx) => (
                <div
                  key={inst.id || idx}
                  className={`flex items-start justify-between gap-2 rounded-lg border p-2.5 text-xs transition ${
                    selectedInstanceIdx === idx
                      ? 'border-indigo-500/60 bg-indigo-950/30'
                      : 'border-slate-800/80 bg-slate-950/40'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-600/80 text-[10px] font-bold text-white mt-0.5">
                      {idx + 1}
                    </span>
                    <div>
                      <span className="font-semibold text-slate-200">{inst.name}</span>
                      {inst.spatialContext && (
                        <p className="text-[11px] text-slate-400">{inst.spatialContext}</p>
                      )}
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                        Y: {inst.box2d[0]}..{inst.box2d[2]} | X: {inst.box2d[1]}..{inst.box2d[3]}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleInvertVerticalAxis(idx)}
                      className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[10px] font-semibold text-amber-300 hover:bg-amber-500/20"
                      title="Invert Vertical Y Axis for this instance"
                    >
                      Flip Y
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedInstanceIdx(idx)}
                      className={`rounded-md px-2 py-1 text-[10px] font-semibold ${
                        selectedInstanceIdx === idx
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {selectedInstanceIdx === idx ? 'Editing' : 'Select'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Reference Object Preview Thumbnail */}
            <div className="mt-4 flex items-center gap-3 border-t border-slate-800/80 pt-3">
              <img
                src={imageB}
                alt="Replacement Reference"
                className="h-14 w-14 rounded-lg border border-slate-700 bg-slate-950 object-cover"
              />
              <div className="flex-1 overflow-hidden">
                <span className="text-[11px] font-semibold text-indigo-400 uppercase">
                  Replacement Source (Image B)
                </span>
                <p className="line-clamp-2 text-xs text-slate-300 mt-0.5">
                  {analysis.replacementDescription || 'New reference object'}
                </p>
              </div>
            </div>
          </div>

          {/* Alternative Detected Objects (User Confirmation / Switch Target) */}
          {analysis.alternativeObjects && analysis.alternativeObjects.length > 0 && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                <Layers className="h-3.5 w-3.5 text-indigo-400" />
                <span>Other Detected Objects in Scene (Switch Target):</span>
              </div>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {analysis.alternativeObjects.map((alt, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSelectAlternative(alt)}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1 text-xs text-slate-300 transition hover:border-indigo-500 hover:text-white"
                  >
                    <span>{alt.name}</span>
                    <span className="text-[10px] text-slate-500">
                      ({formatConfidence(alt.confidence)})
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Inpainting Prompt Tuning / User Notes */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
              <Sliders className="h-3.5 w-3.5 text-indigo-400" />
              <span>Prompt Adjustments &amp; Material Notes (Optional)</span>
            </div>
            <textarea
              rows={2}
              value={userNotes}
              onChange={(e) => setUserNotes(e.target.value)}
              placeholder="e.g. Add subtle contact shadows under rider gloves; match warm sunset lighting; keep metallic sheen."
              className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* AI Generative Inpainting Model & Ultra HD Quality */}
          <div className="rounded-2xl border border-indigo-500/40 bg-gradient-to-b from-indigo-950/40 to-slate-900/60 p-4 space-y-3 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                <Sparkles className="h-4 w-4 text-amber-400" />
                <span>AI Neural Inpainting Model</span>
              </div>
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-400 border border-emerald-500/30">
                Paid Key Active
              </span>
            </div>

            {/* Model options */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setSelectedModel('gemini-nano-banana-2.1')}
                className={`flex flex-col items-start rounded-xl border p-2.5 transition text-left ${
                  selectedModel === 'gemini-nano-banana-2.1'
                    ? 'border-indigo-500 bg-indigo-600/20 text-white shadow-sm ring-1 ring-indigo-500/50'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-1 font-bold text-slate-100">
                  <span>Nano Banana 2.1</span>
                  <span className="rounded bg-indigo-500/30 px-1 text-[9px] text-indigo-300 font-extrabold">Ultra HD</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5">Photorealistic 4K Neural Diffusion</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedModel('gemini-3.1-flash-lite-image')}
                className={`flex flex-col items-start rounded-xl border p-2.5 transition text-left ${
                  selectedModel === 'gemini-3.1-flash-lite-image'
                    ? 'border-indigo-500 bg-indigo-600/20 text-white shadow-sm ring-1 ring-indigo-500/50'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-1 font-bold text-slate-100">
                  <span>Flash Lite Image</span>
                  <span className="rounded bg-slate-800 px-1 text-[9px] text-slate-400">Fast</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5">Standard Speed Inpainting</span>
              </button>
            </div>

            {/* Resolution Selector for Nano Banana */}
            {selectedModel === 'gemini-nano-banana-2.1' && (
              <div className="flex items-center justify-between border-t border-slate-800/80 pt-2.5 text-xs">
                <span className="text-[11px] font-semibold text-slate-400">Output Resolution:</span>
                <div className="flex items-center gap-1 rounded-lg bg-slate-950 p-1 border border-slate-800">
                  {(['1K', '2K', '4K'] as const).map((res) => (
                    <button
                      key={res}
                      type="button"
                      onClick={() => setSelectedResolution(res)}
                      className={`rounded px-2.5 py-0.5 text-[10px] font-bold transition ${
                        selectedResolution === res
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {res}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
