# Devisima Payment Integration - Paystack & Legal Requirements

## Paystack Integration Questions

These questions must be answered by Paystack support before enabling live automated seller payouts:

### 1. Marketplace Business Model Eligibility
- **Question**: Is Devisima's marketplace business model (where sellers sell digital products and Devisima takes a 15% commission) eligible for the proposed Paystack account setup?
- **Required Answer**: Confirmation that this business model is supported and which account type is required (Standard, Split Payments, or Marketplace)

### 2. Seller Payout Timing
- **Question**: Can seller payouts be delayed until weekly eligibility and fraud checks are complete? Does Paystack support holding funds and releasing them on a schedule controlled by the platform?
- **Required Answer**: Whether Paystack supports:
  - Delayed/weekly disbursements to sellers
  - Holding funds in escrow before release
  - Platform-controlled payout schedules
  - Any alternative mechanisms if delayed payouts are not supported

### 3. Processing Fee Allocation
- **Question**: Which supported Paystack arrangement allocates the processing fee to the seller (not Devisima)?
- **Required Answer**: Confirmation of the fee structure:
  - Who bears the Paystack processing fee (platform vs. seller)
  - Whether split payments can assign fees to the sub-account
  - Fee amount and whether it varies by transaction type

### 4. Full and Partial Refunds
- **Question**: How are full and partial refunds processed through Paystack? Does the original processing fee get returned?
- **Required Answer**:
  - Refund API capabilities (full vs. partial)
  - Processing fee treatment on refunds (is it returned to the platform/seller?)
  - Timeframe for refund completion
  - Any limitations on refunding after payout to seller

### 5. Seller Already Paid
- **Question**: What happens when a seller has already received their payout and a refund is later requested/approved?
- **Required Answer**:
  - Whether Paystack supports recovery from seller sub-accounts
  - Whether platform can offset against future earnings
  - Contractual requirements for seller recovery
  - Any manual recovery processes

### 6. Chargebacks and Negative Balances
- **Question**: How are chargebacks, negative balances, and failed transfers handled?
- **Required Answer**:
  - Chargeback notification process
  - Who bears the chargeback cost (platform vs. seller)
  - How negative seller balances are handled
  - Whether sub-accounts can go negative
  - Platform liability for chargebacks

### 7. Seller Verification Requirements
- **Question**: What seller verification and settlement requirements apply?
- **Required Answer**:
  - KYC requirements for sub-accounts
  - Business registration requirements (if any)
  - Bank account verification process
  - Settlement period requirements
  - Tax documentation requirements

### 8. Split Payments vs. Alternative
- **Question**: Should Devisima use Split Payments or an alternative arrangement (manual transfers after commission deduction)?
- **Required Answer**:
  - Pros/cons of Split Payments for this use case
  - Whether Split Payments supports delayed seller disbursements
  - Whether manual transfers provide more control
  - Recommended approach for weekly payouts with fraud checks

## Legal Review Requirements

The following documents must be reviewed by a qualified Nigerian lawyer:

### 1. Terms of Service
**Review Points**:
- Consumer rights under Nigerian law (Consumer Protection Act, FCCPC regulations)
- Limitation of liability clauses
- Dispute resolution mechanisms
- Governing law and jurisdiction
- Platform liability for seller products
- Payment processing and refund terms
- Seller obligations and warranties
- Intellectual property rights
- Data protection compliance (NDPR)

### 2. Privacy Policy
**Review Points**:
- NDPR (Nigeria Data Protection Regulation) compliance
- Data collection and processing purposes
- User rights under NDPR
- Data retention periods
- Third-party data sharing (especially with Paystack)
- Security measures
- Data breach notification requirements
- Cross-border data transfer (if applicable)

### 3. Cookie Policy
**Review Points**:
- Cookie types and purposes
- User consent mechanisms
- NDPR compliance for tracking technologies
- Third-party cookie usage

### 4. Refund Policy
**Review Points**:
- Compliance with mandatory consumer rights under Nigerian law
- Whether any refund restrictions conflict with statutory rights
- Timeframes for refund processing
- Evidence requirements for refunds
- Seller recovery rights
- Chargeback handling procedures
- Digital product refund limitations vs. consumer rights

