/**
 * Client-side image helpers for file handling, SVG rasterization,
 * and high-resolution canvas operations.
 */

export async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Ensures any image (including SVGs) is converted to a clean standard PNG Data URL.
 * Scales down overly huge images if needed to prevent network payload limits.
 */
export async function rasterizeToPng(
  dataUrl: string,
  maxWidth = 1400,
  maxHeight = 1400
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      let width = img.naturalWidth || img.width || 800;
      let height = img.naturalHeight || img.height || 600;

      // Scale down if exceeds max bounds
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/png', 0.95));
    };

    img.onerror = () => {
      // If image loading fails, return original dataUrl
      resolve(dataUrl);
    };

    img.src = dataUrl;
  });
}

export function downloadImage(dataUrl: string, filename = 'swapcraft-result.png') {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
