import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ArrowRight, Package, Plus, Search } from "lucide-react";
import { requireSeller } from "@/lib/auth/guards";
import { db } from "@/lib/db/prisma";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ProductActions } from "@/components/seller/ProductActions";
import { WebsitePreview } from "@/components/marketplace/website-preview";

export default async function SellerProductsPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; categoryId?: string; sort?: string; page?: string }> }) {
  const user = await requireSeller();
  if (user.role !== "SELLER" || user.status !== "ACTIVE") redirect("/forbidden");
  const params = await searchParams;
  const q = params.q?.trim().slice(0, 100) || "";
  const status = params.status;
  const categoryId = params.categoryId || "";
  const sort = params.sort || "updated";
  const page = Math.max(1, Number(params.page) || 1);
  const where = { sellerId: user.id, ...(q ? { OR: [{ title: { contains: q, mode: "insensitive" as const } }, { shortDescription: { contains: q, mode: "insensitive" as const } }] } : {}), ...(categoryId ? { categoryId } : {}), ...(status && ["DRAFT", "PENDING_REVIEW", "PUBLISHED", "REJECTED", "CHANGES_REQUESTED", "ARCHIVED"].includes(status) ? { status: status as "DRAFT" | "PENDING_REVIEW" | "PUBLISHED" | "REJECTED" | "CHANGES_REQUESTED" | "ARCHIVED" } : {}) };
  const orderBy = sort === "name" ? { title: "asc" as const } : sort === "price" ? { price: "asc" as const } : sort === "sales" ? { totalSales: "desc" as const } : { updatedAt: "desc" as const };
  const [products, total, categories, statusCounts] = await Promise.all([
    db.product.findMany({ where, include: { category: { select: { name: true } }, assets: { where: { kind: "IMAGE" }, orderBy: [{ isCover: "desc" }, { createdAt: "asc" }], take: 1, select: { id: true } } }, orderBy, skip: (page - 1) * 12, take: 12 }),
    db.product.count({ where }),
    db.category.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.product.groupBy({ by: ["status"], where: { sellerId: user.id }, _count: { _all: true } }),
  ]);
  const count = (key: string) => statusCounts.find((item) => item.status === key)?._count._all ?? 0;
  const stats = [
    ["All products", statusCounts.reduce((n, x) => n + x._count._all, 0), "bg-muted"],
    ["Published", count("PUBLISHED"), "bg-accent/20"],
    ["In review", count("PENDING_REVIEW"), "bg-accent/20"],
    ["Drafts", count("DRAFT"), "bg-muted"],
    ["Needs attention", count("REJECTED") + count("CHANGES_REQUESTED"), "bg-destructive/10"],
  ];
  const totalPages = Math.max(1, Math.ceil(total / 12));
  const pageHref = (nextPage: number) => `?q=${encodeURIComponent(q)}&status=${status || ""}&categoryId=${categoryId}&sort=${sort}&page=${nextPage}`;

  return <DashboardShell user={user}><div className="mx-auto max-w-7xl py-2">
    <section className="relative isolate overflow-hidden rounded-[2rem] bg-primary px-6 py-8 text-primary-foreground sm:px-10 sm:py-10">
      <div className="pointer-events-none absolute -right-20 -top-36 -z-10 h-80 w-80 rounded-full border-[40px] border-border/20" />
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Seller studio <span className="mx-2 text-primary-foreground/30">/</span> Your catalog</p><h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">My products</h1><p className="mt-3 max-w-xl text-sm leading-6 text-primary-foreground/70">Keep your listings tidy, track what’s live, and see what needs a little attention.</p></div><Link href="/seller/products/new" className="flex w-fit items-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-bold text-accent-foreground transition hover:bg-accent/90"><Plus className="h-4 w-4" /> Add a product</Link></div>
    </section>

    <div className="my-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">{stats.map(([name, value, tint]) => <div key={name} className="rounded-2xl border border-border bg-card p-4 sm:p-5"><div className="flex items-center justify-between"><p className="text-sm font-medium text-muted-foreground">{name}</p><span className={`h-3 w-3 rounded-full ${tint}`} /></div><p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">{value}</p></div>)}</div>
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Listing management</p><h2 className="mt-1 text-xl font-semibold tracking-tight text-foreground">Your listings</h2></div><p className="text-sm text-muted-foreground">{total} result{total === 1 ? "" : "s"}</p></div>

    <form className="mb-5 grid gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_180px_180px_180px_auto] sm:p-5">
      <label className="relative block"><span className="sr-only">Search products</span><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input name="q" defaultValue={q} placeholder="Search your products" className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-3 text-sm outline-none focus:border-primary border-border focus:ring-4 focus:ring-primary/10" /></label>
      <select name="status" defaultValue={status || ""} aria-label="Filter by status" className="rounded-xl border border-border bg-background px-3 py-3 text-sm text-foreground"><option value="">Every status</option>{["DRAFT", "PENDING_REVIEW", "PUBLISHED", "REJECTED", "CHANGES_REQUESTED", "ARCHIVED"].map((s) => <option key={s} value={s}>{s.replaceAll("_", " ")}</option>)}</select>
      <select name="categoryId" defaultValue={categoryId} aria-label="Filter by category" className="rounded-xl border border-border bg-background px-3 py-3 text-sm text-foreground"><option value="">Every category</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
      <select name="sort" defaultValue={sort} aria-label="Sort products" className="rounded-xl border border-border bg-background px-3 py-3 text-sm text-foreground"><option value="updated">Recently updated</option><option value="name">Name</option><option value="price">Price</option><option value="sales">Sales</option></select>
      <button className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90">Apply filters</button>
    </form>

    {products.length === 0 ? <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center"><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted"><Package className="h-6 w-6 text-foreground" /></span><h3 className="mt-4 text-lg font-semibold text-foreground">No products found</h3><p className="mt-2 text-sm text-muted-foreground">Try another search or clear your filters to see your full catalog.</p><Link href="/seller/products" className="mt-5 inline-flex rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">Clear filters</Link></div> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{products.map((p) => <article key={p.id} className="overflow-hidden rounded-2xl border border-border bg-card transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative aspect-[1.8/1] bg-muted">{p.demoUrl ? <WebsitePreview siteUrl={p.demoUrl} title={p.title} fallbackSrc={p.assets[0] ? `/api/products/assets/${p.assets[0].id}` : undefined} className="h-full w-full object-cover" /> : p.assets[0] ? <img src={`/api/products/assets/${p.assets[0].id}`} alt={p.title} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-sm font-medium text-muted-foreground">Product preview</div>}<span className="absolute left-3 top-3 rounded-full bg-card/90 px-3 py-1 text-xs font-semibold text-foreground">{p.category.name}</span><StatusBadge status={p.status} /></div>
      <div className="p-5"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="truncate font-semibold text-foreground">{p.title}</h3><p className="mt-1 line-clamp-2 min-h-10 text-sm leading-5 text-muted-foreground">{p.shortDescription}</p></div><p className="shrink-0 text-sm font-bold text-foreground">₦{p.price.toLocaleString()}</p></div><div className="mt-4 grid grid-cols-3 gap-2 border-y border-border py-3 text-xs"><div><p className="text-muted-foreground">Version</p><p className="mt-1 font-semibold text-foreground">{p.version}</p></div><div><p className="text-muted-foreground">Sales</p><p className="mt-1 font-semibold text-foreground">{p.totalSales}</p></div><div><p className="text-muted-foreground">Updated</p><p className="mt-1 font-semibold text-foreground">{p.updatedAt.toLocaleDateString()}</p></div></div>{p.moderationNotes && <p className="mt-3 rounded-xl bg-destructive/10 p-3 text-xs leading-5 text-destructive">{p.moderationNotes}</p>}<div className="mt-4"><ProductActions id={p.id} slug={p.slug} status={p.status} /></div></div>
    </article>)}</div>}

    <div className="mt-5 flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-sm"><span className="text-muted-foreground">Page {page} of {totalPages}</span><div className="flex gap-2">{page > 1 && <Link className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 font-medium text-foreground" href={pageHref(page - 1)}><ArrowLeft className="h-4 w-4" /> Previous</Link>}{page < totalPages && <Link className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-2 font-medium text-primary-foreground" href={pageHref(page + 1)}>Next <ArrowRight className="h-4 w-4" /></Link>}</div></div>
  </div></DashboardShell>;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = { PUBLISHED: "bg-accent/20 text-primary", PENDING_REVIEW: "bg-accent/20 text-muted-foreground", DRAFT: "bg-muted text-muted-foreground", REJECTED: "bg-destructive/10 text-destructive", CHANGES_REQUESTED: "bg-destructive/10 text-destructive", ARCHIVED: "bg-muted text-foreground" };
  const label = status.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
  return <span className={`absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-semibold ${styles[status] || "bg-card text-foreground"}`}>{label}</span>;
}
