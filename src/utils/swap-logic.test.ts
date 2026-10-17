import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeBox,
  nudgeBox,
  toCanvasCoords,
  isPointInsideBox,
  computeBoxUnion,
  parseBase64DataUrl,
  formatConfidence,
  buildSwapInpaintingPrompt,
  invertVerticalBox,
} from './swap-logic.ts';

test('normalizeBox normalizes 0..1000 Gemini bounding boxes correctly', () => {
  const rawBox: [number, number, number, number] = [200, 150, 600, 750];
  const normalized = normalizeBox(rawBox);

  assert.equal(normalized.ymin, 0.2);
  assert.equal(normalized.xmin, 0.15);
  assert.equal(normalized.ymax, 0.6);
  assert.equal(normalized.xmax, 0.75);
});

test('normalizeBox keeps standard 0..1 bounding boxes within bounds', () => {
  const rawBox = { ymin: 0.12, xmin: 0.34, ymax: 0.88, xmax: 0.95 };
  const normalized = normalizeBox(rawBox);

  assert.equal(normalized.ymin, 0.12);
  assert.equal(normalized.xmin, 0.34);
  assert.equal(normalized.ymax, 0.88);
  assert.equal(normalized.xmax, 0.95);
});

test('toCanvasCoords translates normalized boxes to screen pixel dimensions', () => {
  const box = { ymin: 0.2, xmin: 0.1, ymax: 0.5, xmax: 0.7 };
  const coords = toCanvasCoords(box, 800, 600);

  assert.equal(coords.x, 80);
  assert.equal(coords.y, 120);
  assert.equal(coords.width, 480);
  assert.equal(coords.height, 180);
});

test('isPointInsideBox accurately tests hit detection', () => {
  const box = { ymin: 0.1, xmin: 0.2, ymax: 0.6, xmax: 0.8 };
  assert.equal(isPointInsideBox({ x: 0.5, y: 0.3 }, box), true);
  assert.equal(isPointInsideBox({ x: 0.1, y: 0.3 }, box), false);
  assert.equal(isPointInsideBox({ x: 0.5, y: 0.9 }, box), false);
});

test('computeBoxUnion produces bounding box covering all instances', () => {
  const box1: [number, number, number, number] = [100, 100, 300, 300];
  const box2: [number, number, number, number] = [500, 600, 800, 900];
  const union = computeBoxUnion([box1, box2]);

  assert.equal(union.ymin, 0.1);
  assert.equal(union.xmin, 0.1);
  assert.equal(union.ymax, 0.8);
  assert.equal(union.xmax, 0.9);
});

test('parseBase64DataUrl parses mime and data segments', () => {
  const dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const parsed = parseBase64DataUrl(dataUrl);

  assert.notEqual(parsed, null);
  assert.equal(parsed?.mimeType, 'image/png');
  assert.equal(parsed?.base64.startsWith('iVBORw0KGgo'), true);

  assert.equal(parseBase64DataUrl('invalid-string'), null);
});

test('formatConfidence formats cleanly', () => {
  assert.equal(formatConfidence(0.954), '95%');
  assert.equal(formatConfidence(0), '0%');
  assert.equal(formatConfidence(1.2), '100%');
});

test('normalizeBox supports named dictionary format { top, left, bottom, right }', () => {
  const dictBox = { top: 690, left: 115, bottom: 785, right: 260 };
  const normalized = normalizeBox(dictBox);

  assert.equal(normalized.ymin, 0.69);
  assert.equal(normalized.xmin, 0.115);
  assert.equal(normalized.ymax, 0.785);
  assert.equal(normalized.xmax, 0.26);
});

test('nudgeBox shifts coordinates and supports vertical and horizontal repositioning', () => {
  const box: [number, number, number, number] = [500, 500, 600, 600];
  // Nudge vertically downwards by 0.1 (100 in 0..1000 scale)
  const nudgedDown = nudgeBox(box, 0, 0.1);
  assert.equal(nudgedDown[0], 600); // ymin shifted from 500 to 600
  assert.equal(nudgedDown[2], 700); // ymax shifted from 600 to 700
  assert.equal(nudgedDown[1], 500); // xmin unchanged

  // Nudge horizontally rightwards by 0.05
  const nudgedRight = nudgeBox(box, 0.05, 0);
  assert.equal(nudgedRight[1], 550);
  assert.equal(nudgedRight[3], 650);
});

test('buildSwapInpaintingPrompt contains core requirements for seamless inpainting', () => {
  const prompt = buildSwapInpaintingPrompt({
    targetObjectName: 'handlebar grips',
    targetCategory: 'motorcycle control',
    replacementObjectName: 'vintage diamond rubber grips',
    replacementDescription: 'textured brown rubber with brass end-caps',
    instancesCount: 2,
    instancesDetails: ['left grip near clutch lever', 'right grip near throttle'],
    userNotes: 'Match weathered patina on handlebars',
  });

  assert.equal(prompt.includes('Complete Erasure & Clean Inpainting'), true);
  assert.equal(prompt.includes('Physical & Mechanical In-Situ Installation'), true);
  assert.equal(prompt.includes('Lighting, Shadow & Environment Integration'), true);
  assert.equal(prompt.includes('handlebar grips'), true);
  assert.equal(prompt.includes('vintage diamond rubber grips'), true);
  assert.equal(prompt.includes('textured brown rubber with brass end-caps'), true);
  assert.equal(prompt.includes('There are 2 distinct instances'), true);
  assert.equal(prompt.includes('Match weathered patina on handlebars'), true);
});

test('normalizeBox auto-fixes inverted ymin > ymax or xmin > xmax', () => {
  // If coordinates are inverted (e.g. ymin=800, ymax=200)
  const invertedBox: [number, number, number, number] = [800, 750, 200, 150];
  const normalized = normalizeBox(invertedBox);

  assert.equal(normalized.ymin, 0.2);
  assert.equal(normalized.ymax, 0.8);
  assert.equal(normalized.xmin, 0.15);
  assert.equal(normalized.xmax, 0.75);
});

test('invertVerticalBox flips the Y axis accurately', () => {
  const box: [number, number, number, number] = [700, 120, 780, 260];
  const inverted = invertVerticalBox(box);

  // Inverted Y: ymin was 700, ymax was 780
  // 1000 - 780 = 220, 1000 - 700 = 300
  assert.equal(inverted[0], 220);
  assert.equal(inverted[1], 120);
  assert.equal(inverted[2], 300);
  assert.equal(inverted[3], 260);
});

test('parseBase64DataUrl correctly parses SVG and UTF-8 encoded data URLs', () => {
  const svgUrl = 'data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2210%22%20height%3D%2210%22%3E%3Crect%20fill%3D%22red%22%2F%3E%3C%2Fsvg%3E';
  const parsed = parseBase64DataUrl(svgUrl);

  assert.notEqual(parsed, null);
  assert.equal(parsed?.mimeType, 'image/svg+xml');
  assert.equal(parsed?.base64.length! > 0, true);
});
