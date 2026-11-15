import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/guards";
import { confirmPaystackPayment } from "@/lib/payments/fulfill-order";

export const metadata: Metadata = { title: "Confirming Payment | Devisima", robots: "noindex" };
type PageProps = { searchParams: Promise<{ reference?: string; trxref?: string }> };

export default async function CheckoutCallbackPage({ searchParams }: PageProps) {
  const query = await searchParams;
  const reference = (query.reference || query.trxref || "").slice(0, 100);
  await requireAuth(`/checkout/callback${reference ? `?reference=${encodeURIComponent(reference)}` : ""}`);
  if (!reference) redirect("/checkout/failed?reason=not-verified");
  let result: Awaited<ReturnType<typeof confirmPaystackPayment>>;
  try {
    result = await confirmPaystackPayment(reference);
  } catch {
    redirect(`/checkout/pending?reference=${encodeURIComponent(reference)}`);
  }
  if (result.status === "paid") redirect(`/checkout/success?orderId=${encodeURIComponent(result.orderId)}`);
  if (result.status === "failed") redirect(`/checkout/failed?reference=${encodeURIComponent(reference)}&reason=not-completed`);
  if (result.status === "pending") redirect(`/checkout/pending?reference=${encodeURIComponent(reference)}`);
  redirect(`/checkout/failed?reference=${encodeURIComponent(reference)}&reason=not-verified`);
}
