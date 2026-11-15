"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { SignInPromptDialog } from "@/components/auth/SignInPromptDialog";
import { Heart } from "lucide-react";

export function WishlistButton({ productId, initialWishlisted, slug, compact = false }: { productId: string; initialWishlisted: boolean; slug: string; compact?: boolean }) {
  const { status } = useSession();
  const router = useRouter();
  const [isWishlisted, setIsWishlisted] = useState(initialWishlisted);
  const [busy, setBusy] = useState(false);
  const [showSignInPrompt, setShowSignInPrompt] = useState(false);
  const [error, setError] = useState("");

  async function toggleWishlist(nextWishlisted: boolean) {
    if (busy) return;
    if (status !== "authenticated") {
      setShowSignInPrompt(true);
      return;
    }
    setError("");
    const previousWishlisted = isWishlisted;
    setIsWishlisted(nextWishlisted);
    setBusy(true);
    try {
      const response = await fetch("/api/wishlist", {
        method: nextWishlisted ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      const result = await response.json().catch(() => null);
      if (response.status === 401) {
        setIsWishlisted(previousWishlisted);
        setShowSignInPrompt(true);
        return;
      }
      if (!response.ok) throw new Error(result?.message || "Could not update your wishlist.");
      setIsWishlisted(Boolean(result?.isWishlisted));
      if (!result?.isWishlisted) router.refresh();
    } catch (error) {
      setIsWishlisted(previousWishlisted);
      setError(error instanceof Error ? error.message : "Could not update your wishlist.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => toggleWishlist(!isWishlisted)}
        disabled={busy}
        className={`${compact ? "grid h-10 w-10 place-items-center rounded-full bg-white shadow-sm" : "flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium"} transition-all disabled:cursor-wait disabled:opacity-60 ${
          isWishlisted
            ? compact ? "text-pink-600" : "border-pink-500 bg-pink-50 text-pink-600"
            : compact ? "text-gray-600 hover:bg-gray-50" : "border-gray-300 bg-white text-gray-600 hover:border-gray-400 hover:bg-gray-50"
        }`}
        aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        aria-pressed={isWishlisted}
      >
        <Heart className={`${compact ? "h-5 w-5" : "h-4 w-4"} ${isWishlisted ? "fill-pink-500" : ""}`} />
        {!compact && (isWishlisted ? "Saved" : "Save")}
      </button>
      {error && <p role="alert" className={`text-xs text-destructive ${compact ? "max-w-40 rounded bg-white px-2 py-1 shadow-sm" : "mt-2"}`}>{error}</p>}
      <SignInPromptDialog open={showSignInPrompt} onClose={() => setShowSignInPrompt(false)} action="save this product to your wishlist" callbackUrl={`/products/${slug}`} />
    </>
  );
}
