"use client";

import { useState, type ReactNode } from "react";
import { BarChart3, Table2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { ISSUE_STATUSES, type IssueStatus } from "@/lib/types";
import { ChartTooltip, useChartTooltip } from "./chart-tooltip";

/**
 * Chart fills for the four statuses: the same hues as the status badges, one
 * step stronger so they read as shapes. Checked with the dataviz validator:
 * amber, blue and green clear the lightness, chroma and color-blindness checks
 * (neighbors at least ΔE 23 apart); gray is the de-emphasis color for
 * "closed with no action", and it is ΔE 19 from the green beside it. Amber and
 * gray are under 3:1 against white, which the labels, legend, tooltips and the
 * table view make up for. Labels inside a fill are white or near-black,
 * whichever reads better on it.
 */
export const STATUS_CHART: Record<IssueStatus, { fill: string; label: string }> = {
  "בהמתנה": { fill: "bg-amber-500", label: "text-slate-900" },
  "בתהליך": { fill: "bg-blue-600", label: "text-white" },
  "בוצע": { fill: "bg-emerald-700", label: "text-white" },
  "נדחה": { fill: "bg-slate-400", label: "text-slate-900" },
};

interface ChartCardProps {
  title: string;
  /** The same data as a table: the accessible twin of the chart. */
  table: ReactNode;
  children: ReactNode;
}

/** A chart with its title and a switch to the table view. */
export function ChartCard({ title, table, children }: ChartCardProps) {
  const [asTable, setAsTable] = useState(false);

  return (
    <figure className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <figcaption className="text-base font-bold text-slate-900">{title}</figcaption>
        <button
          type="button"
          onClick={() => setAsTable((current) => !current)}
          aria-pressed={asTable}
          className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          {asTable ? (
            <BarChart3 aria-hidden className="size-4" />
          ) : (
            <Table2 aria-hidden className="size-4" />
          )}
          {asTable ? "הצג כגרף" : "הצג כטבלה"}
        </button>
      </div>
      <div className="mt-4">{asTable ? table : children}</div>
    </figure>
  );
}

const percent = (part: number, whole: number) => Math.round((part / whole) * 100);

/** One whole (all reports) split into its statuses, side by side. */
export function StatusSplitBar({ counts }: { counts: Record<IssueStatus, number> }) {
  const { containerRef, tip, show, hide } = useChartTooltip();
  const total = ISSUE_STATUSES.reduce((sum, status) => sum + counts[status], 0);
  const parts = ISSUE_STATUSES.filter((status) => counts[status] > 0);

  if (total === 0) {
    return <p className="text-sm text-slate-500">עדיין אין פניות להצגה.</p>;
  }

  return (
    <div>
      <div ref={containerRef} className="relative">
        {/* The 2px gaps are the surface showing through, not borders. */}
        <div role="group" aria-label="התפלגות הפניות לפי סטטוס" className="flex h-7 gap-0.5">
          {parts.map((status) => {
            const share = percent(counts[status], total);
            const { fill, label } = STATUS_CHART[status];
            return (
              <div
                key={status}
                role="img"
                tabIndex={0}
                aria-label={`${status}: ${counts[status]} (${share}%)`}
                style={{ flexGrow: counts[status] }}
                className={cn(
                  // No padding: it would count toward the width and inflate the small segments, and the length of a segment is the data.
                  "flex min-w-1 basis-0 items-center justify-center overflow-hidden rounded text-sm font-bold outline-offset-2 transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-slate-900",
                  fill,
                  label,
                )}
                onPointerEnter={(event) =>
                  show(event.currentTarget, { label: `${status} · ${share}%`, value: String(counts[status]), swatch: fill })
                }
                onFocus={(event) =>
                  show(event.currentTarget, { label: `${status} · ${share}%`, value: String(counts[status]), swatch: fill })
                }
                onPointerLeave={hide}
                onBlur={hide}
              >
                {/* A segment too narrow for its number prints none: the tooltip and the table carry it. */}
                {counts[status] / total >= 0.1 ? counts[status] : null}
              </div>
            );
          })}
        </div>
        <ChartTooltip tip={tip} />
      </div>

      <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-700">
        {parts.map((status) => (
          <li key={status} className="flex items-center gap-2">
            <span aria-hidden className={cn("size-3 rounded-sm", STATUS_CHART[status].fill)} />
            {status}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function StatusTable({ counts }: { counts: Record<IssueStatus, number> }) {
  const total = ISSUE_STATUSES.reduce((sum, status) => sum + counts[status], 0);

  return (
    <table className="w-full text-sm">
      <caption className="sr-only">מספר הפניות בכל סטטוס</caption>
      <thead>
        <tr className="border-b border-slate-200 text-slate-600">
          <th scope="col" className="py-2 text-start font-semibold">סטטוס</th>
          <th scope="col" className="py-2 text-start font-semibold">פניות</th>
          <th scope="col" className="py-2 text-start font-semibold">אחוז</th>
        </tr>
      </thead>
      <tbody>
        {ISSUE_STATUSES.map((status) => (
          <tr key={status} className="border-b border-slate-100 last:border-0">
            <th scope="row" className="py-2 text-start font-medium text-slate-900">{status}</th>
            <td className="py-2 tabular-nums text-slate-900">{counts[status]}</td>
            <td className="py-2 tabular-nums text-slate-600">
              {total === 0 ? "0%" : `${percent(counts[status], total)}%`}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Reports per category, largest first. One neutral color: the categories have no color of their own, and blue already means "in progress" here. */
export function CategoryBars({ rows }: { rows: { category: string; count: number }[] }) {
  const { containerRef, tip, show, hide } = useChartTooltip();
  const max = Math.max(...rows.map((row) => row.count), 1);
  const swatch = "bg-slate-500";

  return (
    <div ref={containerRef} className="relative">
      <ul className="space-y-3">
        {rows.map(({ category, count }) => (
          <li
            key={category}
            tabIndex={0}
            aria-label={`${category}: ${count}`}
            className="grid grid-cols-[6.5rem_minmax(0,1fr)] items-center gap-3 rounded outline-offset-4 focus-visible:outline-2 focus-visible:outline-slate-900 sm:grid-cols-[8.5rem_minmax(0,1fr)]"
            onPointerEnter={(event) => show(event.currentTarget, { label: category, value: String(count), swatch })}
            onFocus={(event) => show(event.currentTarget, { label: category, value: String(count), swatch })}
            onPointerLeave={hide}
            onBlur={hide}
          >
            <span className="truncate text-sm text-slate-700">{category}</span>
            <div className="flex items-center gap-2">
              {/* Grows from the start edge; only the end (the data) is rounded. */}
              <div
                aria-hidden
                className={cn("h-3 rounded-e", swatch)}
                style={{
                  width: `calc((100% - 1.75rem) * ${count / max})`,
                  minWidth: count > 0 ? "4px" : 0,
                }}
              />
              <span className="text-sm font-semibold text-slate-900">{count}</span>
            </div>
          </li>
        ))}
      </ul>
      <ChartTooltip tip={tip} />
    </div>
  );
}

export function CategoryTable({ rows }: { rows: { category: string; count: number }[] }) {
  return (
    <table className="w-full text-sm">
      <caption className="sr-only">מספר הפניות בכל קטגוריה</caption>
      <thead>
        <tr className="border-b border-slate-200 text-slate-600">
          <th scope="col" className="py-2 text-start font-semibold">קטגוריה</th>
          <th scope="col" className="py-2 text-start font-semibold">פניות</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(({ category, count }) => (
          <tr key={category} className="border-b border-slate-100 last:border-0">
            <th scope="row" className="py-2 text-start font-medium text-slate-900">{category}</th>
            <td className="py-2 tabular-nums text-slate-900">{count}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
