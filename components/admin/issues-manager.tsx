"use client";

import { useCallback, useRef, useState } from "react";
import { ChevronDown, SearchX } from "lucide-react";
import { CategorySelect } from "@/components/feed/category-select";
import { SearchInput } from "@/components/feed/search-input";
import { Toast } from "@/components/feed/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  ADMIN_SORTS,
  DEFAULT_ADMIN_FILTERS,
  countByStatus,
  filterAndSortForAdmin,
  type AdminFilters,
  type AdminSort,
} from "@/lib/admin-issues";
import {
  deleteIssues,
  restoreIssues,
  setAdminNote,
  setIssueStatus,
  setIssuesStatus,
  useIssues,
} from "@/lib/local-issues";
import { isResolvedStatus } from "@/lib/media-cleanup";
import { ISSUE_STATUSES, type Issue, type IssueStatus } from "@/lib/types";
import { cn } from "@/lib/cn";
import { useNow } from "@/lib/use-minute-clock";
import { IssueDetailsDialog } from "./issue-details-dialog";
import { IssuesList } from "./issues-list";

const STATUS_FILTERS: { value: AdminFilters["status"]; label: string }[] = [
  { value: "all", label: "הכל" },
  ...ISSUE_STATUSES.map((status) => ({ value: status, label: status })),
];

