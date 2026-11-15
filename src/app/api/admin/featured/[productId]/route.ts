import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db/prisma";

// DELETE - Remove product from featured
export async function DELETE(request: Request, { params }: { params: Promise<{ productId: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Admin access required." }, { status: 403 });

  const { productId } = await params;

  try {
    const product = await db.product.update({
      where: { id: productId },
      data: { isFeatured: false },
    });

    return NextResponse.json({ product, message: "Product removed from featured." });
  } catch (error) {
    console.error("Failed to remove featured product:", error);
    return NextResponse.json({ message: "Failed to remove featured product." }, { status: 500 });
  }
}
