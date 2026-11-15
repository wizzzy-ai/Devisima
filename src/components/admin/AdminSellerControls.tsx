"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, LoaderCircle, Mail, ShieldCheck, ShieldOff } from "lucide-react";
import SquishSwitch from "@/components/ui/SquishSwitch";

type SellerAction = "SUSPEND" | "REINSTATE" | "RESTRICT_PRODUCT" | "RESTORE_PRODUCT" | "MESSAGE";
type SellerProduct = { id: string; title: string; status: string; restricted: boolean };

export function AdminSellerControls({ sellerId, suspended, products }: {
  sellerId: string;
  suspended: boolean;
  products: SellerProduct[];
}) {
  const router = useRouter();
  const [action, setAction] = useState<SellerAction | null>(null);
  const [reason, setReason] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [productId, setProductId] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const candidates = products.filter((product) => action === "RESTORE_PRODUCT" ? product.restricted : !product.restricted);
  const selectedProduct = candidates.find((product) => product.id === productId);

  function open(nextAction: SellerAction) {
    const nextProducts = products.filter((product) => nextAction === "RESTORE_PRODUCT" ? product.restricted : !product.restricted);
    setAction(nextAction);
    setProductId(nextProducts[0]?.id ?? "");
    setReason("");
    setTitle("");
    setMessage("");
    setConfirmed(false);
    setError("");
    setSuccess("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!action) return;
    setPending(true);
    setError("");
    setSuccess("");
    try {
      const payload = action === "MESSAGE"
        ? { action, title: title.trim(), message: message.trim(), confirm: confirmed }
        : {
            action,
            reason: reason.trim(),
            confirm: confirmed,
            ...(action === "RESTRICT_PRODUCT" || action === "RESTORE_PRODUCT" ? { productId } : {}),
          };
      const response = await fetch(`/api/admin/sellers/${sellerId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => null) as { message?: string } | null;
      if (!response.ok) throw new Error(result?.message ?? "The action could not be completed.");
      setSuccess(result?.message ?? "Action completed.");
      setAction(null);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "A network error occurred. Try again.");
    } finally {
      setPending(false);
    }
  }

  const needsProduct = action === "RESTRICT_PRODUCT" || action === "RESTORE_PRODUCT";
  const valid = confirmed && (action === "MESSAGE"
    ? title.trim().length >= 3 && message.trim().length >= 10
    : reason.trim().length >= 10 && (!needsProduct || Boolean(productId)));
  const actionTitle = action === "SUSPEND" ? "Restrict seller access"
    : action === "REINSTATE" ? "Reinstate seller access"
      : action === "RESTRICT_PRODUCT" ? "Restrict marketplace listing"
        : action === "RESTORE_PRODUCT" ? "Remove product restriction"
          : "Send seller message";

  return (
    <>
      {success && <p role="status" className="mb-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-800">{success}</p>}
      <div className="flex flex-wrap gap-2">
        {suspended ? (
          <button type="button" onClick={() => open("REINSTATE")} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
            <ShieldCheck className="h-4 w-4" /> Reinstate seller
          </button>
        ) : (
          <button type="button" onClick={() => open("SUSPEND")} className="inline-flex items-center gap-2 rounded-xl border border-destructive/30 px-4 py-2.5 text-sm font-semibold text-destructive hover:bg-destructive/5">
            <ShieldOff className="h-4 w-4" /> Restrict seller
          </button>
        )}
        {products.some((product) => !product.restricted) && (
          <button type="button" onClick={() => open("RESTRICT_PRODUCT")} className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted">Restrict a product</button>
        )}
        {products.some((product) => product.restricted) && (
          <button type="button" onClick={() => open("RESTORE_PRODUCT")} className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted">Restore a product</button>
        )}
        <button type="button" onClick={() => open("MESSAGE")} className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted">
          <Mail className="h-4 w-4" /> Message seller
        </button>
      </div>

      {action && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-foreground/50 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget && !pending) setAction(null); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="seller-action-title" className="my-auto w-full max-w-xl rounded-2xl border border-border bg-card shadow-2xl">
            <form onSubmit={submit}>
              <header className="border-b border-border px-5 py-5 sm:px-6">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Seller management</p>
                <h2 id="seller-action-title" className="mt-1 text-xl font-semibold text-foreground">{actionTitle}</h2>
              </header>
              <div className="space-y-4 px-5 py-5 sm:px-6">
                {needsProduct && (
                  <label className="block text-sm font-semibold text-foreground">
                    Product
                    <select value={productId} onChange={(event) => setProductId(event.target.value)} required className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-normal">
                      {candidates.map((product) => <option key={product.id} value={product.id}>{product.title}</option>)}
                    </select>
                  </label>
                )}
                {action === "MESSAGE" ? (
                  <>
                    <label className="block text-sm font-semibold text-foreground">
                      Subject
                      <input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={100} required className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-normal" />
                    </label>
                    <label className="block text-sm font-semibold text-foreground">
                      Message
                      <textarea value={message} onChange={(event) => setMessage(event.target.value)} maxLength={1500} minLength={10} rows={5} required className="mt-2 w-full resize-y rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-normal" />
                    </label>
                    <p className="text-xs text-muted-foreground">The seller will receive this in-app and by email where their preferences allow.</p>
                  </>
                ) : (
                  <label className="block text-sm font-semibold text-foreground">
                    Reason for this action
                    <textarea value={reason} onChange={(event) => setReason(event.target.value)} maxLength={1500} minLength={10} rows={4} required className="mt-2 w-full resize-y rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-normal" placeholder="Explain the decision and next steps for the seller." />
                  </label>
                )}
                {action === "SUSPEND" && <p className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-sm leading-5 text-foreground">Seller tools and listings will be restricted. Their buyer account, past purchases, orders, and financial records remain intact.</p>}
                {action === "RESTRICT_PRODUCT" && selectedProduct && <p className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-sm leading-5 text-foreground">This hides the listing from discovery and prevents new purchases. Existing orders, downloads, and transaction history are not deleted.</p>}
                {action === "RESTORE_PRODUCT" && selectedProduct && selectedProduct.status !== "PUBLISHED" && <p className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-sm leading-5 text-foreground">Removing the restriction will not publish this product. Its current status, {selectedProduct.status.replaceAll("_", " ").toLowerCase()}, will remain unchanged.</p>}
                {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
                <div className="flex items-center justify-between gap-4 rounded-xl border border-border p-3 text-sm leading-5 text-foreground">
                  <span>I reviewed the impact and confirm this administrative action. It will be recorded in the audit history.</span>
                  <SquishSwitch checked={confirmed} onChange={setConfirmed} ariaLabel="Confirm administrative action" trackColor="#dce5e2" trackOnColor="#174c43" thumbColor="#ffffff" thumbOnColor="#ffffff" width={76} height={38} radius={19} speed={50} stretch={36} hoverScale={1.035} colorDuration={320} />
                </div>
              </div>
              <footer className="flex flex-col-reverse gap-2 border-t border-border px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
                <button type="button" disabled={pending} onClick={() => setAction(null)} className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted disabled:opacity-60">Cancel</button>
                <button type="submit" disabled={pending || !valid} className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 ${action === "SUSPEND" || action === "RESTRICT_PRODUCT" ? "bg-destructive hover:bg-destructive/90" : "bg-primary hover:bg-primary/90"}`}>
                  {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />}
                  Confirm action
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </>
  );
}

