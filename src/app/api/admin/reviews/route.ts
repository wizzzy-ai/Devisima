import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db/prisma";

// GET - List all reviews with filtering and pagination
export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Admin access required." }, { status: 403 });

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status"); // "verified", "unverified", "deleted", "all"
    const search = searchParams.get("search");

    const skip = (page - 1) * limit;

    const where: any = {};

    if (status === "verified") {
      where.isVerified = true;
      where.isDeleted = false;
    } else if (status === "unverified") {
      where.isVerified = false;
      where.isDeleted = false;
    } else if (status === "deleted") {
      where.isDeleted = true;
    } else {
      where.isDeleted = false;
    }

    if (search) {
      where.OR = [
        { user: { name: { contains: search, mode: "insensitive" } } },
        { user: { email: { contains: search, mode: "insensitive" } } },
        { product: { title: { contains: search, mode: "insensitive" } } },
        { comment: { contains: search, mode: "insensitive" } },
      ];
    }

    const [reviews, total] = await Promise.all([
      db.review.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
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
                },
              },
            },
          },
        },
      }),
      db.review.count({ where }),
    ]);

    return NextResponse.json({
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Failed to fetch reviews:", error);
    return NextResponse.json({ message: "Failed to fetch reviews." }, { status: 500 });
  }
}
