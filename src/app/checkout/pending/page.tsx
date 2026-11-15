import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PaymentVerification } from "@/components/checkout/PaymentVerification";
import { requireAuth } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Payment Processing | Devisima", robots: "noindex" };
type PageProps = { searchParams: Promise<{ reference?: string }> };

export default async function CheckoutPendingPage({ searchParams }: PageProps) {
  const { reference = "" } = await searchParams;
  const safeReference = reference.slice(0, 100);
  await requireAuth(`/checkout/pending${safeReference ? `?reference=${encodeURIComponent(safeReference)}` : ""}`);
  return <><Navbar /><main className="grid min-h-screen place-items-center bg-background px-4 pb-16 pt-24 sm:px-8"><PaymentVerification reference={safeReference} /></main><Footer /></>;
}
