import { requireAuth } from "@/lib/auth/guards";
import { SettingsContent } from "@/components/settings/settings-content";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings - Devisima",
  description: "Manage your account settings and preferences.",
  robots: "noindex",
};

export default async function SettingsPage() {
  const user = await requireAuth("/settings");

  return <SettingsContent user={user} />;
}
