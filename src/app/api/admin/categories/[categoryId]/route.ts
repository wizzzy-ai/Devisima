import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db/prisma";
import { z } from "zod";

const categoryUpdateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100).optional(),
  slug: z.string().min(2, "Slug must be at least 2 characters").max(100).regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens").optional(),
  description: z.string().max(2000).optional(),
  icon: z.string().optional(),
  order: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

// GET - Single category
export async function GET(request: Request, { params }: { params: Promise<{ categoryId: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Admin access required." }, { status: 403 });

  const { categoryId } = await params;

  try {
    const category = await db.category.findUnique({
      where: { id: categoryId },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      return NextResponse.json({ message: "Category not found." }, { status: 404 });
    }

    return NextResponse.json({ category });
  } catch (error) {
    console.error("Failed to fetch category:", error);
    return NextResponse.json({ message: "Failed to fetch category." }, { status: 500 });
  }
}

// PUT - Update category
export async function PUT(request: Request, { params }: { params: Promise<{ categoryId: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Admin access required." }, { status: 403 });

  const { categoryId } = await params;

  const parsed = categoryUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Invalid category data." }, { status: 400 });

  try {
    // Check if category exists
    const existing = await db.category.findUnique({
      where: { id: categoryId },
    });

    if (!existing) {
      return NextResponse.json({ message: "Category not found." }, { status: 404 });
    }

    // Check if name or slug conflicts with another category
    if (parsed.data.name || parsed.data.slug) {
      const conflict = await db.category.findFirst({
        where: {
          id: { not: categoryId },
          OR: [
            parsed.data.name ? { name: parsed.data.name } : {},
            parsed.data.slug ? { slug: parsed.data.slug } : {},
          ].filter(Boolean),
        },
      });

      if (conflict) {
        return NextResponse.json(
          { message: conflict.name === parsed.data.name ? "Category name already exists." : "Category slug already exists." },
          { status: 409 }
        );
      }
    }

    const category = await db.category.update({
      where: { id: categoryId },
      data: {
        ...(parsed.data.name && { name: parsed.data.name }),
        ...(parsed.data.slug && { slug: parsed.data.slug }),
        ...(parsed.data.description !== undefined && { description: parsed.data.description }),
        ...(parsed.data.icon !== undefined && { icon: parsed.data.icon }),
        ...(parsed.data.order !== undefined && { order: parsed.data.order }),
        ...(parsed.data.isActive !== undefined && { isActive: parsed.data.isActive }),
      },
    });

    return NextResponse.json({ category, message: "Category updated successfully." });
  } catch (error) {
    console.error("Failed to update category:", error);
    return NextResponse.json({ message: error instanceof Error ? error.message : "Failed to update category." }, { status: 500 });
  }
}

// DELETE - Delete category
export async function DELETE(request: Request, { params }: { params: Promise<{ categoryId: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Admin access required." }, { status: 403 });

  const { categoryId } = await params;

  try {
    // Check if category exists
    const category = await db.category.findUnique({
      where: { id: categoryId },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      return NextResponse.json({ message: "Category not found." }, { status: 404 });
    }

    // Prevent deletion if category has products
    if (category._count.products > 0) {
      return NextResponse.json(
        { message: `Cannot delete category with ${category._count.products} product(s). Please reassign or delete products first.` },
        { status: 400 }
      );
    }

    await db.category.delete({
      where: { id: categoryId },
    });

    return NextResponse.json({ message: "Category deleted successfully." });
  } catch (error) {
    console.error("Failed to delete category:", error);
    return NextResponse.json({ message: "Failed to delete category." }, { status: 500 });
  }
}
