import { notFound } from "next/navigation";
import { redirect } from "next/navigation";
import { requireSeller } from "@/lib/auth/guards";
import { db } from "@/lib/db/prisma";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ProductEditor } from "@/components/seller/product-editor";

export default async function EditSellerProductPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireSeller();
  if (user.role !== "SELLER" || user.status !== "ACTIVE") redirect("/forbidden");
  const { id } = await params;
  const [product, categories] = await Promise.all([db.product.findFirst({ where: { id, sellerId: user.id }, include: { category: { select: { id: true } }, assets: { orderBy: { createdAt: "asc" } } } }), db.category.findMany({ where: { isActive: true }, orderBy: [{ order: "asc" }, { name: "asc" }], select: { id: true, name: true } })]);
  if (!product) notFound();
  return <DashboardShell user={user}><ProductEditor product={product} categories={categories} /></DashboardShell>;
}
