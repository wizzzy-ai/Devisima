export const MARKETPLACE_CURRENCY = "NGN" as const;
export const MARKETPLACE_CURRENCY_MINOR_UNITS = 100;

export function formatMarketplaceMoney(amount: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: MARKETPLACE_CURRENCY, maximumFractionDigits: 0 }).format(amount);
}
