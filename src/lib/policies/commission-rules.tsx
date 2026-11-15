export const COMMISSION_RULES_CONTENT = (
  <>
    <section className="mb-8">
      <h2 className="text-2xl font-semibold text-foreground mb-4">1. Platform Commission</h2>
      <p className="text-muted-foreground">
        Devisima charges a <strong>15% platform commission</strong> on eligible sales. This commission is deducted from the gross sale price before calculating seller earnings.
      </p>
      <p className="text-muted-foreground mt-4">
        <strong>Important:</strong> The 15% commission rate is subject to change. Any changes will be communicated through seller notifications and updates to this policy before taking effect.
      </p>
    </section>

    <section className="mb-8">
      <h2 className="text-2xl font-semibold text-foreground mb-4">2. Commission Calculation</h2>
      <p className="text-muted-foreground">
        Commission is calculated on the <strong>final sale price after discounts</strong> but before taxes are added or subtracted, in accordance with applicable payment provider and tax rules.
      </p>
      <p className="text-muted-foreground mt-4">
        <strong>Example calculation:</strong>
      </p>
      <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-2">
        <li>List price: â‚¦10,000</li>
        <li>Discount: â‚¦1,000 (10% off)</li>
        <li>Final sale price: â‚¦9,000</li>
        <li>Platform commission (15%): â‚¦1,350</li>
        <li>Seller earnings: â‚¦7,650</li>
      </ul>
    </section>

    <section className="mb-8">
      <h2 className="text-2xl font-semibold text-foreground mb-4">3. Payment Processing Fees</h2>
      <p className="text-muted-foreground">
        Payment providers (e.g., Paystack) may charge processing fees on transactions. These fees are typically deducted from the total payment before the commission is calculated.
      </p>
      <p className="text-muted-foreground mt-4">
        Processing fees are outside Devisima&apos;s control and may vary by payment method, currency, and transaction amount. Sellers should review payment provider terms for detailed fee structures.
      </p>
    </section>

    <section className="mb-8">
      <h2 className="text-2xl font-semibold text-foreground mb-4">4. Refunds and Chargebacks</h2>
      <p className="text-muted-foreground">
        When a refund is approved and processed:
      </p>
      <ul className="list-disc pl-6 text-muted-foreground space-y-2">
        <li>The commission originally deducted from that sale will be reversed from Devisima&apos;s records.</li>
        <li>If the seller has already been paid out for that sale, the refunded amount (including the commission portion) may be deducted from future payouts or recovered according to applicable payment provider policies.</li>
        <li>Payment provider chargeback fees may apply and are typically the responsibility of the party whose actions caused the chargeback, as determined by Devisima&apos;s dispute resolution process.</li>
      </ul>
    </section>

    <section className="mb-8">
      <h2 className="text-2xl font-semibold text-foreground mb-4">5. Partial Refunds</h2>
      <p className="text-muted-foreground">
        For partial refunds, commission reversal is calculated proportionally to the refunded amount.
      </p>
      <p className="text-muted-foreground mt-4">
        <strong>Example:</strong> If a â‚¦10,000 sale receives a 50% refund (â‚¦5,000), 50% of the original commission (â‚¦675) will be reversed.
      </p>
    </section>

    <section className="mb-8">
      <h2 className="text-2xl font-semibold text-foreground mb-4">6. Adjustments and Corrections</h2>
      <p className="text-muted-foreground">
        Devisima may adjust commission calculations to correct errors, address fraudulent activity, or comply with payment provider decisions. Sellers will be notified of material adjustments affecting their earnings.
      </p>
    </section>

    <section className="mb-8">
      <h2 className="text-2xl font-semibold text-foreground mb-4">7. Special Promotions</h2>
      <p className="text-muted-foreground">
        During platform-wide promotions or coupon campaigns, commission rules may be temporarily modified. Such modifications will be clearly communicated to affected sellers before the promotion begins.
      </p>
    </section>

    <section>
      <h2 className="text-2xl font-semibold text-foreground mb-4">8. Questions and Support</h2>
      <p className="text-muted-foreground">
        For questions about commission calculations or payout adjustments:<br />
        Email: support@devisima.app
      </p>
    </section>
  </>
);
