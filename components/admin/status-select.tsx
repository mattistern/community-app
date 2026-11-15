"use client";

import { ChevronDown } from "lucide-react";
import { STATUS_STYLES } from "@/components/feed/status-badge";
import { cn } from "@/lib/cn";
import { ISSUE_STATUSES, type IssueStatus } from "@/lib/types";

interface StatusSelectProps {
  value: IssueStatus;
  /** Accessible name, e.g. "סטטוס של פנייה #101". */
  label: string;
  onChange: (status: IssueStatus) => void;
  size?: "sm" | "md";
}

/**
 * Inline status control: a native <select> painted like the status badge, so the
 * current status reads at a glance and the phone's own picker opens on tap.
 * Choosing a status applies it immediately.
 */
export function StatusSelect({ value, label, onChange, size = "sm" }: StatusSelectProps) {
  return (
    <div className="relative inline-block">
      <select
        aria-label={label}
        value={value}
        onChange={(event) => {
          const next = ISSUE_STATUSES.find((status) => status === event.target.value);
          if (next) onChange(next);
        }}
        // 16px on phones: iOS Safari zooms the page when a smaller field gets focus.
        className={cn(
          "appearance-none rounded-full border-0 pe-8 ps-3 text-base font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:text-sm",
          size === "md" ? "h-11" : "h-11 xl:h-9", // sm: 44px in the phone cards, compact in the desktop table
          STATUS_STYLES[value],
        )}
      >
        {ISSUE_STATUSES.map((status) => (
          <option key={status} value={status}>
            {status}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute end-2.5 top-1/2 size-4 -translate-y-1/2 opacity-70"
      />
    </div>
  );
}
