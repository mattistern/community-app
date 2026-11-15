import { cn } from "@/lib/cn";
import type { IssueStatus } from "@/lib/types";

/** DESIGN.md §2 status colors. */
export const STATUS_STYLES: Record<IssueStatus, string> = {
  "בהמתנה": "bg-amber-100 text-amber-800",
  "בתהליך": "bg-blue-100 text-blue-800",
  "בוצע": "bg-emerald-100 text-emerald-800",
  "נדחה": "bg-slate-200 text-slate-700",
};

interface StatusBadgeProps {
  status: IssueStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-1 text-xs font-semibold",
        STATUS_STYLES[status],
        className,
      )}
    >
      {status}
    </span>
  );
}
