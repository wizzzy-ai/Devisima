import { requireAuth } from "@/lib/auth/guards";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Heart, ArrowUpRight, Sparkles } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db/prisma";
import { ProductCard } from "@/components/marketplace/product-card";

export const metadata: Metadata = {
  title: "Wishlist - Devisima",
  description: "View your saved products.",
  robots: "noindex",
};

export default async function WishlistPage() {
  const user = await requireAuth("/wishlist");
  const items = await db.wishlistItem.findMany({
    where: {
      userId: user.id,
      product: {
        status: "PUBLISHED",
        adminRestrictedAt: null,
        seller: { status: "ACTIVE", role: "SELLER", sellerSuspendedAt: null },
      },
    },
    orderBy: { createdAt: "desc" },
    select: {
      product: {
        select: {
          id: true, title: true, slug: true, shortDescription: true, images: true,
          demoUrl: true, price: true, compareAtPrice: true, productType: true,
          licenseType: true, technologies: true, features: true, version: true,
          averageRating: true, reviewCount: true, totalSales: true, isFeatured: true,
          category: { select: { id: true, name: true, slug: true } },
          seller: { select: { id: true, name: true, image: true } },
        },
      },
    },
  });

  return (
    <DashboardShell user={user}>
      <section className="relative isolate mb-8 overflow-hidden rounded-[2rem] bg-primary px-6 py-8 text-primary-foreground sm:px-10 sm:py-10">
        <div className="pointer-events-none absolute -right-20 -top-36 -z-10 h-80 w-80 rounded-full border-[40px] border-border/20" />
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-accent"><Sparkles className="h-4 w-4" /> Account</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Your wishlist</h1>
        <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <p className="max-w-xl text-sm leading-6 text-primary-foreground/70 sm:text-base">
            Products you&apos;ve saved for later. Revisit them anytime or make a purchase when you&apos;re ready.
          </p>
          <Link href="/marketplace" className="inline-flex w-fit items-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-bold text-accent-foreground transition hover:bg-accent/90">
            Explore marketplace <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <div className="mb-4">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Saved items</p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight text-foreground">
          {items.length === 0 ? "Your wishlist is empty" : `${items.length} saved product${items.length !== 1 ? 's' : ''}`}
        </h2>
      </div>

      {items.length ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {items.map(({ product }) => (
            <ProductCard key={product.id} product={product} isWishlisted />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card p-12 text-center">
          <div className="flex h-20 w-20 mx-auto mb-6 items-center justify-center rounded-2xl bg-muted">
            <Heart className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">No saved products yet</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
            Save products you&apos;re interested in by clicking the heart icon on any product page.
          </p>
          <Link
            href="/marketplace"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            Explore Products
          </Link>
        </div>
      )}
    </DashboardShell>
  );
}
