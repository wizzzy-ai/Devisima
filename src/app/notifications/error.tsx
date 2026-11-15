"use client";

export default function NotificationsError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-4 text-center"><h1 className="text-2xl font-semibold text-foreground">Notifications are unavailable</h1><p className="mt-2 text-sm text-muted-foreground">We couldn&apos;t load your notifications. Please try again.</p><button type="button" onClick={() => reset()} className="mt-5 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">Retry</button></main>;
}
