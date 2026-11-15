import { requireSeller } from "@/lib/auth/guards";

export default async function SellerRoutePlaceholder({ params }: { params: Promise<{ sellerRoute: string[] }> }) {
  await requireSeller();
  const { sellerRoute } = await params;
  const title = sellerRoute.map((segment) => segment.replace(/-/g, " ")).join(" / ");
  return <main className="mx-auto min-h-screen max-w-5xl px-6 py-24"><p className="text-sm font-semibold uppercase tracking-widest text-primary">Seller workspace</p><h1 className="mt-3 text-3xl font-semibold capitalize">{title}</h1><p className="mt-3 text-muted-foreground">This seller area is protected and will be available in a later phase.</p></main>;
}
