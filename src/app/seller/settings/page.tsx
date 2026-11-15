import { requireSeller } from "@/lib/auth/guards";
import { db } from "@/lib/db/prisma";
import { SellerSettings } from "@/components/seller/SellerSettings";
import { SellerGreeting } from "@/components/seller/SellerGreeting";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings | Seller Workspace",
  description: "Manage your seller account settings, profile, and payout preferences.",
  robots: "noindex",
};

export default async function SellerSettingsPage() {
  const user = await requireSeller();

  // Redirect suspended users to forbidden page
  if (user.status === "SUSPENDED") {
    redirect("/forbidden");
  }

  if (user.role !== "SELLER" || user.status !== "ACTIVE") return null;

  const seller = await db.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      name: true,
      email: true,
      emailVerified: true,
      image: true,
      storeName: true,
      storeDescription: true,
      storeLogo: true,
      storeBanner: true,
      storeUrl: true,
      storeCategory: true,
      storeAccentColor: true,
      storeTwitter: true,
      storeLinkedin: true,
      storeInstagram: true,
      storeFacebook: true,
      storeSupportEmail: true,
      storeVisibility: true,
      sellerApplications: {
        where: { status: "APPROVED" },
        select: {
          id: true,
          storeName: true,
          description: true,
          productTypes: true,
          technologies: true,
          portfolioUrl: true,
          githubUrl: true,
          whyJoin: true,
        },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      sellerPayoutAccount: {
        select: {
          id: true,
          accountName: true,
          accountLast4: true,
          bankName: true,
          bankCode: true,
          isVerified: true,
          updatedAt: true,
        },
      },
      notificationPreference: {
        select: {
          orderEmails: true,
          paymentEmails: true,
          purchaseEmails: true,
          reviewEmails: true,
          sellerEmails: true,
          payoutEmails: true,
          marketingEmails: true,
          systemEmails: true,
        },
      },
    },
  });

  if (!seller) {
    throw new Error("Seller not found");
  }

  const application = seller.sellerApplications[0];

  return (
    <DashboardShell user={user}>
      <SellerGreeting
        label="Seller workspace"
        title="Settings"
        subtitle="Manage your seller account settings, profile, and payout preferences."
        showGreeting={false}
      />
      <SellerSettings
        seller={{
          id: seller.id,
          name: seller.name,
          email: seller.email,
          emailVerified: seller.emailVerified as boolean | null,
          image: seller.image,
          storeName: seller.storeName || undefined,
          description: seller.storeDescription || undefined,
          productTypes: application?.productTypes,
          technologies: application?.technologies,
          portfolioUrl: application?.portfolioUrl || undefined,
          githubUrl: application?.githubUrl || undefined,
          payoutAccount: seller.sellerPayoutAccount,
          notificationPreference: seller.notificationPreference,
          username: null,
          displayName: seller.name,
          bio: null,
          storeLogo: seller.storeLogo,
          storeBanner: seller.storeBanner,
          storeUrl: seller.storeUrl,
          storeCategory: seller.storeCategory,
          storeAccentColor: seller.storeAccentColor,
          socialLinks: { twitter: seller.storeTwitter, linkedin: null },
          supportEmail: seller.storeSupportEmail,
          storeVisibility: seller.storeVisibility as "public" | "private" | null,
          verificationStatus: {
            identityVerified: true,
            businessVerified: false,
            outstandingRequirements: ["Upload business document", "Verify phone number"]
          },
          accountStatus: user.status === "ACTIVE" ? "approved" : "suspended",
          statusExplanation: user.status === "ACTIVE" ? null : "Account is currently under review"
        }}
      />
    </DashboardShell>
  );
}
