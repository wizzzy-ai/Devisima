import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/guards";
import { getCartSnapshot } from "@/lib/cart";
import { couponCodeSchema, validateCouponForCart } from "@/lib/coupons";

const couponApplySchema = z.object({ code: couponCodeSchema.optional() });

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Sign in to access your cart." }, { status: 401 });
  return NextResponse.json(await getCartSnapshot(user.id), { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Sign in to access your cart." }, { status: 401 });
  const body = await request.json().catch(() => null);
  const parsed = couponApplySchema.safeParse(body);
  if (!parsed.success || !parsed.data.code) {
    return NextResponse.json({ message: "Enter a valid coupon code." }, { status: 400 });
  }

  const cart = await db.cart.findUnique({
    where: { userId: user.id },
    select: {
      id: true,
      items: {
        select: {
          productId: true,
          product: {
            select: {
              categoryId: true,
              sellerId: true,
              price: true,
            },
          },
        },
      },
    },
  });

  if (!cart || !cart.items.length) {
    return NextResponse.json({ message: "Add products to your cart before applying a coupon." }, { status: 400 });
  }

  const subtotal = cart.items.reduce((sum, item) => sum + item.product.price, 0);
  const productIds = cart.items.map((item) => item.productId);
  const sellerIds = cart.items.map((item) => item.product.sellerId).filter((id): id is string => Boolean(id));
  const categoryIds = cart.items.map((item) => item.product.categoryId).filter((id): id is string => Boolean(id));
  const validation = await validateCouponForCart({ code: parsed.data.code, userId: user.id, subtotal, productIds, sellerIds, categoryIds });
  if (!validation.valid) {
    return NextResponse.json({ message: validation.message }, { status: 400 });
  }

  await db.cart.update({
    where: { userId: user.id },
    data: { couponCode: parsed.data.code, couponDiscountAmount: validation.discount },
  });

  const snapshot = await getCartSnapshot(user.id);
  return NextResponse.json({ ...snapshot, message: `✓ ${parsed.data.code} applied` });
}

export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Sign in to access your cart." }, { status: 401 });
  await db.cart.update({
    where: { userId: user.id },
    data: { couponCode: null, couponDiscountAmount: 0 },
  });
  const snapshot = await getCartSnapshot(user.id);
  return NextResponse.json({ ...snapshot, message: "Coupon removed." });
}
