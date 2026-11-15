"use client";

import Image from "next/image";
import Link from "next/link";
import { Star, ArrowUpRight, Sparkles } from "lucide-react";
import { ProductCardPulseHeart } from "./ProductCardPulseHeart";
import { WishlistButton } from "@/components/products/WishlistButton";
import { ProductType, LicenseType } from "@prisma/client";
import { WebsitePreview } from "@/components/marketplace/website-preview";

interface ProductCardProps {
  product: {
    id: string;
    title: string;
    slug: string;
    shortDescription: string;
    images: string[];
    demoUrl: string | null;
    price: number;
    compareAtPrice: number | null;
    productType: ProductType;
    licenseType: LicenseType;
    technologies: string[];
    features: string[];
    version: string;
    averageRating: number;
    reviewCount: number;
    totalSales: number;
    isFeatured: boolean;
    likeCount?: number;
    category: { id: string; name: string; slug: string };
    seller: { id: string; name: string; image: string | null };
  };
  isWishlisted?: boolean;
  onWishlistToggle?: (productId: string) => void;
}

export function ProductCard({ product, isWishlisted }: ProductCardProps) {
  const discount =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
      : 0;

  const sellerInitials = product.seller.name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  const previewAddress = product.demoUrl
    ? product.demoUrl.replace(/^https?:\/\//i, "").split(/[?#]/, 1)[0]
    : `devisima.com/products/${product.slug}`;

  const isSompay = product.title.toUpperCase() === "SOMPAY" || product.slug === "sompay";
  const fallbackPreview = isSompay ? "/products/sompay-preview.svg" : product.images[0];

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[16px] border border-[#eaedea] bg-[#FFFFFF] shadow-[0_4px_20px_rgba(0,0,0,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_14px_30px_rgba(0,0,0,0.1)]">
      {/* Browser Title Bar framing the top of screenshot */}
      <div className="flex h-7.5 items-center justify-between border-b border-[#edf0ee] bg-[#FFFFFF] px-3.5">
        {/* Three tiny browser dots */}
        <div className="flex shrink-0 items-center gap-1.5" aria-hidden="true">
          <span className="h-1.5 w-1.5 rounded-full bg-[#d0d5d2]" />
          <span className="h-1.5 w-1.5 rounded-full bg-[#d0d5d2]" />
          <span className="h-1.5 w-1.5 rounded-full bg-[#d0d5d2]" />
        </div>

        {/* Faint URL path */}
        <div className="mx-auto flex max-w-[65%] items-center justify-center">
          <span className="truncate rounded bg-[#f5f6f5] px-2 py-0.5 text-[10px] font-medium tracking-tight text-[#8b918e]">
            {previewAddress}
          </span>
        </div>

        {/* Spacer to keep URL centered */}
        <div className="w-[30px] shrink-0" aria-hidden="true" />
      </div>

      {/* Website Preview (Top Section, edge-to-edge) */}
      <div className="relative aspect-[16/10] overflow-hidden bg-[#faf8f5]">
        <Link
          href={`/products/${product.slug}`}
          className="group absolute inset-0 block"
          aria-label={`View ${product.title}`}
        >
          {product.demoUrl ? (
            <WebsitePreview
              siteUrl={product.demoUrl}
              title={product.title}
              fallbackSrc={fallbackPreview}
              className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
            />
          ) : fallbackPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={fallbackPreview}
              alt={product.title}
              className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 via-muted to-accent/20">
              <div className="text-center text-muted-foreground">
                <Sparkles className="mx-auto mb-2 h-6 w-6 text-primary" />
                <span className="text-sm font-medium">Product preview</span>
              </div>
            </div>
          )}
        </Link>

        {/* Floating Badge (Top-Left: Clean, minimal, dark-teal-filled pill badge) */}
        <div className="absolute left-3 top-3 z-10 flex items-center gap-1.5">
          {discount > 0 ? (
            <span className="rounded-full bg-[#0F4C5C] px-3 py-1 text-[11px] font-semibold text-white shadow-sm tracking-wide">
              Save {discount}%
            </span>
          ) : product.isFeatured ? (
            <span className="rounded-full bg-[#0F4C5C] px-3 py-1 text-[11px] font-semibold text-white shadow-sm tracking-wide">
              Featured
            </span>
          ) : null}
        </div>

        {/* Floating Badge (Top-Right: Clean, white-filled circular badge with heart icon and count) */}
        <div className="absolute right-3 top-3 z-10">
          {isWishlisted === undefined ? (
            <ProductCardPulseHeart count={product.likeCount || 0} productId={product.id} />
          ) : (
            <WishlistButton productId={product.id} initialWishlisted={isWishlisted} slug={product.slug} compact />
          )}
        </div>
      </div>

      {/* The Product Info (Bottom Section) */}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        {/* Single line of clean, small, grey-text tags for category & technologies */}
        <div className="mb-2.5 flex items-center gap-1.5 overflow-hidden whitespace-nowrap">
          <span className="truncate rounded bg-[#f3f4f3] px-2 py-0.5 text-[11px] font-medium text-[#6b726e]">
            {product.category.name}
          </span>
          {product.technologies.slice(0, 2).map((tech) => {
            const shortTech = tech.length > 20 ? `${tech.slice(0, 19).trimEnd()}…` : tech;
            return (
              <span
                key={tech}
                title={tech}
                className="truncate rounded bg-[#f3f4f3] px-2 py-0.5 text-[11px] font-medium text-[#6b726e]"
              >
                {shortTech}
              </span>
            );
          })}
        </div>

        {/* Main Title: Bold, clean, black sans-serif font */}
        <Link
          href={`/products/${product.slug}`}
          className="block rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <h3 className="line-clamp-1 text-xl font-bold tracking-tight text-[#111827] transition-colors group-hover:text-[#0F4C5C]">
            {product.title}
          </h3>
          {/* Description: Condensed, two-line description in grey text */}
          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-[#6b7280]">
            {product.shortDescription}
          </p>
        </Link>

        {/* Seller Info (Just above Price): Neat circular avatar, seller name, 'New listing' tag */}
        <div className="mt-4 flex items-center justify-between gap-2">
          <Link
            href={`/sellers/${product.seller.id}`}
            className="group/seller inline-flex min-w-0 items-center gap-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#1b2528] text-[10px] font-bold text-white shadow-xs">
              {product.seller.image ? (
                <Image
                  src={product.seller.image}
                  alt={product.seller.name}
                  width={24}
                  height={24}
                  unoptimized
                  className="h-full w-full object-cover"
                />
              ) : (
                sellerInitials
              )}
            </span>
            <span className="truncate text-xs font-medium text-[#4b5563] transition-colors group-hover/seller:text-[#111827]">
              {product.seller.name}
            </span>
          </Link>

          {product.reviewCount > 0 ? (
            <span className="inline-flex shrink-0 items-center gap-1 text-xs text-[#68716c]">
              <Star className="h-3 w-3 fill-current text-[#d59b24]" />
              {product.averageRating.toFixed(1)}{" "}
              <span className="text-[#909793]">({product.reviewCount})</span>
            </span>
          ) : product.totalSales > 0 ? (
            <span className="shrink-0 text-xs text-[#78817c]">
              {product.totalSales} sales
            </span>
          ) : (
            <span className="shrink-0 rounded-full bg-[#f3f4f3] px-2 py-0.5 text-[10px] font-medium text-[#6b726e]">
              New listing
            </span>
          )}
        </div>

        {/* Footer & Price (Bottom Row) */}
        <div className="mt-4 flex items-end justify-between gap-3 border-t border-[#edf0ee] pt-3.5">
          {/* Price display: larger bold price + grey strikethrough just below it */}
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight text-[#111827]">
              ₦{product.price.toLocaleString()}
            </span>
            {discount > 0 && product.compareAtPrice ? (
              <span className="text-xs text-[#9ca3af] line-through -mt-0.5">
                ₦{product.compareAtPrice.toLocaleString()}
              </span>
            ) : null}
          </div>

          {/* Clean, dark teal, rectangular 'View Product' button with arrow icon */}
          <Link
            href={`/products/${product.slug}`}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#0F4C5C] px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#145a6c] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C5C] focus-visible:ring-offset-2"
          >
            View Product <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}
