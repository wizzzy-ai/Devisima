import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { requireSeller } from "@/lib/auth/guards";
import { getProductAnalytics } from "@/lib/analytics";
import { getAnalyticsDateRange } from "@/lib/analytics/date-range";
import { ProductAnalyticsPanel } from "@/components/analytics/ProductAnalyticsPanel";

export const metadata: Metadata = { title: "Product analytics | Devisima", robots: "noindex" };

export default async function SellerProductAnalyticsPage({ params, searchParams }: PageProps<"/seller/products/[id]">) {
  const seller = await requireSeller();
  if (seller.role !== "SELLER" || seller.status !== "ACTIVE") redirect("/forbidden");
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const range = getAnalyticsDateRange(single(query.period), single(query.start), single(query.end));
  const data = await getProductAnalytics(seller.id, id, range);
  if (!data) notFound();
  return <><Navbar /><main className="min-h-screen bg-background pt-20"><div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8"><Link href="/seller/analytics" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"><ArrowLeft className="h-4 w-4" />Seller analytics</Link><header className="mb-7"><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Product performance</p><h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">{data.product.title}</h1><p className="mt-2 text-sm text-muted-foreground">{data.product.category.name} · {data.product.status.toLowerCase().replaceAll("_", " ")}</p></header><ProductAnalyticsPanel data={data} /></div></main></>;
}

function single(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
