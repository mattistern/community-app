import { Plus } from "lucide-react";

/** Floating action button (DESIGN.md §3B), centered at the bottom as in the approved mockup. */
export function NewIssueFab({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed inset-x-0 bottom-5 z-40 mx-auto flex h-14 w-fit items-center gap-2 rounded-full bg-blue-600 ps-4 pe-5 text-base font-bold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-700 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
    >
      <Plus aria-hidden className="size-6" />
      דווח על בעיה חדשה
    </button>
  );
}
