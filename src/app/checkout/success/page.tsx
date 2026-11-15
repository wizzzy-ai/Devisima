import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CheckCircle2, PackageCheck } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { requireAuth } from "@/lib/auth/guards";
import { db } from "@/lib/db/prisma";
import { formatMarketplaceMoney } from "@/lib/marketplace/config";

export const metadata: Metadata = { title: "Purchase Confirmed | Devisima", robots: "noindex" };
type PageProps = { searchParams: Promise<{ orderId?: string }> };

export default async function CheckoutSuccessPage({ searchParams }: PageProps) {
  const { orderId = "" } = await searchParams;
  const user = await requireAuth(`/checkout/success?orderId=${encodeURIComponent(orderId.slice(0, 64))}`);
  if (!/^c[a-z0-9]{20,30}$/i.test(orderId)) notFound();
  const order = await db.order.findFirst({
    where: { id: orderId, userId: user.id },
    select: {
      id: true,
      reference: true,
      total: true,
      currency: true,
      status: true,
      createdAt: true,
      payments: { where: { status: "SUCCESS" }, take: 1, select: { providerReference: true, paidAt: true } },
      items: { select: { id: true, productName: true, productSlug: true, priceAtPurchase: true, quantity: true, purchase: { select: { id: true } }, product: { select: { id: true, slug: true, status: true, images: true, assets: { where: { kind: "IMAGE" }, orderBy: { isCover: "desc" }, take: 1, select: { id: true } } } } } },
    },
  });
  if (!order) notFound();
  if (order.status !== "PAID" || !order.payments.length) {
    const reference = order.payments[0]?.providerReference;
    redirect(reference ? `/checkout/pending?reference=${encodeURIComponent(reference)}` : "/purchases");
  }

  const paidAt = order.payments[0].paidAt ?? order.createdAt;
  return <><Navbar /><main className="min-h-screen bg-background px-4 pb-16 pt-24 text-foreground sm:px-8 sm:pt-28"><div className="mx-auto max-w-4xl"><section className="rounded-3xl border border-primary/20 bg-card p-6 shadow-sm sm:p-9"><div className="flex flex-col items-center text-center"><div className="grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary"><CheckCircle2 className="h-9 w-9" /></div><p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-primary">Payment verified by Paystack</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Purchase complete</h1><p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">Your payment is confirmed and your purchase entitlements are ready. A receipt is associated with your Devisima account.</p></div>
      <dl className="mt-7 grid gap-3 rounded-2xl bg-muted/60 p-4 text-sm sm:grid-cols-3 sm:p-5"><div><dt className="text-xs text-muted-foreground">Order number</dt><dd className="mt-1 break-all font-semibold">{order.reference}</dd></div><div><dt className="text-xs text-muted-foreground">Date paid</dt><dd className="mt-1 font-semibold">{paidAt.toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric", timeZone: "Africa/Lagos" })}</dd></div><div><dt className="text-xs text-muted-foreground">Total paid</dt><dd className="mt-1 font-semibold">{formatMarketplaceMoney(order.total)}</dd></div></dl>
      <div className="mt-7"><h2 className="text-lg font-bold">Products in this order</h2><div className="mt-3 divide-y divide-border">{order.items.map((item) => { const image = item.product?.images[0] ?? (item.product?.assets[0] ? `/api/products/assets/${item.product.assets[0].id}` : null); const canView = Boolean(item.purchase && item.product?.status === "PUBLISHED"); return <article key={item.id} className="flex flex-wrap items-center gap-4 py-4 first:pt-0"><div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-xl bg-muted">{image ? <Image src={image} alt="" fill unoptimized sizes="80px" className="object-cover" /> : <span className="grid h-full place-items-center text-primary"><PackageCheck className="h-6 w-6" /></span>}</div><div className="min-w-0 flex-1"><h3 className="font-semibold">{item.productName}</h3><p className="mt-1 text-xs text-muted-foreground">{item.quantity} × {formatMarketplaceMoney(item.priceAtPurchase)}</p><p className="mt-1 text-xs font-medium text-primary">Purchase entitlement active</p></div>{item.purchase && <Link href={`/purchases/${item.purchase.id}`} className="text-sm font-semibold text-primary hover:underline">Open purchase &amp; downloads</Link>}{canView && <Link href={`/products/${item.product?.slug}`} className="text-sm font-semibold text-primary hover:underline">View product</Link>}</article>; })}</div></div>
      <div className="mt-7 flex flex-wrap justify-center gap-3 border-t border-border pt-6"><Link href="/purchases" className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground">View purchases</Link><Link href="/marketplace" className="inline-flex h-11 items-center justify-center rounded-xl border border-border px-5 text-sm font-semibold hover:bg-muted">Continue shopping</Link></div><p className="mt-5 text-center text-xs leading-5 text-muted-foreground">Download from the purchase details page. Links are private, require your account, and expire after two minutes. <Link href="/contact" className="font-semibold text-primary hover:underline">Contact support</Link> if payment or access looks wrong.</p></section></div></main><Footer /></>;
}
