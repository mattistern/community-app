"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Clock, Loader2, MapPin, X } from "lucide-react";
import { cn } from "@/lib/cn";
import type { ProcessedImage } from "@/lib/image-processing";
import { StorageFullError, createIssue } from "@/lib/local-issues";
import {
  CooldownError,
  DESCRIPTION_MAX_LENGTH,
  LOCATION_MAX_LENGTH,
  TITLE_MAX_LENGTH,
  formatSeconds,
  validateNewIssue,
} from "@/lib/new-issue";
import type { Issue, IssueCategory } from "@/lib/types";
import { CategoryPicker } from "./category-picker";
import { PhotoPicker } from "./photo-picker";

// 16px text: iOS Safari zooms the page when a field with smaller text gets focus.
const FIELD =
  "w-full rounded-xl border bg-white text-base text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2";
const fieldState = (invalid: boolean) =>
  invalid
    ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
    : "border-slate-200 focus:border-blue-600 focus:ring-blue-600/20";

/** Simulated upload: a short progress bar, like the real round trip will have. */
function simulateUpload(onProgress: (percent: number) => void): Promise<void> {
  return new Promise((resolve) => {
    let percent = 0;
    const timer = setInterval(() => {
      percent = Math.min(100, percent + 12);
      onProgress(percent);
      if (percent === 100) {
        clearInterval(timer);
        resolve();
      }
    }, 70);
  });
}

function OptionalMark() {
  return <span className="font-normal text-slate-500"> (לא חובה)</span>;
}

interface NewIssueFormProps {
  authorPhone: string;
  /** Cooldown left when the form opened, in ms (0 when the resident may post). */
  cooldownMs: number;
  /** Tells the dialog to refuse closing while a report is being sent. */
  onBusyChange: (busy: boolean) => void;
  onCreated: (issue: Issue) => void;
  onClose: () => void;
}

