"use client";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Sparkles } from "lucide-react";
import { NotificationPreferencesForm } from "@/components/notifications/NotificationPreferencesForm";
import { PreferenceSettings } from "@/components/profile/preference-settings";
import { SecuritySettings } from "@/components/profile/security-settings";
import { PersonalInformation } from "@/components/profile/personal-information";
import { SettingsTabs } from "@/components/settings/settings-tabs";
import { PaymentsSettings } from "@/components/settings/payments-settings";
import { SellerSettings } from "@/components/settings/seller-settings";
import { PrivacySettings } from "@/components/settings/privacy-settings";
import { HelpLegal } from "@/components/settings/help-legal";
import { DangerZone } from "@/components/settings/danger-zone";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";

interface SettingsContentProps {
  user: {
    name: string;
    email: string;
    role: "USER" | "SELLER" | "ADMIN";
    image: string | null;
  };
}

export function SettingsContent({ user }: SettingsContentProps) {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "account";
  const isSeller = user?.role === "SELLER";

  return (
    <DashboardShell user={user}>
      <section className="relative isolate mb-8 overflow-hidden rounded-[2rem] bg-primary px-6 py-8 text-primary-foreground sm:px-10 sm:py-10">
        <div className="pointer-events-none absolute -right-20 -top-36 -z-10 h-80 w-80 rounded-full border-[40px] border-border/20" />
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-accent"><Sparkles className="h-4 w-4" /> Account</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Settings</h1>
        <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <p className="max-w-xl text-sm leading-6 text-primary-foreground/70 sm:text-base">
            Manage your account preferences, notifications, and security settings.
          </p>
        </div>
      </section>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Tabs */}
        <div className="lg:w-64 shrink-0">
          <SettingsTabs activeTab={activeTab} isSeller={isSeller} />
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          {activeTab === "account" && (
            <div>
              <div className="mb-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">My Account</p>
                <h2 className="mt-1 text-xl font-semibold tracking-tight text-foreground">Personal information</h2>
              </div>
              <PersonalInformation user={user} />
            </div>
          )}

          {activeTab === "security" && (
            <div>
              <div className="mb-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Security</p>
                <h2 className="mt-1 text-xl font-semibold tracking-tight text-foreground">Password & security</h2>
              </div>
              <SecuritySettings emailVerified={!!session?.user?.emailVerified} />
            </div>
          )}

          {activeTab === "preferences" && (
            <div>
              <div className="mb-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Preferences</p>
                <h2 className="mt-1 text-xl font-semibold tracking-tight text-foreground">Notifications, theme, language</h2>
              </div>
              <NotificationPreferencesForm />
              <div className="mt-6">
                <PreferenceSettings />
              </div>
            </div>
          )}

          {activeTab === "payments" && (
            <div>
              <div className="mb-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Payments</p>
                <h2 className="mt-1 text-xl font-semibold tracking-tight text-foreground">Payment methods & payout account</h2>
              </div>
              <PaymentsSettings />
            </div>
          )}

          {activeTab === "seller" && (
            <div>
              <div className="mb-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Seller Settings</p>
                <h2 className="mt-1 text-xl font-semibold tracking-tight text-foreground">Store, products and licenses</h2>
              </div>
              <SellerSettings />
            </div>
          )}

          {activeTab === "privacy" && (
            <div>
              <div className="mb-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Privacy</p>
                <h2 className="mt-1 text-xl font-semibold tracking-tight text-foreground">Visibility, data requests, connected apps</h2>
              </div>
              <PrivacySettings />
            </div>
          )}

          {activeTab === "help" && (
            <div>
              <div className="mb-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Help & Legal</p>
                <h2 className="mt-1 text-xl font-semibold tracking-tight text-foreground">Support, terms and policies</h2>
              </div>
              <HelpLegal />
            </div>
          )}

          {activeTab === "danger" && (
            <div>
              <div className="mb-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-destructive">Danger Zone</p>
                <h2 className="mt-1 text-xl font-semibold tracking-tight text-foreground">Deactivate or delete account</h2>
              </div>
              <DangerZone />
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