function SortSelect({ value, onChange }: { value: AdminSort; onChange: (sort: AdminSort) => void }) {
  return (
    <div className="relative shrink-0">
      <select
        aria-label="מיון הפניות"
        value={value}
        onChange={(event) => {
          const next = ADMIN_SORTS.find((sort) => sort.value === event.target.value);
          if (next) onChange(next.value);
        }}
        className="h-11 appearance-none rounded-xl border border-slate-200 bg-white ps-3 pe-9 text-base font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
      >
        {ADMIN_SORTS.map((sort) => (
          <option key={sort.value} value={sort.value}>
            {sort.label}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
      />
    </div>
  );
}

function Skeleton() {
  return (
    <div role="status" className="animate-pulse space-y-4 motion-reduce:animate-none">
      <span className="sr-only">טוען פניות…</span>
      <div aria-hidden className="h-8 w-40 rounded bg-slate-200" />
      <div aria-hidden className="h-11 rounded-xl bg-slate-200" />
      <div aria-hidden className="h-64 rounded-2xl bg-slate-200" />
    </div>
  );
}

interface ToastState {
  id: number;
  message: string;
  /** Deleted issues, so the toast can offer to bring them back. */
  undo?: Issue[];
}

/** ניהול פניות: find, review, re-status, annotate and delete the community's reports. */
export function IssuesManager() {
  const issues = useIssues();
  const now = useNow();
  const [filters, setFilters] = useState<AdminFilters>(DEFAULT_ADMIN_FILTERS);
  const [selection, setSelection] = useState<ReadonlySet<string>>(new Set());
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [deleteIds, setDeleteIds] = useState<string[] | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const toastCounter = useRef(0);
  const dismissToast = useCallback(() => setToast(null), []);

  if (issues === null || now === null) return <Skeleton />;

  const showToast = (message: string, undo?: Issue[]) =>
    setToast({ id: ++toastCounter.current, message, undo });

  const visible = filterAndSortForAdmin(issues, filters);
  // Only rows that are actually on screen count, so a hidden selection can't be changed by accident.
  const selectedIds = visible.filter((issue) => selection.has(issue.id)).map((issue) => issue.id);
  const statusCounts = countByStatus(issues);
  const detailsIssue = detailsId ? issues.find((issue) => issue.id === detailsId) : undefined;
  const pendingDelete = deleteIds
    ? issues.filter((issue) => deleteIds.includes(issue.id))
    : [];

  const changeStatus = (id: string, status: IssueStatus) => {
    const issue = issues.find((candidate) => candidate.id === id);
    if (!issue || issue.status === status) return;
    setIssueStatus(id, status);
    const mediaNote = issue.media && isResolvedStatus(status) ? " המדיה תימחק בעוד 7 ימים." : "";
    showToast(`סטטוס פנייה #${id} עודכן ל"${status}".${mediaNote}`);
  };

  const changeSelectedStatus = (status: IssueStatus) => {
    setIssuesStatus(selectedIds, status);
    showToast(
      selectedIds.length === 1
        ? `סטטוס פנייה #${selectedIds[0]} עודכן ל"${status}".`
        : `הסטטוס של ${selectedIds.length} פניות עודכן ל"${status}".`,
    );
    setSelection(new Set());
  };

  const toggle = (id: string) =>
    setSelection((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  const toggleAll = (select: boolean) =>
    setSelection((current) => {
      const next = new Set(current);
      for (const issue of visible) {
        if (select) next.add(issue.id);
        else next.delete(issue.id);
      }
      return next;
    });

  const confirmDelete = () => {
    if (!deleteIds) return;
    const removed = deleteIssues(deleteIds);
    setSelection((current) => new Set([...current].filter((id) => !deleteIds.includes(id))));
    showToast(removed.length === 1 ? "הפנייה נמחקה." : `${removed.length} פניות נמחקו.`, removed);
  };

  const hasFilters =
    filters.status !== "all" || filters.category !== "all" || filters.query.trim() !== "";

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">ניהול פניות</h1>
        <p role="status" className="mt-1 text-sm text-slate-600">
          {visible.length} מתוך {issues.length} פניות מוצגות
        </p>
      </div>

      {/* One row of filters above everything they scope. */}
      <div role="search" aria-label="חיפוש וסינון פניות" className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <div className="flex min-w-0 flex-[1_1_16rem]">
            <SearchInput
              value={filters.query}
              onChange={(query) => setFilters((current) => ({ ...current, query }))}
              placeholder="חיפוש לפי כותרת, מזהה או טלפון..."
              label="חיפוש פניות"
            />
          </div>
          <CategorySelect
            value={filters.category === "all" ? null : filters.category}
            onChange={(category) =>
              setFilters((current) => ({ ...current, category: category ?? "all" }))
            }
          />
          <SortSelect
            value={filters.sort}
            onChange={(sort) => setFilters((current) => ({ ...current, sort }))}
          />
        </div>

        <fieldset className="min-w-0">
          <legend className="sr-only">סינון לפי סטטוס</legend>
          <div className="-mx-4 -my-1 flex gap-2 overflow-x-auto px-4 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:mx-0 lg:px-0">
            {STATUS_FILTERS.map(({ value, label }) => {
              const selected = filters.status === value;
              const count = value === "all" ? issues.length : statusCounts[value];
              return (
                <label
                  key={value}
                  className="relative shrink-0 cursor-pointer select-none [-webkit-tap-highlight-color:transparent]"
                >
                  <input
                    type="radio"
                    name="admin-status-filter"
                    value={value}
                    checked={selected}
                    onChange={() => setFilters((current) => ({ ...current, status: value }))}
                    className="peer sr-only"
                  />
                  <span
                    className={cn(
                      "flex h-10 items-center gap-2 rounded-full border px-4 text-sm transition",
                      "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-blue-600",
                      selected
                        ? "border-slate-900 bg-slate-900 font-semibold text-white"
                        : "border-slate-200 bg-white font-medium text-slate-700 hover:bg-slate-100",
                    )}
                  >
                    {label}
                    <span className={cn("tabular-nums", selected ? "text-slate-300" : "text-slate-500")}>
                      {count}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
      </div>

      {selectedIds.length > 0 && (
        // Floats at the bottom of the screen (visually last, but next in the tab order after the
        // filters), so ticking a row never pushes the table down under the pointer.
        <div
          role="region"
          aria-label="פעולות על הפניות שנבחרו"
          className="sticky bottom-4 z-20 order-last flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 shadow-lg"
        >
          <p className="text-sm font-bold text-blue-900">
            {selectedIds.length === 1 ? "נבחרה פנייה אחת" : `נבחרו ${selectedIds.length} פניות`}
          </p>
          <select
            aria-label="שינוי סטטוס לפניות שנבחרו"
            value=""
            onChange={(event) => {
              const next = ISSUE_STATUSES.find((status) => status === event.target.value);
              if (next) changeSelectedStatus(next);
            }}
            className="h-10 rounded-lg border border-blue-200 bg-white px-3 text-base font-medium text-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:text-sm"
          >
            <option value="" disabled>
              שינוי סטטוס ל…
            </option>
            {ISSUE_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setDeleteIds(selectedIds)}
            className="h-10 rounded-lg px-3 text-sm font-semibold text-red-700 transition hover:bg-red-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
          >
            מחיקת הנבחרות
          </button>
          <button
            type="button"
            onClick={() => setSelection(new Set())}
            className="h-10 rounded-lg px-3 text-sm font-medium text-slate-700 transition hover:bg-blue-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            ביטול בחירה
          </button>
        </div>
      )}

      {issues.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-sm font-medium text-slate-600">
          אין פניות בקהילה כרגע.
        </p>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <SearchX aria-hidden className="size-8 text-slate-400" />
          <p className="text-sm font-medium text-slate-700">לא נמצאו פניות התואמות לסינון</p>
          {hasFilters && (
            <button
              type="button"
              onClick={() => setFilters(DEFAULT_ADMIN_FILTERS)}
              className="h-11 rounded-full border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              נקה סינון
            </button>
          )}
        </div>
      ) : (
        <IssuesList
          issues={visible}
          now={now}
          selected={selection}
          onToggle={toggle}
          onToggleAll={toggleAll}
          onStatusChange={changeStatus}
          onEdit={setDetailsId}
          onDelete={(id) => setDeleteIds([id])}
        />
      )}

      {detailsIssue && (
        <IssueDetailsDialog
          key={detailsIssue.id}
          issue={detailsIssue}
          now={now}
          onStatusChange={(status) => changeStatus(detailsIssue.id, status)}
          onSaveNote={(note) => setAdminNote(detailsIssue.id, note)}
          onDelete={() => setDeleteIds([detailsIssue.id])}
          onClose={() => setDetailsId(null)}
        />
      )}

      {deleteIds && (
        <ConfirmDialog
          title={pendingDelete.length === 1 ? "מחיקת פנייה" : `מחיקת ${deleteIds.length} פניות`}
          message={
            pendingDelete.length === 1
              ? `הפנייה "${pendingDelete[0].title}" תימחק מהפיד. אפשר לבטל מיד אחרי המחיקה.`
              : `${deleteIds.length} פניות יימחקו מהפיד. אפשר לבטל מיד אחרי המחיקה.`
          }
          confirmLabel="מחק"
          tone="danger"
          onConfirm={confirmDelete}
          onClose={() => setDeleteIds(null)}
        />
      )}

      {toast && (
        <Toast
          key={toast.id}
          message={toast.message}
          onDismiss={dismissToast}
          visibleMs={toast.undo ? 7000 : undefined}
          action={
            toast.undo
              ? { label: "ביטול", onClick: () => restoreIssues(toast.undo ?? []) }
              : undefined
          }
        />
      )}
    </div>
  );
}
