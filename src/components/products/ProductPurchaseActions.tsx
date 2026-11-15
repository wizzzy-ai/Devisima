"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { SignInPromptDialog } from "@/components/auth/SignInPromptDialog";
import Link from "next/link";
import { BadgeCheck, Download } from "lucide-react";

export function ProductPurchaseActions({ productId, ownedPurchaseId }: { productId: string; ownedPurchaseId?: string }) {
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [prompt, setPrompt] = useState("");
  const [notice, setNotice] = useState("");
  const [adding, setAdding] = useState(false);

  if (ownedPurchaseId) return <div className="grid gap-3"><p className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-[#0F4C5C]"><BadgeCheck className="h-4 w-4" />Purchased</p><Link href={`/purchases/${ownedPurchaseId}`} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground"><Download className="h-4 w-4" />View purchase &amp; download</Link></div>;

  async function addToCart(goToCheckout = false) {
    setNotice("");
    if (status !== "authenticated") {
      setPrompt("add this product to your cart");
      return;
    }
    if (adding) return;
    setAdding(true);
    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      const result = await response.json().catch(() => null);
      if (response.status === 401) {
        setPrompt("add this product to your cart");
        return;
      }
      if (!response.ok) throw new Error(result?.message || "Could not add this product to your cart.");
      setNotice(result?.message || "Added to your cart.");
      window.dispatchEvent(new Event("devisima:cart-updated"));
      if (goToCheckout) router.push("/checkout");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not update your cart.");
    } finally {
      setAdding(false);
    }
  }

  function handleBuyNow() {
    setNotice("");
    if (status !== "authenticated") {
      setPrompt("buy this product");
      return;
    }
    void addToCart(true);
  }

  return (
    <>
      <div className="grid gap-3">
        <Button type="button" variant="default" size="lg" disabled={adding} onClick={() => { void addToCart(); }} className="h-12 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground">{adding ? "Adding…" : "Add to cart"}</Button>
        <Button type="button" variant="outline" size="lg" disabled={adding} onClick={handleBuyNow} className="h-12 w-full rounded-xl text-sm font-semibold">{adding ? "Preparing checkout…" : "Buy now"}</Button>
      </div>
      {notice && <p className="mt-3 rounded-xl bg-muted px-3 py-2 text-center text-xs leading-5 text-muted-foreground" role="status">{notice}</p>}
      <SignInPromptDialog open={Boolean(prompt)} onClose={() => setPrompt("")} action={prompt} callbackUrl={pathname} />
    </>
  );
}
