import { Plus, Package, ShoppingCart, DollarSign, Settings } from "lucide-react";
import Link from "next/link";

export function SellerQuickActions() {
  const actions = [
    { name: "Add Product", href: "/seller/products/new", icon: Plus, description: "Create a new product" },
    { name: "View Products", href: "/seller/products", icon: Package, description: "Manage your products" },
    { name: "View Orders", href: "/seller/orders", icon: ShoppingCart, description: "See recent orders" },
    { name: "View Earnings", href: "/seller/earnings", icon: DollarSign, description: "Track your revenue" },
    { name: "Manage Store", href: "/seller/settings", icon: Settings, description: "Store settings" },
  ];

  return (
    <div className="rounded-2xl border bg-card p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-foreground mb-6">Quick Actions</h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {actions.map((action) => (
          <Link
            key={action.name}
            href={action.href}
            className="flex items-start gap-4 p-4 rounded-xl border border-border/30 hover:bg-muted transition-all"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <action.icon className="w-5 h-5 text-foreground" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">{action.name}</h3>
              <p className="text-xs text-muted-foreground mt-1">{action.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
