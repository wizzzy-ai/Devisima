import { db } from "@/lib/db/prisma";
import { CheckCircle } from "lucide-react";

const DATABASE_READY = /^(prisma(?:\+postgres)?:\/\/)/i.test(process.env.DATABASE_URL ?? "");

export async function TopSellers() {
  if (!DATABASE_READY) return null;

  const sellers = await db.user.findMany({
    where: {
      role: "SELLER",
      status: "ACTIVE",
      sellerSuspendedAt: null,
      products: { some: { status: "PUBLISHED", adminRestrictedAt: null } },
    },
    orderBy: { createdAt: "desc" },
    take: 4,
    select: {
      id: true,
      name: true,
      image: true,
      products: {
        where: { status: "PUBLISHED", adminRestrictedAt: null },
        select: { averageRating: true },
      },
    },
  });
  if (sellers.length === 0) return null;

  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">Meet the Creators</h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">Talented developers and designers building the future of software.</p>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {sellers.map((seller) => {
            const rating = seller.products.reduce((sum, product) => sum + product.averageRating, 0) / seller.products.length;
            return (
              <article key={seller.id} className="rounded-2xl border border-border bg-card p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-lg font-semibold text-primary">
                    {seller.image ? <img src={seller.image} alt="" className="h-full w-full object-cover" /> : seller.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2"><h3 className="truncate font-semibold text-foreground">{seller.name}</h3><CheckCircle className="h-4 w-4 shrink-0 text-primary" aria-label="Verified seller" /></div>
                    <p className="text-sm text-muted-foreground">{seller.products.length} published product{seller.products.length === 1 ? "" : "s"}</p>
                    <p className="mt-2 text-sm text-muted-foreground">{rating > 0 ? `${rating.toFixed(1)} average rating` : "New seller"}</p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
