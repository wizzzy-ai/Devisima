"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { ProductType } from "@prisma/client";
import { SlidersHorizontal } from "lucide-react";
import SquishSwitch from "@/components/ui/SquishSwitch";

interface FilterSidebarProps {
  categories: Array<{ id: string; name: string; slug: string; icon?: string | null }>;
}

export function FilterSidebar({ categories }: FilterSidebarProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const currentCategory = searchParams.get("category");
  const currentProductType = searchParams.get("productType") as ProductType | null;
  const currentMinPrice = searchParams.get("minPrice");
  const currentMaxPrice = searchParams.get("maxPrice");
  const currentMinRating = searchParams.get("minRating");
  const currentSort = searchParams.get("sort");

  const updateFilter = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };

  const clearAllFilters = () => {
    router.push(pathname);
  };

  const hasActiveFilters = currentCategory || currentProductType || currentMinPrice || currentMaxPrice || currentMinRating;

  return (
    <aside className="w-full flex-shrink-0 lg:w-60">
      <details className="group rounded-2xl border border-border bg-card p-4 lg:sticky lg:top-36 lg:block lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0" open>
       <summary className="flex cursor-pointer list-none items-center justify-between gap-3 lg:mb-5 lg:cursor-default [&::-webkit-details-marker]:hidden">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-semibold text-foreground"><SlidersHorizontal className="h-4 w-4 text-primary" /> Refine results</h2>
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-sm font-medium text-primary hover:underline"
            >
              Clear all
            </button>
          )}
        </div>
        <span className="text-xs text-muted-foreground group-open:hidden lg:hidden">Show</span>
        <span className="text-xs text-muted-foreground lg:hidden">Hide</span>
       </summary>

       <div className="mt-5 grid gap-5 border-t border-border pt-5 sm:grid-cols-2 lg:mt-0 lg:grid-cols-1 lg:gap-6 lg:border-0 lg:pt-0">
        {/* Category */}
        <div>
          <h3 className="text-sm font-medium text-foreground mb-3">Category</h3>
          <div className="space-y-2">
            {categories.map((category) => (
              <div key={category.id} className="flex items-center justify-between gap-2">
                <span className="text-sm text-muted-foreground">{category.name}</span>
                <SquishSwitch
                  checked={currentCategory === category.slug}
                  onChange={(checked) => updateFilter("category", checked ? category.slug : null)}
                  ariaLabel={`${category.name} category filter`}
                  trackColor="#dce5e2" trackOnColor="#174c43" thumbColor="#ffffff" thumbOnColor="#ffffff" width={36} height={20} radius={10} speed={50} stretch={36} hoverScale={1.035} colorDuration={320}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Product Type */}
        <div>
          <h3 className="text-sm font-medium text-foreground mb-3">Product Type</h3>
          <div className="space-y-2">
            {Object.values(ProductType).map((type) => (
              <div key={type} className="flex items-center justify-between gap-2">
                <span className="text-sm text-muted-foreground">{formatProductType(type)}</span>
                <SquishSwitch
                  checked={currentProductType === type}
                  onChange={(checked) => updateFilter("productType", checked ? type : null)}
                  ariaLabel={`${formatProductType(type)} product type filter`}
                  trackColor="#dce5e2" trackOnColor="#174c43" thumbColor="#ffffff" thumbOnColor="#ffffff" width={36} height={20} radius={10} speed={50} stretch={36} hoverScale={1.035} colorDuration={320}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Price Range */}
        <div>
          <h3 className="text-sm font-medium text-foreground mb-3">Price Range</h3>
          <div className="space-y-2">
            <input
              type="number"
              placeholder="Min price"
              value={currentMinPrice || ""}
              onChange={(e) => updateFilter("minPrice", e.target.value || null)}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <input
              type="number"
              placeholder="Max price"
              value={currentMaxPrice || ""}
              onChange={(e) => updateFilter("maxPrice", e.target.value || null)}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        {/* Rating */}
        <div>
          <h3 className="text-sm font-medium text-foreground mb-3">Minimum Rating</h3>
          <div className="space-y-2">
            {[4, 3, 2].map((rating) => (
              <div key={rating} className="flex items-center justify-between gap-2">
                <span className="text-sm text-muted-foreground">{rating}+ stars</span>
                <SquishSwitch
                  checked={currentMinRating === rating.toString()}
                  onChange={(checked) => updateFilter("minRating", checked ? rating.toString() : null)}
                  ariaLabel={`${rating} stars and up filter`}
                  trackColor="#dce5e2" trackOnColor="#174c43" thumbColor="#ffffff" thumbOnColor="#ffffff" width={36} height={20} radius={10} speed={50} stretch={36} hoverScale={1.035} colorDuration={320}
                />
              </div>
            ))}
          </div>
        </div>
       </div>
      </details>
    </aside>
  );
}

function formatProductType(type: ProductType): string {
  return type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

