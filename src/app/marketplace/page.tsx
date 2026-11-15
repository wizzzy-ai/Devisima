import { MarketplaceHeader } from "@/components/marketplace/marketplace-header";
import { FilterSidebar } from "@/components/marketplace/filter-sidebar";
import { SortDropdown } from "@/components/marketplace/sort-dropdown";
import { MarketplaceContent } from "@/components/marketplace/marketplace-content";
import { ProductCard } from "@/components/marketplace/product-card";
import { getMarketplaceProducts, getCategories, getFeaturedProducts, type MarketplaceFilters } from "@/lib/marketplace/queries";
import { ProductType } from "@prisma/client";
import { Suspense } from "react";
import type { Metadata } from "next";
import { ArrowUpRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/guards";
import { db } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Devisima Marketplace — Digital Products & Software",
  description: "Discover software, templates, SaaS products, APIs, and business solutions on Devisima.",
};

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; productType?: string; minPrice?: string; maxPrice?: string; minRating?: string; sort?: string; page?: string }>;
}) {
  const params = await searchParams;
  const pageValue = Number.parseInt(params.page || "1", 10);
  const page = Number.isSafeInteger(pageValue) && pageValue > 0 ? pageValue : 1;
  const filters = {
    search: params.q,
    category: params.category,
    productType: parseProductType(params.productType),
    minPrice: parseInteger(params.minPrice),
    maxPrice: parseInteger(params.maxPrice),
    minRating: parseInteger(params.minRating),
    sort: parseSort(params.sort),
    page,
    limit: 24,
  };

  const [products, categories, featuredProducts, user] = await Promise.all([
    getMarketplaceProducts(filters),
    getCategories(),
    getFeaturedProducts(6),
    getCurrentUser(),
  ]);
  const productIds = [...new Set([...products.products, ...featuredProducts].map((product) => product.id))];
  const wishlistItems = user?.status === "ACTIVE" && productIds.length
    ? await db.wishlistItem.findMany({
        where: { userId: user.id, productId: { in: productIds } },
        select: { productId: true },
      })
    : [];
  const wishlistProductIds = wishlistItems.map((item) => item.productId);

  return (
    <div className="min-h-screen bg-background">
      <MarketplaceHeader />

      {featuredProducts.length > 0 && (
        <section className="container mx-auto max-w-7xl px-4 pt-9 sm:pt-12">
          <div className="relative overflow-hidden rounded-[1.75rem] bg-muted p-5 sm:p-8">
            <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full border-[36px] border-primary-foreground/50" />
            <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-foreground"><Sparkles className="h-4 w-4 text-primary" /> Hand-picked for you</div>
                <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Standout finds</h2>
                <p className="mt-2 text-sm text-muted-foreground">A few ideas worth opening in a new tab.</p>
              </div>
              <Link href="#all-products" className="group inline-flex w-fit items-center gap-2 text-sm font-semibold text-foreground">Browse all <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></Link>
            </div>
            <div className="relative mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featuredProducts.slice(0, 3).map((product) => (
                <ProductCard key={product.id} product={product} isWishlisted={wishlistProductIds.includes(product.id)} />
              ))}
            </div>
          </div>
        </section>
      )}

      <div id="all-products" className="w-full max-w-none px-4 py-9 sm:px-6 sm:py-12">
        <div className="mb-5 flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">The full collection</p><h2 className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Browse everything</h2></div>
          <p className="text-sm text-muted-foreground">Take your time. Your next favorite is in here.</p>
        </div>
        <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
          <Suspense fallback={<div className="h-12 lg:w-60" />}>
            <FilterSidebar categories={categories} />
          </Suspense>

          <main className="min-w-0 flex-1">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{products.total}</span> product{products.total !== 1 ? "s" : ""} to explore
              </p>
              <Suspense fallback={<div className="h-10" />}>
                <SortDropdown />
              </Suspense>
            </div>

            <Suspense fallback={<div className="text-center py-16">Loading products...</div>}>
              <MarketplaceContent products={products} wishlistProductIds={wishlistProductIds} />
            </Suspense>
          </main>
        </div>
      </div>
    </div>
  );
}

function parseProductType(value?: string): ProductType | undefined {
  return value && Object.values(ProductType).includes(value as ProductType) ? value as ProductType : undefined;
}

function parseSort(value?: string): MarketplaceFilters["sort"] {
  const allowed: NonNullable<MarketplaceFilters["sort"]>[] = ["featured", "popular", "newest", "rating", "price-asc", "price-desc"];
  return allowed.find((option) => option === value);
}

function parseInteger(value?: string) {
  if (!value || !/^-?\d+$/.test(value)) return undefined;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : undefined;
}
