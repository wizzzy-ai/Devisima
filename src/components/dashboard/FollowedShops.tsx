import Link from "next/link";
import { ArrowUpRight, Store, Package, Users, ExternalLink, Trash2 } from "lucide-react";
import { db } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/guards";

export async function FollowedShops() {
  const user = await requireAuth();
  
  const followedShops = await db.storeFollow.findMany({
    where: { followerId: user.id },
    include: {
      seller: {
        select: {
          id: true,
          name: true,
          storeName: true,
          storeDescription: true,
          storeLogo: true,
          image: true,
        },
      },
    },
    orderBy: { followedAt: "desc" },
  });

  const shopsWithStats = await Promise.all(
    followedShops.map(async (follow) => {
      const productCount = await db.product.count({
        where: { sellerId: follow.sellerId, status: "PUBLISHED", adminRestrictedAt: null },
      });
      const followerCount = await db.storeFollow.count({
        where: { sellerId: follow.sellerId },
      });
      return {
        ...follow,
        productCount,
        followerCount,
      };
    })
  );

  if (shopsWithStats.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Following</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-foreground">My Followed Shops</h2>
        </div>
        <Link href="/marketplace" className="text-sm font-medium text-primary hover:underline">
          Discover more shops
        </Link>
      </div>

      <div className="space-y-4">
        {shopsWithStats.map((shop) => (
          <div key={shop.id} className="flex items-start gap-4 rounded-xl border border-border bg-muted/30 p-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-background">
              {shop.seller.storeLogo ? (
                <img src={shop.seller.storeLogo} alt={shop.seller.storeName || shop.seller.name} className="h-full w-full object-cover" />
              ) : shop.seller.image ? (
                <img src={shop.seller.image} alt={shop.seller.name} className="h-full w-full object-cover" />
              ) : (
                <span className="text-sm font-bold text-muted-foreground">
                  {(shop.seller.storeName || shop.seller.name).split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-foreground">{shop.seller.storeName || shop.seller.name}</h3>
                  {shop.seller.storeDescription && (
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{shop.seller.storeDescription}</p>
                  )}
                </div>
                <form action={`/api/sellers/${shop.sellerId}/follow`} method="DELETE">
                  <button
                    type="submit"
                    className="shrink-0 text-xs font-medium text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </form>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Package className="h-3.5 w-3.5" />
                  {shop.productCount} product{shop.productCount === 1 ? "" : "s"}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {shop.followerCount} follower{shop.followerCount === 1 ? "" : "s"}
                </span>
              </div>
            </div>

            <Link
              href={`/sellers/${shop.sellerId}`}
              className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90"
            >
              Visit <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
