import { ShoppingCart, Eye } from "lucide-react";

export function RecentOrders() {
  return (
    <div className="rounded-2xl border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Recent Orders</h2>
      </div>

      <div className="text-center py-12">
        <ShoppingCart className="mx-auto w-16 h-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">No orders yet</h3>
        <p className="text-sm text-muted-foreground">
          Order data will appear here once transactions begin.
        </p>
      </div>
    </div>
  );
}
