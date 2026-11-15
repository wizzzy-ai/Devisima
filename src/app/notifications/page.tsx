import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { requireAuth } from "@/lib/auth/guards";
import { getNotifications } from "@/lib/notifications";

export const metadata: Metadata = { title: "Notifications | Devisima", description: "Updates about your Devisima account activity.", robots: "noindex" };

export default async function NotificationsPage({ searchParams }: PageProps<"/notifications">) {
  const user = await requireAuth("/notifications");
  if (user.status !== "ACTIVE") redirect("/forbidden");
  const params = await searchParams;
  const pageValue = Number(params.page);
  const page = Number.isSafeInteger(pageValue) && pageValue > 0 ? Math.min(pageValue, 100_000) : 1;
  const unreadOnly = params.filter === "unread";
  const result = await getNotifications(user.id, { page, limit: 20, unreadOnly });

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background pt-20">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <header className="mb-7">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Your account</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">Notifications</h1>
            <p className="mt-2 text-sm text-muted-foreground">Updates about your purchases, products, payments and account activity.</p>
          </header>
          <NotificationCenter notifications={result.notifications} page={result.page} totalPages={result.totalPages} unreadOnly={unreadOnly} />
        </div>
      </main>
    </>
  );
}
