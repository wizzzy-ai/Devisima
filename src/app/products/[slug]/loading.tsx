export default function ProductDetailsLoading() {
  return (
    <main className="min-h-screen bg-[#F7F5EF] px-4 pb-16 pt-24 sm:px-8 sm:pt-28" aria-label="Loading product">
      <div className="mx-auto max-w-7xl animate-pulse">
        <div className="h-4 w-48 rounded bg-[#e2e8df]" />
        <div className="mt-6 grid gap-7 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,.8fr)]">
          <div className="aspect-[4/3] rounded-2xl bg-[#e6ebe4] sm:aspect-[16/10]" />
          <div className="space-y-5 rounded-2xl border border-[#dce3dd] bg-white p-6"><div className="h-4 w-32 rounded bg-[#e6ebe4]" /><div className="h-10 w-3/4 rounded bg-[#e6ebe4]" /><div className="h-16 rounded bg-[#eef1ec]" /><div className="h-12 rounded bg-[#e6ebe4]" /><div className="h-12 rounded bg-[#e6ebe4]" /></div>
        </div>
      </div>
    </main>
  );
}
