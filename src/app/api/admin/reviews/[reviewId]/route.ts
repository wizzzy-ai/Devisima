import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db/prisma";

// GET - Single review details
export async function GET(request: Request, { params }: { params: Promise<{ reviewId: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Admin access required." }, { status: 403 });

  const { reviewId } = await params;

  try {
    const review = await db.review.findUnique({
      where: { id: reviewId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        product: {
          select: {
            id: true,
            title: true,
            slug: true,
            seller: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!review) {
      return NextResponse.json({ message: "Review not found." }, { status: 404 });
    }

    return NextResponse.json({ review });
  } catch (error) {
    console.error("Failed to fetch review:", error);
    return NextResponse.json({ message: "Failed to fetch review." }, { status: 500 });
  }
}

// PUT - Update review status (verify/unverify, delete/restore)
export async function PUT(request: Request, { params }: { params: Promise<{ reviewId: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Admin access required." }, { status: 403 });

  const { reviewId } = await params;

  try {
    const body = await request.json();
    const { isVerified, isDeleted } = body;

    const review = await db.review.update({
      where: { id: reviewId },
      data: {
        ...(isVerified !== undefined && { isVerified }),
        ...(isDeleted !== undefined && { isDeleted }),
      },
    });

    return NextResponse.json({ review, message: "Review updated successfully." });
  } catch (error) {
    console.error("Failed to update review:", error);
    return NextResponse.json({ message: "Failed to update review." }, { status: 500 });
  }
}

// DELETE - Permanently delete review
export async function DELETE(request: Request, { params }: { params: Promise<{ reviewId: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Admin access required." }, { status: 403 });

  const { reviewId } = await params;

  try {
    await db.review.delete({
      where: { id: reviewId },
    });

    return NextResponse.json({ message: "Review deleted permanently." });
  } catch (error) {
    console.error("Failed to delete review:", error);
    return NextResponse.json({ message: "Failed to delete review." }, { status: 500 });
  }
}
