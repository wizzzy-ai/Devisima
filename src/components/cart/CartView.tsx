"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { AlertTriangle, ArrowLeft, ArrowRight, Package, ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type CartItem = {
  id: string;
  productId: string;
  createdAt: string;
  available: boolean;
  product: {
    id: string;
    title: string;
    slug: string;
    image: string | null;
    price: number;
    productType: string;
    licenseType: string;
    seller: { id: string; name: string };
  };
};

type CartState = {
  items: CartItem[];
  itemCount: number;
  unavailableCount: number;
  subtotal: number;
  discount: number;
  total: number;
  couponCode: string | null;
};

const money = (amount: number) => `₦${amount.toLocaleString("en-NG")}`;
const label = (value: string) => value.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

export function CartView({ initialCart }: { initialCart: CartState }) {
  const [cart, setCart] = useState(initialCart);
  const [couponInput, setCouponInput] = useState(initialCart.couponCode ?? "");
  const [removing, setRemoving] = useState<string | null>(null);
  const [couponPending, setCouponPending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function removeItem(productId: string) {
    if (removing) return;
    setRemoving(productId);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/cart/items/${encodeURIComponent(productId)}`, { method: "DELETE" });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.message || "Could not remove this item.");
      setCart(result as CartState);
      setMessage(result.message || "Removed from your cart.");
      window.dispatchEvent(new Event("devisima:cart-updated"));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update your cart.");
    } finally {
      setRemoving(null);
    }
  }

  async function applyCoupon(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = couponInput.trim();
    if (!code) {
      setError("Enter a coupon code.");
      return;
    }
    setCouponPending(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/cart/coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.message || "The coupon could not be applied.");
      setCart(result as CartState);
      setCouponInput(result.couponCode ?? "");
      setMessage(result.message || `✓ ${code.toUpperCase()} applied`);
      window.dispatchEvent(new Event("devisima:cart-updated"));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The coupon could not be applied.");
    } finally {
      setCouponPending(false);
    }
  }

  async function removeCoupon() {
    setCouponPending(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/cart/coupon", { method: "DELETE" });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.message || "The coupon could not be removed.");
      setCart(result as CartState);
      setCouponInput("");
      setMessage(result.message || "Coupon removed.");
      window.dispatchEvent(new Event("devisima:cart-updated"));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The coupon could not be removed.");
    } finally {
      setCouponPending(false);
    }
  }

  if (!cart.items.length) {
    return (
      <section className="mx-auto max-w-2xl rounded-[2rem] border border-border bg-card px-6 py-14 text-center shadow-sm sm:px-12">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-[1.7rem] bg-primary/10 text-primary"><ShoppingBag className="h-9 w-9" /></div>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-primary">Your cart</p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground">Your cart is ready for something good</h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">Explore the marketplace and add digital products you want to keep close. Your wishlist stays separate.</p>
        {message && <p role="status" className="mx-auto mt-4 max-w-md rounded-xl bg-primary/5 px-4 py-3 text-sm text-foreground">{message}</p>}
        <Link href="/marketplace" className="mt-7 inline-flex h-12 items-center justify-center rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90">Browse marketplace <ArrowRight className="ml-2 h-4 w-4" /></Link>
      </section>
    );
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8">
      <section className="space-y-4" aria-label="Products in your cart">
        <div className="flex items-end justify-between gap-3"><div><p className="text-sm font-semibold text-primary">Your selection</p><h2 className="mt-1 text-xl font-bold tracking-tight text-foreground">{cart.itemCount} {cart.itemCount === 1 ? "product" : "products"}</h2></div><Link href="/marketplace" className="text-sm font-semibold text-primary underline-offset-4 hover:underline">Continue shopping</Link></div>
        {cart.unavailableCount > 0 && <div role="alert" className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm leading-6 text-foreground"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" /><p><span className="font-semibold">Some products are unavailable.</span> Remove them to resolve your cart. They are excluded from your total.</p></div>}
        {error && <p role="alert" className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
        {message && <p role="status" className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground">{message}</p>}
        {cart.items.map((item) => (
          <article key={item.id} className={`grid gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm sm:grid-cols-[148px_minmax(0,1fr)] sm:gap-5 sm:p-5 ${!item.available ? "border-amber-500/40" : ""}`}>
            <Link href={`/products/${item.product.slug}`} aria-label={`View ${item.product.title}`} className="relative aspect-[1.45/1] overflow-hidden rounded-xl bg-muted sm:aspect-square">
              {item.product.image ? <Image src={item.product.image} alt="" fill unoptimized sizes="(max-width: 640px) 100vw, 148px" className="object-cover" /> : <span className="grid h-full place-items-center text-muted-foreground"><Package className="h-8 w-8" /></span>}
            </Link>
            <div className="flex min-w-0 flex-col">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-semibold text-secondary-foreground">{label(item.product.productType)}</span>{!item.available && <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-[11px] font-semibold text-amber-800">Unavailable</span>}</div><Link href={`/products/${item.product.slug}`} className="mt-2 block break-words text-lg font-bold leading-snug text-foreground hover:text-primary">{item.product.title}</Link><p className="mt-1 text-sm text-muted-foreground">By <Link href={`/sellers/${item.product.seller.id}`} className="font-medium text-foreground underline-offset-4 hover:underline">{item.product.seller.name}</Link></p><p className="mt-1 text-xs text-muted-foreground">{label(item.product.licenseType)} license</p></div>
                <p className="shrink-0 text-lg font-bold tracking-tight text-foreground">{money(item.product.price)}</p>
              </div>
              <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-5">
                <Link href={`/products/${item.product.slug}`} className="text-sm font-semibold text-primary underline-offset-4 hover:underline">View product</Link>
                <Button type="button" variant="ghost" disabled={removing === item.productId} onClick={() => removeItem(item.productId)} aria-label={`Remove ${item.product.title} from cart`} className="h-9 gap-2 rounded-lg px-3 text-sm text-muted-foreground hover:text-destructive">{removing === item.productId ? <span className="animate-pulse">Removing…</span> : <><Trash2 className="h-4 w-4" /> Remove</>}</Button>
              </div>
            </div>
          </article>
        ))}
      </section>

      <aside className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6 lg:sticky lg:top-6">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Order summary</p>
        <h2 className="mt-1 text-xl font-bold tracking-tight text-foreground">Cart total</h2>
        <dl className="mt-5 space-y-3 border-y border-border py-5 text-sm">
          <div className="flex justify-between gap-4 text-muted-foreground"><dt>Subtotal</dt><dd className="font-semibold text-foreground">{money(cart.subtotal)}</dd></div>
          <div className="flex justify-between gap-4 text-muted-foreground"><dt>Discount</dt><dd className="font-semibold text-foreground">{cart.discount ? `−${money(cart.discount)}` : money(0)}</dd></div>
          <div className="flex justify-between gap-4 pt-1 text-base font-bold text-foreground"><dt>Total</dt><dd>{money(cart.total)}</dd></div>
        </dl>

        <form onSubmit={applyCoupon} className="mt-5 space-y-3 rounded-2xl border border-border bg-muted/30 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Have a coupon?</p>
          {cart.couponCode ? (
            <div className="space-y-2">
              <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-800">✓ {cart.couponCode} applied</p>
              <Button type="button" variant="outline" onClick={removeCoupon} disabled={couponPending} className="h-10 w-full rounded-xl text-sm font-semibold">Remove coupon</Button>
            </div>
          ) : (
            <>
              <input value={couponInput} onChange={(event) => setCouponInput(event.target.value)} placeholder="Enter coupon code" className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none ring-0 placeholder:text-muted-foreground focus:border-primary" />
              <Button type="submit" disabled={couponPending} className="h-11 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground">{couponPending ? "Applying…" : "Apply"}</Button>
            </>
          )}
        </form>

        {cart.unavailableCount === 0 ? <Link href="/checkout" className="mt-5 flex h-12 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90">Proceed to checkout <ArrowRight className="ml-2 h-4 w-4" /></Link> : <Button type="button" disabled className="mt-5 h-12 w-full rounded-xl bg-primary font-semibold text-primary-foreground opacity-70">Proceed to checkout</Button>}
        {cart.unavailableCount > 0 && <p className="mt-3 text-center text-xs font-medium text-amber-800">Remove unavailable products to prepare your cart.</p>}
        <Link href="/marketplace" className="mt-4 flex items-center justify-center gap-1 text-sm font-semibold text-primary hover:underline"><ArrowLeft className="h-3.5 w-3.5" /> Continue shopping</Link>
      </aside>
    </div>
  );
}
