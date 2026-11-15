import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service - Devisima",
  description: "Devisima Terms of Service",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <h1 className="text-4xl font-bold tracking-tight text-foreground mb-4">Devisima Terms of Service</h1>
        <p className="text-muted-foreground mb-8">Effective date: 2026-10-10 | Last updated: 2026-10-10</p>

        <div className="prose prose-sm sm:prose-base max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">1. Introduction</h2>
            <p className="text-muted-foreground">
              Welcome to Devisima (&quot;Devisima&quot;, &quot;we&quot;, &quot;our&quot;, or &quot;us&quot;). Devisima is a digital marketplace where users can discover, purchase, sell, and access digital products, software projects, website templates, applications, APIs, UI kits, and other digital resources.
            </p>
            <p className="text-muted-foreground">
              These Terms of Service govern your access to and use of the Devisima website, marketplace, account services, seller tools, payment features, downloads, and related services.
            </p>
            <p className="text-muted-foreground">
              By creating an account or using Devisima, you agree to these Terms. If you do not agree, you should not use the services.
            </p>
            <p className="text-muted-foreground">
              Platform operator: Devisima Ltd.<br />
              Business address: Lagos, Nigeria<br />
              Contact email: support@devisima.app
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">2. Eligibility and Accounts</h2>
            <p className="text-muted-foreground">
              You must provide accurate information when creating an account and keep your account details up to date.
            </p>
            <p className="text-muted-foreground">
              You are responsible for protecting your login credentials and for activities carried out through your account, subject to applicable law.
            </p>
            <p className="text-muted-foreground">
              You must not:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Create accounts using false or misleading information.</li>
              <li>Impersonate another person or business.</li>
              <li>Share, sell, or transfer your account without authorization.</li>
              <li>Attempt to access another user&apos;s account or private information.</li>
              <li>Use Devisima for fraudulent, unlawful, or deceptive activities.</li>
            </ul>
            <p className="text-muted-foreground">
              We may restrict access to an account when reasonably necessary to investigate suspected fraud, protect users, enforce these Terms, or comply with legal obligations. Where appropriate, we will provide notice and an opportunity to challenge the decision.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">3. Marketplace Services</h2>
            <p className="text-muted-foreground">
              Devisima provides a platform for discovering and purchasing digital products and for eligible sellers to offer their products.
            </p>
            <p className="text-muted-foreground">
              Products may include software projects, templates, source code, applications, APIs, plugins, UI kits, and business systems.
            </p>
            <p className="text-muted-foreground">
              Product descriptions, prices, features, requirements, licenses, and support terms should be reviewed before purchase.
            </p>
            <p className="text-muted-foreground">
              We aim to provide accurate product information, but we cannot guarantee that every third-party product will be suitable for every user&apos;s needs. Sellers remain responsible for the accuracy of their listings and for the products they offer, subject to applicable law.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">4. Buyer Responsibilities</h2>
            <p className="text-muted-foreground">
              When purchasing a product, you agree to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Review the product description, compatibility requirements, license, and included files.</li>
              <li>Provide accurate checkout information.</li>
              <li>Use legitimate payment methods.</li>
              <li>Follow the applicable product license.</li>
              <li>Keep purchased files and account credentials secure.</li>
              <li>Avoid redistributing, reselling, or sharing products unless the license expressly permits it.</li>
            </ul>
            <p className="text-muted-foreground">
              Purchasing a product does not automatically transfer ownership of its intellectual property.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">5. Seller Responsibilities</h2>
            <p className="text-muted-foreground">
              Sellers must provide accurate information about their products and comply with Devisima&apos;s seller requirements.
            </p>
            <p className="text-muted-foreground">
              Sellers must:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Own or have permission to sell the products they list.</li>
              <li>Disclose relevant requirements, limitations, dependencies, and included materials.</li>
              <li>Avoid malware, malicious code, stolen content, and unauthorized intellectual property.</li>
              <li>Use legitimate product images, descriptions, and demonstrations.</li>
              <li>Provide the files and license rights promised to buyers.</li>
              <li>Respond appropriately to legitimate support requests.</li>
              <li>Follow applicable laws and tax obligations.</li>
            </ul>
            <p className="text-muted-foreground">
              Sellers must not manipulate reviews, misrepresent sales, upload harmful files, or circumvent marketplace moderation.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">6. Seller Applications and Product Moderation</h2>
            <p className="text-muted-foreground">
              Seller access may require an application and approval by Devisima.
            </p>
            <p className="text-muted-foreground">
              Products may be reviewed before publication. We may approve, reject, hide, or request changes to listings that violate our policies or present legitimate legal, security, quality, or consumer-protection concerns.
            </p>
            <p className="text-muted-foreground">
              Moderation decisions will be handled according to our applicable procedures. Users may contact support to challenge a decision.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">7. Pricing, Payments, and Fees</h2>
            <p className="text-muted-foreground">
              Prices and applicable charges will be displayed before a purchase is completed.
            </p>
            <p className="text-muted-foreground">
              Payments may be processed by third-party payment providers, including Paystack where enabled. Payment processing is subject to the provider&apos;s applicable terms and security procedures.
            </p>
            <p className="text-muted-foreground">
              A payment is not considered successful merely because a browser displays a success message. Devisima may verify payment status with the payment provider before confirming an order or enabling downloads.
            </p>
            <p className="text-muted-foreground">
              Seller commissions, payout thresholds, and applicable fees will be disclosed through the relevant seller or payment terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">8. Digital Delivery and Downloads</h2>
            <p className="text-muted-foreground">
              After successful payment verification, eligible purchases may become available in the buyer&apos;s account.
            </p>
            <p className="text-muted-foreground">
              Download access may be subject to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Payment confirmation.</li>
              <li>Product availability and licensing conditions.</li>
              <li>Security checks and reasonable download restrictions.</li>
              <li>Legal or fraud-prevention requirements.</li>
            </ul>
            <p className="text-muted-foreground">
              Buyers must not bypass access controls or share private download links with unauthorized persons.
            </p>
            <p className="text-muted-foreground">
              If a purchased product is unavailable or a download fails, users should contact support for assistance.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">9. Intellectual Property and Product Licenses</h2>
            <p className="text-muted-foreground">
              Devisima&apos;s website design, branding, original content, and platform software are protected by applicable intellectual property laws.
            </p>
            <p className="text-muted-foreground">
              Third-party products remain subject to their respective owners&apos; rights.
            </p>
            <p className="text-muted-foreground">
              Your rights to use a purchased product are determined by the license displayed at purchase or provided with the product. Unless expressly granted, you do not acquire ownership of the underlying source code or the right to redistribute or resell it.
            </p>
            <p className="text-muted-foreground">
              Sellers grant Devisima the permissions reasonably necessary to host, display, promote, distribute, and deliver their listings through the marketplace.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">10. Prohibited Activities</h2>
            <p className="text-muted-foreground">
              You must not:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Commit fraud or attempt payment manipulation.</li>
              <li>Upload malware, backdoors, or harmful files.</li>
              <li>Infringe copyright, trademarks, or other rights.</li>
              <li>Circumvent payment, download, or security controls.</li>
              <li>Scrape or abuse the platform in ways that impair its operation.</li>
              <li>Submit fake reviews, false claims, or misleading product listings.</li>
              <li>Interfere with other users&apos; accounts or marketplace activities.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">11. Refunds, Complaints, and Disputes</h2>
            <p className="text-muted-foreground">
              Refund requests are handled under the Devisima Refund Policy and applicable law.
            </p>
            <p className="text-muted-foreground">
              If you experience a payment problem, missing download, defective product, or seller dispute, contact support@devisima.app or use the available support or dispute tools.
            </p>
            <p className="text-muted-foreground">
              Nothing in these Terms removes consumer rights or remedies that cannot lawfully be excluded.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">12. Third-Party Services</h2>
            <p className="text-muted-foreground">
              Devisima may use third-party services for payments, email delivery, hosting, analytics, file storage, and other functions.
            </p>
            <p className="text-muted-foreground">
              Those services may have their own terms and privacy policies. Devisima is not responsible for independent third-party services beyond the responsibilities imposed on us by applicable law.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">13. Account Suspension and Termination</h2>
            <p className="text-muted-foreground">
              We may restrict or suspend an account where necessary to address fraud, security risks, serious policy violations, unlawful conduct, or legal obligations.
            </p>
            <p className="text-muted-foreground">
              Where appropriate, users will receive an explanation and a means to appeal or contact support.
            </p>
            <p className="text-muted-foreground">
              Account closure does not automatically cancel outstanding legal obligations, legitimate payment disputes, or record-retention requirements.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">14. Service Availability</h2>
            <p className="text-muted-foreground">
              We aim to maintain reliable service but cannot guarantee uninterrupted access. Maintenance, technical failures, security incidents, or third-party outages may temporarily affect the platform.
            </p>
            <p className="text-muted-foreground">
              We will take reasonable steps to address material disruptions.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">15. Liability and Consumer Rights</h2>
            <p className="text-muted-foreground">
              To the extent permitted by applicable law, Devisima is not responsible for losses arising solely from a user&apos;s misuse of the platform or a seller&apos;s independent actions.
            </p>
            <p className="text-muted-foreground">
              Nothing in these Terms excludes liability for fraud, deliberate misconduct, or any other liability that cannot lawfully be excluded or limited.
            </p>
            <p className="text-muted-foreground">
              Your statutory rights remain unaffected.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">16. Changes to These Terms</h2>
            <p className="text-muted-foreground">
              We may update these Terms to reflect changes in our services, business operations, security requirements, or legal obligations.
            </p>
            <p className="text-muted-foreground">
              Material changes will be communicated through the platform or account communications where appropriate. The updated version will display its effective date.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">17. Governing Law</h2>
            <p className="text-muted-foreground">
              These Terms are subject to the laws of the Federal Republic of Nigeria, unless mandatory applicable law requires otherwise.
            </p>
            <p className="text-muted-foreground">
              Disputes will be handled by the competent courts or other legally applicable dispute-resolution mechanisms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">18. Contact Us</h2>
            <p className="text-muted-foreground">
              For questions, complaints, or concerns about these Terms:<br />
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
