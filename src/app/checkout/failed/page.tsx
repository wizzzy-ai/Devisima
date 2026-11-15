import type { Metadata } from "next";
import Link from "next/link";
import { AlertCircle, ArrowRight } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { requireAuth } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Payment Not Completed | Devisima", robots: "noindex" };
type PageProps = { searchParams: Promise<{ reference?: string; reason?: string }> };

export default async function CheckoutFailedPage({ searchParams }: PageProps) {
  const { reference = "", reason = "not-completed" } = await searchParams;
  const safeReference = reference.slice(0, 100);
  await requireAuth(`/checkout/failed${safeReference ? `?reference=${encodeURIComponent(safeReference)}&reason=${encodeURIComponent(reason)}` : ""}`);
  const paymentWasDeclined = reason === "not-completed";
  return <><Navbar /><main className="grid min-h-screen place-items-center bg-background px-4 pb-16 pt-24 sm:px-8"><section className="mx-auto max-w-xl rounded-3xl border border-border bg-card p-7 text-center shadow-sm sm:p-10"><div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-amber-500/10 text-amber-700"><AlertCircle className="h-8 w-8" /></div><p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-primary">Paystack transaction</p><h1 className="mt-2 text-2xl font-bold">{paymentWasDeclined ? "Payment was not completed" : "Payment could not be confirmed"}</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">{paymentWasDeclined ? "No purchase access has been created. Your cart is unchanged, so you can try again when ready." : "We could not verify this payment, so access has not been granted. If Paystack charged you, contact support and provide this reference before trying to pay again."}</p>{safeReference && <p className="mt-4 break-all rounded-lg bg-muted px-3 py-2 font-mono text-xs text-muted-foreground">Reference: {safeReference}</p>}<div className="mt-6 flex flex-wrap justify-center gap-3">{paymentWasDeclined && <Link href="/checkout" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground">Try again <ArrowRight className="h-4 w-4" /></Link>}<Link href="/purchases" className="inline-flex h-11 items-center justify-center rounded-xl border border-border px-5 text-sm font-semibold hover:bg-muted">View purchases</Link><Link href="/contact" className="inline-flex h-11 items-center justify-center rounded-xl border border-border px-5 text-sm font-semibold hover:bg-muted">Contact support</Link></div></section></main><Footer /></>;
}
