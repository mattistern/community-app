/** Placeholder for the instant before the browser has loaded the local issues. */
export function FeedSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      className="animate-pulse space-y-4 motion-reduce:animate-none"
    >
      <span className="sr-only">טוען דיווחים…</span>

      <div aria-hidden className="space-y-3">
        <div className="h-11 rounded-xl bg-slate-200" />
        <div className="flex gap-2 overflow-hidden">
          {["w-24", "w-14", "w-20", "w-16", "w-16"].map((width, index) => (
            <div
              key={index}
              className={`h-10 shrink-0 rounded-full bg-slate-200 ${width}`}
            />
          ))}
        </div>
      </div>

      {[0, 1].map((index) => (
        <div
          key={index}
          aria-hidden
          className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div className="flex justify-between">
            <div className="h-4 w-20 rounded bg-slate-200" />
            <div className="h-6 w-16 rounded-full bg-slate-200" />
          </div>
          <div className="h-5 w-3/4 rounded bg-slate-200" />
          <div className="h-4 w-full rounded bg-slate-100" />
          <div className="aspect-video rounded-xl bg-slate-100" />
        </div>
      ))}
    </div>
  );
}
