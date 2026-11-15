import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db/prisma";

export const normalizeCouponCode = (value: string) => value.trim().toUpperCase();

export const couponCodeSchema = z.string().trim().min(1, "Coupon code is required.").max(64, "Coupon code is too long.").transform((value) => normalizeCouponCode(value));

export const createCouponSchema = z
  .object({
    code: z.string().trim().min(1, "Code cannot be empty.").max(64, "Code is too long.").transform((value) => normalizeCouponCode(value)),
    description: z.string().trim().max(300).optional().transform((value) => value && value.length > 0 ? value : null),
    discountType: z.enum(["PERCENTAGE", "FIXED_AMOUNT"]),
    discountValue: z.number().int().positive("Discount value must be positive."),
    minimumOrderAmount: z.number().int().nonnegative().default(0),
    maximumDiscountAmount: z.number().int().nonnegative().optional(),
    usageLimit: z.number().int().nonnegative().optional(),
    perUserLimit: z.number().int().nonnegative().optional(),
    startsAt: z.coerce.date(),
    expiresAt: z.coerce.date(),
    isActive: z.boolean().default(true),
    sellerId: z.string().cuid().optional(),
  })
  .refine((data) => data.expiresAt > data.startsAt, {
    message: "Expiry must be after start date.",
    path: ["expiresAt"],
  })
  .refine((data) => {
    if (data.discountType === "PERCENTAGE") return data.discountValue > 0 && data.discountValue <= 100;
    return data.discountValue > 0;
  }, {
    message: "A percentage discount must be between 1 and 100.",
    path: ["discountValue"],
  });

const couponSelect = {
  id: true,
  code: true,
  description: true,
  discountType: true,
  discountValue: true,
  minimumOrderAmount: true,
  maximumDiscountAmount: true,
  usageLimit: true,
  usageCount: true,
  perUserLimit: true,
  startsAt: true,
  expiresAt: true,
  isActive: true,
  sellerId: true,
  createdById: true,
  products: { select: { productId: true } },
  categories: { select: { categoryId: true } },
  sellers: { select: { sellerId: true } },
} satisfies Prisma.CouponSelect;

export async function getCouponByCode(code: string) {
  return db.coupon.findUnique({
    where: { code: normalizeCouponCode(code) },
    select: couponSelect,
  });
}

export function formatCouponPrice(amount: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(amount);
}

export async function validateCouponForCart({
  code,
  userId,
  subtotal,
  productIds,
  sellerIds,
  categoryIds,
  checkUsageLimits = true,
}: {
  code: string;
  userId: string;
  subtotal: number;
  productIds: string[];
  sellerIds?: string[];
  categoryIds?: string[];
  checkUsageLimits?: boolean;
}) {
  const normalizedCode = normalizeCouponCode(code);
  const coupon = await getCouponByCode(normalizedCode);
  if (!coupon) {
    return { valid: false, message: "Coupon not found", discount: 0 } as const;
  }
  const now = new Date();
  if (!coupon.isActive) {
    return { valid: false, message: "Coupon is inactive", discount: 0 } as const;
  }
  if (coupon.startsAt > now) {
    return { valid: false, message: "Coupon is not active yet", discount: 0 } as const;
  }
  if (coupon.expiresAt < now) {
    return { valid: false, message: "Coupon has expired", discount: 0 } as const;
  }
  if (checkUsageLimits && coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
    return { valid: false, message: "Coupon usage limit reached", discount: 0 } as const;
  }
  if (checkUsageLimits && coupon.perUserLimit !== null) {
    const personalUsage = await db.couponUsage.count({ where: { couponId: coupon.id, userId } });
    if (personalUsage >= coupon.perUserLimit) {
      return { valid: false, message: "Coupon usage limit for this account has been reached", discount: 0 } as const;
    }
  }

  if (subtotal < coupon.minimumOrderAmount) {
    return { valid: false, message: `Minimum order amount is ${formatCouponPrice(coupon.minimumOrderAmount)}`, discount: 0 } as const;
  }

  const restrictedProducts = new Set(coupon.products.map((entry) => entry.productId));
  const restrictedSellers = new Set(coupon.sellers.map((entry) => entry.sellerId));
  const restrictedCategories = new Set(coupon.categories.map((entry) => entry.categoryId));
  const hasRestrictions = restrictedProducts.size > 0 || restrictedSellers.size > 0 || restrictedCategories.size > 0;
  if (hasRestrictions) {
    const productAllowed = restrictedProducts.size === 0 || productIds.some((id) => restrictedProducts.has(id));
    const sellerAllowed = restrictedSellers.size === 0 || (sellerIds ?? []).some((id) => restrictedSellers.has(id));
    const categoryAllowed = restrictedCategories.size === 0 || (categoryIds ?? []).some((id) => restrictedCategories.has(id));
    if (!productAllowed || !sellerAllowed || !categoryAllowed) {
      return { valid: false, message: "This coupon is not valid for the products in your cart", discount: 0 } as const;
    }
  }

  let discount = coupon.discountType === "PERCENTAGE" ? Math.floor((subtotal * coupon.discountValue) / 100) : coupon.discountValue;
  if (coupon.maximumDiscountAmount !== null && coupon.maximumDiscountAmount > 0) {
    discount = Math.min(discount, coupon.maximumDiscountAmount);
  }
  discount = Math.max(0, Math.min(discount, subtotal));

  return {
    valid: true,
    message: `${coupon.code} applied`,
    discount,
    coupon,
  } as const;
}

export async function reserveCouponUsage(
  tx: Prisma.TransactionClient,
  {
    couponId,
    userId,
    discountAmount,
  }: {
    couponId: string;
    userId: string;
    discountAmount: number;
  },
) {
  const incremented = await tx.coupon.updateMany({
    where: { id: couponId },
    data: { usageCount: { increment: 1 } },
  });
  if (!incremented.count) return null;

  const coupon = await tx.coupon.findUnique({
    where: { id: couponId },
    select: { isActive: true, startsAt: true, expiresAt: true, usageLimit: true, usageCount: true, perUserLimit: true },
  });
  if (!coupon) throw new Error("Coupon disappeared while reserving usage.");

  const now = new Date();
  const expiredOrUnavailable = !coupon.isActive
    || coupon.startsAt > now
    || coupon.expiresAt < now
    || (coupon.usageLimit !== null && coupon.usageCount > coupon.usageLimit);
  const personalUsage = coupon.perUserLimit === null
    ? 0
    : await tx.couponUsage.count({ where: { couponId, userId } });
  const personalLimitReached = coupon.perUserLimit !== null && personalUsage >= coupon.perUserLimit;

  if (expiredOrUnavailable || personalLimitReached) {
    await tx.coupon.update({ where: { id: couponId }, data: { usageCount: { decrement: 1 } } });
    return null;
  }

  return tx.couponUsage.create({
    data: { couponId, userId, discountAmount },
    select: { id: true },
  });
}

export async function releaseCouponUsage(tx: Prisma.TransactionClient, orderId: string) {
  const usages = await tx.couponUsage.findMany({
    where: { orderId },
    select: { id: true, couponId: true },
  });
  for (const usage of usages) {
    const decremented = await tx.coupon.updateMany({
      where: { id: usage.couponId, usageCount: { gt: 0 } },
      data: { usageCount: { decrement: 1 } },
    });
    if (!decremented.count) throw new Error(`Coupon usage count is inconsistent for coupon ${usage.couponId}.`);
  }
  if (usages.length) {
    await tx.couponUsage.deleteMany({ where: { id: { in: usages.map(({ id }) => id) } } });
  }
}
