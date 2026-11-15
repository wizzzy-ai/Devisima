"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Product, ProductAsset, User, Category } from "@prisma/client";
import { AlertCircle, Check, Download, FileArchive, Image as ImageIcon, LoaderCircle, Tag, UserRound, X } from "lucide-react";

type ReviewProduct = Product & {
  category: Pick<Category, "name">;
  seller: Pick<User, "id" | "name" | "email">;
  assets: Pick<ProductAsset, "id" | "kind" | "fileName" | "mimeType" | "sizeBytes" | "isCover">[];
};

export function AdminProductReview({ product }: { product: ReviewProduct }) {
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pendingDecision, setPendingDecision] = useState<"APPROVE" | "REJECT" | "REQUEST_CHANGES" | null>(null);

  async function decide(decision: "APPROVE" | "REJECT" | "REQUEST_CHANGES") {
    if (decision !== "APPROVE" && notes.trim().length < 5) {
      setIsError(true);
      setMessage("Add at least 5 characters of feedback before requesting changes or rejecting.");
      document.getElementById(`product-feedback-${product.id}`)?.focus();
      return;
    }

    setBusy(true);
    setPendingDecision(decision);
    setMessage("");
    setIsError(false);
    try {
      const response = await fetch(`/api/admin/products/${product.id}/review`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ decision, notes }),
      });
      const data = await response.json().catch(() => null) as { message?: string } | null;
      if (!response.ok) throw new Error(data?.message || "Review could not be saved.");
      router.refresh();
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "A network error occurred. Please try again.");
    } finally {
      setBusy(false);
      setPendingDecision(null);
    }
  }

  const cover = product.assets.find((asset) => asset.kind === "IMAGE" && asset.isCover)
    ?? product.assets.find((asset) => asset.kind === "IMAGE");

  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <header className="flex flex-col gap-4 border-b border-border px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div className="flex min-w-0 gap-4">
          <div className="hidden h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary sm:grid">
            <ImageIcon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold tracking-tight text-foreground">{product.title}</h2>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-600" /> Pending review
              </span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><Tag className="h-3.5 w-3.5" />{product.category.name}</span>
              <span>₦{product.price.toLocaleString()}</span>
              <span>Version {product.version}</span>
              <span>{product.productType.replaceAll("_", " ").toLowerCase()}</span>
            </div>
            <p className="mt-2 flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
              <UserRound className="h-4 w-4 shrink-0" />
              <span className="font-medium text-foreground">{product.seller.name}</span>
              <span className="break-all">{product.seller.email}</span>
            </p>
          </div>
        </div>
      </header>

      <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.72fr)]">
        <section className="min-w-0">
          <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Product description</h3>
          <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-foreground">{product.description}</p>

          <div className="mt-6">
            <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Submission files</h3>
            {product.assets.length ? (
              <ul className="mt-3 space-y-2">
                {product.assets.map((asset) => (
                  <li key={asset.id} className="flex flex-col gap-3 rounded-xl border border-border bg-muted/30 p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-background text-primary">
                        {asset.kind === "IMAGE" ? <ImageIcon className="h-4 w-4" /> : <FileArchive className="h-4 w-4" />}
                      </span>
                      <span className="min-w-0">
                        <span className="block break-all text-sm font-semibold text-foreground">
                          {asset.isCover ? "Cover · " : ""}{asset.fileName}
                        </span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {asset.kind === "IMAGE" ? "Product image" : "Private product file"} · {(asset.sizeBytes / 1024 / 1024).toFixed(1)} MB
                        </span>
                      </span>
                    </div>
                    {asset.kind === "FILE" && (
                      <a
                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-primary transition hover:bg-primary/5"
                        href={`/api/admin/products/${product.id}/assets/${asset.id}`}
                      >
                        <Download className="h-3.5 w-3.5" /> Download privately
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 rounded-xl border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">No product files were attached.</p>
            )}
          </div>
        </section>

        <aside className="space-y-5">
          <section className="overflow-hidden rounded-xl border border-border bg-muted/20">
            <div className="border-b border-border px-4 py-3">
              <h3 className="text-sm font-semibold text-foreground">Marketplace preview</h3>
              <p className="mt-1 text-xs text-muted-foreground">Cover image used on the product listing</p>
            </div>
            {cover ? (
              <div className="relative aspect-[16/10] bg-muted">
                <Image
                  src={`/api/products/assets/${cover.id}`}
                  alt={`${product.title} cover`}
                  fill
                  unoptimized
                  sizes="(max-width: 1024px) 100vw, 36vw"
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="grid aspect-[16/10] place-items-center bg-muted/60 px-5 text-center">
                <div>
                  <ImageIcon className="mx-auto h-8 w-8 text-muted-foreground/60" />
                  <p className="mt-2 text-sm font-medium text-foreground">No cover image</p>
                  <p className="mt-1 text-xs text-muted-foreground">Review the live demo or request a cover image from the seller.</p>
                </div>
              </div>
            )}
          </section>

          <section className="rounded-xl border border-border bg-card p-4">
            <label htmlFor={`product-feedback-${product.id}`} className="block text-sm font-semibold text-foreground">
              Feedback to seller
              <span className="mt-1 block text-xs font-normal leading-5 text-muted-foreground">
                Required for a rejection or change request; be specific and actionable.
              </span>
            </label>
            <textarea
              id={`product-feedback-${product.id}`}
              className="mt-3 min-h-32 w-full resize-y rounded-xl border border-border bg-background px-3 py-2.5 text-sm leading-6 text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:opacity-60"
              value={notes}
              onChange={(event) => {
                setNotes(event.target.value);
                if (isError) {
                  setIsError(false);
                  setMessage("");
                }
              }}
              maxLength={3000}
              placeholder="Explain what needs to change or why the product cannot be published…"
              disabled={busy}
            />
            <div className="mt-1 flex items-center justify-between gap-3 text-xs">
              <span className={notes.trim().length > 0 && notes.trim().length < 5 ? "text-amber-700" : "text-muted-foreground"}>
                {notes.trim().length < 5 ? "Add at least 5 characters to request changes or reject." : "Feedback is ready for a change request or rejection."}
              </span>
              <span className="shrink-0 text-muted-foreground">{notes.length}/3000</span>
            </div>
            {message && (
              <p role={isError ? "alert" : "status"} className={`mt-3 flex items-start gap-2 rounded-lg px-3 py-2 text-sm leading-5 ${isError ? "border border-destructive/20 bg-destructive/5 text-destructive" : "bg-primary/5 text-primary"}`}>
                {isError && <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />}
                {message}
              </p>
            )}
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => void decide("APPROVE")}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-2"
              >
                {pendingDecision === "APPROVE" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                {pendingDecision === "APPROVE" ? "Approving…" : "Approve and publish"}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void decide("REQUEST_CHANGES")}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 text-sm font-semibold text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
              >
                {pendingDecision === "REQUEST_CHANGES" && <LoaderCircle className="h-4 w-4 animate-spin" />}
                {pendingDecision === "REQUEST_CHANGES" ? "Sending request…" : "Request changes"}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void decide("REJECT")}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-destructive/30 bg-card px-3 py-2.5 text-sm font-semibold text-destructive transition hover:bg-destructive/5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {pendingDecision === "REJECT" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                {pendingDecision === "REJECT" ? "Rejecting…" : "Reject"}
              </button>
            </div>
            <p className="mt-3 text-xs leading-5 text-muted-foreground">
              Product decisions are sent to the seller in-app and by email.
            </p>
          </section>
        </aside>
      </div>
    </article>
  );
}
