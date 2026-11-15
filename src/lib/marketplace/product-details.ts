import "server-only";
import { cache } from "react";
import { db } from "@/lib/db/prisma";

export const getPublicProductBySlug = cache(async (slug: string) => {
  return db.product.findFirst({
    where: {
      slug,
      status: "PUBLISHED",
      adminRestrictedAt: null,
      seller: { status: "ACTIVE", role: "SELLER", sellerSuspendedAt: null },
    },
    select: {
      id: true,
      title: true,
      slug: true,
      shortDescription: true,
      description: true,
      images: true,
      demoUrl: true,
      documentationUrl: true,
      githubUrl: true,
      videoUrl: true,
      price: true,
      compareAtPrice: true,
      productType: true,
      licenseType: true,
      technologies: true,
      features: true,
      framework: true,
      tags: true,
      requirements: true,
      supportPeriod: true,
      supportInformation: true,
      version: true,
      changelog: true,
      averageRating: true,
      reviewCount: true,
      totalSales: true,
      likeCount: true,
      updatedAt: true,
      categoryId: true,
      category: { select: { name: true, slug: true } },
      seller: {
        select: {
          id: true,
          name: true,
          image: true,
          _count: { select: { products: { where: { status: "PUBLISHED", adminRestrictedAt: null } } } },
        },
      },
      assets: {
        where: { kind: "IMAGE" },
        orderBy: [{ isCover: "desc" }, { createdAt: "asc" }],
        select: { id: true, fileName: true, isCover: true },
      },
      _count: { select: { assets: { where: { kind: "FILE" } } } },
    },
  });
});

export async function getProductDetailCollections(product: NonNullable<Awaited<ReturnType<typeof getPublicProductBySlug>>>, userId?: string) {
  const [reviews, ratingCounts, relatedCandidates, sellerProducts, isWishlisted] = await Promise.all([
    db.review.findMany({
      where: { productId: product.id, isDeleted: false },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        rating: true,
        comment: true,
        isVerified: true,
        createdAt: true,
        user: { select: { name: true } },
      },
    }),
    db.review.groupBy({
      by: ["rating"],
      where: { productId: product.id, isDeleted: false },
      _count: { _all: true },
    }),
    db.product.findMany({
      where: {
        status: "PUBLISHED",
        adminRestrictedAt: null,
        seller: { status: "ACTIVE", role: "SELLER", sellerSuspendedAt: null },
        slug: { not: product.slug },
        OR: [
          { categoryId: product.categoryId },
          { productType: product.productType },
          ...(product.technologies.length ? [{ technologies: { hasSome: product.technologies } }] : []),
        ],
      },
      orderBy: [{ totalSales: "desc" }, { averageRating: "desc" }, { publishedAt: "desc" }],
      take: 12,
      select: relatedProductSelect,
    }),
    db.product.findMany({
      where: {
        status: "PUBLISHED",
        adminRestrictedAt: null,
        sellerId: product.seller.id,
        slug: { not: product.slug },
        seller: { status: "ACTIVE", role: "SELLER", sellerSuspendedAt: null },
      },
      orderBy: [{ publishedAt: "desc" }, { totalSales: "desc" }],
      take: 4,
      select: relatedProductSelect,
    }),
    userId
      ? db.wishlistItem.findUnique({ where: { userId_productId: { userId, productId: product.id } }, select: { id: true } }).then(Boolean)
      : Promise.resolve(false),
  ]);

  const technologySet = new Set(product.technologies);
  const relatedProducts = relatedCandidates
    .map((candidate, index) => ({
      candidate,
      index,
      score: (candidate.category.id === product.categoryId ? 100 : 0)
        + candidate.technologies.filter((technology) => technologySet.has(technology)).length * 2
        + (candidate.productType === product.productType ? 1 : 0),
    }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, 4)
    .map(({ candidate }) => candidate);

  return { reviews, ratingCounts, relatedProducts, sellerProducts, isWishlisted };
}

const relatedProductSelect = {
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
  likeCount: true,
  category: { select: { id: true, name: true, slug: true } },
  seller: { select: { id: true, name: true, image: true } },
} as const;
