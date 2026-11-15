import "server-only";
import type { BankOption, PayoutProvider, ResolvedBankAccount, TransferResult } from "./provider";

const API = "https://api.paystack.co";

function secret() {
  const value = process.env.PAYSTACK_SECRET_KEY?.trim();
  if (!value) throw new Error("Payout provider is not configured.");
  return value;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${secret()}`, "Content-Type": "application/json", ...init.headers },
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  const body = await response.json().catch(() => null) as { status?: boolean; data?: T } | null;
  if (!response.ok || body?.status !== true || body.data === undefined) throw new Error("Payout provider request failed.");
  return body.data;
}

type PaystackTransfer = { reference: string; status: string; transfer_code?: string | null; amount: number; currency: string };

function transferResult(data: PaystackTransfer): TransferResult {
  return { reference: data.reference, status: data.status, transferCode: data.transfer_code ?? null, amount: data.amount, currency: data.currency };
}

export const paystackPayoutProvider: PayoutProvider = {
  async listBanks() {
    const rows = await request<Array<{ name: string; code: string; active: boolean }>>("/bank?country=nigeria&perPage=100");
    return rows.filter((bank) => bank.active && bank.code).map(({ name, code }) => ({ name, code }));
  },
  async resolveAccount(accountNumber: string, bankCode: string) {
    const query = new URLSearchParams({ account_number: accountNumber, bank_code: bankCode });
    const data = await request<{ account_name: string; account_number: string }>(`/bank/resolve?${query}`);
    return { accountName: data.account_name, accountNumber: data.account_number } satisfies ResolvedBankAccount;
  },
  async createRecipient(input) {
    const data = await request<{ recipient_code: string; details?: { bank_name?: string | null } }>("/transferrecipient", {
      method: "POST",
      body: JSON.stringify({ type: "nuban", name: input.accountName, account_number: input.accountNumber, bank_code: input.bankCode, currency: "NGN", email: input.email }),
    });
    if (!data.recipient_code) throw new Error("Payout provider returned an invalid recipient.");
    return { recipientCode: data.recipient_code, bankName: data.details?.bank_name || "" };
  },
  async initiateTransfer(input) {
    const data = await request<PaystackTransfer>("/transfer", {
      method: "POST",
      body: JSON.stringify({ source: "balance", amount: input.amountMinor, recipient: input.recipientCode, reference: input.reference, reason: input.reason, currency: "NGN" }),
    });
    return transferResult(data);
  },
  async verifyTransfer(reference: string) {
    const data = await request<PaystackTransfer>(`/transfer/verify/${encodeURIComponent(reference)}`);
    return transferResult(data);
  },
};
