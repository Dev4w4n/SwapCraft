/**
 * Pure logic and utility functions for Object Swap & Inpainting.
 * Decoupled from React UI for deterministic testing and reliability.
 */

export interface BoundingBox {
  ymin: number;
  xmin: number;
  ymax: number;
  xmax: number;
}

export interface CanvasRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ObjectInstance {
  id: string;
  name: string;
  confidence: number;
  box2d: [number, number, number, number]; // [ymin, xmin, ymax, xmax] normalized 0..1000 or 0..1
  spatialContext?: string;
  notes?: string;
}

export interface ObjectDetectionAnalysis {
  targetObjectName: string;
  targetCategory: string;
  confidenceScore: number;
  explanation: string;
  targetDescription: string;
  replacementDescription: string;
  instances: ObjectInstance[];
  alternativeObjects?: Array<{
    name: string;
    category: string;
    box2d: [number, number, number, number];
    confidence: number;
  }>;
  editingPromptAdvice?: string;
}

/**
 * Normalizes a bounding box coordinate set to [0, 1] range.
 * Supports input coordinates as:
 * - [ymin, xmin, ymax, xmax] (0..1000 or 0..1)
 * - { top, left, bottom, right } or { ymin, xmin, ymax, xmax }
 */
export function normalizeBox(rawBox: any): BoundingBox {
  let ymin = 0;
  let xmin = 0;
  let ymax = 1;
  let xmax = 1;

  if (rawBox && typeof rawBox === 'object' && !Array.isArray(rawBox)) {
    if ('top' in rawBox && 'left' in rawBox) {
      ymin = Number(rawBox.top);
      xmin = Number(rawBox.left);
      ymax = Number(rawBox.bottom ?? (rawBox.top + (rawBox.height || 100)));
      xmax = Number(rawBox.right ?? (rawBox.left + (rawBox.width || 100)));
    } else if ('ymin' in rawBox && 'xmin' in rawBox) {
      ymin = Number(rawBox.ymin);
      xmin = Number(rawBox.xmin);
      ymax = Number(rawBox.ymax);
      xmax = Number(rawBox.xmax);
    }
  } else if (Array.isArray(rawBox) && rawBox.length >= 4) {
    [ymin, xmin, ymax, xmax] = rawBox.map(Number);
  }

  // Detect if coordinates are on 0..1000 scale
  const isThousandScale = ymax > 1.05 || xmax > 1.05 || ymin > 1.05 || xmin > 1.05;
  const factor = isThousandScale ? 1000 : 1;

  // Protect against inverted coordinates (e.g. ymin > ymax)
  const normY1 = Math.max(0, Math.min(1, ymin / factor));
  const normX1 = Math.max(0, Math.min(1, xmin / factor));
  const normY2 = Math.max(0, Math.min(1, ymax / factor));
  const normX2 = Math.max(0, Math.min(1, xmax / factor));

  const nYmin = Math.min(normY1, normY2);
  const nYmax = Math.max(normY1, normY2);
  const nXmin = Math.min(normX1, normX2);
  const nXmax = Math.max(normX1, normX2);

  // Guarantee minimum dimension of at least 0.005 so bounding boxes never collapse
  const safeYmax = Math.max(nYmin + 0.005, nYmax);
  const safeXmax = Math.max(nXmin + 0.005, nXmax);

  return {
    ymin: Number(nYmin.toFixed(4)),
    xmin: Number(nXmin.toFixed(4)),
    ymax: Number(Math.min(1, safeYmax).toFixed(4)),
    xmax: Number(Math.min(1, safeXmax).toFixed(4)),
  };
}

/**
 * Inverts the vertical (Y) axis coordinates of a bounding box.
 * Useful when detection coordinates were measured from bottom-up (Y=0 at bottom)
 * rather than top-down (Y=0 at top).
 */
export function invertVerticalBox(box: [number, number, number, number] | BoundingBox): [number, number, number, number] {
  const norm = normalizeBox(box);
  const invYmin = Math.max(0, Math.min(1, 1 - norm.ymax));
  const invYmax = Math.max(0, Math.min(1, 1 - norm.ymin));

  return [
    Math.round(invYmin * 1000),
    Math.round(norm.xmin * 1000),
    Math.round(invYmax * 1000),
    Math.round(norm.xmax * 1000),
  ];
}

