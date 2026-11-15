"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { MessageSquareText, Pencil, Trash2 } from "lucide-react";
import { UrgencyScore } from "@/components/feed/urgency-score";
import { hasUnreadForAdmin } from "@/lib/chat";
import { cn } from "@/lib/cn";
import { useChats } from "@/lib/local-chat";
import type { Issue, IssueStatus } from "@/lib/types";
import { LifecycleChip } from "./lifecycle-chip";
import { StatusSelect } from "./status-select";

interface IssuesListProps {
  /** Already filtered and sorted. */
  issues: Issue[];
  now: number;
  selected: ReadonlySet<string>;
  onToggle: (id: string) => void;
  /** Select (or clear) every issue listed. */
  onToggleAll: (select: boolean) => void;
  onStatusChange: (id: string, status: IssueStatus) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

/** Phone numbers read left to right even inside right-to-left text. */
function Phone({ value }: { value: string }) {
  return (
    <bdi dir="ltr" className="tabular-nums">
      {value}
    </bdi>
  );
}

function SelectAll({
  checked,
  indeterminate,
  onChange,
}: {
  checked: boolean;
  indeterminate: boolean;
  onChange: (select: boolean) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <input
      ref={ref}
      type="checkbox"
      aria-label="בחירת כל הפניות המוצגות"
      checked={checked}
      onChange={(event) => onChange(event.target.checked)}
      className="size-5 accent-blue-600"
    />
  );
}

function RowCheckbox({
  issue,
  checked,
  onToggle,
}: {
  issue: Issue;
  checked: boolean;
  onToggle: (id: string) => void;
}) {
  // The label makes the whole 44px square tappable, not just the small box.
  return (
    <label className="grid size-11 shrink-0 cursor-pointer place-items-center">
      <input
        type="checkbox"
        aria-label={`בחירת פנייה #${issue.id}`}
        checked={checked}
        onChange={() => onToggle(issue.id)}
        className="size-5 accent-blue-600"
      />
    </label>
  );
}

/** Marks a row whose private chat has an unread reply from the resident. */
function UnreadChip() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">
      <span aria-hidden className="size-1.5 rounded-full bg-red-600" />
      הודעה חדשה מהמדווח
    </span>
  );
}

const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600";
// Cards on phones: a 44px button with its word. The desktop table has little room, so there each action is a 36px icon with a tooltip.
const ACTION = `inline-flex h-11 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium transition ${FOCUS}`;
const ICON_ACTION = `inline-grid size-9 place-items-center rounded-lg transition ${FOCUS}`;

function RowActions({
  issue,
  onEdit,
  onDelete,
  unreadChat,
  compact = false,
}: Pick<IssuesListProps, "onEdit" | "onDelete"> & {
  issue: Issue;
  unreadChat: boolean;
  compact?: boolean;
}) {
  const base = compact ? ICON_ACTION : ACTION;
  return (
    <div className={cn("flex items-center gap-1", !compact && "flex-wrap")}>
      <Link
        href={`/issue/${issue.id}`}
        aria-label={`${unreadChat ? "הודעה חדשה, " : ""}שיחה: פנייה #${issue.id}`}
        title={unreadChat ? "יש הודעה חדשה מהמדווח" : "עמוד הפנייה והשיחה הפרטית"}
        className={cn(base, "relative text-slate-700 hover:bg-slate-100")}
      >
        <MessageSquareText aria-hidden className="size-4" />
        {!compact && "שיחה"}
        {unreadChat && (
          <span
            aria-hidden
            className="absolute end-1 top-1 size-2.5 rounded-full bg-red-600 ring-2 ring-white"
          />
        )}
      </Link>
      <button
        type="button"
        onClick={() => onEdit(issue.id)}
        aria-label={`עריכה: פנייה #${issue.id}`}
        title="עריכה"
        className={cn(base, "text-slate-700 hover:bg-slate-100")}
      >
        <Pencil aria-hidden className="size-4" />
        {!compact && "עריכה"}
      </button>
      <button
        type="button"
        onClick={() => onDelete(issue.id)}
        aria-label={`מחיקה: פנייה #${issue.id}`}
        title="מחיקה"
        className={cn(base, "text-red-700 hover:bg-red-50")}
      >
        <Trash2 aria-hidden className="size-4" />
        {!compact && "מחיקה"}
      </button>
    </div>
  );
}

/**
 * The issues table (DESIGN.md §3C: ID, category, title, submitter phone, urgency,
 * status, actions) on wide screens, and the same rows as cards on phones and
 * narrow windows.
 */
