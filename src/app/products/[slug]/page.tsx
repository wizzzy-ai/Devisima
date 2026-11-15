import type { Metadata } from "next";
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, BookOpen, Check, Code2, ExternalLink, FileArchive, PackageCheck, ShieldCheck, Star } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { buttonVariants } from "@/components/ui/button";
import { ProductCard } from "@/components/marketplace/product-card";
import { ProductGallery } from "@/components/products/ProductGallery";
import { ProductReviews } from "@/components/products/ProductReviews";
import { ProductPurchaseActions } from "@/components/products/ProductPurchaseActions";
import { WishlistButton } from "@/components/products/WishlistButton";
import { ProductViewTracker } from "@/components/analytics/ProductViewTracker";
import { getCurrentUser } from "@/lib/auth/guards";
import { db } from "@/lib/db/prisma";
import { getProductDetailCollections, getPublicProductBySlug } from "@/lib/marketplace/product-details";
import { formatProductListItems } from "@/lib/products/list-format";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getPublicProductBySlug(slug);
  if (!product) return { title: "Product not found | Devisima", robots: { index: false, follow: false } };

  const cover = product.assets[0];
  const image = cover ? `/api/products/assets/${cover.id}` : product.images[0];
  return {
    title: `${product.title} | Devisima`,
    description: product.shortDescription,
    alternates: { canonical: `/products/${product.slug}` },
    robots: { index: true, follow: true },
    openGraph: {
      type: "website",
      title: `${product.title} | Devisima`,
      description: product.shortDescription,
      url: `/products/${product.slug}`,
      ...(image ? { images: [{ url: image, alt: product.title }] } : {}),
    },
    twitter: { card: image ? "summary_large_image" : "summary", title: `${product.title} | Devisima`, description: product.shortDescription, ...(image ? { images: [image] } : {}) },
  };
}

