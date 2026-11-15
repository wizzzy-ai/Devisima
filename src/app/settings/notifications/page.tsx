import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { NotificationPreferencesForm } from "@/components/notifications/NotificationPreferencesForm";
import { requireAuth } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Notification settings | Devisima", description: "Manage your Devisima email notification preferences.", robots: "noindex" };

export default async function NotificationSettingsPage() {
  const user = await requireAuth("/settings/notifications");
  if (user.status !== "ACTIVE") redirect("/forbidden");

  return (
    <DashboardShell user={user}>
      <div className="mb-4">
        <Link href="/settings" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" />
          Settings
        </Link>
      </div>

      <NotificationPreferencesForm />
    </DashboardShell>
  );
}
