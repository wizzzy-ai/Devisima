"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
}

interface CategoryNavigationProps {
  categories: Category[];
}

export function CategoryNavigation({ categories }: CategoryNavigationProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const currentCategory = searchParams.get("category");

  const categoryUrl = (slug?: string) => {
    const params = new URLSearchParams(searchParams);
    if (slug) params.set("category", slug);
    else params.delete("category");
    params.delete("page");
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  };

  return (
    <div className="sticky top-16 z-30 border-y border-border bg-background/95 backdrop-blur-md">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="flex items-center gap-1.5 overflow-x-auto py-2 scrollbar-hide">
          <button
            type="button"
            onClick={() => router.push(categoryUrl())}
            aria-pressed={!currentCategory}
            className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
              !currentCategory
                ? "bg-[#174c43] text-white shadow-sm"
                : "text-muted-foreground hover:bg-[#174c43]/10 hover:text-[#174c43]"
            }`}
          >
            All Products
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => router.push(categoryUrl(category.slug))}
              aria-pressed={currentCategory === category.slug}
              className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                currentCategory === category.slug
                  ? "bg-[#174c43] text-white shadow-sm"
                  : "text-muted-foreground hover:bg-[#174c43]/10 hover:text-[#174c43]"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
