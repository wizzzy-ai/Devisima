import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Mail } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";

export const metadata: Metadata = {
  title: "Contact Support | Devisima",
  description: "Get help with Devisima orders, payments, downloads, refunds, and seller accounts.",
};

export default function ContactPage() {
  return (
    <>
    <Navbar />
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <Link href="/" className="mb-8 inline-flex items-center gap-2 text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <header className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">We&apos;re here to help</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">Contact support</h1>
          <p className="mt-4 text-lg leading-8 text-muted-foreground">
            For order, payment, download, refund, or seller-account problems, email Devisima Support with enough detail for us to find the issue.
          </p>
        </header>

        <section className="mt-8 rounded-2xl border border-border bg-card p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-foreground">Email Devisima Support</h2>
          <p className="mt-3 leading-7 text-muted-foreground">
            Include the email address on your account, the order or Paystack reference when relevant, and what happened. For a payment that appears charged but is not confirmed, include the approximate time of payment and do not pay again until the first attempt has been checked.
          </p>
          <a
            href="mailto:support@devisima.app?subject=Devisima%20support%20request"
            className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <Mail className="h-4 w-4" /> support@devisima.app
          </a>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            Never send passwords, one-time verification codes, full card numbers, or full bank account details by email.
          </p>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-3">
          <Link href="/resources#payments" className="group rounded-2xl border border-border bg-card p-5 hover:border-primary/40">
            <h2 className="font-semibold text-foreground">Payment help</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">What to do when checkout is pending, failed, or missing from your purchases.</p>
            <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary">Read buyer help <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
          </Link>
          <Link href="/purchases" className="group rounded-2xl border border-border bg-card p-5 hover:border-primary/40">
            <h2 className="font-semibold text-foreground">Purchases and downloads</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Open a verified purchase, download files, or submit a refund request.</p>
            <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary">Go to purchases <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
          </Link>
          <Link href="/refund-policy" className="group rounded-2xl border border-border bg-card p-5 hover:border-primary/40">
            <h2 className="font-semibold text-foreground">Refund policy</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Review eligibility, what to include, and how refund requests are considered.</p>
            <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary">Read policy <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
          </Link>
        </section>
      </div>
    </main>
    <Footer />
    </>
  );
}
