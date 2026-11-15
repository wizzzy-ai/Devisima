import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CartView } from "@/components/cart/CartView";
import { requireAuth } from "@/lib/auth/guards";
import { getCartSnapshot } from "@/lib/cart";

export const metadata: Metadata = { title: "Your Cart | Devisima", description: "Review the digital products in your cart.", robots: "noindex" };

export default async function CartPage() {
  const user = await requireAuth("/cart");
  if (user.status !== "ACTIVE") redirect("/forbidden");
  const cart = await getCartSnapshot(user.id);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background px-4 pb-16 pt-24 text-foreground sm:px-8 sm:pt-28">
        <div className="mx-auto max-w-7xl">
          <Link href="/marketplace" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"><ArrowLeft className="h-4 w-4" /> Back to marketplace</Link>
          <header className="mb-7 mt-5 flex items-center gap-4 sm:mb-9"><div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary"><ShoppingCart className="h-6 w-6" /></div><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Buyer space</p><h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Your cart</h1><p className="mt-1 text-sm text-muted-foreground">Review products and their current prices.</p></div></header>
          <CartView initialCart={cart} />
        </div>
      </main>
      <Footer />
    </>
  );
}
