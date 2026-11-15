import "server-only";
import { getAppUrl } from "@/lib/app-url";

const PAYSTACK_API = "https://api.paystack.co";

function secretKey() {
  const key = process.env.PAYSTACK_SECRET_KEY?.trim();
  if (!key) throw new Error("Payment service is not configured.");
  return key;
}

async function paystackRequest<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${PAYSTACK_API}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${secretKey()}`, "Content-Type": "application/json", ...init.headers },
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  const payload = await response.json().catch(() => null) as { status?: boolean; data?: T } | null;
  if (!response.ok || payload?.status !== true || payload.data === undefined) {
    throw new Error("The payment provider could not complete the request.");
  }
  return payload.data;
}

export async function initializePaystackTransaction(input: {
  email: string;
  amountMinor: bigint;
  currency: string;
  reference: string;
  orderId: string;
  orderReference: string;
}) {
  const callbackOverride = process.env.PAYSTACK_CALLBACK_URL?.trim();
  const callbackUrl = callbackOverride || getAppUrl("/checkout/callback").toString();
  const appOrigin = getAppUrl("/").origin;
  try {
    const parsedCallback = new URL(callbackUrl);
    const isLocalDevelopment = process.env.NODE_ENV !== "production" && parsedCallback.hostname === "localhost";
    if ((!isLocalDevelopment && parsedCallback.protocol !== "https:") || parsedCallback.origin !== appOrigin || parsedCallback.pathname !== "/checkout/callback" || parsedCallback.search || parsedCallback.hash) {
      throw new Error("Invalid callback URL.");
    }
  } catch {
    throw new Error("Payment callback is not configured.");
  }

  const data = await paystackRequest<{ authorization_url: string; access_code: string; reference: string }>("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email: input.email,
      amount: input.amountMinor.toString(),
      currency: input.currency,
      reference: input.reference,
      callback_url: callbackUrl,
      metadata: { order_id: input.orderId, order_reference: input.orderReference },
    }),
  });
  let authorizationUrl: URL;
  try { authorizationUrl = new URL(data.authorization_url); } catch { throw new Error("The payment provider returned an invalid checkout link."); }
  if (authorizationUrl.protocol !== "https:" || authorizationUrl.hostname !== "checkout.paystack.com" || data.reference !== input.reference) {
    throw new Error("The payment provider returned an invalid checkout response.");
  }
  return { authorizationUrl: authorizationUrl.toString(), accessCode: data.access_code };
}

export type VerifiedPaystackTransaction = {
  id: number;
  reference: string;
  status: string;
  amount: number;
  currency: string;
};

export function verifyPaystackTransaction(reference: string) {
  return paystackRequest<VerifiedPaystackTransaction>(`/transaction/verify/${encodeURIComponent(reference)}`, { method: "GET" });
}
