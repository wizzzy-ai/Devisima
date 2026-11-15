"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, LoaderCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

type State = "checking" | "idle" | "pending" | "failed" | "invalid" | "error" | "paid";

export function PaymentVerification({ reference }: { reference: string }) {
  const router = useRouter();
  const [state, setState] = useState<State>(reference ? "idle" : "invalid");
  const [message, setMessage] = useState(reference ? "Check with Paystack again if the status has changed." : "The payment reference is missing.");

  const checkPayment = useCallback(async () => {
    if (!reference) {
      setState("invalid");
      setMessage("The payment reference is missing.");
      return;
    }
    try {
      const response = await fetch("/api/payments/paystack/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reference }) });
      const result = await response.json().catch(() => null) as { status?: string; orderId?: string; message?: string } | null;
      if (result?.status === "paid" && result.orderId) {
        setState("paid");
        router.replace(`/checkout/success?orderId=${encodeURIComponent(result.orderId)}`);
        return;
      }
      if (result?.status === "pending") {
        setState("pending");
        setMessage(result.message || "Paystack is still confirming your payment.");
        return;
      }
      if (result?.status === "failed") {
        setState("failed");
        setMessage(result.message || "This payment was not completed.");
        return;
      }
      setState(response.status === 503 ? "pending" : "invalid");
      setMessage(result?.message || "We could not confirm this payment. If Paystack charged you, contact support with your payment reference.");
    } catch {
      setState("pending");
      setMessage("We couldn’t reach Paystack to confirm the payment. Your access will remain locked until it is verified.");
    }
  }, [reference, router]);

  const verify = useCallback(() => {
    setState("checking");
    setMessage("");
    void checkPayment();
  }, [checkPayment]);

  const checking = state === "checking";
  return (
    <section className="mx-auto max-w-xl rounded-3xl border border-border bg-card p-7 text-center shadow-sm sm:p-10">
      <div className={`mx-auto grid h-16 w-16 place-items-center rounded-2xl ${checking ? "bg-primary/10 text-primary" : state === "failed" ? "bg-destructive/10 text-destructive" : "bg-amber-500/10 text-amber-700"}`}>
        {checking ? <LoaderCircle className="h-8 w-8 animate-spin" /> : state === "failed" ? <AlertCircle className="h-8 w-8" /> : <RefreshCw className="h-7 w-7" />}
      </div>
      <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-primary">Paystack transaction</p>
      <h2 className="mt-2 text-2xl font-bold tracking-tight">{checking ? "Checking your payment" : state === "failed" ? "Payment not completed" : state === "pending" ? "Payment is still processing" : "Payment needs confirmation"}</h2>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{checking ? "We’re securely checking the transaction with Paystack. Please keep this page open." : message}</p>
      {reference && <p className="mt-4 break-all rounded-lg bg-muted px-3 py-2 font-mono text-xs text-muted-foreground">Reference: {reference}</p>}
      {(state === "idle" || state === "pending" || state === "invalid" || state === "error") && <Button type="button" disabled={checking || !reference} onClick={verify} className="mt-6 h-11 rounded-xl bg-primary px-5 font-semibold text-primary-foreground">{checking ? <><LoaderCircle className="mr-2 h-4 w-4 animate-spin" />Checking…</> : <><RefreshCw className="mr-2 h-4 w-4" />Check payment again</>}</Button>}
      <div className="mt-5 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm"><Link href="/purchases" className="font-semibold text-primary hover:underline">View purchases</Link><Link href="/cart" className="font-semibold text-primary hover:underline">Back to cart</Link><Link href="/contact" className="font-semibold text-primary hover:underline">Contact support</Link></div>
      {state === "paid" && <p className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary"><CheckCircle2 className="h-4 w-4" />Payment verified</p>}
    </section>
  );
}
