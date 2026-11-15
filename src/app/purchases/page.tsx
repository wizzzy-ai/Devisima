import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Download, PackageCheck, ShoppingBag } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { ProfileSidebar } from "@/components/profile/profile-sidebar";
import { requireAuth } from "@/lib/auth/guards";
import { db } from "@/lib/db/prisma";
import { formatMarketplaceMoney } from "@/lib/marketplace/config";

export const metadata: Metadata = { title: "Purchases | Devisima", description: "Your verified purchases and secure downloads.", robots: "noindex" };

export default async function PurchasesPage() {
  const user = await requireAuth("/purchases");
  const purchases = await db.purchase.findMany({
    where: { userId: user.id, order: { status: "PAID", payments: { some: { status: "SUCCESS" } } } },
    orderBy: { purchasedAt: "desc" },
    select: {
      id: true,
      purchasedAt: true,
      purchasedPrice: true,
      purchasedVersion: true,
      order: { select: { reference: true, total: true } },
      orderItem: { select: { productName: true, productSlug: true, sellerName: true, licenseType: true } },
      product: { select: { slug: true, status: true, version: true, images: true, assets: { where: { kind: "IMAGE" }, orderBy: [{ isCover: "desc" }, { createdAt: "asc" }], take: 1, select: { id: true } }, _count: { select: { assets: { where: { kind: "FILE" } } } } } },
    },
  });

  return <><Navbar /><main className="min-h-screen bg-[#F7F5EF]"><div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"><header className="mb-8"><p className="text-sm font-semibold uppercase tracking-widest text-[#0F4C5C]">Account</p><h1 className="mt-2 text-3xl font-semibold text-[#101820]">Purchases</h1><p className="mt-1 text-sm text-[#697579]">Paid orders and files available through secure download links.</p></header><div className="flex flex-col gap-8 lg:flex-row"><ProfileSidebar user={user} /><section className="min-w-0 flex-1" aria-label="Your purchases">{purchases.length === 0 ? <div className="rounded-2xl border border-[#dce3dd] bg-white p-8 text-center shadow-sm"><ShoppingBag className="mx-auto mb-4 h-14 w-14 text-[#0F4C5C]" /><h2 className="text-xl font-semibold text-[#101820]">No purchases yet</h2><p className="mt-2 text-sm text-[#697579]">Explore Devisima and find software built for your next project.</p><Link href="/marketplace" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#0F4C5C] px-6 py-3 text-sm font-semibold text-white hover:bg-[#0a3b48]">Explore Marketplace <ArrowUpRight className="h-4 w-4" /></Link></div> : <div className="space-y-4">{purchases.map((purchase) => { const image = purchase.product?.images[0] ?? (purchase.product?.assets[0] ? `/api/products/assets/${purchase.product.assets[0].id}` : null); const hasFiles = (purchase.product?._count.assets ?? 0) > 0; return <article key={purchase.id} className="flex flex-col gap-4 rounded-2xl border border-[#dce3dd] bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:p-5"><div className="relative h-24 w-full shrink-0 overflow-hidden rounded-xl bg-[#edf1ec] sm:h-20 sm:w-28">{image ? <Image src={image} alt="" fill unoptimized sizes="112px" className="object-cover" /> : <div className="grid h-full place-items-center text-[#0F4C5C]"><PackageCheck className="h-7 w-7" /></div>}</div><div className="min-w-0 flex-1"><h2 className="truncate text-lg font-semibold text-[#101820]">{purchase.orderItem.productName}</h2><p className="mt-1 text-sm text-[#697579]">By {purchase.orderItem.sellerName} · {formatMarketplaceMoney(purchase.purchasedPrice)} · {purchase.orderItem.licenseType.toLowerCase()} license</p><p className="mt-1 break-words text-xs text-[#77837a]">Order {purchase.order.reference} · Purchased {purchase.purchasedAt.toLocaleDateString("en-NG", { year: "numeric", month: "short", day: "numeric", timeZone: "Africa/Lagos" })} · Version {purchase.purchasedVersion || "Not recorded"}{purchase.product?.version && purchase.product.version !== purchase.purchasedVersion ? ` · Current ${purchase.product.version}` : ""}</p><p className="mt-1 text-xs font-semibold text-[#0F4C5C]">Payment verified · Entitlement active</p></div><div className="flex shrink-0 flex-wrap gap-2"><Link href={`/purchases/${purchase.id}`} className="inline-flex h-10 items-center justify-center rounded-xl border border-[#dce3dd] px-4 text-sm font-semibold text-[#101820] hover:bg-[#f4f6f2]">Details</Link>{hasFiles && <Link href={`/purchases/${purchase.id}`} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#0F4C5C] px-4 text-sm font-semibold text-white hover:bg-[#0a3b48]"><Download className="h-4 w-4" />Download</Link>}{purchase.product?.status === "PUBLISHED" && <Link href={`/products/${purchase.product.slug}`} aria-label="View product" className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#dce3dd] text-[#0F4C5C] hover:bg-[#f4f6f2]"><ArrowUpRight className="h-4 w-4" /></Link>}</div></article>; })}</div>}</section></div></div></main></>;
}