/** DESIGN.md §3D: category, location, photo, title and description, then send. */
export function NewIssueForm({
  authorPhone,
  cooldownMs,
  onBusyChange,
  onCreated,
  onClose,
}: NewIssueFormProps) {
  const [category, setCategory] = useState<IssueCategory | null>(null);
  const [location, setLocation] = useState("");
  const [photo, setPhoto] = useState<ProcessedImage | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [attempted, setAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(Math.ceil(cooldownMs / 1000));

  const id = useId();
  const titleRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const locationRef = useRef<HTMLInputElement>(null);

  // Counts the cooldown down one second at a time.
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(
      () => setSecondsLeft((seconds) => seconds - 1),
      1000,
    );
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const errors = validateNewIssue({ title, description, location });
  // Nothing is flagged until the first attempt to send.
  const shown = attempted ? errors : {};

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting || secondsLeft > 0) return;

    setAttempted(true);
    setSubmitError(null);
    if (Object.keys(errors).length > 0) {
      (errors.title
        ? titleRef
        : errors.description
          ? descriptionRef
          : locationRef
      ).current?.focus();
      return;
    }

    setSubmitting(true);
    onBusyChange(true);
    setProgress(0);
    if (photo) await simulateUpload(setProgress);

    try {
      const issue = createIssue(
        {
          title,
          description,
          category,
          location,
          media: photo
            ? {
                type: "image",
                thumbnailUrl: photo.thumbnailUrl,
                fullUrl: photo.fullUrl,
                alt: "",
              }
            : null,
        },
        authorPhone,
      );
      onCreated(issue);
      onClose();
    } catch (error) {
      setSubmitting(false);
      onBusyChange(false);
      if (error instanceof CooldownError) {
        setSecondsLeft(Math.ceil(error.remainingMs / 1000));
      } else if (error instanceof StorageFullError) {
        setSubmitError(
          "האחסון המקומי של הדפדפן מלא. נסו להסיר את התמונה או למחוק נתוני דמו ישנים.",
        );
      } else {
        setSubmitError("לא הצלחנו לשלוח את הדיווח. נסו שוב.");
      }
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="flex min-h-0 flex-1 flex-col"
    >
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 py-2 ps-4 pe-2">
        <h2
          id="new-issue-title"
          className="text-lg font-extrabold tracking-tight text-slate-900"
        >
          דיווח על מפגע או בעיה חדשה
        </h2>
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          aria-label="סגור"
          className="grid size-11 shrink-0 place-items-center rounded-full text-slate-600 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-40"
        >
          <X aria-hidden className="size-5" />
        </button>
      </header>

      <div
        inert={submitting}
        className={cn(
          "min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 py-4 transition-opacity",
          submitting && "opacity-60",
        )}
      >
        {secondsLeft > 0 && (
          <div className="flex gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <Clock aria-hidden className="mt-0.5 size-4 shrink-0" />
            <p>
              כדי למנוע הצפה, אפשר לשלוח דיווח חדש פעם בדקה. אפשר לנסות שוב בעוד{" "}
              {formatSeconds(secondsLeft)}.
            </p>
          </div>
        )}

        <fieldset className="min-w-0">
          <legend className="mb-2 text-sm font-semibold text-slate-900">
            קטגוריה
            <OptionalMark />
          </legend>
          <CategoryPicker value={category} onChange={setCategory} />
        </fieldset>

        <div>
          <label
            htmlFor={`${id}-location`}
            className="mb-2 block text-sm font-semibold text-slate-900"
          >
            מיקום
            <OptionalMark />
          </label>
          <div className="relative">
            <MapPin
              aria-hidden
              className="pointer-events-none absolute start-3 top-1/2 size-5 -translate-y-1/2 text-slate-400"
            />
            <input
              id={`${id}-location`}
              ref={locationRef}
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              maxLength={LOCATION_MAX_LENGTH}
              placeholder="רחוב הבנים 12"
              autoComplete="off"
              aria-invalid={Boolean(shown.location)}
              aria-describedby={
                shown.location ? `${id}-location-error` : undefined
              }
              className={cn(
                FIELD,
                "h-12 pe-3 ps-10",
                fieldState(Boolean(shown.location)),
              )}
            />
          </div>
          {shown.location && (
            <p
              id={`${id}-location-error`}
              className="mt-1.5 text-sm text-red-700"
            >
              {shown.location}
            </p>
          )}
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-slate-900">
            תמונה
            <OptionalMark />
          </p>
          <PhotoPicker value={photo} onChange={setPhoto} />
        </div>

        <div>
          <label
            htmlFor={`${id}-title`}
            className="mb-2 block text-sm font-semibold text-slate-900"
          >
            כותרת
          </label>
          <input
            id={`${id}-title`}
            ref={titleRef}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={TITLE_MAX_LENGTH}
            placeholder="למשל: בור בכביש ליד הגן"
            autoComplete="off"
            aria-required
            aria-invalid={Boolean(shown.title)}
            aria-describedby={shown.title ? `${id}-title-error` : undefined}
            className={cn(FIELD, "h-12 px-3", fieldState(Boolean(shown.title)))}
          />
          {shown.title && (
            <p id={`${id}-title-error`} className="mt-1.5 text-sm text-red-700">
              {shown.title}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor={`${id}-description`}
            className="mb-2 block text-sm font-semibold text-slate-900"
          >
            תיאור קצר
          </label>
          <textarea
            id={`${id}-description`}
            ref={descriptionRef}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={DESCRIPTION_MAX_LENGTH}
            rows={4}
            placeholder="ספרו בקצרה מה הבעיה ומתי הבחנתם בה"
            aria-required
            aria-invalid={Boolean(shown.description)}
            aria-describedby={
              shown.description ? `${id}-description-error` : undefined
            }
            className={cn(
              FIELD,
              "resize-none px-3 py-3",
              fieldState(Boolean(shown.description)),
            )}
          />
          <div className="mt-1.5 flex items-start justify-between gap-3">
            {shown.description ? (
              <p
                id={`${id}-description-error`}
                className="text-sm text-red-700"
              >
                {shown.description}
              </p>
            ) : (
              <span />
            )}
            <span className="shrink-0 text-xs text-slate-500">
              {description.length}/{DESCRIPTION_MAX_LENGTH}
            </span>
          </div>
        </div>

        {submitError && (
          <p
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800"
          >
            {submitError}
          </p>
        )}
      </div>

      <footer className="shrink-0 border-t border-slate-200 bg-white p-4">
        <button
          type="submit"
          disabled={submitting || secondsLeft > 0}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-base font-bold text-white transition hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
        >
          {submitting ? (
            <>
              <Loader2 aria-hidden className="size-5 animate-spin" />
              {photo ? `שולח… ${progress}%` : "שולח…"}
            </>
          ) : secondsLeft > 0 ? (
            `אפשר לשלוח שוב בעוד ${formatSeconds(secondsLeft)}`
          ) : (
            "שלח לביקורת הנהלה"
          )}
        </button>
        {submitting && photo && (
          <div
            role="progressbar"
            aria-label="התקדמות ההעלאה"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
            className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200"
          >
            <div
              className="h-full rounded-full bg-blue-600 transition-[width] duration-75"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </footer>
    </form>
  );
}
