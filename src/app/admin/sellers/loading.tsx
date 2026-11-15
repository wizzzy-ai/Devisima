export default function AdminSellersLoading() {
  return (
    <main aria-busy="true" aria-label="Loading seller management" className="mx-auto max-w-7xl animate-pulse space-y-5 p-4">
      <div className="h-10 w-64 rounded-xl bg-muted" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => <div key={index} className="h-28 rounded-2xl bg-muted" />)}
      </div>
      <div className="h-40 rounded-2xl bg-muted" />
      <div className="h-96 rounded-2xl bg-muted" />
    </main>
  );
}
