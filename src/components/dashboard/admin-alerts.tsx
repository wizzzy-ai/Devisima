import { CheckCircle2, AlertTriangle, Clock, BarChart3, Package, ShoppingCart } from "lucide-react";
import Link from "next/link";

export function AdminAlerts() {
  const alerts = [
    {
      type: "success",
      title: "Everything is up to date",
      description: "No pending items require your attention at this time.",
      icon: CheckCircle2,
    },
  ];

  return (
    <div className="rounded-2xl border bg-card p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-foreground mb-6">Admin Alerts</h2>

      <div className="space-y-4">
        {alerts.map((alert) => (
          <div
            key={alert.title}
            className="flex items-start gap-4 p-4 rounded-xl bg-muted/50"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
              <alert.icon className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-foreground">{alert.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{alert.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/admin/seller-applications"
          className="flex items-center gap-2 p-3 rounded-lg border hover:bg-muted transition-colors"
        >
          <AlertTriangle className="w-4 h-4 text-yellow-600" />
          <span className="text-sm font-medium">Review Sellers</span>
        </Link>
        <Link
          href="/admin/products"
          className="flex items-center gap-2 p-3 rounded-lg border hover:bg-muted transition-colors"
        >
          <Package className="w-4 h-4 text-foreground" />
          <span className="text-sm font-medium">Review Products</span>
        </Link>
        <Link
          href="/admin/orders"
          className="flex items-center gap-2 p-3 rounded-lg border hover:bg-muted transition-colors"
        >
          <ShoppingCart className="w-4 h-4 text-foreground" />
          <span className="text-sm font-medium">Manage Orders</span>
        </Link>
        <Link
          href="/admin/reports"
          className="flex items-center gap-2 p-3 rounded-lg border hover:bg-muted transition-colors"
        >
          <BarChart3 className="w-4 h-4 text-foreground" />
          <span className="text-sm font-medium">View Reports</span>
        </Link>
      </div>
    </div>
  );
}
