import { requireAuth } from "@/lib/auth/guards";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ProfileHeader } from "@/components/profile/profile-header";
import { PersonalInformation } from "@/components/profile/personal-information";
import { Sparkles, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile - Devisima",
  description: "Manage your Devisima account settings and profile.",
  robots: "noindex",
};

export default async function ProfilePage() {
  const user = await requireAuth("/profile");

  return (
    <DashboardShell user={user}>
      <section className="relative isolate mb-8 overflow-hidden rounded-[2rem] bg-primary px-6 py-8 text-primary-foreground sm:px-10 sm:py-10">
        <div className="pointer-events-none absolute -right-20 -top-36 -z-10 h-80 w-80 rounded-full border-[40px] border-border/20" />
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-accent"><Sparkles className="h-4 w-4" /> Account</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Your profile</h1>
        <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <p className="max-w-xl text-sm leading-6 text-primary-foreground/70 sm:text-base">Manage your personal information and make your Devisima account feel like yours.</p>
          <Link href="/settings" className="inline-flex w-fit items-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-bold text-accent-foreground transition hover:bg-accent/90">
            Settings <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <div className="space-y-6">
        <ProfileHeader user={user} />
        <PersonalInformation user={user} />
      </div>
    </DashboardShell>
  );
}
