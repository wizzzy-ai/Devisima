import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Mail } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";

export const metadata: Metadata = {
  title: "Buyer Help | Devisima",
  description: "Help with Devisima purchases, product licenses, downloads, payments, and refunds.",
};

export default function ResourcesPage() {
  return (
    <>
    <Navbar />
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <header className="relative isolate mb-10 flex min-h-60 flex-col justify-between gap-8 overflow-hidden rounded-[2rem] bg-[#00665f] p-8 text-white sm:p-10 md:flex-row md:items-center">
          <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-36 -z-10 h-80 w-80 rounded-full border-[2.8rem] border-white/15" />
          <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-40 -z-10 h-96 w-96 rounded-full border border-white/10" />
          <div className="relative max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#35D0BA]">Devisima help</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">Buyer guide</h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-white/75">
              Find out how payment confirmation, licenses, protected downloads, and refund requests work.
            </p>
          </div>
        </header>

        <nav aria-label="Help topics" className="mb-10 flex flex-wrap gap-3">
          <a href="#buying" className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-muted">Buying</a>
          <a href="#licenses" className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-muted">Licenses</a>
          <a href="#downloads" className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-muted">Downloads</a>
          <a href="#refunds" className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-muted">Refunds</a>
          <a href="#payments" className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-muted">Payment help</a>
        </nav>

        <div className="space-y-10">
          <section id="buying" className="scroll-mt-8 rounded-2xl border border-border bg-card p-6 sm:p-8">
            <h2 className="text-2xl font-semibold text-foreground">Buying a product</h2>
            <ol className="mt-4 list-decimal space-y-3 pl-5 leading-7 text-muted-foreground">
              <li>Sign in, add products to your cart, and review the items and total.</li>
              <li>Complete checkout through Paystack. The amount and currency are shown before you confirm payment.</li>
              <li>Devisima verifies the payment with the payment provider. A browser redirect or success message alone does not unlock a purchase.</li>
              <li>After verification, open <Link href="/purchases" className="font-semibold text-primary underline-offset-4 hover:underline">Purchases</Link> to view your order and product access.</li>
            </ol>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              If payment is still processing, use the payment page&apos;s check-again option and avoid starting another payment while the first one is unresolved.
            </p>
          </section>

          <section id="licenses" className="scroll-mt-8 rounded-2xl border border-border bg-card p-6 sm:p-8">
            <h2 className="text-2xl font-semibold text-foreground">Product licenses</h2>
            <p className="mt-4 leading-7 text-muted-foreground">
              Each listing identifies a license type, such as Personal, Commercial, or Extended. The label alone is not a complete grant of rights: read the product&apos;s listing and license terms for the permitted uses, restrictions, and any support period before buying.
            </p>
            <p className="mt-3 leading-7 text-muted-foreground">
              If the listing does not explain whether your intended use is allowed, ask the seller before purchase. Keep your order reference and purchase record for future questions.
            </p>
          </section>

          <section id="downloads" className="scroll-mt-8 rounded-2xl border border-border bg-card p-6 sm:p-8">
            <h2 className="text-2xl font-semibold text-foreground">Finding and using downloads</h2>
            <ol className="mt-4 list-decimal space-y-3 pl-5 leading-7 text-muted-foreground">
              <li>Sign in with the account used for the purchase.</li>
              <li>Open <Link href="/purchases" className="font-semibold text-primary underline-offset-4 hover:underline">Purchases</Link>, select the item, and use its download button.</li>
              <li>Download links expire after two minutes and are tied to your account. If one expires, return to the purchase page and request a fresh link.</li>
            </ol>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              Downloads are available only after payment verification. If a paid purchase has no file, or a file is damaged, contact the seller using the listing details and contact Devisima Support if the issue remains unresolved.
            </p>
          </section>

          <section id="refunds" className="scroll-mt-8 rounded-2xl border border-border bg-card p-6 sm:p-8">
            <h2 className="text-2xl font-semibold text-foreground">Refund requests</h2>
            <p className="mt-4 leading-7 text-muted-foreground">
              Open the relevant item in <Link href="/purchases" className="font-semibold text-primary underline-offset-4 hover:underline">Purchases</Link>, explain the issue in the refund request form, and submit it for review. Include useful details such as what went wrong and any relevant error message. Do not send passwords or full card details.
            </p>
            <p className="mt-3 leading-7 text-muted-foreground">
              Submitting a request records it for review; it does not itself approve a refund or reverse a payment. Eligibility and possible outcomes are described in the <Link href="/refund-policy" className="font-semibold text-primary underline-offset-4 hover:underline">Refund Policy</Link>. For updates or help with a request, <Link href="/contact" className="font-semibold text-primary underline-offset-4 hover:underline">contact support</Link> with your order reference.
            </p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              If Paystack confirms a charge but Devisima has not confirmed the purchase, <Link href="/contact" className="font-semibold text-primary underline-offset-4 hover:underline">contact support</Link> with the payment reference before trying to pay again.
            </p>
          </section>

          <section id="payments" className="scroll-mt-8 rounded-2xl border border-border bg-card p-6 sm:p-8">
            <h2 className="text-2xl font-semibold text-foreground">Payment did not complete or is not showing</h2>
            <ul className="mt-4 list-disc space-y-3 pl-5 leading-7 text-muted-foreground">
              <li>For a pending payment, open the payment status page and select <strong>Check payment again</strong>.</li>
              <li>If payment failed, no purchase access is granted; you can return to checkout and try again.</li>
              <li>If your account was charged but the order is missing or still pending, email support with the order or Paystack reference and the approximate payment time.</li>
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/contact" className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
                <Mail className="h-4 w-4" /> Contact support
              </Link>
              <Link href="/seller-guide" className="inline-flex h-11 items-center gap-2 rounded-xl border border-border px-4 text-sm font-semibold hover:bg-muted">
                Seller guide <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </section>
        </div>
      </div>
    </main>
    <Footer />
    </>
  );
}
