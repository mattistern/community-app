import { BadgeCheck } from "lucide-react";

/** Official public status note from the community admin (הערת הנהלה רשמית). */
export function AdminNote({ note }: { note: string }) {
  return (
    <div className="mt-3 flex gap-2.5 rounded-xl border border-blue-100 bg-blue-50 p-3">
      <BadgeCheck aria-hidden className="mt-0.5 size-4 shrink-0 text-blue-700" />
      <div>
        <p className="text-xs font-bold text-blue-800">הערת הנהלה רשמית</p>
        <p className="mt-0.5 text-sm leading-relaxed text-slate-700">{note}</p>
      </div>
    </div>
  );
}