### 5. Seller Agreement
**Review Points**:
- Seller warranties and representations
- Product quality obligations
- Intellectual property warranties
- Indemnification clauses
- Commission and fee disclosure
- Payout terms and conditions
- Refund handling obligations
- Tax obligations
- Termination rights
- Liability limitations

### 6. Payment Settlement Terms
**Review Points**:
- Legal validity of holding seller funds before payout
- Escrow arrangement compliance
- Commission deduction legality
- Recovery rights for refunds/chargebacks
- Tax withholding requirements (if any)
- Withholding tax on payments to non-resident sellers

### 7. Consumer Rights Compliance
**Specific Nigerian Laws to Consider**:
- Consumer Protection Council Act
- Federal Competition and Consumer Protection Act (FCCPA)
- Nigeria Data Protection Regulation (NDPR)
- Cybercrimes Act (for electronic transactions)
- CBN regulations on electronic payments
- Tax laws (CITA, VAT Act)

### 8. Payment Provider Agreement
**Review Points**:
- Paystack terms of service compliance
- Fee structure transparency
- Dispute resolution with Paystack
- Liability allocation for payment failures
- Data processing agreement with Paystack
- Regulatory compliance requirements

## Additional Considerations

### Tax Compliance
- VAT collection and remittance obligations
- Withholding tax on seller payouts
- Seller tax reporting requirements
- Digital services tax (if applicable)

### Regulatory Compliance
- CBN guidelines for payment service providers
- FCCPC registration requirements
- NDPR registration with NDPB
- Business registration requirements

### Insurance
- Professional liability insurance
- Cyber insurance
- Fraud insurance for payment transactions

## Questions for Legal Counsel

1. Does our current Terms of Service adequately protect Devisima from liability for defective seller products?
2. Are our refund restrictions compliant with mandatory consumer rights under Nigerian law?
3. Can we legally hold seller funds before weekly payouts, or does this require a specific escrow arrangement?
4. What are our obligations when a seller is sued for copyright infringement related to products sold on Devisima?
5. Are our data protection practices fully compliant with NDPR?
6. What disclosures are required for commission rates and payment processing fees?
7. Can we legally recover overpaid amounts from sellers for refunds/chargebacks?
8. What are our obligations for reporting seller income to tax authorities?
9. Do we need specific licenses or registrations to operate this marketplace in Nigeria?
10. Are our limitation of liability clauses enforceable under Nigerian law?

## Implementation Notes

### Current Implementation Status
- ✅ 15% platform commission (1500 bps) set as default
- ✅ Server-side payment initialization with authoritative prices
- ✅ Server-side Paystack transaction verification
- ✅ Secure webhook signature verification
- ✅ Idempotent payment processing
- ✅ Database transactions for financial updates
- ✅ Download access only after payment verification
- ✅ Seller earnings ledger with commission tracking
- ✅ Weekly payout workflow with eligibility checks
- ✅ Refund request workflow with evidence collection
- ✅ Admin refund review system with audit trail
- ✅ Download revocation after successful refunds
- ✅ Refund reconciliation for seller earnings
- ✅ Fraud detection mechanisms (payment risk, payout risk)
- ✅ Admin financial dashboard with real data

### Limitations Requiring Paystack Confirmation
- ⚠️ Weekly seller payout timing (delayed disbursements)
- ⚠️ Processing fee allocation to sellers
- ⚠️ Seller recovery after payout for refunds
- ⚠️ Chargeback handling and negative balances
- ⚠️ Escrow arrangement for holding funds

### Legal Review Priority
1. Refund Policy - Must not conflict with mandatory consumer rights
2. Seller Agreement - Liability and indemnification clauses
3. Terms of Service - Platform liability for seller products
4. Privacy Policy - NDPR compliance
5. Payment Settlement - Legal validity of holding seller funds

## Next Steps

1. Contact Paystack support with the questions above
2. Engage Nigerian legal counsel for document review
3. Update policies based on legal recommendations
4. Adjust payout workflow based on Paystack capabilities
5. Implement any additional compliance measures required
6. Document the final confirmed integration approach
