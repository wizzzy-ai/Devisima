import Link from "next/link";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db/prisma";
import { AdminProductReview } from "@/components/admin/AdminProductReview";
import { AdminShell } from "@/components/admin/admin-shell";
import { Clock3, Inbox, PackageCheck } from "lucide-react";

export default async function AdminProductsPage() {
  const admin = await requireAdmin();
  const products = await db.product.findMany({ where: { status: "PENDING_REVIEW" }, include: { category: { select: { name: true } }, seller: { select: { id: true, name: true, email: true } }, assets: { select: { id: true, kind: true, fileName: true, mimeType: true, sizeBytes: true, isCover: true } } }, orderBy: { updatedAt: "asc" } });
  return (
    <AdminShell user={admin}>
      <div className="mx-auto max-w-7xl py-2">
        <Link href="/admin" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-primary">
          <span aria-hidden="true">←</span> Admin dashboard
        </Link>
        <header className="mt-6 flex flex-col gap-5 rounded-3xl bg-primary px-6 py-7 text-primary-foreground shadow-sm sm:flex-row sm:items-end sm:justify-between sm:px-8 sm:py-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Marketplace operations</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Product review</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-primary-foreground/75 sm:text-base">
              Review product quality and marketplace readiness. Give sellers clear, actionable feedback when updates are needed.
            </p>
          </div>
          <div className="inline-flex w-fit items-center gap-3 rounded-2xl border border-primary-foreground/15 bg-primary-foreground/5 px-4 py-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent/15 text-accent"><Clock3 className="h-5 w-5" /></span>
            <span>
              <span className="block text-2xl font-semibold tabular-nums">{products.length}</span>
              <span className="block text-xs text-primary-foreground/70">Awaiting review</span>
            </span>
          </div>
        </header>

        <div className="mb-4 mt-8 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">Review queue</h2>
            <p className="mt-1 text-sm text-muted-foreground">Oldest submissions appear first.</p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground">
            <PackageCheck className="h-4 w-4 text-primary" /> {products.length} {products.length === 1 ? "submission" : "submissions"}
          </span>
        </div>

        {products.length ? (
          <div className="space-y-5">
            {products.map((product) => <AdminProductReview key={product.id} product={product} />)}
          </div>
        ) : (
          <section className="rounded-2xl border border-border bg-card px-6 py-14 text-center shadow-sm">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary"><Inbox className="h-7 w-7" /></span>
            <h2 className="mt-4 text-lg font-semibold text-foreground">Your review queue is clear</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              There are no products waiting for review. New seller submissions will appear here.
            </p>
          </section>
        )}
      </div>
    </AdminShell>
  );
}
