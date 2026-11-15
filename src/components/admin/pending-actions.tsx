import { AlertTriangle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/db/prisma";
import { SellerApplicationStatus } from "@prisma/client";

interface PendingAction {
  title: string;
  count: number;
  href: string;
  icon: React.ReactNode;
}

export async function PendingActions() {
  const pendingApplications = await db.sellerApplication.count({
    where: { status: SellerApplicationStatus.PENDING },
  });

  const pendingActions: PendingAction[] = [
    {
      title: "Seller Applications",
      count: pendingApplications,
      href: "/admin/seller-applications",
      icon: <AlertTriangle className="w-5 h-5" />,
    },
    {
      title: "Products Awaiting Review",
      count: 0,
      href: "/admin/products",
      icon: <AlertTriangle className="w-5 h-5" />,
    },
    {
      title: "Refund Requests",
      count: 0,
      href: "/admin/refunds",
      icon: <AlertTriangle className="w-5 h-5" />,
    },
    {
      title: "Payout Requests",
      count: 0,
      href: "/admin/payouts",
      icon: <AlertTriangle className="w-5 h-5" />,
    },
  ];

  const totalPending = pendingActions.reduce((sum, action) => sum + action.count, 0);

  if (totalPending === 0) {
    return (
      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Requires Attention</h2>
        </div>
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">All systems operational. No pending actions.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Requires Attention</h2>
        <span className="text-sm font-medium text-foreground">{totalPending} pending</span>
      </div>

      <div className="space-y-3">
        {pendingActions.map((action) => (
          action.count > 0 ? (
            <Link
              key={action.title}
              href={action.href}
              className="flex items-center justify-between p-3 rounded-lg border border-border/30 hover:bg-muted transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100">
                  {action.icon}
                </div>
                <span className="text-sm font-medium">{action.title}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">{action.count}</span>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </Link>
          ) : null
        ))}
      </div>
    </div>
  );
}
