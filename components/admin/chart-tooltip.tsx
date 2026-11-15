"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/cn";

export interface TooltipState {
  /** What the number is about, e.g. the status or category name. */
  label: string;
  /** The number, shown first and strongest. */
  value: string;
  /** Tailwind background class of the mark, used for the short color key. */
  swatch: string;
  left: number;
  top: number;
}

/**
 * Hover and focus tooltip for a chart's marks. Attach `containerRef` to the
 * chart's `relative` wrapper, call `show` from pointer-enter and focus and
 * `hide` from pointer-leave and blur. Tooltips only add to what the chart
 * already prints and to its table view; nothing is reachable only through them.
 */
export function useChartTooltip() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<TooltipState | null>(null);

  const show = (
    element: HTMLElement,
    content: Pick<TooltipState, "label" | "value" | "swatch">,
  ) => {
    const container = containerRef.current;
    if (!container) return;
    const box = element.getBoundingClientRect();
    const outer = container.getBoundingClientRect();
    // Keep the tooltip inside the chart, however close the mark is to an edge.
    const half = 80;
    setTip({
      ...content,
      left: Math.min(Math.max(box.left - outer.left + box.width / 2, half), outer.width - half),
      top: box.top - outer.top,
    });
  };

  const hide = () => setTip(null);

  return { containerRef, tip, show, hide };
}

export function ChartTooltip({ tip }: { tip: TooltipState | null }) {
  if (!tip) return null;
  return (
    <div
      role="tooltip"
      className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg bg-slate-900 px-3 py-2 text-xs text-white shadow-lg"
      style={{ left: tip.left, top: tip.top - 6 }}
    >
      <span className="flex items-center gap-2">
        <span aria-hidden className={cn("h-0.5 w-3 rounded-full", tip.swatch)} />
        <strong className="text-sm font-bold">{tip.value}</strong>
        <span className="text-slate-300">{tip.label}</span>
      </span>
    </div>
  );
}
