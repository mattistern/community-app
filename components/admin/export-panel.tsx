"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { csvFilename, ISSUE_CSV_HEADERS, issuesToCsv } from "@/lib/csv";
import { useIssues } from "@/lib/local-issues";

/** ייצוא נתונים: every report as a CSV file that opens in Excel with Hebrew intact. */
export function ExportPanel() {
  const issues = useIssues();
  const [message, setMessage] = useState<string | null>(null);

  if (issues === null) {
    return (
      <div role="status" className="animate-pulse space-y-4 motion-reduce:animate-none">
        <span className="sr-only">טוען…</span>
        <div aria-hidden className="h-8 w-40 rounded bg-slate-200" />
        <div aria-hidden className="h-48 rounded-2xl bg-slate-200" />
      </div>
    );
  }

  function download() {
    if (issues === null) return;
    const filename = csvFilename(Date.now());
    const blob = new Blob([issuesToCsv(issues)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage(`הקובץ ${filename} הורד (${issues.length} פניות).`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">ייצוא נתונים</h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-600">
          מוריד קובץ CSV עם כל הפניות בקהילה, כפי שהן עכשיו. הקובץ נפתח באקסל
          כשהעברית מוצגת נכון.
        </p>
      </div>

      <section
        aria-labelledby="export-heading"
        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
      >
        <h2 id="export-heading" className="text-base font-bold text-slate-900">
          הקובץ יכלול {issues.length} פניות
        </h2>
        <p className="mt-3 text-sm font-semibold text-slate-700">העמודות:</p>
        <ul className="mt-2 flex flex-wrap gap-2">
          {ISSUE_CSV_HEADERS.map((header) => (
            <li key={header} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
              {header}
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={download}
          className="mt-5 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-base font-bold text-white transition hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          <Download aria-hidden className="size-5" />
          ייצא נתונים ל-CSV
        </button>
        <p role="status" className="mt-3 min-h-5 text-sm font-medium text-emerald-700">
          {message}
        </p>
      </section>
    </div>
  );
}
