export function AnalyticsLoading() {
  return (
    <main aria-label="Loading analytics" aria-busy="true" className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl animate-pulse space-y-6">
        <div className="h-8 w-56 rounded-lg bg-muted" />
        <div className="h-24 rounded-2xl bg-muted" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 8 }, (_, index) => <div key={index} className="h-28 rounded-2xl bg-muted" />)}</div>
        <div className="h-80 rounded-2xl bg-muted" />
        <div className="h-64 rounded-2xl bg-muted" />
      </div>
    </main>
  );
}