/**
 * Nudges a bounding box by delta X, delta Y, and optional scale factor in normalized [0, 1] units.
 */
export function nudgeBox(
  box: [number, number, number, number] | BoundingBox,
  deltaX: number,
  deltaY: number,
  scale = 1.0
): [number, number, number, number] {
  const norm = normalizeBox(box);
  const curW = norm.xmax - norm.xmin;
  const curH = norm.ymax - norm.ymin;

  const newW = Math.max(0.01, Math.min(1, curW * scale));
  const newH = Math.max(0.01, Math.min(1, curH * scale));

  const centerX = (norm.xmin + norm.xmax) / 2 + deltaX;
  const centerY = (norm.ymin + norm.ymax) / 2 + deltaY;

  const newXmin = Math.max(0, Math.min(1 - newW, centerX - newW / 2));
  const newYmin = Math.max(0, Math.min(1 - newH, centerY - newH / 2));
  const newXmax = Math.min(1, newXmin + newW);
  const newYmax = Math.min(1, newYmin + newH);

  // Return in 0..1000 standard format
  return [
    Math.round(newYmin * 1000),
    Math.round(newXmin * 1000),
    Math.round(newYmax * 1000),
    Math.round(newXmax * 1000),
  ];
}

/**
 * Directly updates a box from canvas pixel coordinates back to [0..1000] standard format.
 */
export function fromCanvasCoords(
  x: number,
  y: number,
  width: number,
  height: number,
  canvasWidth: number,
  canvasHeight: number
): [number, number, number, number] {
  const safeW = Math.max(1, canvasWidth);
  const safeH = Math.max(1, canvasHeight);

  const xmin = Math.max(0, Math.min(1, x / safeW));
  const ymin = Math.max(0, Math.min(1, y / safeH));
  const xmax = Math.max(xmin + 0.005, Math.min(1, (x + width) / safeW));
  const ymax = Math.max(ymin + 0.005, Math.min(1, (y + height) / safeH));

  return [
    Math.round(ymin * 1000),
    Math.round(xmin * 1000),
    Math.round(ymax * 1000),
    Math.round(xmax * 1000),
  ];
}

/**
 * Converts normalized bounding box to canvas pixel coordinates.
 */
export function toCanvasCoords(box: BoundingBox | [number, number, number, number], canvasWidth: number, canvasHeight: number): CanvasRect {
  const norm = normalizeBox(box);
  const x = Math.round(norm.xmin * canvasWidth);
  const y = Math.round(norm.ymin * canvasHeight);
  const width = Math.round((norm.xmax - norm.xmin) * canvasWidth);
  const height = Math.round((norm.ymax - norm.ymin) * canvasHeight);

  return { x, y, width, height };
}

/**
 * Tests if a normalized point (nx, ny in 0..1) is inside a bounding box.
 */
export function isPointInsideBox(point: { x: number; y: number }, box: BoundingBox): boolean {
  const norm = normalizeBox(box);
  return (
    point.x >= norm.xmin &&
    point.x <= norm.xmax &&
    point.y >= norm.ymin &&
    point.y <= norm.ymax
  );
}

/**
 * Computes the union bounding box enclosing all provided boxes.
 */
export function computeBoxUnion(boxes: Array<[number, number, number, number] | BoundingBox>): BoundingBox {
  if (boxes.length === 0) {
    return { ymin: 0, xmin: 0, ymax: 1, xmax: 1 };
  }

  const normalized = boxes.map(normalizeBox);
  const ymin = Math.min(...normalized.map(b => b.ymin));
  const xmin = Math.min(...normalized.map(b => b.xmin));
  const ymax = Math.max(...normalized.map(b => b.ymax));
  const xmax = Math.max(...normalized.map(b => b.xmax));

  return { ymin, xmin, ymax, xmax };
}

