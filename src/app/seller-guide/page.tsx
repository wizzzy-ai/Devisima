import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Mail } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";

export const metadata: Metadata = {
  title: "Seller Guide | Devisima",
  description: "How to apply, publish products, understand seller fees, and request payouts on Devisima.",
};

export default function SellerGuidePage() {
  return (
    <>
    <Navbar />
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <Link href="/" className="mb-8 inline-flex items-center gap-2 text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <header className="mb-12">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Devisima seller help</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">Seller guide</h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-muted-foreground">
            A practical overview of seller approval, product review, earnings, fees, payouts, and buyer support.
          </p>
        </header>

        <div className="space-y-10">
          <section id="seller-help" className="scroll-mt-8 rounded-2xl border border-border bg-card p-6 sm:p-8">
            <h2 className="text-2xl font-semibold text-foreground">1. Apply to sell</h2>
            <ol className="mt-4 list-decimal space-y-3 pl-5 leading-7 text-muted-foreground">
              <li>Create and verify your Devisima account, then complete the seller application at <Link href="/seller/apply" className="font-semibold text-primary underline-offset-4 hover:underline">Apply to become a seller</Link>.</li>
              <li>Describe your store and the digital products you plan to offer. Portfolio and technology details help reviewers understand your work.</li>
              <li>Your application remains pending until reviewed. Devisima will notify you when a decision is made; if rejected, you can submit an updated application.</li>
            </ol>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              Approval is required before seller tools are available. Approval does not automatically publish a product.
            </p>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
            <h2 className="text-2xl font-semibold text-foreground">2. Prepare and publish products</h2>
            <ol className="mt-4 list-decimal space-y-3 pl-5 leading-7 text-muted-foreground">
              <li>After approval, create a product listing with accurate descriptions, version, requirements, images, license type, and support information.</li>
              <li>Upload the files buyers should receive and check the listing carefully before submitting it for review.</li>
              <li>Products are reviewed before publication. A submitted product is not publicly available until approved; changes to a published listing may require another review.</li>
            </ol>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              Only upload material you have the right to sell. Keep files maintained and make the listing&apos;s compatibility, included content, and license terms clear.
            </p>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
            <h2 className="text-2xl font-semibold text-foreground">3. Sales, commission, and fees</h2>
            <p className="mt-4 leading-7 text-muted-foreground">
              When a buyer&apos;s payment is verified, the seller ledger records the sale&apos;s gross amount, Devisima commission, and net seller earnings. The commission rate is configured by Devisima and is not a fixed rate published in this guide. Check the current seller terms and your earnings records for the applicable amounts before relying on a projection.
            </p>
            <p className="mt-3 leading-7 text-muted-foreground">
              Checkout shows buyers the payable total before they confirm. Payment-provider or bank charges may also apply under those providers&apos; terms; review the relevant terms and seller records rather than assuming the sale price is the payout amount.
            </p>
            <Link href="/seller/earnings" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
              View seller earnings <ArrowRight className="h-4 w-4" />
            </Link>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
            <h2 className="text-2xl font-semibold text-foreground">4. Requesting a payout</h2>
            <ol className="mt-4 list-decimal space-y-3 pl-5 leading-7 text-muted-foreground">
              <li>Configure and verify a Nigerian bank account in <Link href="/seller/payouts" className="font-semibold text-primary underline-offset-4 hover:underline">Payouts</Link>.</li>
              <li>Wait until earnings are available. Any configured holding period appears in the pending and available balances.</li>
              <li>Request an amount at or above the minimum shown on the payout page. You can request all available funds or a smaller eligible amount.</li>
              <li>Requests are reviewed by an administrator. Requested funds stay reserved while a request is pending or processing; follow its status in payout history.</li>
            </ol>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              The current minimum and available balance are shown in your account because these settings can change. A submitted request is not proof that a transfer has completed; timing depends on review and payment-provider processing.
            </p>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
            <h2 className="text-2xl font-semibold text-foreground">5. Buyer support and refunds</h2>
            <p className="mt-4 leading-7 text-muted-foreground">
              Keep your listing, files, and documentation accurate, and respond constructively to legitimate product questions. Buyers submit refund requests from their purchase details. A request is reviewed against the listing, purchase, and <Link href="/refund-policy" className="font-semibold text-primary underline-offset-4 hover:underline">Refund Policy</Link>; it is not automatically approved when submitted.
            </p>
            <p className="mt-3 leading-7 text-muted-foreground">
              Completed refunds can affect seller earnings and payout balances. Do not retaliate against a buyer for raising a genuine issue. Contact Devisima Support if a buyer report or payment issue needs platform assistance.
            </p>
          </section>

          <section className="rounded-2xl border border-primary/20 bg-primary/5 p-6 sm:p-8">
            <h2 className="text-2xl font-semibold text-foreground">Need help?</h2>
            <p className="mt-3 leading-7 text-muted-foreground">
              Include your store name, product or payout reference, and a short description of the issue. Never email passwords, verification codes, or full bank/card details.
            </p>
            <Link href="/contact" className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
              <Mail className="h-4 w-4" /> Contact support
            </Link>
          </section>
        </div>
      </div>
    </main>
    <Footer />
    </>
  );
}
