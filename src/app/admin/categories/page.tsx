import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db/prisma";
import { AdminCategories } from "@/components/admin/AdminCategories";
import { AdminShell } from "@/components/admin/admin-shell";
import { FolderKanban, Layers } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Categories | Admin",
  description: "Manage marketplace categories",
  robots: "noindex",
};

export default async function AdminCategoriesPage() {
  const admin = await requireAdmin();

  const categories = await db.category.findMany({
    orderBy: [{ order: "asc" }, { name: "asc" }],
    include: {
      _count: {
        select: { products: true },
      },
    },
  });

  return (
    <AdminShell user={admin}>
      <div className="mx-auto max-w-7xl py-2">
        <header className="mt-6 flex flex-col gap-5 rounded-3xl bg-primary px-6 py-7 text-primary-foreground shadow-sm sm:flex-row sm:items-end sm:justify-between sm:px-8 sm:py-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Marketplace organization</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Categories</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-primary-foreground/75 sm:text-base">
              Manage marketplace categories to help buyers discover products. Organize, edit, and control category visibility.
            </p>
          </div>
          <div className="inline-flex w-fit items-center gap-3 rounded-2xl border border-primary-foreground/15 bg-primary-foreground/5 px-4 py-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent/15 text-accent"><Layers className="h-5 w-5" /></span>
            <span>
              <span className="block text-2xl font-semibold tabular-nums">{categories.length}</span>
              <span className="block text-xs text-primary-foreground/70">Total categories</span>
            </span>
          </div>
        </header>

        <AdminCategories categories={categories} />
      </div>
    </AdminShell>
  );
}
