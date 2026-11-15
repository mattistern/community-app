/**
 * Local simulation of the media pipeline in CLAUDE.md §2: a chosen photo is
 * compressed and a low-resolution thumbnail is made, entirely in the browser.
 * Re-encoding through a canvas also strips EXIF data (including GPS location).
 *
 * Uses only APIs that work on an insecure http origin (a phone opening the dev
 * server by its LAN address), so nothing here needs a secure context.
 */

export const MAX_SOURCE_BYTES = 20 * 1024 * 1024;

const FULL = { maxEdge: 1280, quality: 0.78 } as const;
const THUMBNAIL = { maxEdge: 480, quality: 0.65 } as const;

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export interface ProcessedImage {
  /** Compressed full-size version (shown only when the resident taps the photo). */
  fullUrl: string;
  /** Low-resolution version shown in the feed. */
  thumbnailUrl: string;
  originalBytes: number;
  /** Size of what is actually stored (both versions, as data URLs). */
  storedBytes: number;
}

/** Its message is Hebrew and safe to show to the resident. */
export class ImageProcessingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImageProcessingError";
  }
}

/** Scales down to fit `maxEdge` on the longest side, keeping the aspect ratio; never scales up. */
export function fitWithin(
  width: number,
  height: number,
  maxEdge: number,
): { width: number; height: number } {
  const longest = Math.max(width, height);
  if (longest <= maxEdge) return { width, height };
  const scale = maxEdge / longest;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

/** "4.2MB" or "140KB". */
export function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  return `${Math.max(1, Math.round(bytes / 1024))}KB`;
}

function renderJpeg(
  image: HTMLImageElement,
  { maxEdge, quality }: { maxEdge: number; quality: number },
): string {
  const { width, height } = fitWithin(
    image.naturalWidth,
    image.naturalHeight,
    maxEdge,
  );
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) throw new Error("canvas is not available");
  // JPEG has no transparency: put PNGs on white instead of black.
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);

  const url = canvas.toDataURL("image/jpeg", quality);
  canvas.width = canvas.height = 0; // lets phones release the canvas memory
  return url;
}

export async function processImageFile(file: File): Promise<ProcessedImage> {
  if (file.type !== "" && !ACCEPTED_TYPES.includes(file.type)) {
    throw new ImageProcessingError(
      "פורמט התמונה אינו נתמך. נסו תמונה בפורמט JPG או PNG",
    );
  }
  if (file.size > MAX_SOURCE_BYTES) {
    throw new ImageProcessingError("התמונה גדולה מדי (עד 20MB)");
  }

  const sourceUrl = URL.createObjectURL(file);
  try {
    // An <img> applies the photo's EXIF rotation, so portrait phone photos stay upright.
    const image = new Image();
    image.src = sourceUrl;
    await image.decode();

    const fullUrl = renderJpeg(image, FULL);
    const thumbnailUrl = renderJpeg(image, THUMBNAIL);
    return {
      fullUrl,
      thumbnailUrl,
      originalBytes: file.size,
      storedBytes: fullUrl.length + thumbnailUrl.length,
    };
  } catch {
    throw new ImageProcessingError(
      "לא הצלחנו לקרוא את התמונה. נסו קובץ JPG או PNG",
    );
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}
