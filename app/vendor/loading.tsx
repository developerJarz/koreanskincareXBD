// Shown instantly while the seller dashboard loads (e.g. right after signing in)
export default function VendorLoading() {
  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]">
      <aside className="hidden lg:block h-screen sticky top-0 bg-sidebar" aria-hidden="true" />
      <div className="min-w-0">
        <div className="sticky top-0 z-30 h-14 border-b border-border bg-card/95" />
        <div
          className="px-4 sm:px-6 lg:px-8 py-6 space-y-6 max-w-6xl animate-pulse"
          role="status"
          aria-live="polite"
        >
          <span className="sr-only">Loading your seller dashboard…</span>
          <div className="h-8 w-56 rounded-lg bg-secondary" />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="h-48 rounded-2xl bg-card border border-border" />
            <div className="h-48 rounded-2xl bg-card border border-border" />
          </div>
        </div>
      </div>
    </div>
  );
}
