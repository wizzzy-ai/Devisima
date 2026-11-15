export const PAYOUT_TERMS_CONTENT = (
  <>
    <section className="mb-8">
      <h2 className="text-2xl font-semibold text-foreground mb-4">1. Payout Schedule</h2>
      <p className="text-muted-foreground">
        Payouts are processed on a <strong>weekly schedule</strong>. Eligible earnings accumulated during a payout period are transferred to the seller&apos;s registered payout account at the end of that period.
      </p>
      <p className="text-muted-foreground mt-4">
        <strong>Important:</strong> The exact payout day and processing timeline are subject to payment provider capabilities and may be adjusted. Sellers will be notified of any material changes to the payout schedule.
      </p>
    </section>

    <section className="mb-8">
      <h2 className="text-2xl font-semibold text-foreground mb-4">2. Minimum Payout Threshold</h2>
      <p className="text-muted-foreground">
        A <strong>minimum payout threshold of â‚¦10,000</strong> is proposed for seller payouts. Earnings below this threshold will accumulate until the threshold is reached or a longer period has elapsed.
      </p>
      <p className="text-muted-foreground mt-4">
        <strong>Note:</strong> The â‚¦10,000 threshold is not yet finalized or legally binding. The actual minimum threshold will be confirmed once the payout implementation is complete and approved by the payment provider. Sellers will be notified before any threshold takes effect.
      </p>
    </section>

    <section className="mb-8">
      <h2 className="text-2xl font-semibold text-foreground mb-4">3. Seller Eligibility</h2>
      <p className="text-muted-foreground">
        To receive payouts, sellers must:
      </p>
      <ul className="list-disc pl-6 text-muted-foreground space-y-2">
        <li>Have a verified payout account registered with Devisima.</li>
        <li>Have completed identity and business verification where required.</li>
        <li>Have no outstanding account restrictions or suspensions.</li>
        <li>Comply with applicable tax and regulatory requirements.</li>
      </ul>
    </section>

    <section className="mb-8">
      <h2 className="text-2xl font-semibold text-foreground mb-4">4. Payment Verification and Fraud Checks</h2>
      <p className="text-muted-foreground">
        All payouts are subject to verification and fraud prevention checks. This may include:
      </p>
      <ul className="list-disc pl-6 text-muted-foreground space-y-2">
        <li>Verification of payout account details.</li>
        <li>Review of transaction history for suspicious activity.</li>
        <li>Confirmation that sales are legitimate and not fraudulent.</li>
        <li>Compliance with payment provider security requirements.</li>
      </ul>
      <p className="text-muted-foreground mt-4">
        Payouts may be delayed or withheld if verification checks raise concerns. Sellers will be notified and given an opportunity to provide clarification where appropriate.
      </p>
    </section>

    <section className="mb-8">
      <h2 className="text-2xl font-semibold text-foreground mb-4">5. Processing Fees</h2>
      <p className="text-muted-foreground">
        Payment providers may charge processing fees for transfers to seller accounts. These fees are deducted from the payout amount where applicable.
      </p>
      <p className="text-muted-foreground mt-4">
        Processing fees vary by provider, account type, and transfer method. Sellers should review their payout account terms for detailed fee information.
      </p>
    </section>

    <section className="mb-8">
      <h2 className="text-2xl font-semibold text-foreground mb-4">6. Payout Delays and Failed Transfers</h2>
      <p className="text-muted-foreground">
        Payouts may be delayed or fail due to:
      </p>
      <ul className="list-disc pl-6 text-muted-foreground space-y-2">
        <li>Payment provider technical issues or maintenance.</li>
        <li>Incorrect or invalid payout account details.</li>
        <li>Bank account restrictions or closures.</li>
        <li>Fraud prevention holds or regulatory requirements.</li>
        <li>Insufficient funds in seller&apos;s eligible balance after adjustments.</li>
      </ul>
      <p className="text-muted-foreground mt-4">
        Sellers will be notified of payout failures and given instructions to resolve the issue. Failed payouts will be retried according to applicable procedures.
      </p>
    </section>

    <section className="mb-8">
      <h2 className="text-2xl font-semibold text-foreground mb-4">7. Refunds and Chargebacks After Payout</h2>
      <p className="text-muted-foreground">
        If a refund or chargeback occurs after a seller has already been paid out for the related sale:
      </p>
      <ul className="list-disc pl-6 text-muted-foreground space-y-2">
        <li>The refunded amount (including the commission portion) may be deducted from the seller&apos;s future eligible earnings.</li>
        <li>If the seller&apos;s balance is insufficient, Devisima may pursue recovery according to applicable payment provider policies and the seller agreement.</li>
        <li>Chargeback fees imposed by payment providers may be the responsibility of the party whose actions caused the chargeback, as determined by Devisima&apos;s dispute resolution process.</li>
      </ul>
    </section>

    <section className="mb-8">
      <h2 className="text-2xl font-semibold text-foreground mb-4">8. Payout Adjustments</h2>
      <p className="text-muted-foreground">
        Devisima may adjust payout amounts to correct errors, address fraudulent activity, or comply with payment provider decisions. Sellers will be notified of material adjustments affecting their payouts.
      </p>
    </section>

    <section>
      <h2 className="text-2xl font-semibold text-foreground mb-4">9. Questions and Support</h2>
      <p className="text-muted-foreground">
        For questions about payouts, account verification, or payout failures:<br />
        Email: support@devisima.app
      </p>
    </section>
  </>
);
