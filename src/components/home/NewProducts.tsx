import { getNewProducts } from "@/lib/marketplace/queries";
import { ProductCard } from "@/components/marketplace/product-card";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export async function NewProducts() {
  const newProducts = await getNewProducts(8);
  if (newProducts.length === 0) return null;
  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Fresh from the Community
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Latest additions from our community of creators.
            </p>
          </div>
          <button className="relative group mt-4 md:mt-0">
            <span className="absolute top-1 left-1 h-full w-full rounded bg-[#0F4C5C]"></span>
            <span className="relative inline-flex items-center gap-2 h-full w-full rounded border-2 border-[#0F4C5C] bg-white px-4 py-2 text-sm font-bold text-[#0F4C5C] transition-all duration-200 group-hover:bg-[#35D0BA] group-hover:text-[#0F4C5C]">
              View All Products
              <ArrowRight className="w-4 h-4" />
            </span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {newProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
