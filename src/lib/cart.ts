import { db } from "@/lib/db/prisma";
import { Prisma } from "@prisma/client";
import { z } from "zod";

const cartProductSelect = {
  id: true,
  title: true,
  slug: true,
  images: true,
  price: true,
  productType: true,
  licenseType: true,
  status: true,
  adminRestrictedAt: true,
  categoryId: true,
  sellerId: true,
  seller: { select: { id: true, name: true, status: true, role: true, sellerSuspendedAt: true, sellerApplications: { where: { status: "APPROVED" }, orderBy: { createdAt: "desc" }, take: 1, select: { storeName: true } } } },
  assets: {
    where: { kind: "IMAGE" as const },
    orderBy: [{ isCover: "desc" as const }, { createdAt: "asc" as const }],
    take: 1,
    select: { id: true },
  },
} satisfies Prisma.ProductSelect;

export async function getCartSnapshot(userId: string) {
  const cart = await db.cart.findUnique({
    where: { userId },
    select: {
      id: true,
      couponCode: true,
      couponDiscountAmount: true,
      items: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          productId: true,
          createdAt: true,
          product: { select: cartProductSelect },
        },
      },
    },
  });

  const items = (cart?.items ?? []).map((item) => {
    const product = item.product;
    const available = product.status === "PUBLISHED" && !product.adminRestrictedAt && product.seller.status === "ACTIVE" && product.seller.role === "SELLER" && !product.seller.sellerSuspendedAt;
    return {
      id: item.id,
      productId: item.productId,
      createdAt: item.createdAt.toISOString(),
      available,
      product: {
        id: product.id,
        title: product.title,
        slug: product.slug,
        image: product.images[0] ?? (product.assets[0] ? `/api/products/assets/${product.assets[0].id}` : null),
        price: product.price,
        productType: product.productType,
        licenseType: product.licenseType,
        seller: { id: product.seller.id, name: product.seller.sellerApplications[0]?.storeName || product.seller.name },
      },
    };
  });

  const purchasableItems = items.filter((item) => item.available);
  const subtotal = purchasableItems.reduce((sum, item) => sum + item.product.price, 0);
  const discount = Math.min(cart?.couponDiscountAmount ?? 0, subtotal);

  return {
    items,
    itemCount: items.length,
    unavailableCount: items.length - purchasableItems.length,
    subtotal,
    discount,
    total: subtotal - discount,
    couponCode: cart?.couponCode ?? null,
  };
}

export const cartAddSchema = z.object({ productId: z.string().cuid() });
