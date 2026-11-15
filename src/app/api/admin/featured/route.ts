import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db/prisma";

// GET - List all featured products
export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Admin access required." }, { status: 403 });

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search");

    const skip = (page - 1) * limit;

    const where: any = {
      isFeatured: true,
      status: "PUBLISHED",
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
        { seller: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { totalSales: "desc" },
        include: {
          seller: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      db.product.count({ where }),
    ]);

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Failed to fetch featured products:", error);
    return NextResponse.json({ message: "Failed to fetch featured products." }, { status: 500 });
  }
}

// POST - Add product to featured
export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Admin access required." }, { status: 403 });

  try {
    const body = await request.json();
    const { productId } = body;

    if (!productId) {
      return NextResponse.json({ message: "Product ID is required." }, { status: 400 });
    }

    const product = await db.product.update({
      where: { id: productId },
      data: { isFeatured: true },
    });

    return NextResponse.json({ product, message: "Product added to featured." });
  } catch (error) {
    console.error("Failed to add featured product:", error);
    return NextResponse.json({ message: "Failed to add featured product." }, { status: 500 });
  }
}
