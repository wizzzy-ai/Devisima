import { requireSeller } from "@/lib/auth/guards";
import { redirect } from "next/navigation";
import { db } from "@/lib/db/prisma";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ProductEditor } from "@/components/seller/product-editor";

export default async function NewSellerProductPage() {
  const user = await requireSeller();
  if (user.role !== "SELLER" || user.status !== "ACTIVE") redirect("/forbidden");
  const categories = await db.category.findMany({ where: { isActive: true }, orderBy: [{ order: "asc" }, { name: "asc" }], select: { id: true, name: true } });
  return <DashboardShell user={user}><ProductEditor categories={categories} /></DashboardShell>;
}
