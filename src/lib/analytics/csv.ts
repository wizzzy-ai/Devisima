import "server-only";

import type { getSalesExportRows } from "@/lib/analytics";

export type SalesExportRow = Awaited<ReturnType<typeof getSalesExportRows>>[number];

export function salesRowsToCsv(rows: SalesExportRow[]) {
  const columns = ["created_at_utc", "order_reference", "product", "seller_id", "gross_revenue", "platform_commission", "seller_earnings", "currency"];
  const lines = rows.map((row) => [
    row.createdAt.toISOString(),
    row.order?.reference ?? "",
    row.product?.title ?? "",
    row.sellerId,
    row.grossAmount,
    row.commissionAmount,
    row.netAmount,
    row.currency,
  ].map(escapeCsv).join(","));
  return [columns.join(","), ...lines].join("\r\n");
}

function escapeCsv(value: string | number) {
  const safeValue = String(value).replace(/^[\s]*[=+\-@]/, (match) => `'${match}`);
  return `"${safeValue.replaceAll('"', '""')}"`;
}
