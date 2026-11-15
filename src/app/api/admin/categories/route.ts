import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db/prisma";
import { z } from "zod";

const categorySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  slug: z.string().min(2, "Slug must be at least 2 characters").max(100).regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  description: z.string().max(2000).optional(),
  icon: z.string().optional(),
  order: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

// GET - List all categories
export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Admin access required." }, { status: 403 });

  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get("includeInactive") === "true";

    const categories = await db.category.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: [{ order: "asc" }, { name: "asc" }],
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return NextResponse.json({ message: "Failed to fetch categories." }, { status: 500 });
  }
}

// POST - Create new category
export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Admin access required." }, { status: 403 });

  const parsed = categorySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Invalid category data." }, { status: 400 });

  try {
    // Check if name or slug already exists
    const existing = await db.category.findFirst({
      where: {
        OR: [
          { name: parsed.data.name },
          { slug: parsed.data.slug },
        ],
      },
    });

    if (existing) {
      return NextResponse.json(
        { message: existing.name === parsed.data.name ? "Category name already exists." : "Category slug already exists." },
        { status: 409 }
      );
    }

    const category = await db.category.create({
      data: {
        name: parsed.data.name,
        slug: parsed.data.slug,
        description: parsed.data.description,
        icon: parsed.data.icon,
        order: parsed.data.order ?? 0,
        isActive: parsed.data.isActive ?? true,
      },
    });

    return NextResponse.json({ category, message: "Category created successfully." }, { status: 201 });
  } catch (error) {
    console.error("Failed to create category:", error);
    return NextResponse.json({ message: "Failed to create category." }, { status: 500 });
  }
}
