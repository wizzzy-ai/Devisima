import { requireAuth } from "@/lib/auth/guards";
import { Navbar } from "@/components/layout/Navbar";
import { ProfileSidebar } from "@/components/profile/profile-sidebar";
import { SecuritySettings } from "@/components/profile/security-settings";
import { ProfilePageHeading } from "@/components/profile/profile-page-heading";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Security - Devisima",
  description: "Manage your security settings and password.",
  robots: "noindex",
};

export default async function SecurityPage() {
  const user = await requireAuth("/profile/security");

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <ProfilePageHeading title="Security" description="Keep your account protected and your sign-in details up to date." />

          <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
            <ProfileSidebar user={user} />
            <div className="flex-1">
              <SecuritySettings emailVerified={!!user.emailVerified} />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
