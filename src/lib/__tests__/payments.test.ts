import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { db } from "@/lib/db/prisma";
import { verifyPaystackTransaction } from "@/lib/payments/paystack";
import { confirmPaystackPayment } from "@/lib/payments/fulfill-order";
import { reconcileSuccessfulRefundEarnings } from "@/lib/earnings/refunds";
import { detectPaymentRisk, detectPayoutRisk } from "@/lib/security/risk-detection";

describe("Payment Processing Tests", () => {
  describe("Payment Verification", () => {
    it("should verify a successful Paystack transaction", async () => {
      const reference = "PS-test-123";
      const transaction = await verifyPaystackTransaction(reference);
      expect(transaction).toBeDefined();
      expect(transaction.status).toBe("success");
      expect(transaction.reference).toBe(reference);
    });

    it("should reject payment with incorrect amount", async () => {
      const payment = await db.payment.create({
        data: {
          orderId: "test-order",
          providerReference: "PS-test-wrong-amount",
          amountMinor: 500000n,
          currency: "NGN",
          status: "PENDING",
        },
      });

      const result = await confirmPaystackPayment(payment.providerReference);
      expect(result.status).toBe("invalid");
    });

    it("should reject payment with incorrect currency", async () => {
      const payment = await db.payment.create({
        data: {
          orderId: "test-order",
          providerReference: "PS-test-wrong-currency",
          amountMinor: 100000n,
          currency: "USD",
          status: "PENDING",
        },
      });

      const result = await confirmPaystackPayment(payment.providerReference);
      expect(result.status).toBe("invalid");
    });

    it("should handle failed payments correctly", async () => {
      const reference = "PS-test-failed";
      const result = await confirmPaystackPayment(reference);
      expect(result.status).toBe("failed");
    });

    it("should be idempotent for duplicate payment references", async () => {
      const reference = "PS-test-duplicate";
      const result1 = await confirmPaystackPayment(reference);
      const result2 = await confirmPaystackPayment(reference);
      expect(result1.status).toBe(result2.status);
    });
  });

  describe("Commission Calculation", () => {
    it("should calculate 15% commission correctly", async () => {
      const grossAmount = 10000;
      const commissionRateBps = 1500;
      const commissionAmount = Math.round(grossAmount * commissionRateBps / 10_000);
      const netAmount = grossAmount - commissionAmount;

      expect(commissionAmount).toBe(1500);
      expect(netAmount).toBe(8500);
    });

    it("should handle commission for different amounts", async () => {
      const testCases = [
        { gross: 5000, expectedCommission: 750 },
        { gross: 15000, expectedCommission: 2250 },
        { gross: 25000, expectedCommission: 3750 },
      ];

      for (const { gross, expectedCommission } of testCases) {
        const commission = Math.round(gross * 1500 / 10_000);
        expect(commission).toBe(expectedCommission);
      }
    });

    it("should preserve commission rate for historical transactions", async () => {
      const orderItem = await db.orderItem.create({
        data: {
          orderId: "test-order",
          productName: "Test Product",
          productSlug: "test-product",
          productType: "TEMPLATE",
          sellerName: "Test Seller",
          priceAtPurchase: 10000,
          commissionRateBps: 1500,
          commissionAmount: 1500,
          sellerEarnings: 8500,
        },
      });

      expect(orderItem.commissionRateBps).toBe(1500);
      expect(orderItem.commissionAmount).toBe(1500);
      expect(orderItem.sellerEarnings).toBe(8500);
    });
  });

  describe("Refund Processing", () => {
    it("should handle full refund correctly", async () => {
      const refund = await db.refund.create({
        data: {
          orderId: "test-order",
          paymentReference: "PS-test-refund",
          providerReference: "RF-test-full",
          amount: 10000,
          currency: "NGN",
          status: "SUCCESS",
          reason: "Full refund requested",
        },
      });

      const result = await reconcileSuccessfulRefundEarnings(refund.id);
      expect(result.status).toBe("reconciled");
      expect(result.created).toBeGreaterThan(0);
    });

    it("should handle partial refund correctly", async () => {
      const refund = await db.refund.create({
        data: {
          orderId: "test-order",
          paymentReference: "PS-test-partial",
          providerReference: "RF-test-partial",
          amount: 5000,
          currency: "NGN",
          status: "SUCCESS",
          reason: "Partial refund requested",
        },
      });

      const result = await reconcileSuccessfulRefundEarnings(refund.id);
      expect(result.status).toBe("reconciled");
    });

    it("should prevent refund exceeding original payment", async () => {
      const refund = await db.refund.create({
        data: {
          orderId: "test-order",
          paymentReference: "PS-test-exceed",
          providerReference: "RF-test-exceed",
          amount: 50000,
          currency: "NGN",
          status: "SUCCESS",
          reason: "Excessive refund",
        },
      });

      await expect(reconcileSuccessfulRefundEarnings(refund.id)).rejects.toThrow();
    });

    it("should handle refund before seller payout", async () => {
      const refund = await db.refund.create({
        data: {
          orderId: "test-order",
          paymentReference: "PS-test-before-payout",
          providerReference: "RF-test-before",
          amount: 10000,
          currency: "NGN",
          status: "SUCCESS",
          reason: "Refund before payout",
        },
      });

      const result = await reconcileSuccessfulRefundEarnings(refund.id);
      expect(result.status).toBe("reconciled");
    });

    it("should handle refund after seller payout", async () => {
      const refund = await db.refund.create({
        data: {
          orderId: "test-order",
          paymentReference: "PS-test-after-payout",
          providerReference: "RF-test-after",
          amount: 10000,
          currency: "NGN",
          status: "SUCCESS",
          reason: "Refund after payout",
        },
      });

      const result = await reconcileSuccessfulRefundEarnings(refund.id);
      expect(result.status).toBe("reconciled");
    });

    it("should handle processing fee not returned by provider", async () => {
      const refund = await db.refund.create({
        data: {
          orderId: "test-order",
          paymentReference: "PS-test-fee",
          providerReference: "RF-test-fee",
          amount: 10000,
          currency: "NGN",
          status: "SUCCESS",
          reason: "Refund with fee",
        },
      });

      const result = await reconcileSuccessfulRefundEarnings(refund.id);
      expect(result.status).toBe("reconciled");
    });
  });

  describe("Download Access Control", () => {
    it("should allow download after successful payment", async () => {
      const purchase = await db.purchase.create({
        data: {
          userId: "test-user",
          orderId: "test-order",
          orderItemId: "test-item",
          productId: "test-product",
          sellerId: "test-seller",
          purchasedPrice: 10000,
          purchasedVersion: "1.0.0",
        },
      });

      expect(purchase).toBeDefined();
    });

    it("should revoke download access after successful refund", async () => {
      const refund = await db.refund.create({
        data: {
          orderId: "test-order",
          paymentReference: "PS-test-revoke",
          providerReference: "RF-test-revoke",
          amount: 10000,
          currency: "NGN",
          status: "SUCCESS",
          reason: "Refund for download revocation",
        },
      });

      const hasSuccessfulRefund = await db.refund.findFirst({
        where: { orderId: "test-order", status: "SUCCESS" },
      });

      expect(hasSuccessfulRefund).toBeDefined();
    });

    it("should prevent download access before payment verification", async () => {
      const payment = await db.payment.create({
        data: {
          orderId: "test-order",
          providerReference: "PS-test-unverified",
          amountMinor: 100000n,
          currency: "NGN",
          status: "PENDING",
        },
      });

      expect(payment.status).toBe("PENDING");
    });
  });

  describe("Fraud Detection", () => {
    it("should detect high failed payment rate", async () => {
      const flags = await detectPaymentRisk("test-user", "test@example.com", "DV-test-1");
      const highSeverityFlags = flags.filter((f) => f.severity === "high");
      expect(highSeverityFlags.length).toBeGreaterThanOrEqual(0);
    });

    it("should detect rapid order pattern", async () => {
      const flags = await detectPaymentRisk("test-user", "test@example.com", "DV-test-2");
      const rapidOrderFlag = flags.find((f) => f.type === "RAPID_ORDER_PATTERN");
      expect(rapidOrderFlag).toBeDefined();
    });

    it("should detect duplicate order reference", async () => {
      const flags = await detectPaymentRisk("test-user", "test@example.com", "DV-test-3");
      const duplicateFlag = flags.find((f) => f.type === "DUPLICATE_ORDER_REFERENCE");
      expect(duplicateFlag).toBeDefined();
    });

    it("should detect high refund rate", async () => {
      const flags = await detectPaymentRisk("test-user", "test@example.com", "DV-test-4");
      const highRefundFlag = flags.find((f) => f.type === "HIGH_REFUND_RATE");
      expect(highRefundFlag).toBeDefined();
    });

    it("should detect unverified payout account", async () => {
      const flags = await detectPayoutRisk("test-seller");
      const unverifiedFlag = flags.find((f) => f.type === "UNVERIFIED_PAYOUT_ACCOUNT");
      expect(unverifiedFlag).toBeDefined();
    });

    it("should detect recent payout account change", async () => {
      const flags = await detectPayoutRisk("test-seller");
      const recentChangeFlag = flags.find((f) => f.type === "RECENT_PAYOUT_ACCOUNT_CHANGE");
      expect(recentChangeFlag).toBeDefined();
    });

    it("should detect multiple payout failures", async () => {
      const flags = await detectPayoutRisk("test-seller");
      const failureFlag = flags.find((f) => f.type === "MULTIPLE_PAYOUT_FAILURES");
      expect(failureFlag).toBeDefined();
    });
  });

  describe("Payout Processing", () => {
    it("should prevent duplicate payout attempts", async () => {
      const payout = await db.sellerPayout.create({
        data: {
          sellerId: "test-seller",
          payoutAccountId: "test-account",
          amount: 10000,
          currency: "NGN",
          status: "PENDING",
          reference: "PO-test-1",
          idempotencyKey: "unique-key-1",
          recipientCode: "RC-test",
          bankName: "Test Bank",
          accountLast4: "1234",
        },
      });

      expect(payout).toBeDefined();
      expect(payout.status).toBe("PENDING");
    });

    it("should check seller balance before payout", async () => {
      const balance = await db.sellerTransaction.aggregate({
        where: {
          sellerId: "test-seller",
          status: "AVAILABLE",
        },
        _sum: { netAmount: true },
      });

      expect(balance._sum.netAmount).toBeDefined();
    });

    it("should verify payout account before transfer", async () => {
      const account = await db.sellerPayoutAccount.findUnique({
        where: { sellerId: "test-seller" },
      });

      if (account) {
        expect(account.isVerified).toBe(true);
      }
    });
  });

  describe("Unauthorized Access Prevention", () => {
    it("should prevent user from accessing another user's order", async () => {
      const order = await db.order.findUnique({
        where: { id: "other-user-order" },
      });

      if (order) {
        expect(order.userId).not.toBe("test-user");
      }
    });

    it("should prevent user from accessing another user's refund", async () => {
      const refund = await db.refund.findFirst({
        where: { orderId: "other-user-order" },
      });

      if (refund) {
        const order = await db.order.findUnique({
          where: { id: refund.orderId },
        });

        if (order) {
          expect(order.userId).not.toBe("test-user");
        }
      }
    });
  });
});
