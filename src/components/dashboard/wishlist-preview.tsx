import { db } from "@/lib/db/prisma";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export async function WishlistPreview({ userId }: { userId: string }) {
  const items = await db.wishlistItem.findMany({
    where: {
      userId,
      product: {
        status: "PUBLISHED",
        adminRestrictedAt: null,
        seller: { status: "ACTIVE", role: "SELLER", sellerSuspendedAt: null },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 3,
    select: {
      product: {
        select: {
          title: true,
          slug: true,
          price: true,
          images: true,
          category: { select: { name: true } },
          seller: { select: { name: true } },
        },
      },
    },
  });

  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="mb-5 flex items-center justify-between">
        <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Saved for later</p><h2 className="mt-1 text-lg font-semibold text-foreground">Your wishlist</h2></div>
        <Link href="/wishlist" className="inline-flex items-center gap-1 text-sm font-semibold text-foreground hover:text-primary">View all <ArrowUpRight className="h-4 w-4" /></Link>
      </div>
      {items.length ? <div className="space-y-3">
        {items.map(({ product }) => <Link key={product.slug} href={`/products/${product.slug}`} className="flex items-center gap-4 rounded-xl border border-transparent p-3 transition-colors hover:border-border hover:bg-background">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted">
            {product.images[0] ? <Image src={product.images[0]} alt="" width={64} height={64} unoptimized={!product.images[0].startsWith("/api/products/assets/")} className="h-full w-full object-cover" /> : <span className="text-[10px] text-muted-foreground">Preview</span>}
          </div>
          <div className="min-w-0 flex-1"><h3 className="truncate text-sm font-semibold text-foreground">{product.title}</h3><p className="text-xs text-muted-foreground">{product.seller.name} · {product.category.name}</p><p className="mt-1 text-sm font-semibold text-foreground">₦{product.price.toLocaleString()}</p></div>
        </Link>)}
      </div> : <p className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">Your saved products will appear here.</p>}
    </div>
  );
}
