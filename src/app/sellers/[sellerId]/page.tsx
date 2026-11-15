import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Package, Store, Users, Star } from "lucide-react";
import { ProductCard } from "@/components/marketplace/product-card";
import { WebsitePreview } from "@/components/marketplace/website-preview";
import { FollowStoreButton } from "@/components/seller/FollowStoreButton";
import { db } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/guards";

export default async function PublicSellerProfilePage({ params }: { params: Promise<{ sellerId: string }> }) {
  const { sellerId } = await params;
  const currentUser = await getCurrentUser();

  const seller = await db.user.findFirst({
    where: { id: sellerId, role: "SELLER", status: "ACTIVE", sellerSuspendedAt: null },
    select: {
      id: true,
      name: true,
      image: true,
      createdAt: true,
      storeName: true,
      storeDescription: true,
      storeLogo: true,
      storeBanner: true,
      storeCategory: true,
      storeAccentColor: true,
    },
  });
  if (!seller) notFound();

  const [products, reviews] = await Promise.all([
    db.product.findMany({
      where: { sellerId: seller.id, status: "PUBLISHED", adminRestrictedAt: null },
      orderBy: { publishedAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        shortDescription: true,
        images: true,
        demoUrl: true,
        price: true,
        compareAtPrice: true,
        productType: true,
        licenseType: true,
        technologies: true,
        features: true,
        version: true,
        averageRating: true,
        reviewCount: true,
        totalSales: true,
        isFeatured: true,
        category: { select: { id: true, name: true, slug: true } },
        seller: { select: { id: true, name: true, image: true } },
      },
    }),
    db.review.findMany({
      where: {
        isDeleted: false,
        product: {
          is: { sellerId: seller.id, status: "PUBLISHED", adminRestrictedAt: null },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        user: { select: { name: true } },
        product: { select: { title: true, slug: true } },
      },
    }),
  ]);

  const followerCount = await db.storeFollow.count({ where: { sellerId: seller.id } });
  const isFollowing = currentUser ? await db.storeFollow.findUnique({
    where: { followerId_sellerId: { followerId: currentUser.id, sellerId: seller.id } },
  }) : null;

  const totalSales = products.reduce((sum, p) => sum + (p.totalSales || 0), 0);
  const avgRating = products.length > 0
    ? products.reduce((sum, p) => sum + (p.averageRating || 0), 0) / products.length
    : 0;
  const totalReviews = products.reduce((sum, p) => sum + (p.reviewCount || 0), 0);

  const featuredProduct = products.find((product) => product.isFeatured) ?? products[0];
  const catalogProducts = featuredProduct
    ? products.filter((product) => product.id !== featuredProduct.id)
    : products;
  const initials = seller.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  const joined = new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(seller.createdAt);
  const accentColor = seller.storeAccentColor || "#35D0BA";
  const displayName = seller.storeName || seller.name;
  const logoImage = seller.storeLogo || seller.image;

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8 sm:py-12">
        <Link href="/marketplace" className="mb-7 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition hover:border-primary/40 hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Marketplace
        </Link>

        {/* Store Header */}
        <section className="relative isolate overflow-hidden rounded-[2rem] border border-border bg-gradient-to-br from-[#0F4C5C] to-[#174c43] text-white sm:p-9">
          <div aria-hidden="true" className="absolute inset-x-0 top-0 z-20 h-1" style={{ backgroundColor: accentColor }} />
          {/* Custom Banner */}
          {seller.storeBanner && (
            <div className="absolute inset-0 opacity-30">
              <Image src={seller.storeBanner} alt="Store banner" fill className="object-cover" unoptimized />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0F4C5C]/50 to-[#0F4C5C]" />

          <div className="relative z-10 flex flex-col gap-6 p-6 sm:p-9">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
              {/* Store Logo */}
              <div
                style={{ borderColor: accentColor }}
                className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-[1.75rem] border-2 bg-white/10 text-2xl font-bold text-white shadow-xl sm:h-28 sm:w-28"
              >
                {logoImage ? (
                  <Image src={logoImage} alt={`${displayName}'s logo`} width={112} height={112} unoptimized className="h-full w-full object-cover" />
                ) : (
                  initials
                )}
              </div>

              {/* Store Info */}
              <div className="min-w-0 flex-1">
                {seller.storeCategory && (
                  <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-white/70">
                    <Store className="h-4 w-4" /> {seller.storeCategory}
                  </p>
                )}
                <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{displayName}</h1>
                {seller.storeDescription && (
                  <p className="mt-2 text-sm text-white/90 max-w-2xl">{seller.storeDescription}</p>
                )}
                <p className="mt-2 text-xs text-white/60">Sharing digital products on Devisima since {joined}</p>
              </div>

              {/* Follow Button */}
              {currentUser?.id !== seller.id && (
                <FollowStoreButton sellerId={seller.id} isFollowing={!!isFollowing} followerCount={followerCount} />
              )}
            </div>

            {/* Store Stats */}
            <div className="flex flex-wrap gap-4 sm:gap-6">
              <div style={{ borderColor: `${accentColor}66` }} className="flex items-center gap-3 rounded-2xl border bg-white/5 px-4 py-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white">
                  <Package className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xl font-bold">{products.length}</p>
                  <p className="text-xs text-white/70">Published product{products.length === 1 ? "" : "s"}</p>
                </div>
              </div>
              <div style={{ borderColor: `${accentColor}66` }} className="flex items-center gap-3 rounded-2xl border bg-white/5 px-4 py-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white">
                  <Users className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xl font-bold">{followerCount}</p>
                  <p className="text-xs text-white/70">Follower{followerCount === 1 ? "" : "s"}</p>
                </div>
              </div>
              <div style={{ borderColor: `${accentColor}66` }} className="flex items-center gap-3 rounded-2xl border bg-white/5 px-4 py-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white">
                  <Star className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xl font-bold">{avgRating.toFixed(1)}</p>
                  <p className="text-xs text-white/70">{totalReviews} review{totalReviews === 1 ? "" : "s"}</p>
                </div>
              </div>
              <div style={{ borderColor: `${accentColor}66` }} className="flex items-center gap-3 rounded-2xl border bg-white/5 px-4 py-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white">
                  <Package className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xl font-bold">{totalSales}</p>
                  <p className="text-xs text-white/70">Total sales</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Navigation Tabs */}
        <nav aria-label="Store sections" className="mt-8 border-b border-border">
          <div className="flex gap-8">
            <a href="#products" style={{ borderColor: accentColor }} className="border-b-2 pb-4 text-sm font-semibold text-primary">
              Products
            </a>
            <a href="#about" className="border-b-2 border-transparent pb-4 text-sm font-medium text-muted-foreground transition hover:text-foreground">
              About
            </a>
            <a href="#reviews" className="border-b-2 border-transparent pb-4 text-sm font-medium text-muted-foreground transition hover:text-foreground">
              Reviews
            </a>
          </div>
        </nav>

        {/* Products Grid */}
        <section id="products" className="mt-8 scroll-mt-8">
          {featuredProduct && (
            <article
              style={{ borderColor: `${accentColor}66` }}
              className="mb-8 grid overflow-hidden rounded-[1.75rem] border bg-card shadow-sm md:grid-cols-2"
            >
              <Link href={`/products/${featuredProduct.slug}`} className="group relative min-h-60 bg-muted sm:min-h-80">
                {featuredProduct.demoUrl ? (
                  <WebsitePreview
                    siteUrl={featuredProduct.demoUrl}
                    title={featuredProduct.title}
                    fallbackSrc={featuredProduct.images[0]}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                ) : featuredProduct.images[0] ? (
                  <Image
                    src={featuredProduct.images[0]}
                    alt={featuredProduct.title}
                    fill
                    sizes="(min-width: 768px) 50vw, 100vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="flex h-full min-h-60 items-center justify-center bg-gradient-to-br from-primary/10 via-muted to-accent/20 sm:min-h-80">
                    <Package className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
                  </div>
                )}
                <span className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-border bg-card/95 px-3 py-1.5 text-xs font-bold text-foreground shadow-sm backdrop-blur">
                  <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ backgroundColor: accentColor }} />
                  {featuredProduct.isFeatured ? "Featured product" : "Store spotlight"}
                </span>
              </Link>
              <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-10">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                  A standout from {displayName}
                </p>
                <h2 className="mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  {featuredProduct.title}
                </h2>
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">
                  {featuredProduct.shortDescription}
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-3 text-sm">
                  <span className="rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-foreground">
                    {featuredProduct.category.name}
                  </span>
                  {featuredProduct.reviewCount > 0 ? (
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                      <Star
                        aria-hidden="true"
                        className="h-4 w-4 fill-current"
                        style={{ color: accentColor }}
                      />
                      {featuredProduct.averageRating.toFixed(1)} ({featuredProduct.reviewCount})
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">New listing</span>
                  )}
                </div>
                <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-5">
                  <p className="text-2xl font-bold tracking-tight text-foreground">
                    ₦{featuredProduct.price.toLocaleString()}
                  </p>
                  <Link
                    href={`/products/${featuredProduct.slug}`}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  >
                    Explore product <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </article>
          )}

          {catalogProducts.length ? (
            <>
              <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                    <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ backgroundColor: accentColor }} />
                    The seller&apos;s catalog
                  </p>
                  <h2 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
                    {featuredProduct ? `More products by ${displayName}` : `Products by ${displayName}`}
                  </h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  {catalogProducts.length} more listing{catalogProducts.length === 1 ? "" : "s"}
                </p>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {catalogProducts.map((product) => <ProductCard key={product.id} product={product} />)}
              </div>
            </>
          ) : !featuredProduct ? (
            <div className="rounded-[1.75rem] border border-dashed border-border bg-card px-6 py-16 text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-primary">
                <Package className="h-6 w-6" />
              </span>
              <h3 className="mt-4 text-lg font-semibold text-foreground">No published products yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">This seller's products will appear here when they're published.</p>
              <Link href="/marketplace" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">
                Browse marketplace <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          ) : null}
        </section>

        <section id="about" className="mt-12 scroll-mt-8">
          <div style={{ borderTopColor: accentColor }} className="rounded-2xl border border-border border-t-4 bg-card p-6 sm:p-8">
            <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_16rem]">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">About the store</p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground">{displayName}</h2>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
                  {seller.storeDescription || "This seller hasn’t added a store description yet."}
                </p>
              </div>
              <dl className="grid grid-cols-2 gap-3 self-start">
                <div className="rounded-xl bg-muted/60 p-4">
                  <dt className="text-xs text-muted-foreground">Store category</dt>
                  <dd className="mt-1 text-sm font-semibold text-foreground">{seller.storeCategory || "Digital products"}</dd>
                </div>
                <div className="rounded-xl bg-muted/60 p-4">
                  <dt className="text-xs text-muted-foreground">On Devisima since</dt>
                  <dd className="mt-1 text-sm font-semibold text-foreground">{joined}</dd>
                </div>
              </dl>
            </div>
          </div>
        </section>

        <section id="reviews" className="mt-12 scroll-mt-8">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Buyer feedback</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-foreground">Reviews</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              {totalReviews} review{totalReviews === 1 ? "" : "s"} · {avgRating.toFixed(1)} average rating
            </p>
          </div>
          {reviews.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {reviews.map((review) => (
                <article key={review.id} className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-1" aria-label={`${review.rating} out of 5 stars`}>
                      {Array.from({ length: 5 }, (_, index) => (
                        <Star
                          key={index}
                          style={index < review.rating ? { color: accentColor, fill: accentColor } : undefined}
                          className={`h-4 w-4 ${index < review.rating ? "" : "text-muted-foreground"}`}
                          aria-hidden="true"
                        />
                      ))}
                    </div>
                    <time className="text-xs text-muted-foreground" dateTime={review.createdAt.toISOString()}>
                      {review.createdAt.toLocaleDateString("en", { month: "long", year: "numeric" })}
                    </time>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-foreground">{review.comment}</p>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
                    <span>By {review.user.name || "Devisima customer"}</span>
                    <Link href={`/products/${review.product.slug}`} className="font-semibold text-primary transition hover:underline">
                      {review.product.title}
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-10 text-center">
              <Star className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden="true" />
              <p className="mt-3 text-sm font-semibold text-foreground">No reviews yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Customer reviews for this store&apos;s products will appear here.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
