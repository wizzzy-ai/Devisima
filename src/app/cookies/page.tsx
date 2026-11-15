import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookie Policy - Devisima",
  description: "Devisima Cookie Policy",
};

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <h1 className="text-4xl font-bold tracking-tight text-foreground mb-4">Devisima Cookie Policy</h1>
        <p className="text-muted-foreground mb-8">Effective date: 2026-10-10 | Last updated: 2026-10-10</p>

        <div className="prose prose-sm sm:prose-base max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">1. What Are Cookies?</h2>
            <p className="text-muted-foreground">
              Cookies are small files stored on your device by a website. Similar technologies, such as local storage and tracking pixels, may also store or access information.
            </p>
            <p className="text-muted-foreground">
              Devisima uses these technologies only as appropriate for the functions actually implemented on the platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">2. Why We Use Cookies</h2>
            <p className="text-muted-foreground">
              Cookies and similar technologies may be used for the following purposes.
            </p>
            <p className="text-muted-foreground font-semibold">Strictly necessary cookies</p>
            <p className="text-muted-foreground">
              These support essential website functions, which may include:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Maintaining authentication sessions.</li>
              <li>Protecting login and account actions.</li>
              <li>Supporting security and fraud prevention.</li>
              <li>Maintaining checkout and session continuity.</li>
            </ul>
            <p className="text-muted-foreground text-sm">These cookies cannot always be disabled without affecting essential website functionality.</p>
            <p className="text-muted-foreground font-semibold">Preference cookies</p>
            <p className="text-muted-foreground">
              These remember choices such as:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Light or dark theme.</li>
              <li>Language preference.</li>
              <li>Other interface preferences.</li>
            </ul>
            <p className="text-muted-foreground text-sm">They should only be used when the relevant feature is implemented.</p>
            <p className="text-muted-foreground font-semibold">Analytics cookies</p>
            <p className="text-muted-foreground">
              If Devisima uses analytics tools, these may help us understand:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Which pages are visited.</li>
              <li>How visitors navigate the website.</li>
              <li>Which features are used.</li>
              <li>Whether pages experience performance problems.</li>
            </ul>
            <p className="text-muted-foreground text-sm">Where consent is required, non-essential analytics technologies will be activated only after the required consent is obtained.</p>
            <p className="text-muted-foreground font-semibold">Marketing cookies</p>
            <p className="text-muted-foreground">
              If advertising or remarketing tools are introduced, they may be used to measure campaigns or show relevant promotions.
            </p>
            <p className="text-muted-foreground text-sm">Such technologies must be disclosed and managed according to applicable consent requirements. They should not be activated before required consent.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">3. Cookies Used by Devisima</h2>
            <p className="text-muted-foreground">
              The exact cookies depend on the current implementation and third-party services.
            </p>
            <p className="text-muted-foreground">
              Devisima should maintain an accurate cookie inventory containing:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Cookie or technology name.</li>
              <li>Provider.</li>
              <li>Purpose.</li>
              <li>Category.</li>
              <li>Duration.</li>
              <li>Whether it is first-party or third-party.</li>
              <li>Whether consent is required.</li>
            </ul>
            <p className="text-muted-foreground text-sm">Do not treat this policy as a claim that every category above is currently active.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">4. Managing Your Cookie Preferences</h2>
            <p className="text-muted-foreground">
              Where applicable, users can manage optional cookies through the Devisima cookie-preference interface.
            </p>
            <p className="text-muted-foreground">
              You may also manage or delete cookies through your browser settings.
            </p>
            <p className="text-muted-foreground">
              Blocking strictly necessary cookies may cause certain features, including login or checkout, to stop working properly.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">5. Third-Party Services</h2>
            <p className="text-muted-foreground">
              Devisima may use third-party services for payments, hosting, analytics, embedded content, or other features.
            </p>
            <p className="text-muted-foreground">
              These providers may use their own cookies or similar technologies, subject to their terms and the applicable legal requirements.
            </p>
            <p className="text-muted-foreground text-sm">The active providers should be identified in the actual cookie inventory.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">6. Consent and Your Choices</h2>
            <p className="text-muted-foreground">
              Where consent is required, Devisima will request it before activating relevant non-essential cookies.
            </p>
            <p className="text-muted-foreground">
              Users should be able to reject optional cookies as easily as they can accept them, where required by applicable law.
            </p>
            <p className="text-muted-foreground">
              Withdrawing consent will stop future consent-based processing where technically feasible, but will not automatically delete information already lawfully processed.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">7. Updates to This Policy</h2>
            <p className="text-muted-foreground">
              We may update this Cookie Policy when our technology, services, or legal obligations change.
            </p>
            <p className="text-muted-foreground">
              The current version and effective date will be available on our website.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">8. Contact Us</h2>
            <p className="text-muted-foreground">
              For questions about cookies or privacy:<br />
              Email: privacy@devisima.app<br />
              Business name: Devisima Ltd.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