function safeExternalUrl(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function label(value: string) {
  return value.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function ExternalTextLink({ href, children }: { href: string | null; children: ReactNode }) {
  if (!href) return null;
  return <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0F4C5C] underline-offset-4 hover:underline">{children}<ExternalLink className="h-3.5 w-3.5" /></a>;
}

export default async function ProductDetailsPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getPublicProductBySlug(slug);
  if (!product) notFound();

  const user = await getCurrentUser();
  const ownedPurchase = user?.status === "ACTIVE" ? await db.purchase.findFirst({
    where: { userId: user.id, productId: product.id, order: { status: "PAID", payments: { some: { status: "SUCCESS" } } } },
    orderBy: { purchasedAt: "desc" },
    select: { id: true },
  }) : null;
  const { reviews, ratingCounts, relatedProducts, sellerProducts, isWishlisted } = await getProductDetailCollections(product, user?.status === "ACTIVE" ? user.id : undefined);
  const sellerInitials = product.seller.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  const demoUrl = safeExternalUrl(product.demoUrl);
  const videoUrl = safeExternalUrl(product.videoUrl);
  const docsUrl = safeExternalUrl(product.documentationUrl);
  const githubUrl = safeExternalUrl(product.githubUrl);
  const features = formatProductListItems(product.features);
  const requirements = formatProductListItems(product.requirements);
  const discount = product.compareAtPrice && product.compareAtPrice > product.price
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;

  return (
    <>
      <Navbar />
      <ProductViewTracker slug={product.slug} />
      <main className="min-h-screen bg-[#F7F5EF] text-[#101820]">
        <div className="mx-auto max-w-7xl px-4 pb-16 pt-24 sm:px-8 sm:pt-28">
          <nav aria-label="Breadcrumb" className="mb-6 flex min-w-0 items-center gap-2 overflow-hidden text-sm text-[#68756d]">
            <Link href="/marketplace" className="inline-flex shrink-0 items-center gap-2 font-semibold text-[#0F4C5C] hover:underline"><ArrowLeft className="h-4 w-4" /> Marketplace</Link>
            <span aria-hidden="true">/</span>
            <Link href={`/marketplace?category=${encodeURIComponent(product.category.slug)}`} className="truncate hover:text-[#0F4C5C]">{product.category.name}</Link>
            <span aria-hidden="true">/</span>
            <span className="truncate text-[#34433a]" aria-current="page">{product.title}</span>
          </nav>

          <div className="grid min-w-0 items-start gap-7 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,.8fr)] lg:gap-10">
            <ProductGallery title={product.title} assets={product.assets} legacyImages={product.images} demoUrl={demoUrl} videoUrl={videoUrl} />

            <aside className="min-w-0 rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-lg sm:p-8 lg:sticky lg:top-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#f0fdf4] px-3 py-1.5 text-xs font-semibold text-[#166534]">{product.category.name}</span>
                <span className="rounded-full bg-[#f8fafc] px-3 py-1.5 text-xs font-medium text-[#64748b]">{label(product.productType)}</span>
              </div>
              <h1 className="mt-5 break-words text-3xl font-bold leading-tight tracking-tight text-[#0f172a] sm:text-[2.25rem]">{product.title}</h1>
              <p className="mt-4 text-base leading-7 text-[#64748b]">{product.shortDescription}</p>

              <a href="#reviews" className="mt-5 inline-flex items-center gap-2 text-sm text-[#64748b] hover:text-[#0f172a] transition-colors">
                <span className="inline-flex items-center gap-1 font-semibold text-[#0f172a]"><Star className="h-4 w-4 fill-[#f59e0b] text-[#f59e0b]" />{product.reviewCount ? product.averageRating.toFixed(1) : "New"}</span>
                <span className="text-[#64748b]">{product.reviewCount ? `${product.reviewCount} review${product.reviewCount === 1 ? "" : "s"}` : "No reviews yet"}</span>
              </a>

              <div className="mt-6 rounded-xl bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9] border border-[#e2e8f0] p-5">
                <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
                  <p className="text-4xl font-bold tracking-tight text-[#0f172a]">₦{product.price.toLocaleString()}</p>
                  {discount > 0 && (
                    <>
                      <span className="text-sm text-[#94a3b8] line-through">₦{product.compareAtPrice?.toLocaleString()}</span>
                      <span className="rounded-full bg-[#dcfce7] px-3 py-1 text-xs font-semibold text-[#166534]">Save {discount}%</span>
                    </>
                  )}
                </div>
                <p className="mt-2 text-sm font-medium text-[#64748b]">{label(product.licenseType)} license</p>
              </div>

              <div className="mt-6 space-y-3">
                <ProductPurchaseActions productId={product.id} ownedPurchaseId={ownedPurchase?.id} />
              </div>
              <div className="mt-4 flex flex-col items-center gap-2">
                <WishlistButton productId={product.id} initialWishlisted={isWishlisted} slug={product.slug} />
                <p className="text-center text-xs leading-5 text-[#94a3b8]">Keep this product handy for later.</p>
              </div>

              <div className="mt-8 flex items-center gap-4 rounded-xl border border-[#e5e7eb] bg-[#f8fafc] p-4">
                <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-[#e0f2fe] to-[#bae6fd] text-sm font-bold text-[#0369a1] shadow-sm">
                  {product.seller.image ? (
                    <Image src={product.seller.image} alt={`${product.seller.name}'s profile photo`} width={56} height={56} unoptimized className="h-full w-full object-cover" />
                  ) : (
                    sellerInitials
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-[#64748b]">Created by</p>
                  <p className="truncate font-semibold text-[#0f172a]">{product.seller.name}</p>
                  <p className="text-xs text-[#64748b]">{product.seller._count.products} published product{product.seller._count.products === 1 ? "" : "s"}</p>
                </div>
                <Link href={`/sellers/${product.seller.id}`} className={buttonVariants({ variant: "outline", size: "sm", className: "shrink-0 rounded-lg border-[#cbd5e1] bg-white text-[#0f172a] hover:bg-[#f1f5f9] hover:border-[#94a3b8]" })}>
                  View store
                </Link>
              </div>
            </aside>
          </div>

          <div className="mt-10 grid min-w-0 gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
            <section className="min-w-0">
              <div className="border-b border-[#dce3dd] pb-4"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0F4C5C]">Product details</p><h2 className="mt-1 text-2xl font-semibold tracking-tight">About this product</h2></div>
              <div className="mt-5 break-words whitespace-pre-wrap text-sm leading-7 text-[#536159] sm:text-base">{product.description}</div>

              {features.length > 0 && <section className="mt-8"><h3 className="text-lg font-semibold">Features</h3><ul className="mt-3 grid gap-3 sm:grid-cols-2">{features.map((feature, index) => <li key={`${index}-${feature}`} className="flex items-start gap-3 rounded-xl border border-[#e3e9e3] bg-white p-4 text-sm leading-6 text-[#3c4c42] shadow-sm"><span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#e8f4ee]"><Check className="h-3.5 w-3.5 text-[#20826e]" /></span><span className="min-w-0 whitespace-pre-wrap break-words">{feature}</span></li>)}</ul></section>}

              {requirements.length > 0 && <section className="mt-8"><h3 className="text-lg font-semibold">Requirements</h3><ul className="mt-3 grid gap-2 sm:grid-cols-2">{requirements.map((requirement, index) => <li key={`${index}-${requirement}`} className="flex items-start gap-3 rounded-xl bg-[#f4f7f3] px-4 py-3 text-sm leading-6 text-[#536159]"><span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#35D0BA]" /><span className="min-w-0 whitespace-pre-wrap break-words">{requirement}</span></li>)}</ul></section>}

              <section className="mt-8 rounded-2xl border border-[#dce3dd] bg-white p-5 sm:p-6">
                <div className="flex items-center gap-2"><PackageCheck className="h-5 w-5 text-[#0F4C5C]" /><h3 className="text-lg font-semibold">Product information</h3></div>
                <dl className="mt-4 grid gap-x-6 gap-y-4 sm:grid-cols-2">
                  <Info label="Product type" value={label(product.productType)} />
                  <Info label="License" value={label(product.licenseType)} />
                  <Info label="Version" value={product.version} />
                  <Info label="Last updated" value={product.updatedAt.toLocaleDateString("en", { year: "numeric", month: "short", day: "numeric" })} />
                  <Info label="Digital files included" value={String(product._count.assets)} />
                  {product.framework && <Info label="Framework" value={product.framework} />}
                  {product.technologies.length > 0 && <Info label="Technologies" value={product.technologies.join(", ")} />}
                  {product.supportPeriod && <Info label="Support period" value={product.supportPeriod} />}
                </dl>
                {product.supportInformation && <div className="mt-5 border-t border-[#e7ece7] pt-4"><p className="text-xs font-semibold uppercase tracking-wide text-[#748077]">Support information</p><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-[#536159]">{product.supportInformation}</p></div>}
                {product.changelog && <div className="mt-5 border-t border-[#e7ece7] pt-4"><p className="text-xs font-semibold uppercase tracking-wide text-[#748077]">Changelog</p><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-[#536159]">{product.changelog}</p></div>}
                <div className="mt-5 flex flex-wrap gap-x-5 gap-y-3 border-t border-[#e7ece7] pt-4"><ExternalTextLink href={docsUrl}><BookOpen className="h-4 w-4" /> Documentation</ExternalTextLink><ExternalTextLink href={githubUrl}><Code2 className="h-4 w-4" /> Source repository</ExternalTextLink></div>
                {product.tags.length > 0 && <div className="mt-5 flex flex-wrap gap-2 border-t border-[#e7ece7] pt-4">{product.tags.map((tag) => <span key={tag} className="rounded-full bg-[#eef4e9] px-3 py-1.5 text-xs font-medium text-[#315d4a]">#{tag}</span>)}</div>}
              </section>

              <ProductReviews averageRating={product.averageRating} reviewCount={product.reviewCount} reviews={reviews} ratingCounts={ratingCounts} />
            </section>

            <aside className="space-y-5">
              <section className="rounded-2xl border border-[#dce3dd] bg-white p-5">
                <div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-[#0F4C5C]" /><h2 className="font-semibold">License &amp; support</h2></div>
                <p className="mt-3 text-sm leading-6 text-[#59675e]">This listing includes a {label(product.licenseType).toLowerCase()} license{product.supportPeriod ? ` with ${product.supportPeriod} support` : ""}.</p>
              </section>
              {videoUrl && <section className="rounded-2xl border border-[#dce3dd] bg-white p-5"><p className="text-xs font-semibold uppercase tracking-wide text-[#748077]">Product video</p><p className="mt-2 text-sm text-[#59675e]">The seller has provided a video walkthrough.</p><ExternalTextLink href={videoUrl}>Watch video</ExternalTextLink></section>}
            </aside>
          </div>

          <section className="mt-12 border-t border-[#dce3dd] pt-9">
            <div className="mb-5 flex items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0F4C5C]">Keep exploring</p><h2 className="mt-1 text-2xl font-semibold tracking-tight">Related products</h2><p className="mt-1 text-sm text-[#66756b]">Published products in {product.category.name}{product.technologies.length ? " with similar technologies" : ""}.</p></div><Link href="/marketplace" className="hidden items-center gap-1 text-sm font-semibold text-[#0F4C5C] hover:underline sm:inline-flex">Browse marketplace <ArrowUpRight className="h-4 w-4" /></Link></div>
            {relatedProducts.length ? <div className="grid min-w-0 gap-5 sm:grid-cols-2 xl:grid-cols-4">{relatedProducts.map((item) => <ProductCard key={item.id} product={item} />)}</div> : <EmptyProducts message="No related published products yet." />}
          </section>

          <section className="mt-12 border-t border-[#dce3dd] pt-9">
            <div className="mb-5"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0F4C5C]">From this seller</p><h2 className="mt-1 text-2xl font-semibold tracking-tight">More from {product.seller.name}</h2></div>
            {sellerProducts.length ? <div className="grid min-w-0 gap-5 sm:grid-cols-2 xl:grid-cols-4">{sellerProducts.map((item) => <ProductCard key={item.id} product={item} />)}</div> : <EmptyProducts message="This seller has no other published products yet." />}
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0"><dt className="text-xs font-medium text-[#748077]">{label}</dt><dd className="mt-1 break-words text-sm font-medium text-[#263d34]">{value}</dd></div>;
}

function EmptyProducts({ message }: { message: string }) {
  return <div className="rounded-2xl border border-dashed border-[#cdd8ce] bg-white px-6 py-8 text-center text-sm text-[#66756b]"><FileArchive className="mx-auto h-6 w-6 text-[#0F4C5C]/60" /><p className="mt-2">{message}</p></div>;
}
