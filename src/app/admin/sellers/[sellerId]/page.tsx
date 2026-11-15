import { AdminShell } from "@/components/admin/admin-shell";
import { SellerManagement } from "@/components/admin/SellerManagement";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Seller Management | Devisima Admin",
  description: "Manage individual seller accounts, products, and restrictions.",
  robots: "noindex",
};

export default async function AdminSellerManagePage({
  params,
}: {
  params: Promise<{ sellerId: string }>;
}) {
  const admin = await requireAdmin();
  const { sellerId } = await params;

  const seller = await db.user.findFirst({
    where: {
      id: sellerId,
      sellerApplications: { some: {} },
    },
    select: {
      id: true,
      name: true,
      email: true,
      emailVerified: true,
      role: true,
      status: true,
      sellerSuspendedAt: true,
      sellerSuspensionReason: true,
      sessionVersion: true,
      createdAt: true,
      sellerApplications: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true,
          storeName: true,
          status: true,
          createdAt: true,
        },
      },
      products: {
        where: { adminRestrictedAt: null },
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
          adminRestrictedAt: true,
          adminRestrictionReason: true,
          totalSales: true,
          averageRating: true,
          price: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      auditLogs: {
        where: {
          action: { in: ["SELLER_SUSPENDED", "SELLER_REINSTATED", "SELLER_PRODUCT_RESTRICTED", "SELLER_PRODUCT_RESTORED", "SELLER_MESSAGE_SENT"] },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          action: true,
          entityType: true as string,
          entityId: true,
          metadata: true,
          createdAt: true,
          admin: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  if (!seller) {
    notFound();
  }

  const application = seller.sellerApplications.find((app) => app.status === "APPROVED");
  const suspended = Boolean(seller.sellerSuspendedAt) || seller.status === "SUSPENDED";

  if (!application && seller.role !== "SELLER") {
    return (
      <AdminShell user={admin}>
        <div className="mx-auto max-w-7xl py-12 text-center">
          <h1 className="text-2xl font-semibold text-foreground mb-4">Seller not approved</h1>
          <p className="text-muted-foreground mb-6">This user has not yet been approved as a seller.</p>
          <Link href="/admin/seller-applications" className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
            Review applications
          </Link>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell user={admin}>
      <SellerManagement
        seller={{
          id: seller.id,
          name: seller.name,
          email: seller.email,
          emailVerified: seller.emailVerified as boolean | null,
          role: seller.role,
          status: seller.status,
          sellerSuspendedAt: seller.sellerSuspendedAt,
          sellerSuspensionReason: seller.sellerSuspensionReason,
          sessionVersion: seller.sessionVersion,
          createdAt: seller.createdAt,
          storeName: application?.storeName,
          applicationStatus: application?.status,
          applicationId: application?.id,
          suspended,
        }}
        products={seller.products}
        auditLogs={seller.auditLogs}
      />
    </AdminShell>
  );
}
