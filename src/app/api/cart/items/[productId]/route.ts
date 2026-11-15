import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/guards";
import { getCartSnapshot } from "@/lib/cart";

type Context = { params: Promise<{ productId: string }> };

export async function DELETE(_request: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Sign in to update your cart." }, { status: 401 });
  if (user.status !== "ACTIVE") return NextResponse.json({ message: "This account cannot update a cart." }, { status: 403 });

  const { productId } = await params;
  if (!z.string().cuid().safeParse(productId).success) return NextResponse.json({ message: "Choose a valid cart item." }, { status: 400 });
  const product = await db.product.findUnique({ where: { id: productId }, select: { id: true } });
  if (!product) return NextResponse.json({ message: "Product not found." }, { status: 404 });

  const removed = await db.cartItem.deleteMany({ where: { productId, cart: { userId: user.id } } });
  if (!removed.count) return NextResponse.json({ message: "This product is not in your cart." }, { status: 404 });
  return NextResponse.json({ ...(await getCartSnapshot(user.id)), message: "Removed from your cart." });
}
