import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/guards";
import { cartAddSchema, getCartSnapshot } from "@/lib/cart";

async function activeUser() {
  const user = await getCurrentUser();
  if (!user) return { user: null, response: NextResponse.json({ message: "Sign in to access your cart." }, { status: 401 }) };
  if (user.status !== "ACTIVE") return { user: null, response: NextResponse.json({ message: "This account cannot access a cart." }, { status: 403 }) };
  return { user, response: null };
}

export async function GET() {
  const access = await activeUser();
  if (!access.user) return access.response;
  return NextResponse.json(await getCartSnapshot(access.user.id), { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: Request) {
  const access = await activeUser();
  if (!access.user) return access.response;
  const parsed = cartAddSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "Choose a valid product." }, { status: 400 });

  const product = await db.product.findFirst({
    where: {
      id: parsed.data.productId,
      status: "PUBLISHED",
      adminRestrictedAt: null,
      seller: { status: "ACTIVE", role: "SELLER", sellerSuspendedAt: null },
    },
    select: { id: true },
  });
  if (!product) return NextResponse.json({ message: "This product is unavailable and cannot be added." }, { status: 409 });

  try {
    const result = await db.$transaction(async (tx) => {
      const cart = await tx.cart.upsert({ where: { userId: access.user.id }, create: { userId: access.user.id }, update: {} });
      const existing = await tx.cartItem.findUnique({ where: { cartId_productId: { cartId: cart.id, productId: product.id } }, select: { id: true } });
      if (existing) return { alreadyInCart: true };
      await tx.cartItem.create({ data: { cartId: cart.id, productId: product.id } });
      await tx.cart.update({ where: { id: cart.id }, data: { updatedAt: new Date() } });
      return { alreadyInCart: false };
    });
    const cart = await getCartSnapshot(access.user.id);
    return NextResponse.json({ ...cart, ...result, message: result.alreadyInCart ? "This product is already in your cart." : "Added to your cart." });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ ...(await getCartSnapshot(access.user.id)), alreadyInCart: true, message: "This product is already in your cart." });
    }
    return NextResponse.json({ message: "Could not update your cart. Please try again." }, { status: 500 });
  }
}

export async function DELETE() {
  const access = await activeUser();
  if (!access.user) return access.response;
  await db.cartItem.deleteMany({ where: { cart: { userId: access.user.id } } });
  return NextResponse.json({ ...(await getCartSnapshot(access.user.id)), message: "Cart cleared." });
}
