"use client";

import { useRef, useState, type ChangeEvent } from "react";
import Image from "next/image";
import { ImagePlus, Loader2, X } from "lucide-react";
import {
  ImageProcessingError,
  formatBytes,
  processImageFile,
  type ProcessedImage,
} from "@/lib/image-processing";

interface PhotoPickerProps {
  value: ProcessedImage | null;
  onChange: (photo: ProcessedImage | null) => void;
}

/**
 * Optional photo. Picking one compresses it and builds the feed thumbnail right
 * here in the browser (the local stand-in for an upload), then previews the
 * thumbnail, which is how it will look in the feed.
 */
export function PhotoPicker({ value, onChange }: PhotoPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ""; // lets the same photo be picked again after removing it
    if (!file) return;

    setError(null);
    setProcessing(true);
    try {
      onChange(await processImageFile(file));
    } catch (caught) {
      setError(
        caught instanceof ImageProcessingError
          ? caught.message
          : "לא הצלחנו לעבד את התמונה",
      );
    } finally {
      setProcessing(false);
    }
  }

  const openPicker = () => inputRef.current?.click();

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />

      {processing ? (
        <div
          role="status"
          className="flex h-32 items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-600"
        >
          <Loader2 aria-hidden className="size-5 animate-spin" />
          מעבדים את התמונה…
        </div>
      ) : value ? (
        <div>
          <div className="relative overflow-hidden rounded-xl bg-slate-100">
            <Image
              src={value.thumbnailUrl}
              alt="תצוגה מקדימה של התמונה שנבחרה"
              width={480}
              height={270}
              className="aspect-video w-full object-cover"
            />
            <button
              type="button"
              onClick={() => onChange(null)}
              aria-label="הסר תמונה"
              className="absolute end-2 top-2 grid size-10 place-items-center rounded-full bg-slate-900/70 text-white hover:bg-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <X aria-hidden className="size-5" />
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            כווצה מ-{formatBytes(value.originalBytes)} ל-
            {formatBytes(value.storedBytes)} ·{" "}
            <button
              type="button"
              onClick={openPicker}
              className="font-semibold text-blue-700 hover:underline"
            >
              החלף תמונה
            </button>
          </p>
        </div>
      ) : (
        <button
          type="button"
          onClick={openPicker}
          className="flex h-32 w-full flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-slate-600 transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          <ImagePlus aria-hidden className="size-7" />
          <span className="text-sm font-semibold">הוסיפו תמונה</span>
          <span className="text-xs text-slate-500">
            מהגלריה או ישירות מהמצלמה
          </span>
        </button>
      )}

      {error && (
        <p role="alert" className="mt-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