export function parseBase64DataUrl(dataUrl: string): { mimeType: string; base64: string } | null {
  if (!dataUrl || typeof dataUrl !== 'string') return null;

  // Case 1: Standard base64 data URL
  const match = dataUrl.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
  if (match) {
    return {
      mimeType: match[1],
      base64: match[2],
    };
  }

  // Case 2: UTF-8 / URL-encoded data URL (e.g. data:image/svg+xml;utf8,<svg...)
  const generalMatch = dataUrl.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+)(?:;[a-zA-Z0-9-]+)?,(.*)$/);
  if (generalMatch) {
    try {
      const raw = decodeURIComponent(generalMatch[2]);
      const b64 = typeof Buffer !== 'undefined'
        ? Buffer.from(raw, 'utf-8').toString('base64')
        : btoa(unescape(encodeURIComponent(raw)));
      return {
        mimeType: generalMatch[1],
        base64: b64,
      };
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Formats confidence score into a user-friendly percentage string.
 */
export function formatConfidence(score: number): string {
  const bounded = Math.max(0, Math.min(1, score));
  return `${Math.round(bounded * 100)}%`;
}

export interface PromptBuildParams {
  targetObjectName: string;
  targetCategory?: string;
  replacementObjectName?: string;
  replacementDescription?: string;
  instancesCount: number;
  instancesDetails?: string[];
  userNotes?: string;
}

/**
 * Constructs the rigorous generative inpainting prompt conforming to
 * Section 4 & 8 quality assurance requirements.
 */
export function buildSwapInpaintingPrompt(params: PromptBuildParams): string {
  const {
    targetObjectName,
    targetCategory = 'object',
    replacementObjectName = 'replacement reference object',
    replacementDescription = '',
    instancesCount = 1,
    instancesDetails = [],
    userNotes = '',
  } = params;

  const instanceText = instancesCount > 1
    ? `There are ${instancesCount} distinct instances of the target object to substitute (${instancesDetails.join('; ')}). Generate both/all instances symmetrically and consistently, matching each location's specific angle and perspective.`
    : `There is 1 primary instance of the target object to substitute (${instancesDetails[0] || 'designated target region'}).`;

  const customNotesSection = userNotes.trim()
    ? `\nUser Specific Instructions:\n- ${userNotes.trim()}`
    : '';

  return `TASK: Advanced Generative Inpainting and In-Situ Object Substitution.

You are provided with two images:
- Image 1: The original photograph containing the target [${targetObjectName}] (${targetCategory}) that must be replaced.
- Image 2: The replacement reference photograph showing the new [${replacementObjectName}].

EXECUTION REQUIREMENTS:
1. Complete Erasure & Clean Inpainting:
   - Completely remove and erase the original [${targetObjectName}] pixels from Image 1.
   - Do NOT simply overlay, paste, collage, or blend Image 2 on top. No ghosting or remnants of the original object should remain underneath.

2. Physical & Mechanical In-Situ Installation (NOT 2D Pasting):
   - The replacement object must look genuinely, physically installed onto the host structure or environment, not pasted or collaged on top.
   - For tubular controls (e.g. handlebar grips): The grip must look like a cylindrical sleeve slid tightly over the chrome handlebar tube, aligned with the bar's angle and perspective. Include authentic mechanical joints (bar-end cap on the outer edge, switch gear/clamp on the inner edge).
   - FOREGROUND OCCLUSIONS (CRITICAL): If human fingers, gloves, hands, levers, cables, or clothing wrap around or overlap the target object in Image 1, they MUST remain in the foreground, realistically gripping or draping over the new installed part. Do NOT paste the new object over hands or levers.
   - Accurately bend, warp, and conform the replacement object's 3D geometry to match the viewing perspective, camera focal length, vanishing lines, and surface curvature of the original scene.
   ${replacementDescription ? `- Incorporate the reference attributes: ${replacementDescription}.` : ''}

3. Lighting, Shadow & Environment Integration:
   - Match the scene's ambient illumination, key lights, directional sunlight, and color temperature.
   - Generate realistic contact shadows, cast shadows, specular highlights, and ambient occlusion where the new object touches or meets adjacent surfaces.

4. Occlusion & Edge Preservation:
   - Respect all occluding elements: human fingers, hands, straps, clamps, or foreground surfaces overlapping the object in Image 1 must remain visible in front of the newly installed object.

5. Surrounding Environment Preservation:
   - Leave 100% of all other pixels outside the target zone completely untouched and photorealistically identical to Image 1 (background, secondary objects, texts, controls, lens distortion, and grain).

6. Multi-Instance Consistency:
   - ${instanceText}
${customNotesSection}

OUTPUT REQUIREMENT:
Generate and return the full edited photograph with seamless generative inpainting where the replacement object looks physically installed in the scene.`;
}
