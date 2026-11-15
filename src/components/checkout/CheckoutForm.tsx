"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, CheckCircle2, LoaderCircle, LockKeyhole, Package, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import SquishSwitch from "@/components/ui/SquishSwitch";
import { formatMarketplaceMoney, MARKETPLACE_CURRENCY } from "@/lib/marketplace/config";

type CheckoutItem = {
  id: string;
  productId: string;
  available: boolean;
  product: { id: string; title: string; slug: string; image: string | null; price: number; productType: string; licenseType: string; seller: { id: string; name: string } };
};
type CheckoutCart = { items: CheckoutItem[]; itemCount: number; unavailableCount: number; subtotal: number; discount: number; total: number; couponCode: string | null };

export function CheckoutForm({ cart, buyer, paymentConfigured }: { cart: CheckoutCart; buyer: { name: string; email: string }; paymentConfigured: boolean }) {
  const router = useRouter();
  const idempotencyKey = useRef<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const canPay = cart.itemCount > 0 && cart.unavailableCount === 0 && acceptedTerms && paymentConfigured;

  async function beginPayment() {
    if (!canPay || pending) return;
    setError("");
    setStatusMessage("");
    setPending(true);
    idempotencyKey.current ??= crypto.randomUUID();
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idempotencyKey: idempotencyKey.current,
          expectedItems: cart.items.filter((item) => item.available).map((item) => ({ productId: item.product.id, price: item.product.price })),
          acceptedTerms,
          couponCode: cart.couponCode ?? undefined,
        }),
      });
      const result = await response.json().catch(() => null) as { authorizationUrl?: string; orderId?: string; alreadyPaid?: boolean; retryable?: boolean; code?: string; message?: string } | null;
      if (response.status === 409 && ["CART_CHANGED", "UNAVAILABLE_PRODUCT", "EMPTY_CART"].includes(result?.code ?? "")) {
        setError(result?.message || "Your cart changed. Review the updated details before paying.");
        setPending(false);
        router.refresh();
        return;
      }
      if (!response.ok) {
        if (response.status === 502 || result?.retryable) idempotencyKey.current = null;
        throw new Error(result?.message || "We could not start your payment. Please try again.");
      }
      if (result?.alreadyPaid && result.orderId) {
        router.replace(`/checkout/success?orderId=${encodeURIComponent(result.orderId)}`);
        return;
      }
      if (!result?.authorizationUrl || !result.authorizationUrl.startsWith("https://checkout.paystack.com/")) throw new Error("Paystack did not return a valid payment page.");
      setStatusMessage("Opening Paystackâ€™s secure payment pageâ€¦");
      window.location.assign(result.authorizationUrl);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "A network error occurred. Try again when you are back online.");
      setPending(false);
    }
  }

  if (!cart.items.length) {
    return <section className="rounded-3xl border border-border bg-card p-8 text-center shadow-sm"><div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary"><Package className="h-8 w-8" /></div><h2 className="mt-4 text-xl font-bold">Your cart is empty</h2><p className="mt-2 text-sm text-muted-foreground">Add a published product before you start checkout.</p><Link href="/marketplace" className="mt-5 inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground">Browse marketplace</Link></section>;
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_370px] lg:gap-8">
      <section className="space-y-5">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6"><p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Buyer information</p><h2 className="mt-1 text-xl font-bold">Your account</h2><div className="mt-4 grid gap-3 sm:grid-cols-2"><div className="rounded-xl bg-muted/70 p-3"><p className="text-xs text-muted-foreground">Name</p><p className="mt-1 break-words text-sm font-semibold text-foreground">{buyer.name}</p></div><div className="rounded-xl bg-muted/70 p-3"><p className="text-xs text-muted-foreground">Email for your receipt</p><p className="mt-1 break-all text-sm font-semibold text-foreground">{buyer.email}</p></div></div></div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Order details</p><h2 className="mt-1 text-xl font-bold">{cart.itemCount} {cart.itemCount === 1 ? "product" : "products"}</h2></div><Link href="/cart" className="text-sm font-semibold text-primary hover:underline">Edit cart</Link></div>
          <div className="mt-4 divide-y divide-border">{cart.items.map((item) => <article key={item.id} className="flex gap-4 py-4 first:pt-0 last:pb-0"><Link href={`/products/${item.product.slug}`} className="relative h-20 w-24 shrink-0 overflow-hidden rounded-xl bg-muted" aria-label={`View ${item.product.title}`}>{item.product.image ? <Image src={item.product.image} alt="" fill unoptimized sizes="96px" className="object-cover" /> : <span className="grid h-full place-items-center text-muted-foreground"><Package className="h-6 w-6" /></span>}</Link><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-2"><Link href={`/products/${item.product.slug}`} className="font-semibold leading-5 hover:text-primary">{item.product.title}</Link><span className="shrink-0 text-sm font-bold">{formatMarketplaceMoney(item.product.price)}</span></div><p className="mt-1 text-xs text-muted-foreground">{item.product.seller.name} Â· {item.product.licenseType.toLowerCase()} license</p>{!item.available && <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-destructive"><AlertTriangle className="h-3.5 w-3.5" />Unavailable. Remove this product from your cart.</p>}</div></article>)}</div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6"><p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Payment method</p><h2 className="mt-1 text-xl font-bold">Paystack</h2><div className="mt-4 flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><ShieldCheck className="h-5 w-5" /></div><div><p className="text-sm font-semibold">Secure payment hosted by Paystack</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Your card and bank details are entered on Paystack. Devisima never receives or stores them.</p></div></div><div className="mt-5 flex items-center justify-between gap-4 text-sm leading-6 text-muted-foreground"><span>I confirm these are the products I want to purchase and agree to their listed licenses.</span><SquishSwitch checked={acceptedTerms} onChange={setAcceptedTerms} ariaLabel="Accept listed product licenses" trackColor="#dce5e2" trackOnColor="#174c43" thumbColor="#ffffff" thumbOnColor="#ffffff" width={76} height={38} radius={19} speed={50} stretch={36} hoverScale={1.035} colorDuration={320} /></div></div>
        {cart.unavailableCount > 0 && <div role="alert" className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm leading-6 text-foreground">Some products are no longer available. Remove them from your cart before paying.</div>}
        {!paymentConfigured && <div role="alert" className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm leading-6 text-foreground">Paystack is not configured yet. Add the server-side Paystack secret key to the deployment environment.</div>}
        {error && <p role="alert" className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
        {statusMessage && <p role="status" className="text-center text-sm text-muted-foreground">{statusMessage}</p>}
      </section>

      <aside className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6 lg:sticky lg:top-6"><p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Order summary</p><h2 className="mt-1 text-xl font-bold">Review and pay</h2><dl className="mt-5 space-y-3 border-y border-border py-5 text-sm"><div className="flex justify-between gap-4 text-muted-foreground"><dt>Subtotal</dt><dd className="font-semibold text-foreground">{formatMarketplaceMoney(cart.subtotal)}</dd></div><div className="flex justify-between gap-4 text-muted-foreground"><dt>Discount</dt><dd className="font-semibold text-foreground">{cart.discount ? `âˆ’${formatMarketplaceMoney(cart.discount)}` : formatMarketplaceMoney(0)}</dd></div><div className="flex justify-between gap-4 pt-1 text-base font-bold"><dt>Total ({MARKETPLACE_CURRENCY})</dt><dd>{formatMarketplaceMoney(cart.total)}</dd></div></dl><Button type="button" disabled={!canPay || pending} onClick={beginPayment} className="mt-5 h-12 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground">{pending ? <><LoaderCircle className="mr-2 h-4 w-4 animate-spin" />Preparing secure paymentâ€¦</> : <><LockKeyhole className="mr-2 h-4 w-4" />Pay {formatMarketplaceMoney(cart.total)} with Paystack</>}</Button><p className="mt-3 text-center text-xs leading-5 text-muted-foreground">Youâ€™ll confirm and pay on Paystackâ€™s secure page. Weâ€™ll verify the payment before granting access.</p><p className="mt-4 flex items-center justify-center gap-1.5 text-xs font-medium text-primary"><CheckCircle2 className="h-4 w-4" />Current database prices, verified server-side</p><Link href="/cart" className="mt-5 flex items-center justify-center gap-1 text-sm font-semibold text-primary hover:underline"><ArrowLeft className="h-3.5 w-3.5" /> Back to cart</Link></aside>
    </div>
  );
}

