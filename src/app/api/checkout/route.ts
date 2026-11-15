import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/guards";
import { MARKETPLACE_CURRENCY, MARKETPLACE_CURRENCY_MINOR_UNITS } from "@/lib/marketplace/config";
import { initializePaystackTransaction } from "@/lib/payments/paystack";
import { releaseCouponUsage, reserveCouponUsage, validateCouponForCart } from "@/lib/coupons";
import { createNotification, sendNotificationEmail } from "@/lib/notifications";
import { POLICY_VERSIONS, recordPolicyAcceptance } from "@/lib/policy-acceptance";
import { checkoutInitializationSchema } from "@/lib/validation/checkout";
import { detectPaymentRisk, logRiskFlag } from "@/lib/security/risk-detection";

const paymentSelect = { id: true, providerReference: true, status: true, authorizationUrl: true } as const;

async function priorAttempt(userId: string, idempotencyKey: string) {
  return db.order.findUnique({ where: { userId_idempotencyKey: { userId, idempotencyKey } }, select: { id: true, reference: true, status: true, payments: { orderBy: { createdAt: "desc" }, take: 1, select: paymentSelect } } });
}

function existingAttemptResponse(order: NonNullable<Awaited<ReturnType<typeof priorAttempt>>>) {
  const payment = order.payments[0];
  if (order.status === "PAID") return NextResponse.json({ alreadyPaid: true, orderId: order.id, orderReference: order.reference });
  if (payment?.authorizationUrl && payment.status === "PENDING") return NextResponse.json({ authorizationUrl: payment.authorizationUrl, orderId: order.id, orderReference: order.reference, reused: true });
  if (order.status === "FAILED" || payment?.status === "FAILED") return NextResponse.json({ message: "The previous payment attempt did not start. Click pay again to begin a new attempt.", retryable: true }, { status: 409 });
  return NextResponse.json({ message: "This checkout attempt is already being processed. Refresh your checkout before trying again." }, { status: 409 });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Sign in to continue to checkout." }, { status: 401 });
  if (user.status !== "ACTIVE") return NextResponse.json({ message: "This account cannot make purchases." }, { status: 403 });

  const parsed = checkoutInitializationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "Refresh your checkout and try again." }, { status: 400 });
  const { idempotencyKey, expectedItems, couponCode } = parsed.data;
  const previous = await priorAttempt(user.id, idempotencyKey);
  if (previous) return existingAttemptResponse(previous);

  const orderReference = `DV-${randomUUID()}`;
  const paymentReference = `PS-${randomUUID()}`;

  const riskFlags = await detectPaymentRisk(user.id, user.email, orderReference);
  const highSeverityFlags = riskFlags.filter((flag) => flag.severity === "high");
  if (highSeverityFlags.length > 0) {
    await Promise.all(highSeverityFlags.map((flag) => logRiskFlag(user.id, flag, `checkout:${orderReference}`)));
    return NextResponse.json({ message: "Your account has been flagged for review. Please contact support." }, { status: 403 });
  }
  let order: { id: string; reference: string; total: number };
  let amountMinor: bigint;

  try {
    const created = await db.$transaction(async (tx) => {
      const cart = await tx.cart.findUnique({
        where: { userId: user.id },
        select: {
          couponCode: true,
          couponDiscountAmount: true,
          items: {
            select: {
              productId: true,
              product: {
                select: {
                  id: true,
                  title: true,
                  slug: true,
                  price: true,
                  productType: true,
                  licenseType: true,
                  version: true,
                  status: true,
                  adminRestrictedAt: true,
                  categoryId: true,
                  sellerId: true,
                  seller: { select: { id: true, name: true, role: true, status: true, sellerSuspendedAt: true, sellerApplications: { where: { status: "APPROVED" }, orderBy: { createdAt: "desc" }, take: 1, select: { storeName: true } } } },
                },
              },
            },
          },
        },
      });
      const cartItems = cart?.items ?? [];
      if (!cartItems.length) return { error: "Your cart is empty. Add a product before checkout.", code: "EMPTY_CART" } as const;
      const unavailable = cartItems.some(({ product }) => product.status !== "PUBLISHED" || product.adminRestrictedAt !== null || product.seller.status !== "ACTIVE" || product.seller.role !== "SELLER" || product.seller.sellerSuspendedAt !== null);
      if (unavailable) return { error: "A product in your cart is no longer available. Remove it before checkout.", code: "UNAVAILABLE_PRODUCT" } as const;

      const expected = new Map(expectedItems.map((item) => [item.productId, item.price]));
      const changed = expected.size !== expectedItems.length || expected.size !== cartItems.length || cartItems.some(({ product }) => expected.get(product.id) !== product.price);
      if (changed) return { error: "Your cart or a product price changed. Review the updated cart before paying.", code: "CART_CHANGED" } as const;

      const subtotal = cartItems.reduce((sum, item) => sum + item.product.price, 0);
      const productIds = cartItems.map(({ product }) => product.id);
      const sellerIds = cartItems.map(({ product }) => product.sellerId).filter((id): id is string => Boolean(id));
      const categoryIds = cartItems.map(({ product }) => product.categoryId).filter((id): id is string => Boolean(id));
      const couponToApply = couponCode ?? cart?.couponCode ?? null;
      const couponValidation = couponToApply ? await validateCouponForCart({ code: couponToApply, userId: user.id, subtotal, productIds, sellerIds, categoryIds, checkUsageLimits: false }) : { valid: true, message: "No coupon applied", discount: 0, coupon: null } as const;
      if (!couponValidation.valid) return { error: couponValidation.message, code: "INVALID_COUPON" } as const;
      const discount = couponValidation.discount;
      const total = subtotal - discount;
      if (!Number.isSafeInteger(total) || total > 2_147_483_647 || !Number.isSafeInteger(total * MARKETPLACE_CURRENCY_MINOR_UNITS)) return { error: "The checkout total is outside the supported range.", code: "INVALID_TOTAL" } as const;
      if (total < 1) return { error: "Paystack checkout requires a total of at least ₦1.", code: "INVALID_TOTAL" } as const;

      const couponUsage = couponValidation.coupon
        ? await reserveCouponUsage(tx, {
          couponId: couponValidation.coupon.id,
          userId: user.id,
          discountAmount: discount,
        })
        : null;
      if (couponValidation.coupon && !couponUsage) {
        return { error: "Coupon usage limit reached. Remove the coupon or try a different one.", code: "INVALID_COUPON" } as const;
      }

      const createdOrder = await tx.order.create({
        data: {
          reference: orderReference,
          idempotencyKey,
          userId: user.id,
          subtotal,
          discount,
          couponCode: couponToApply,
          couponDiscountAmount: discount,
          total,
          currency: MARKETPLACE_CURRENCY,
          termsAcceptedAt: new Date(),
          items: { create: cartItems.map(({ product }) => ({ productId: product.id, sellerId: product.seller.id, productName: product.title, productSlug: product.slug, productType: product.productType, productVersion: product.version, licenseType: product.licenseType, sellerName: product.seller.sellerApplications[0]?.storeName || product.seller.name, priceAtPurchase: product.price, quantity: 1 })) },
          payments: { create: { providerReference: paymentReference, amountMinor: BigInt(total) * BigInt(MARKETPLACE_CURRENCY_MINOR_UNITS), currency: MARKETPLACE_CURRENCY } },
        },
        select: { id: true, reference: true, total: true },
      });
      if (couponUsage) {
        await tx.couponUsage.update({
          where: { id: couponUsage.id },
          data: { orderId: createdOrder.id },
        });
      }
      await createNotification(tx, {
        userId: user.id,
        type: "ORDER_CREATED",
        title: "Order created",
        message: `Order ${createdOrder.reference} is ready for payment.`,
        link: "/purchases",
      });
      return { order: createdOrder } as const;
    });

    if ("error" in created) return NextResponse.json({ message: created.error, code: created.code }, { status: 409 });
    await Promise.all([
      recordPolicyAcceptance({ userId: user.id, policyType: "TERMS", version: POLICY_VERSIONS.TERMS, source: "checkout" }),
      recordPolicyAcceptance({ userId: user.id, policyType: "REFUND_POLICY", version: POLICY_VERSIONS.REFUND_POLICY, source: "checkout" }),
    ]);
    order = created.order;
    amountMinor = BigInt(order.total) * BigInt(MARKETPLACE_CURRENCY_MINOR_UNITS);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const concurrent = await priorAttempt(user.id, idempotencyKey);
      if (concurrent) return existingAttemptResponse(concurrent);
    }
    return NextResponse.json({ message: "We could not prepare your order. Please refresh and try again." }, { status: 500 });
  }

  try {
    const initialized = await initializePaystackTransaction({ email: user.email, amountMinor, currency: MARKETPLACE_CURRENCY, reference: paymentReference, orderId: order.id, orderReference: order.reference });
    await db.$transaction([
      db.payment.update({ where: { providerReference: paymentReference }, data: { authorizationUrl: initialized.authorizationUrl } }),
      db.order.update({ where: { id: order.id }, data: { status: "PAYMENT_PROCESSING" } }),
    ]);
    return NextResponse.json({ authorizationUrl: initialized.authorizationUrl, orderId: order.id, orderReference: order.reference });
  } catch (error) {
    console.error("Paystack transaction initialization failed", error);
    const failed = await db.$transaction(async (tx) => {
      const orderUpdate = await tx.order.updateMany({ where: { id: order.id, status: { notIn: ["PAID", "FAILED"] } }, data: { status: "FAILED" } });
      await tx.payment.updateMany({ where: { providerReference: paymentReference, status: "PENDING" }, data: { status: "FAILED" } });
      if (orderUpdate.count) await releaseCouponUsage(tx, order.id);
      return orderUpdate.count > 0;
    });
    if (failed) {
      try {
        await createNotification(db, {
          userId: user.id,
          type: "PAYMENT_FAILED",
          title: "Payment could not be started",
          message: "We could not start the Paystack payment. Your cart is unchanged; try checkout again.",
          link: "/cart",
        });
      } catch (notificationError) {
        console.error("Failed to persist payment initialization notification", notificationError);
      }
      await sendNotificationEmail({
        userId: user.id,
        type: "PAYMENT_FAILED",
        title: "Payment could not be started",
        message: "We could not start the Paystack payment. Your cart is unchanged; try checkout again.",
        link: "/cart",
      });
    }
    return NextResponse.json({ message: "We could not start the Paystack payment. Your cart is unchanged; please try again." }, { status: 502 });
  }
}
