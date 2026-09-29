// Shown instantly while the dashboard data is fetched on the server (e.g. right after signing in)
export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]">
      <aside className="hidden lg:block h-screen sticky top-0 bg-sidebar" aria-hidden="true">
        <div className="h-14 px-5 flex items-center border-b border-sidebar-border">
          <div className="h-4 w-32 rounded bg-sidebar-accent" />
        </div>
        <div className="p-4 space-y-2.5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-8 rounded-lg bg-sidebar-accent/60" />
          ))}
        </div>
      </aside>

      <div className="min-w-0">
        <div className="sticky top-0 z-30 h-14 border-b border-border bg-card/95 flex items-center px-4 lg:px-8">
          <div className="h-4 w-28 rounded bg-secondary" />
        </div>
        <div
          className="px-4 sm:px-6 lg:px-8 py-6 space-y-6 max-w-[1440px] animate-pulse"
          role="status"
          aria-live="polite"
        >
          <span className="sr-only">Loading your dashboard…</span>
          <div className="h-8 w-64 rounded-lg bg-secondary" />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 rounded-2xl bg-card border border-border" />
            ))}
          </div>
          <div className="h-72 rounded-2xl bg-card border border-border" />
        </div>
      </div>
    </div>
  );
}
