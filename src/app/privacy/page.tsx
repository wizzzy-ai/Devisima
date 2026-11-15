import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - Devisima",
  description: "Devisima Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <h1 className="text-4xl font-bold tracking-tight text-foreground mb-4">Devisima Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Effective date: 2026-10-10 | Last updated: 2026-10-10</p>

        <div className="prose prose-sm sm:prose-base max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">1. Introduction</h2>
            <p className="text-muted-foreground">
              This Privacy Policy explains how Devisima collects, uses, stores, shares, and protects personal information when you visit our website, create an account, buy products, sell digital products, or contact support.
            </p>
            <p className="text-muted-foreground">
              We aim to handle personal information transparently and in accordance with applicable data-protection laws, including the Nigeria Data Protection Act 2023 where applicable.
            </p>
            <p className="text-muted-foreground">
              Data controller or responsible entity: Devisima Ltd.<br />
              Privacy contact: privacy@devisima.app
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">2. Information We Collect</h2>
            <p className="text-muted-foreground">
              Depending on how you use Devisima, we may collect the following information.
            </p>
            <p className="text-muted-foreground font-semibold">Account information</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Name and username.</li>
              <li>Email address.</li>
              <li>Profile image and biography, if provided.</li>
              <li>Account role and verification status.</li>
              <li>Password hashes and authentication/session information.</li>
            </ul>
            <p className="text-muted-foreground text-sm">We should never store passwords in plain text.</p>
            <p className="text-muted-foreground font-semibold">Purchase and transaction information</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Orders and purchased products.</li>
              <li>Product prices, currencies, and order totals.</li>
              <li>Payment references and payment status.</li>
              <li>Refund and dispute records.</li>
              <li>Download entitlements and download activity.</li>
            </ul>
            <p className="text-muted-foreground text-sm">Payment card details are handled according to the payment provider&apos;s integration. Devisima should not collect or store full card credentials unless it has a properly authorized and compliant arrangement to do so.</p>
            <p className="text-muted-foreground font-semibold">Seller information</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Seller application and store information.</li>
              <li>Product listings, uploaded files, and product versions.</li>
              <li>Sales, commission, earnings, and payout records.</li>
              <li>Payout account details needed to process payments.</li>
            </ul>
            <p className="text-muted-foreground font-semibold">Technical information</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>IP address and browser/device information where collected.</li>
              <li>Website usage, diagnostic logs, and security events.</li>
              <li>Cookies and similar technologies.</li>
              <li>Error reports and performance information.</li>
            </ul>
            <p className="text-muted-foreground font-semibold">Support and communications</p>
            <p className="text-muted-foreground">
              Information you submit through support tickets, contact forms, reviews, or communications with the Devisima AI Assistant may be processed to provide assistance and improve service quality.
            </p>
            <p className="text-muted-foreground text-sm">Please do not submit passwords, secret keys, or unnecessary sensitive information through these channels.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">3. How We Use Your Information</h2>
            <p className="text-muted-foreground">
              We may use personal information to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Create and maintain accounts.</li>
              <li>Authenticate users and verify email addresses.</li>
              <li>Process purchases and confirm payments.</li>
              <li>Provide secure downloads.</li>
              <li>Review seller applications and product listings.</li>
              <li>Calculate commissions, earnings, and payouts.</li>
              <li>Handle refunds, disputes, and customer support.</li>
              <li>Send essential account and transaction notifications.</li>
              <li>Detect fraud, abuse, and security threats.</li>
              <li>Maintain records required by law.</li>
              <li>Improve website performance and user experience.</li>
              <li>Send marketing communications where permitted.</li>
            </ul>
            <p className="text-muted-foreground">
              We will not use personal information for purposes that are incompatible with the purposes disclosed to users unless a lawful basis permits it.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">4. Legal Bases for Processing</h2>
            <p className="text-muted-foreground">
              Depending on the circumstances, we may process information because:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>It is necessary to provide a service or perform a contract.</li>
              <li>We have a legitimate interest that does not override applicable individual rights.</li>
              <li>We have a legal obligation.</li>
              <li>You have provided consent where consent is the appropriate legal basis.</li>
            </ul>
            <p className="text-muted-foreground">
              Where processing relies on consent, you may withdraw it, subject to applicable law. Withdrawal does not automatically invalidate processing that was lawful before withdrawal.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">5. How We Share Information</h2>
            <p className="text-muted-foreground">
              We may share relevant information with:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Payment providers such as Paystack to process transactions.</li>
              <li>Hosting, database, file-storage, and email providers.</li>
              <li>Security, analytics, and error-monitoring providers where used.</li>
              <li>Sellers when necessary to fulfil purchases or provide product support.</li>
              <li>Professional advisers and authorities where legally required.</li>
              <li>Successor entities in a legitimate business transfer, subject to applicable protections.</li>
            </ul>
            <p className="text-muted-foreground">
              We share only information reasonably necessary for the relevant purpose.
            </p>
            <p className="text-muted-foreground">
              We do not sell personal information to advertisers as a business practice.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">6. International Transfers</h2>
            <p className="text-muted-foreground">
              Some service providers may process or store information outside Nigeria.
            </p>
            <p className="text-muted-foreground">
              Where international transfers occur, we will apply the safeguards and legal requirements applicable to those transfers.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">7. Data Retention</h2>
            <p className="text-muted-foreground">
              We retain information only for as long as reasonably necessary for the purposes described in this policy, including account management, transaction records, security, dispute resolution, and legal obligations.
            </p>
            <p className="text-muted-foreground">
              Financial and transaction records may need to be retained after account closure. Data that is no longer needed will be deleted or anonymized where appropriate and technically feasible.
            </p>
            <p className="text-muted-foreground text-sm">Specific retention periods should be established in Devisima&apos;s internal retention schedule.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">8. Data Security</h2>
            <p className="text-muted-foreground">
              We use appropriate technical and organizational measures to protect information against unauthorized access, loss, alteration, and disclosure.
            </p>
            <p className="text-muted-foreground">
              These measures may include access controls, secure authentication, encrypted connections, protected file storage, and restricted staff access.
            </p>
            <p className="text-muted-foreground">
              No internet-based service can guarantee absolute security. If a data incident occurs, we will respond and provide notifications where required by law.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">9. Your Privacy Rights</h2>
            <p className="text-muted-foreground">
              Subject to applicable law, you may have the right to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Request access to personal information we hold about you.</li>
              <li>Correct inaccurate or incomplete information.</li>
              <li>Request deletion of information in eligible circumstances.</li>
              <li>Object to or request restriction of certain processing.</li>
              <li>Request a copy of eligible information in a portable format.</li>
              <li>Withdraw consent where consent is the basis for processing.</li>
              <li>Raise a complaint with the relevant data-protection authority.</li>
            </ul>
            <p className="text-muted-foreground">
              To exercise these rights, contact privacy@devisima.app. We may need to verify your identity before responding.
            </p>
            <p className="text-muted-foreground">
              Some requests may be limited where information must be retained for legal, security, financial, or dispute-resolution reasons.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">10. Cookies and Similar Technologies</h2>
            <p className="text-muted-foreground">
              Devisima may use cookies or similar technologies to maintain sessions, remember preferences, protect accounts, and understand website performance.
            </p>
            <p className="text-muted-foreground">
              The actual cookies used will depend on the features enabled on the website. See our separate Cookie Policy for details.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">11. AI Assistant and Automated Processing</h2>
            <p className="text-muted-foreground">
              If Devisima offers an AI Assistant, information submitted to it may be processed to generate responses and provide platform support.
            </p>
            <p className="text-muted-foreground">
              Where the assistant accesses account-specific information, access should be limited to information the authenticated user is authorized to see.
            </p>
            <p className="text-muted-foreground">
              AI responses may be inaccurate. The assistant should not independently authorize financial transfers, refunds, or other sensitive actions without the required checks and approvals.
            </p>
            <p className="text-muted-foreground">
              Any additional AI provider or model processing must be disclosed as appropriate.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">12. Children&apos;s Privacy</h2>
            <p className="text-muted-foreground">
              Devisima is not intended for users who are legally prohibited from entering into the relevant transactions. Where age restrictions apply, users must comply with them.
            </p>
            <p className="text-muted-foreground">
              If we discover personal information collected in circumstances that violate applicable children&apos;s privacy requirements, we will take appropriate steps.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">13. Third-Party Links</h2>
            <p className="text-muted-foreground">
              Our website may contain links to third-party websites or services. Their privacy practices are governed by their own policies.
            </p>
            <p className="text-muted-foreground">
              We encourage users to review those policies before providing personal information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">14. Changes to This Policy</h2>
            <p className="text-muted-foreground">
              We may update this Privacy Policy as our services, technology, or legal obligations change.
            </p>
            <p className="text-muted-foreground">
              The updated policy will display a revised date. Material changes will be communicated where required.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">15. Contact and Complaints</h2>
            <p className="text-muted-foreground">
              For privacy requests, questions, or complaints:<br />
              Privacy email: privacy@devisima.app<br />
              Support email: support@devisima.app<br />
              Legal entity: Devisima Ltd.<br />
              Address: Lagos, Nigeria
            </p>
            <p className="text-muted-foreground">
              You may also contact the relevant data-protection authority if you believe your rights have been violated.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
