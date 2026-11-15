import { NextResponse } from "next/server";
import { db } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/guards";

async function getActiveUser() {
  const user = await getCurrentUser();
  if (!user) return { user: null, response: NextResponse.json({ message: "Sign in to save products." }, { status: 401 }) };
  if (user.status !== "ACTIVE") return { user: null, response: NextResponse.json({ message: "This account cannot update a wishlist." }, { status: 403 }) };
  return { user, response: null };
}

export async function POST(request: Request) {
  const access = await getActiveUser();
  if (!access.user) return access.response;

  const body = await request.json().catch(() => null) as { productId?: unknown } | null;
  if (!body || typeof body.productId !== "string" || body.productId.length > 64) {
    return NextResponse.json({ message: "Choose a valid product." }, { status: 400 });
  }

  const product = await db.product.findFirst({
    where: {
      id: body.productId,
      status: "PUBLISHED",
      adminRestrictedAt: null,
      seller: { status: "ACTIVE", role: "SELLER", sellerSuspendedAt: null },
    },
    select: { id: true },
  });
  if (!product) return NextResponse.json({ message: "Product not found." }, { status: 404 });

  try {
    await db.wishlistItem.upsert({
      where: { userId_productId: { userId: access.user.id, productId: product.id } },
      create: { userId: access.user.id, productId: product.id },
      update: {},
    });
    return NextResponse.json({ isWishlisted: true });
  } catch {
    return NextResponse.json({ message: "Could not update your wishlist. Try again." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const access = await getActiveUser();
  if (!access.user) return access.response;

  const body = await request.json().catch(() => null) as { productId?: unknown } | null;
  if (!body || typeof body.productId !== "string" || body.productId.length > 64) {
    return NextResponse.json({ message: "Choose a valid product." }, { status: 400 });
  }

  try {
    await db.wishlistItem.deleteMany({ where: { userId: access.user.id, productId: body.productId } });
    return NextResponse.json({ isWishlisted: false });
  } catch {
    return NextResponse.json({ message: "Could not update your wishlist. Try again." }, { status: 500 });
  }
}
