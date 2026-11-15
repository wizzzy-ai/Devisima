import { NextResponse } from "next/server";
import { db } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/guards";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Sign in to request your data export." }, { status: 401 });

  try {
    const [profile, orders, purchases, notifications, products, applications, reviews] = await Promise.all([
      db.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          emailVerified: true,
          image: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      db.order.findMany({
        where: { userId: user.id },
        select: { id: true, reference: true, total: true, currency: true, status: true, createdAt: true },
      }),
      db.purchase.findMany({
        where: { userId: user.id },
        select: { id: true, orderId: true, productId: true, sellerId: true, purchasedAt: true, purchasedPrice: true },
      }),
      db.notification.findMany({
        where: { userId: user.id },
        select: { id: true, type: true, title: true, message: true, createdAt: true },
      }),
      db.product.findMany({
        where: { sellerId: user.id },
        select: { id: true, title: true, slug: true, status: true, price: true, createdAt: true },
      }),
      db.sellerApplication.findMany({
        where: { userId: user.id },
        select: { id: true, storeName: true, status: true, createdAt: true, reviewedAt: true },
      }),
      db.review.findMany({
        where: { userId: user.id },
        select: { id: true, productId: true, rating: true, comment: true, createdAt: true },
      }),
    ]);

    return NextResponse.json({
      exportedAt: new Date().toISOString(),
      profile,
      orders,
      purchases,
      notifications,
      products,
      applications,
      reviews,
    });
  } catch (error) {
    console.error("Privacy export failed", error);
    return NextResponse.json({ message: "Your data export request could not be completed right now." }, { status: 500 });
  }
}
