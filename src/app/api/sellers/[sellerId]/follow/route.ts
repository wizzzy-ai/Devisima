import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/guards";
import { db } from "@/lib/db/prisma";

export async function POST(request: Request, { params }: { params: Promise<{ sellerId: string }> }) {
  const { sellerId } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Sign in to follow stores." }, { status: 401 });
  if (user.id === sellerId) return NextResponse.json({ message: "You cannot follow your own store." }, { status: 400 });

  try {
    const seller = await db.user.findFirst({
      where: { id: sellerId, role: "SELLER", status: "ACTIVE", sellerSuspendedAt: null },
    });
    if (!seller) return NextResponse.json({ message: "Seller not found." }, { status: 404 });

    const existing = await db.storeFollow.findUnique({
      where: { followerId_sellerId: { followerId: user.id, sellerId } },
    });

    if (existing) {
      return NextResponse.json({ message: "You already follow this store." }, { status: 400 });
    }

    await db.storeFollow.create({
      data: { followerId: user.id, sellerId },
    });

    const followerCount = await db.storeFollow.count({ where: { sellerId } });
    return NextResponse.json({ message: "Store followed successfully.", followerCount });
  } catch (error) {
    console.error("Failed to follow store:", error);
    return NextResponse.json({ message: "Failed to follow store." }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ sellerId: string }> }) {
  const { sellerId } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Sign in to continue." }, { status: 401 });

  try {
    await db.storeFollow.deleteMany({
      where: { followerId: user.id, sellerId },
    });

    const followerCount = await db.storeFollow.count({ where: { sellerId } });
    return NextResponse.json({ message: "Store unfollowed successfully.", followerCount });
  } catch (error) {
    console.error("Failed to unfollow store:", error);
    return NextResponse.json({ message: "Failed to unfollow store." }, { status: 500 });
  }
}
