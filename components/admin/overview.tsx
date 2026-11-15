"use client";

import Link from "next/link";
import { StatusBadge } from "@/components/feed/status-badge";
import { UrgencyScore } from "@/components/feed/urgency-score";
import {
  countByCategory,
  countByStatus,
  overviewStats,
  scheduledMediaDeletions,
  topUrgentOpen,
} from "@/lib/admin-issues";
import { useIssues } from "@/lib/local-issues";
import { useNow } from "@/lib/use-minute-clock";
import {
  CategoryBars,
  CategoryTable,
  ChartCard,
  StatusSplitBar,
  StatusTable,
} from "./charts";
import { LifecycleChip } from "./lifecycle-chip";

function StatTile({ label, value, note }: { label: string; value: number; note?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-slate-600">{label}</p>
      <p className="mt-1 text-3xl font-semibold text-slate-900">{value}</p>
      {note && <p className="mt-1 text-xs text-slate-500">{note}</p>}
    </div>
  );
}

function Panel({ id, title, children, link }: { id: string; title: string; children: React.ReactNode; link?: { href: string; label: string } }) {
  return (
    <section aria-labelledby={id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <h2 id={id} className="text-base font-bold text-slate-900">{title}</h2>
        {link && (
          <Link href={link.href} className="-my-2.5 inline-flex min-h-11 shrink-0 items-center rounded-lg px-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 lg:-my-1.5 lg:min-h-9">
            {link.label}
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

function OverviewSkeleton() {
  return (
    <div role="status" className="animate-pulse space-y-6 motion-reduce:animate-none">
      <span className="sr-only">טוען נתונים…</span>
      <div aria-hidden className="h-8 w-48 rounded bg-slate-200" />
      <div aria-hidden className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((index) => (
          <div key={index} className="h-24 rounded-2xl bg-slate-200" />
        ))}
      </div>
      <div aria-hidden className="h-48 rounded-2xl bg-slate-200" />
    </div>
  );
}

/** סקירה כללית: the headline numbers, how the reports split, and what needs attention. */
export function Overview() {
  const issues = useIssues();
  const now = useNow();

  if (issues === null || now === null) return <OverviewSkeleton />;

  const stats = overviewStats(issues, now);
  const counts = countByStatus(issues);
  const categories = countByCategory(issues);
  const urgent = topUrgentOpen(issues, 5);
  const scheduled = scheduledMediaDeletions(issues, now);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">סקירה כללית</h1>

      <section aria-label="מדדים עיקריים" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="פניות פתוחות" value={stats.open} note="בהמתנה ובתהליך" />
        <StatTile label="ממתינות לטיפול" value={stats.pending} note="עוד לא התחילו להיות מטופלות" />
        <StatTile label="נפתחו ב-7 הימים האחרונים" value={stats.newThisWeek} />
        <StatTile label="טופלו" value={stats.done} note={`מתוך ${stats.total} פניות`} />
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="התפלגות הפניות לפי סטטוס" table={<StatusTable counts={counts} />}>
          <StatusSplitBar counts={counts} />
        </ChartCard>
        <ChartCard title="פניות לפי קטגוריה" table={<CategoryTable rows={categories} />}>
          <CategoryBars rows={categories} />
        </ChartCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel id="top-urgent" title="הדחופות ביותר שעדיין פתוחות" link={{ href: "/admin/issues", label: "לניהול הפניות" }}>
          {urgent.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">אין פניות פתוחות כרגע.</p>
          ) : (
            <ol className="mt-3 divide-y divide-slate-100">
              {urgent.map((issue, index) => (
                <li key={issue.id} className="flex gap-3 py-3">
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{issue.title}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                      <span className="text-xs text-slate-500">#{issue.id}</span>
                      <StatusBadge status={issue.status} />
                      <UrgencyScore ratingSum={issue.ratingSum} voteCount={issue.voteCount} />
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Panel>

        <Panel id="media-queue" title="מדיה שתימחק בקרוב">
          <p className="mt-1 text-sm text-slate-600">
            תמונות של פניות שטופלו או נדחו נמחקות 7 ימים אחרי הטיפול. החזרת הפנייה
            לסטטוס פתוח מבטלת את המחיקה.
          </p>
          {scheduled.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">אין כרגע מדיה שמתוכננת למחיקה.</p>
          ) : (
            <ul className="mt-3 divide-y divide-slate-100">
              {scheduled.map(({ issue }) => (
                <li key={issue.id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{issue.title}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      #{issue.id} · {issue.status}
                    </p>
                  </div>
                  <LifecycleChip issue={issue} now={now} />
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