export function IssuesList({
  issues,
  now,
  selected,
  onToggle,
  onToggleAll,
  onStatusChange,
  onEdit,
  onDelete,
}: IssuesListProps) {
  const chats = useChats();
  // Issues whose private thread has a resident message no admin has opened yet.
  const unreadIds = new Set(
    (chats ?? []).filter(hasUnreadForAdmin).map((thread) => thread.issueId),
  );
  const selectedCount = issues.filter((issue) => selected.has(issue.id)).length;
  const allSelected = issues.length > 0 && selectedCount === issues.length;

  return (
    <>
      <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm xl:block">
        <table className="w-full text-sm">
          <caption className="sr-only">רשימת הפניות</caption>
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th scope="col" className="w-14 py-2 ps-1">
                {/* Like the row checkboxes: the whole 44px square is the target. */}
                <label className="grid size-11 cursor-pointer place-items-center">
                  <SelectAll
                    checked={allSelected}
                    indeterminate={selectedCount > 0 && !allSelected}
                    onChange={onToggleAll}
                  />
                </label>
              </th>
              {["מזהה", "קטגוריה", "כותרת", "טלפון המדווח", "דחיפות", "סטטוס", "פעולות"].map((heading) => (
                <th key={heading} scope="col" className="py-3 pe-3 text-start font-semibold">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {issues.map((issue) => (
              <tr
                key={issue.id}
                className={cn(
                  "border-t border-slate-100 align-middle",
                  selected.has(issue.id) && "bg-blue-50/60",
                )}
              >
                <td className="ps-1">
                  <RowCheckbox issue={issue} checked={selected.has(issue.id)} onToggle={onToggle} />
                </td>
                <td className="py-3 pe-3 tabular-nums text-slate-600">#{issue.id}</td>
                <td className="py-3 pe-3 text-slate-700">{issue.category ?? "—"}</td>
                <td className="max-w-xs py-3 pe-3">
                  <button
                    type="button"
                    onClick={() => onEdit(issue.id)}
                    className="text-start font-semibold text-slate-900 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                  >
                    {issue.title}
                  </button>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-500">
                    {unreadIds.has(issue.id) && <UnreadChip />}
                    {issue.location && <span>{issue.location}</span>}
                    {issue.adminNote && <span className="font-medium text-blue-700">יש הערת הנהלה</span>}
                  </div>
                  <div className="mt-1.5 empty:hidden">
                    <LifecycleChip issue={issue} now={now} />
                  </div>
                </td>
                <td className="whitespace-nowrap py-3 pe-3 text-slate-700">
                  <Phone value={issue.authorPhone} />
                </td>
                <td className="whitespace-nowrap py-3 pe-3">
                  <UrgencyScore ratingSum={issue.ratingSum} voteCount={issue.voteCount} />
                </td>
                <td className="py-3 pe-3">
                  <StatusSelect
                    value={issue.status}
                    label={`סטטוס של פנייה #${issue.id}`}
                    onChange={(status) => onStatusChange(issue.id, status)}
                  />
                </td>
                <td className="py-3 pe-3">
                  <RowActions
                    issue={issue}
                    unreadChat={unreadIds.has(issue.id)}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    compact
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="xl:hidden">
        <label className="mb-1 flex min-h-11 w-fit cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
          <SelectAll
            checked={allSelected}
            indeterminate={selectedCount > 0 && !allSelected}
            onChange={onToggleAll}
          />
          בחירת כל הפניות המוצגות
        </label>
        <ul className="space-y-3">
          {issues.map((issue) => (
            <li
              key={issue.id}
              className={cn(
                "rounded-2xl border bg-white p-4 shadow-sm",
                selected.has(issue.id) ? "border-blue-300 bg-blue-50/40" : "border-slate-200",
              )}
            >
              <div className="flex items-start gap-1">
                <span className="-ms-2 -mt-2">
                  <RowCheckbox issue={issue} checked={selected.has(issue.id)} onToggle={onToggle} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-slate-500">
                      <span className="tabular-nums">#{issue.id}</span>
                      {issue.category && ` · ${issue.category}`}
                    </span>
                    <StatusSelect
                      value={issue.status}
                      label={`סטטוס של פנייה #${issue.id}`}
                      onChange={(status) => onStatusChange(issue.id, status)}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => onEdit(issue.id)}
                    className="mt-1.5 text-start text-base font-bold leading-snug text-slate-900 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                  >
                    {issue.title}
                  </button>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-slate-600">
                    <Phone value={issue.authorPhone} />
                    <UrgencyScore ratingSum={issue.ratingSum} voteCount={issue.voteCount} />
                  </div>
                  {unreadIds.has(issue.id) && (
                    <div className="mt-1.5">
                      <UnreadChip />
                    </div>
                  )}
                  {issue.adminNote && (
                    <p className="mt-1.5 text-xs font-medium text-blue-700">יש הערת הנהלה</p>
                  )}
                  <div className="mt-2 empty:hidden">
                    <LifecycleChip issue={issue} now={now} />
                  </div>
                </div>
              </div>
              <div className="mt-3 border-t border-slate-100 pt-2">
                <RowActions
                  issue={issue}
                  unreadChat={unreadIds.has(issue.id)}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
