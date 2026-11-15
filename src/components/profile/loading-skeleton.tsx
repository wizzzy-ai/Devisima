export function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="h-4 w-32 bg-muted rounded animate-pulse" />
          <div className="mt-2 h-8 w-48 bg-muted rounded animate-pulse" />
          <div className="mt-1 h-4 w-64 bg-muted rounded animate-pulse" />
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Skeleton */}
          <aside className="w-full lg:w-72 space-y-6">
            <div className="rounded-2xl border bg-card p-6">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-muted animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-40 bg-muted rounded animate-pulse" />
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="h-3 w-24 bg-muted rounded animate-pulse" />
                <div className="h-10 w-full bg-muted rounded animate-pulse" />
              </div>
            </div>
            <div className="space-y-3">
              <div className="h-4 w-20 bg-muted rounded animate-pulse" />
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-10 w-full bg-muted rounded animate-pulse" />
                ))}
              </div>
            </div>
          </aside>

          {/* Main Content Skeleton */}
          <div className="flex-1 space-y-6">
            <div className="rounded-2xl border bg-card p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <div className="h-20 w-20 rounded-full bg-muted animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-8 w-48 bg-muted rounded animate-pulse" />
                  <div className="h-4 w-64 bg-muted rounded animate-pulse" />
                  <div className="flex gap-3 mt-3">
                    <div className="h-6 w-24 bg-muted rounded-full animate-pulse" />
                    <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                  </div>
                </div>
                <div className="h-10 w-24 bg-muted rounded animate-pulse" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="rounded-2xl border bg-card p-5">
                  <div className="h-5 w-5 bg-muted rounded animate-pulse mb-2" />
                  <div className="h-8 w-16 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-20 bg-muted rounded animate-pulse mt-2" />
                </div>
              ))}
            </div>

            <div className="rounded-2xl border bg-card p-6 sm:p-8">
              <div className="h-6 w-32 bg-muted rounded animate-pulse mb-1" />
              <div className="h-4 w-64 bg-muted rounded animate-pulse mb-6" />
              <div className="space-y-5">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                    <div className="h-12 w-full bg-muted rounded animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
