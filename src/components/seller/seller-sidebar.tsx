"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  DollarSign,
  Settings,
  Store,
  X,
} from "lucide-react";

interface SellerSidebarProps {
  isMobile?: boolean;
  onClose?: () => void;
}

export function SellerSidebar({ isMobile = false, onClose }: SellerSidebarProps) {
  const pathname = usePathname();

  const menuItems = [
    {
      label: "Dashboard",
      href: "/seller/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "My Products",
      href: "/seller/products",
      icon: Package,
    },
    {
      label: "Orders",
      href: "/seller/orders",
      icon: ShoppingCart,
    },
    {
      label: "Earnings",
      href: "/seller/earnings",
      icon: DollarSign,
    },
    {
      label: "Store Settings",
      href: "/seller/settings",
      icon: Store,
    },
    {
      label: "Settings",
      href: "/seller/account",
      icon: Settings,
    },
  ];

  return (
    <aside className={`flex flex-col w-64 h-screen bg-card border-r border-border ${isMobile ? '' : 'hidden lg:flex sticky top-16'}`}>
      <div className="flex-1 overflow-y-auto py-6">
        {isMobile && (
          <div className="px-6 mb-6 flex items-center justify-between">
            <h1 className="text-lg font-bold text-foreground">DEVISIMA</h1>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {!isMobile && (
          <div className="px-6 mb-6">
            <h1 className="text-lg font-bold text-foreground">DEVISIMA</h1>
            <p className="text-xs font-semibold text-muted-foreground tracking-widest uppercase">SELLER</p>
          </div>
        )}

        <nav className="px-3 space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive
                    ? "bg-primary/10 text-foreground font-medium"
                    : "text-muted-foreground hover:bg-muted text-foreground"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-border">
        <Link
          href="/marketplace"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-muted text-foreground transition-colors"
        >
          <Store className="w-5 h-5" />
          <span className="text-sm">View Marketplace</span>
        </Link>
      </div>
    </aside>
  );
}
