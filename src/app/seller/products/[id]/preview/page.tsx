import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireSeller } from "@/lib/auth/guards";
import { db } from "@/lib/db/prisma";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Check } from "lucide-react";
import { formatProductListItems } from "@/lib/products/list-format";

export default async function SellerProductPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireSeller();
  if (user.role !== "SELLER" || user.status !== "ACTIVE") redirect("/forbidden");
  const { id } = await params;
  const product = await db.product.findFirst({ where: { id, sellerId: user.id }, include: { category: { select: { name: true } }, assets: { where: { kind: "IMAGE" }, orderBy: [{ isCover: "desc" }, { createdAt: "asc" }] } } });
  if (!product) notFound();
  const features = formatProductListItems(product.features);
  const requirements = formatProductListItems(product.requirements);
  return <DashboardShell user={user}>
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Private preview · {product.status.replaceAll("_", " ")}</p><h1 className="mt-1 text-2xl font-bold">{product.title}</h1></div>
        <Link className="rounded-lg border border-border px-4 py-2 text-sm font-semibold" href={`/seller/products/${id}/edit`}>Continue editing</Link>
      </div>
      <article className="grid gap-8 rounded-2xl border border-border bg-card p-5 sm:p-6 md:grid-cols-2">
        {product.assets[0] ? <img src={`/api/products/assets/${product.assets[0].id}`} alt={product.title} className="aspect-[4/3] w-full rounded-xl object-cover" /> : <div className="aspect-[4/3] rounded-xl bg-muted" />}
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">{product.category.name}</p>
          <h2 className="mt-2 text-3xl font-bold">{product.title}</h2>
          <p className="mt-3 text-muted-foreground">{product.shortDescription}</p>
          <p className="mt-5 text-2xl font-bold">₦{product.price.toLocaleString()}</p>
          <p className="mt-1 text-sm text-muted-foreground">Version {product.version} · {product.licenseType} license</p>
          <h3 className="mt-7 font-semibold">Description</h3>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{product.description}</p>
          {product.demoUrl && <a href={product.demoUrl} target="_blank" rel="noreferrer" className="mt-5 inline-block underline">Open demo</a>}
        </div>
        <div className="grid gap-7 md:col-span-2 sm:grid-cols-2">
          <section>
            <h3 className="font-semibold">Features</h3>
            {features.length ? <ul className="mt-3 grid gap-2">{features.map((feature, index) => <li key={`${index}-${feature}`} className="flex items-start gap-3 rounded-xl border border-border bg-background p-3 text-sm leading-6 text-foreground"><Check className="mt-1 h-4 w-4 shrink-0 text-primary" /><span className="min-w-0 whitespace-pre-wrap break-words">{feature}</span></li>)}</ul> : <p className="mt-2 text-sm text-muted-foreground">None added</p>}
          </section>
          <section>
            <h3 className="font-semibold">Requirements</h3>
            {requirements.length ? <ul className="mt-3 grid gap-2">{requirements.map((requirement, index) => <li key={`${index}-${requirement}`} className="flex items-start gap-3 rounded-xl bg-muted/50 p-3 text-sm leading-6 text-muted-foreground"><span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-accent" /><span className="min-w-0 whitespace-pre-wrap break-words">{requirement}</span></li>)}</ul> : <p className="mt-2 text-sm text-muted-foreground">None added</p>}
          </section>
          <section><h3 className="font-semibold">Technologies</h3><div className="mt-2 flex flex-wrap gap-2">{product.technologies.length ? product.technologies.map((item, index) => <span key={`${index}-${item}`} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">{item}</span>) : <span className="text-sm text-muted-foreground">None added</span>}</div></section>
          <section><h3 className="font-semibold">Tags</h3><div className="mt-2 flex flex-wrap gap-2">{product.tags.length ? product.tags.map((item, index) => <span key={`${index}-${item}`} className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">{item}</span>) : <span className="text-sm text-muted-foreground">None added</span>}</div></section>
        </div>
      </article>
    </div>
  </DashboardShell>;
}
