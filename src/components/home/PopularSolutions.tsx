import { getPopularSolutions } from "@/lib/marketplace/queries";
import { ProductCard } from "@/components/marketplace/product-card";

export async function PopularSolutions() {
  const popularSolutions = await getPopularSolutions(6);
  if (popularSolutions.length === 0) return null;
  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Popular Solutions
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Complete software systems for real-world businesses.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {popularSolutions.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
