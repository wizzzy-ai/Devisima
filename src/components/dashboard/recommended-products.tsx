import { getNewProducts } from "@/lib/marketplace/queries";
import { ProductCard } from "@/components/marketplace/product-card";
import Link from "next/link";

export async function RecommendedProducts() {
  const products = await getNewProducts(4);
  return (
    <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="mb-5 flex items-end justify-between gap-3">
        <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Recently published</p><h2 className="mt-1 text-lg font-semibold text-foreground">Products for you</h2></div>
        <Link href="/marketplace" className="text-sm font-semibold text-primary hover:underline">Browse marketplace</Link>
      </div>
      {products.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <p className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">No published products to recommend yet.</p>}
    </section>
  );
}
