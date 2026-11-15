import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

type RevenuePoint = { date: string; gross: number; commission: number; earnings: number };

export function AdminRevenuePreview({ data }: { data: RevenuePoint[] }) {
  const max = Math.max(1, ...data.flatMap((point) => [point.gross, point.commission, point.earnings]));
  const line = (key: keyof Pick<RevenuePoint, "gross" | "commission" | "earnings">) =>
    data.map((point, index) => `${data.length > 1 ? (index / (data.length - 1)) * 640 : 320},${180 - (point[key] / max) * 160}`).join(" ");
  const hasRevenue = data.some((point) => point.gross > 0);

  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-start justify-between gap-3">
        <div><h2 className="text-lg font-semibold text-foreground">Marketplace revenue</h2><p className="mt-1 text-xs text-muted-foreground">Verified sales · last 30 days</p></div>
        <Link href="/admin/analytics" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">Analytics <ArrowUpRight className="h-4 w-4" /></Link>
      </div>
      {hasRevenue ? (
        <>
          <svg viewBox="0 0 640 200" role="img" aria-label="Revenue trends over the last 30 days" className="mt-5 h-48 w-full overflow-visible">
            <line x1="0" y1="180" x2="640" y2="180" stroke="currentColor" className="text-border" />
            <polyline points={line("gross")} fill="none" stroke="#0F4C5C" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
            <polyline points={line("commission")} fill="none" stroke="#35D0BA" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
            <polyline points={line("earnings")} fill="none" stroke="#d99b3d" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
          </svg>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
            <Legend color="#0F4C5C" label="Gross revenue" />
            <Legend color="#35D0BA" label="Commission" />
            <Legend color="#d99b3d" label="Seller earnings" />
          </div>
        </>
      ) : (
        <p className="py-14 text-center text-sm text-muted-foreground">Verified sales will appear here when they occur.</p>
      )}
    </section>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return <span className="inline-flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />{label}</span>;
}
