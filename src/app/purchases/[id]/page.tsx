import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, FileArchive, PackageCheck } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { SecureDownloadButton } from "@/components/purchases/SecureDownloadButton";
import { RefundRequestButton } from "@/components/purchases/RefundRequestButton";
import { requireAuth } from "@/lib/auth/guards";
import { db } from "@/lib/db/prisma";
import { formatMarketplaceMoney } from "@/lib/marketplace/config";

export const metadata: Metadata = { title: "Purchase Details | Devisima", robots: "noindex" };
type PageProps = { params: Promise<{ id: string }> };

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function safeHttpUrl(value: string | null) {
  if (!value) return null;
  try { const url = new URL(value); return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null; } catch { return null; }
}

export default async function PurchaseDetailsPage({ params }: PageProps) {
  const user = await requireAuth("/purchases");
  const { id } = await params;
  if (!/^c[a-z0-9]{20,30}$/i.test(id)) notFound();
  const purchase = await db.purchase.findFirst({
    where: { id, userId: user.id, order: { status: "PAID", payments: { some: { status: "SUCCESS" } } } },
    select: {
      id: true,
      purchasedAt: true,
      purchasedPrice: true,
      purchasedVersion: true,
      order: { select: { reference: true, total: true, currency: true, status: true, payments: { where: { status: "SUCCESS" }, orderBy: { paidAt: "desc" }, take: 1, select: { status: true, paidAt: true } } } },
      orderItem: { select: { productName: true, productSlug: true, sellerName: true, licenseType: true, quantity: true } },
      product: { select: { id: true, slug: true, status: true, version: true, images: true, licenseType: true, documentationUrl: true, supportPeriod: true, supportInformation: true, assets: { orderBy: [{ isCover: "desc" }, { createdAt: "desc" }], select: { id: true, kind: true, fileName: true, mimeType: true, sizeBytes: true, createdAt: true } } } },
    },
  });
  if (!purchase) notFound();

  const coverAsset = purchase.product?.assets.find((asset) => asset.kind === "IMAGE");
  const files = purchase.product?.assets.filter((asset) => asset.kind === "FILE") ?? [];
  const cover = purchase.product?.images[0] ?? (coverAsset ? `/api/products/assets/${coverAsset.id}` : null);
  const documentationUrl = safeHttpUrl(purchase.product?.documentationUrl ?? null);
  const amount = formatMarketplaceMoney(purchase.purchasedPrice * purchase.orderItem.quantity);

  return <><Navbar /><main className="min-h-screen bg-[#F7F5EF] px-4 pb-16 pt-24 text-[#101820] sm:px-8 sm:pt-28"><div className="mx-auto max-w-5xl"><Link href="/purchases" className="inline-flex items-center gap-2 text-sm font-semibold text-[#0F4C5C] hover:underline"><ArrowLeft className="h-4 w-4" />Back to purchases</Link><section className="mt-5 overflow-hidden rounded-3xl border border-[#dce3dd] bg-white shadow-sm"><div className="grid gap-6 p-5 sm:grid-cols-[220px_1fr] sm:p-8"><div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-[#edf1ec]">{cover ? <Image src={cover} alt="" fill unoptimized sizes="220px" className="object-cover" /> : <div className="grid h-full place-items-center text-[#0F4C5C]"><PackageCheck className="h-10 w-10" /></div>}</div><div className="min-w-0"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0F4C5C]">Verified purchase</p><h1 className="mt-2 break-words text-3xl font-semibold tracking-tight">{purchase.orderItem.productName}</h1><p className="mt-2 text-sm text-[#697579]">By {purchase.orderItem.sellerName}</p><dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2"><div><dt className="text-xs text-[#77837a]">Order reference</dt><dd className="mt-1 break-all font-semibold">{purchase.order.reference}</dd></div><div><dt className="text-xs text-[#77837a]">Purchase date</dt><dd className="mt-1 font-semibold">{purchase.purchasedAt.toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric", timeZone: "Africa/Lagos" })}</dd></div><div><dt className="text-xs text-[#77837a]">Amount paid</dt><dd className="mt-1 font-semibold">{amount}</dd></div><div><dt className="text-xs text-[#77837a]">Payment status</dt><dd className="mt-1 font-semibold text-[#0F4C5C]">{purchase.order.payments[0]?.status ?? "Verified"}</dd></div><div><dt className="text-xs text-[#77837a]">Purchased version</dt><dd className="mt-1 font-semibold">{purchase.purchasedVersion || "Not recorded"}</dd></div><div><dt className="text-xs text-[#77837a]">Current version</dt><dd className="mt-1 font-semibold">{purchase.product?.version ?? "Listing unavailable"}</dd></div></dl><div className="mt-5 flex flex-wrap gap-3">{purchase.product?.status === "PUBLISHED" && <Link href={`/products/${purchase.product.slug}`} className="inline-flex h-10 items-center justify-center rounded-xl border border-[#dce3dd] px-4 text-sm font-semibold hover:bg-[#f4f6f2]">View product</Link>}{documentationUrl && <a href={documentationUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#dce3dd] px-4 text-sm font-semibold hover:bg-[#f4f6f2]">Documentation <ExternalLink className="h-3.5 w-3.5" /></a>}</div></div></div>
      <div className="border-t border-[#e5eae5] p-5 sm:p-8"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0F4C5C]">Entitled files</p><h2 className="mt-1 text-xl font-semibold">Product downloads</h2></div><p className="text-xs text-[#697579]">Links expire after two minutes and require your account.</p></div>{files.length ? <ul className="mt-4 divide-y divide-[#e5eae5]">{files.map((file) => <li key={file.id} className="flex flex-col gap-3 py-4 first:pt-0 sm:flex-row sm:items-center"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#e9f1e8] text-[#0F4C5C]"><FileArchive className="h-5 w-5" /></div><div className="min-w-0 flex-1"><p className="break-all font-semibold">{file.fileName}</p><p className="mt-1 text-xs text-[#697579]">{file.mimeType} · {formatSize(file.sizeBytes)} · Version {purchase.product?.version}</p></div><SecureDownloadButton href={`/api/downloads/${purchase.id}?fileId=${encodeURIComponent(file.id)}`} fileName={file.fileName} compact /></li>)}</ul> : <p className="mt-4 rounded-xl bg-[#f4f6f2] p-4 text-sm text-[#697579]">No product files are currently available. The purchase entitlement is active; contact the seller if you need help.</p>}
        <div className="mt-6 grid gap-4 border-t border-[#e5eae5] pt-5 sm:grid-cols-2"><div><p className="text-xs font-semibold uppercase tracking-wide text-[#77837a]">License</p><p className="mt-1 text-sm leading-6">{(purchase.product?.licenseType ?? purchase.orderItem.licenseType).toLowerCase().replaceAll("_", " ")} license</p></div><div><p className="text-xs font-semibold uppercase tracking-wide text-[#77837a]">Support</p><p className="mt-1 whitespace-pre-wrap text-sm leading-6">{purchase.product?.supportInformation || purchase.product?.supportPeriod || "Contact the seller through the product listing for support."}</p></div></div>
        <RefundRequestButton purchaseId={purchase.id} orderReference={purchase.order.reference} />
      </div></section></div></main></>;
}
