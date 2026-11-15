import type { MetadataRoute } from "next";
import { db } from "@/lib/db/prisma";
import { getAppBaseUrl } from "@/lib/app-url";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getAppBaseUrl();
  const [products, categories] = await Promise.all([
    db.product.findMany({
      where: {
        status: "PUBLISHED",
        adminRestrictedAt: null,
        seller: { status: "ACTIVE", role: "SELLER", sellerSuspendedAt: null },
      },
      orderBy: { updatedAt: "desc" },
      take: 50_000,
      select: { slug: true, updatedAt: true },
    }),
    db.category.findMany({
      where: { isActive: true },
      orderBy: { updatedAt: "desc" },
      take: 5_000,
      select: { slug: true, updatedAt: true },
    }),
  ]);

  const staticPaths = ["/", "/marketplace", "/categories", "/deals", "/resources", "/seller-guide", "/contact", "/refund-policy"];
  return [
    ...staticPaths.map((path) => ({ url: new URL(path, baseUrl).toString() })),
    ...categories.map((category) => ({
      url: new URL(`/marketplace?category=${encodeURIComponent(category.slug)}`, baseUrl).toString(),
      lastModified: category.updatedAt,
    })),
    ...products.map((product) => ({
      url: new URL(`/products/${encodeURIComponent(product.slug)}`, baseUrl).toString(),
      lastModified: product.updatedAt,
    })),
  ];
}
