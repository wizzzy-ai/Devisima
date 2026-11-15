import { z } from "zod";

export const checkoutInitializationSchema = z.object({
  idempotencyKey: z.string().uuid(),
  expectedItems: z.array(z.object({ productId: z.string().cuid(), price: z.number().int().nonnegative() })).max(500),
  acceptedTerms: z.literal(true),
  couponCode: z.string().trim().max(64).optional().transform((value) => value ? value.toUpperCase() : undefined),
});

export const paystackReferenceSchema = z.string().min(8).max(100).regex(/^[A-Za-z0-9.=-]+$/);
