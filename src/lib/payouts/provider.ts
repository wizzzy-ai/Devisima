export type BankOption = { name: string; code: string };
export type ResolvedBankAccount = { accountName: string; accountNumber: string };
export type TransferResult = { reference: string; status: string; transferCode: string | null; amount: number; currency: string };

export interface PayoutProvider {
  listBanks(): Promise<BankOption[]>;
  resolveAccount(accountNumber: string, bankCode: string): Promise<ResolvedBankAccount>;
  createRecipient(input: { accountName: string; accountNumber: string; bankCode: string; email: string }): Promise<{ recipientCode: string; bankName: string }>;
  initiateTransfer(input: { amountMinor: number; recipientCode: string; reference: string; reason: string }): Promise<TransferResult>;
  verifyTransfer(reference: string): Promise<TransferResult>;
}
