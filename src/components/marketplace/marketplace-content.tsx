"use client";

import { ProductCard } from "@/components/marketplace/product-card";
import { Pagination } from "@/components/marketplace/pagination";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import type { MarketplaceResult } from "@/lib/marketplace/queries";

interface MarketplaceContentProps {
  products: MarketplaceResult;
  wishlistProductIds: string[];
}

export function MarketplaceContent({ products, wishlistProductIds }: MarketplaceContentProps) {
  const searchParams = useSearchParams();

  const buildUrl = (newPage: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("page", newPage.toString());
    return `/marketplace?${newParams.toString()}`;
  };

  return (
    <>
      {products.products.length === 0 ? (
        <div className="text-center py-16">
          <h3 className="text-xl font-semibold text-foreground mb-2">No products found</h3>
          <p className="text-muted-foreground mb-4">
            We couldn&apos;t find products matching your search and filters.
          </p>
          <Link
            href="/marketplace"
            className="inline-block px-6 py-2 bg-primary text-primary-foreground rounded-lg bg-primary/90 transition-colors"
          >
            Clear Filters
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {products.products.map((product) => (
              <ProductCard key={product.id} product={product} isWishlisted={wishlistProductIds.includes(product.id)} />
            ))}
          </div>

          {products.totalPages > 1 && (
            <Pagination
              currentPage={products.page}
              totalPages={products.totalPages}
              onPageChange={(newPage) => {
                window.location.href = buildUrl(newPage);
              }}
            />
          )}
        </>
      )}
    </>
  );
}
