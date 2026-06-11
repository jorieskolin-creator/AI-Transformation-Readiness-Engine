import type { ImageInput, ImageMimeType } from '../types';

export const DEFAULT_IMAGE_MAX_LONG_EDGE = 1600;
export const ANTHROPIC_IMAGE_MAX_LONG_EDGE = 1900;
export const DEFAULT_IMAGE_JPEG_QUALITY = 0.76;

export const constrainImageDimensions = (
  width: number,
  height: number,
  maxLongEdge: number
): { width: number; height: number; scale: number } => {
  const safeWidth = Math.max(1, Math.round(width || 1));
  const safeHeight = Math.max(1, Math.round(height || 1));
  const longest = Math.max(safeWidth, safeHeight);
  if (longest <= maxLongEdge) return { width: safeWidth, height: safeHeight, scale: 1 };
  const scale = maxLongEdge / longest;
  return {
    width: Math.max(1, Math.round(safeWidth * scale)),
    height: Math.max(1, Math.round(safeHeight * scale)),
    scale
  };
};

const toDataUrl = (image: ImageInput): string => `data:${image.mimeType};base64,${image.data}`;

const loadImageElement = (dataUrl: string): Promise<HTMLImageElement> => new Promise((resolve, reject) => {
  if (typeof Image === 'undefined') {
    reject(new Error('Image API is unavailable in this runtime.'));
    return;
  }
  const img = new Image();
  img.onload = () => resolve(img);
  img.onerror = () => reject(new Error('Image could not be decoded.'));
  img.src = dataUrl;
});

export const normalizeImageInput = async (
  image: ImageInput,
  opts: { maxLongEdge?: number; jpegQuality?: number } = {}
): Promise<ImageInput> => {
  const maxLongEdge = opts.maxLongEdge ?? DEFAULT_IMAGE_MAX_LONG_EDGE;
  const jpegQuality = opts.jpegQuality ?? DEFAULT_IMAGE_JPEG_QUALITY;

  if (typeof document === 'undefined' || typeof Image === 'undefined') {
    return image;
  }

  try {
    const img = await loadImageElement(toDataUrl(image));
    const originalWidth = image.width || img.naturalWidth || img.width;
    const originalHeight = image.height || img.naturalHeight || img.height;
    const target = constrainImageDimensions(originalWidth, originalHeight, maxLongEdge);

    if (target.scale >= 1) {
      return { ...image, width: originalWidth, height: originalHeight };
    }

    const canvas = document.createElement('canvas');
    canvas.width = target.width;
    canvas.height = target.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return { ...image, width: originalWidth, height: originalHeight };
    ctx.drawImage(img, 0, 0, target.width, target.height);
    const dataUrl = canvas.toDataURL('image/jpeg', jpegQuality);
    const base64 = dataUrl.split(',')[1];
    if (!base64) return { ...image, width: originalWidth, height: originalHeight };
    return {
      ...image,
      mimeType: 'image/jpeg' as ImageMimeType,
      data: base64,
      width: target.width,
      height: target.height
    };
  } catch {
    return image;
  }
};

export const normalizeImageInputs = async (
  images: ImageInput[] = [],
  opts: { maxLongEdge?: number; jpegQuality?: number } = {}
): Promise<ImageInput[]> => Promise.all(images.map((image) => normalizeImageInput(image, opts)));

export const fileToDataUrl = (file: File): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result || ''));
  reader.onerror = () => reject(reader.error || new Error('File could not be read as data URL.'));
  reader.readAsDataURL(file);
});
