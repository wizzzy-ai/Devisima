import { marketplaceStats } from "@/data/stats";

export function MarketplaceStats() {
  const stats = [
    { label: "Digital Products", value: marketplaceStats.products },
    { label: "Creators", value: marketplaceStats.creators },
    { label: "Customers", value: marketplaceStats.customers },
    { label: "Average Rating", value: marketplaceStats.averageRating },
  ];

  return (
    <section>
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
