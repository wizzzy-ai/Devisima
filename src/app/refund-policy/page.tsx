import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund Policy - Devisima",
  description: "Devisima Refund Policy",
};

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <h1 className="text-4xl font-bold tracking-tight text-foreground mb-4">Devisima Refund Policy</h1>
        <p className="text-muted-foreground mb-8">Effective date: 2026-10-10 | Last updated: 2026-10-10</p>

        <div className="prose prose-sm sm:prose-base max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">1. Introduction</h2>
            <p className="text-muted-foreground">
              This Refund Policy explains how buyers can request refunds for digital products purchased through Devisima.
            </p>
            <p className="text-muted-foreground">
              Digital products may include source code, website templates, software projects, applications, plugins, APIs, UI kits, and other downloadable resources.
            </p>
            <p className="text-muted-foreground">
              Our goal is to handle refund requests fairly, investigate legitimate problems, and protect both buyers and sellers from fraud.
            </p>
            <p className="text-muted-foreground">
              This policy does not remove any consumer rights or remedies that cannot lawfully be excluded under applicable law.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">2. When You May Request a Refund</h2>
            <p className="text-muted-foreground">
              You may request a refund if circumstances justify one, including:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Non-delivery:</strong> Payment was confirmed, but the purchased product was not made available.</li>
              <li><strong>Defective or corrupted files:</strong> The files are damaged or cannot reasonably be accessed as supplied.</li>
              <li><strong>Material misrepresentation:</strong> The product materially differs from its listing or promised contents.</li>
              <li><strong>Undisclosed incompatibility:</strong> The product fails to meet an expressly stated requirement that was material to the purchase.</li>
              <li><strong>Duplicate payment:</strong> You were charged more than once for the same transaction.</li>
              <li><strong>Unauthorized transaction:</strong> A payment appears to have been made without your authorization.</li>
              <li><strong>Other justified circumstances:</strong> A refund or other remedy is required by applicable law or is appropriate under the circumstances.</li>
            </ul>
            <p className="text-muted-foreground">
              A refund request will be assessed using the product listing, license, transaction information, evidence provided, and applicable legal requirements.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">3. When a Refund May Not Be Approved</h2>
            <p className="text-muted-foreground">
              A refund may not be approved solely because:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>You changed your mind after downloading a correctly described digital product.</li>
              <li>You did not review the stated requirements before purchasing.</li>
              <li>You lack the technical knowledge to use a product that meets its description.</li>
              <li>You modified the product or environment in a way that caused the problem.</li>
            </ul>
            <p className="text-muted-foreground">
              These circumstances are not automatic grounds for rejection. The specific facts, seller representations, applicable law, and any non-excludable consumer rights will be considered.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">4. How to Request a Refund</h2>
            <p className="text-muted-foreground">
              To request a refund:
            </p>
            <ol className="list-decimal pl-6 text-muted-foreground space-y-2">
              <li>Sign in to your Devisima account.</li>
              <li>Open <Link href="/purchases" className="font-semibold text-primary hover:underline">Purchases</Link> and select the item.</li>
              <li>Enter a short reason in the refund request section and submit it for review.</li>
              <li>For additional evidence, such as an error message or screenshot, email support with your order reference.</li>
            </ol>
            <p className="text-muted-foreground">
              Submitting the request records it for review; it does not approve or process a payment reversal.
            </p>
            <p className="text-muted-foreground">
              If the self-service option is unavailable, <a href="mailto:support@devisima.app" className="font-semibold text-primary hover:underline">email support</a> with your order reference and a description of the issue.
            </p>
            <p className="text-muted-foreground text-sm">Do not send passwords, full card numbers, or other unnecessary sensitive information.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">5. Review Process</h2>
            <p className="text-muted-foreground">
              Devisima may review:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Payment and order status.</li>
              <li>Product descriptions and promised features.</li>
              <li>Download and delivery records.</li>
              <li>Relevant communications with the seller.</li>
              <li>Technical evidence supplied by the buyer.</li>
              <li>The applicable product license and refund terms.</li>
            </ul>
            <p className="text-muted-foreground">
              We may ask for additional information when reasonably necessary.
            </p>
            <p className="text-muted-foreground">
              A refund request does not guarantee approval. Decisions should be based on the evidence and applicable policy, not solely on whether a download occurred.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">6. Review Time and Communication</h2>
            <p className="text-muted-foreground">
              We aim to acknowledge refund requests within 3 business days and provide updates while the request is being reviewed.
            </p>
            <p className="text-muted-foreground">
              Complex cases, payment-provider investigations, and disputes may take longer.
            </p>
            <p className="text-muted-foreground">
              Devisima should communicate material delays and explain any additional information required.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">7. Refund Processing</h2>
            <p className="text-muted-foreground">
              If a refund is approved, it will generally be returned through the original payment method where possible.
            </p>
            <p className="text-muted-foreground">
              The time required for the funds to appear depends on the payment provider and the financial institution involved.
            </p>
            <p className="text-muted-foreground">
              Devisima may need to verify the original transaction before processing the refund.
            </p>
            <p className="text-muted-foreground">
              A refund should not be marked as completed merely because it was requested or approved internally. Its actual processing status must be recorded accurately.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">8. Partial Refunds and Other Remedies</h2>
            <p className="text-muted-foreground">
              Depending on the circumstances and applicable law, an appropriate resolution may include:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>A full refund.</li>
              <li>A partial refund.</li>
              <li>Correction or replacement of defective files.</li>
              <li>Restoration of access or delivery of missing files.</li>
              <li>Another mutually acceptable remedy.</li>
            </ul>
            <p className="text-muted-foreground">
              Any remedy will be communicated clearly to the affected buyer.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">9. Effect on Digital Access</h2>
            <p className="text-muted-foreground">
              If a refund is completed, Devisima may revoke the associated download entitlement where appropriate and lawful.
            </p>
            <p className="text-muted-foreground">
              Revoking download access does not itself resolve all questions about copies already downloaded or license obligations. Buyers must follow the applicable license and any lawful instructions relating to the refunded product.
            </p>
            <p className="text-muted-foreground">
              Devisima will maintain appropriate records of refunds and access changes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">10. Seller Responsibilities</h2>
            <p className="text-muted-foreground">
              Sellers must provide accurate product descriptions, valid files, and the license rights promised in their listings.
            </p>
            <p className="text-muted-foreground">
              Sellers may be asked to assist with investigating product defects or misrepresentations.
            </p>
            <p className="text-muted-foreground">
              Devisima may adjust seller earnings and payout balances to reflect completed refunds, subject to its seller terms and applicable law.
            </p>
            <p className="text-muted-foreground">
              Sellers must not retaliate against buyers for submitting legitimate refund requests.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">11. Payment Disputes and Chargebacks</h2>
            <p className="text-muted-foreground">
              If you believe a payment was unauthorized or incorrectly processed, contact Devisima and, where appropriate, your payment provider.
            </p>
            <p className="text-muted-foreground">
              Devisima may investigate disputed transactions and provide relevant transaction records to the payment provider as permitted by law.
            </p>
            <p className="text-muted-foreground">
              Submitting a chargeback does not guarantee a particular outcome. Buyers should provide accurate information and avoid duplicate or fraudulent claims.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">12. Fraud and Abuse</h2>
            <p className="text-muted-foreground">
              We may investigate suspected refund fraud, duplicate claims, manipulation, or other abuse.
            </p>
            <p className="text-muted-foreground">
              Where appropriate, we may restrict relevant transactions or accounts while an investigation is conducted.
            </p>
            <p className="text-muted-foreground">
              Any restrictions will be proportionate to the circumstances and subject to applicable law and available review procedures.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">13. Statutory Rights</h2>
            <p className="text-muted-foreground">
              Nothing in this policy limits any rights or remedies available to consumers under applicable Nigerian law or other mandatory laws that apply to a transaction.
            </p>
            <p className="text-muted-foreground">
              Where applicable law provides a stronger right to a refund or another remedy, that law takes precedence over this policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">14. Changes to This Policy</h2>
            <p className="text-muted-foreground">
              We may update this Refund Policy as the marketplace develops or legal requirements change.
            </p>
            <p className="text-muted-foreground">
              Material changes will be communicated where appropriate. The version applicable to a purchase will be assessed with regard to the terms disclosed at the time of purchase and any applicable legal requirements.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">15. Contact Us</h2>
            <p className="text-muted-foreground">
              For refund requests and questions:<br />
              Email: support@devisima.app<br />
              Business name: Devisima Ltd.<br />
              Address: Lagos, Nigeria
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
