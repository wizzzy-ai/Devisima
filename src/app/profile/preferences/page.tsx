import { requireAuth } from "@/lib/auth/guards";
import { Navbar } from "@/components/layout/Navbar";
import { ProfileSidebar } from "@/components/profile/profile-sidebar";
import { PreferenceSettings } from "@/components/profile/preference-settings";
import { ProfilePageHeading } from "@/components/profile/profile-page-heading";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Preferences - Devisima",
  description: "Customize your Devisima experience.",
  robots: "noindex",
};

export default async function PreferencesPage() {
  const user = await requireAuth("/profile/preferences");

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <ProfilePageHeading title="Preferences" description="Fine-tune how Devisima looks and works for you." />

          <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
            <ProfileSidebar user={user} />
            <div className="flex-1">
              <PreferenceSettings />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
