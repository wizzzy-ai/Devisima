"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import {
  LayoutDashboard,
  BarChart3,
  Users,
  Store,
  Package,
  ShoppingCart,
  CreditCard,
  DollarSign,
  Undo2,
  Tag,
  MessageSquare,
  AlertTriangle,
  Bell,
  Settings,
  FileText,
  LogOut,
  X,
  ArrowLeft,
} from "lucide-react";

interface AdminSidebarProps {
  user: {
    name: string;
    email: string;
    role: "USER" | "SELLER" | "ADMIN";
    image?: string | null;
  };
  isMobile?: boolean;
  onClose?: () => void;
}

export function AdminSidebar({ user, isMobile = false, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const initials = user.name.split(/\s+/).slice(0, 2).map((part: string) => part[0]).join("").toUpperCase();

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  const overviewLinks = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  ];

  const marketplaceLinks = [
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Sellers", href: "/admin/sellers", icon: Store },
    { name: "Seller Applications", href: "/admin/seller-applications", icon: Store },
    { name: "Products", href: "/admin/products", icon: Package },
    { name: "Categories", href: "/admin/categories", icon: Tag },
    { name: "Orders", href: "/admin/orders", icon: ShoppingCart },
    { name: "Reviews", href: "/admin/reviews", icon: MessageSquare },
  ];

  const financeLinks = [
    { name: "Payments", href: "/admin/payments", icon: CreditCard },
    { name: "Refunds", href: "/admin/refunds", icon: Undo2 },
    { name: "Payouts", href: "/admin/payouts", icon: DollarSign },
    { name: "Earnings reconciliation", href: "/admin/earnings/reconciliation", icon: DollarSign },
  ];

  const growthLinks = [
    { name: "Coupons", href: "/admin/coupons", icon: Tag },
    { name: "Featured Products", href: "/admin/featured", icon: Package },
    { name: "Reports", href: "/admin/reports", icon: FileText },
  ];

  const systemLinks = [
    { name: "Notifications", href: "/admin/notifications", icon: Bell },
    { name: "Settings", href: "/admin/settings", icon: Settings },
    { name: "Audit Logs", href: "/admin/audit-logs", icon: FileText },
  ];

  async function logout() {
    try {
      await fetch("/api/accounts/logout", { method: "POST" });
    } finally {
      await signOut({ callbackUrl: "/" });
    }
  }

  const handleLinkClick = () => {
    if (isMobile && onClose) {
      onClose();
    }
  };

  return (
    <aside className={`flex flex-col w-64 h-screen bg-card border-r border-border ${isMobile ? '' : 'hidden lg:flex sticky top-0'}`}>
      <div className="flex-1 overflow-y-auto py-6">
        {isMobile && (
          <div className="px-6 mb-6 flex items-center justify-between">
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
            <p className="text-xs font-semibold text-muted-foreground tracking-widest uppercase">ADMIN PANEL</p>
          </div>
        )}

        <nav className="space-y-6 px-3">
          <div>
            <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Overview</p>
            <ul className="space-y-1">
              {overviewLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    onClick={handleLinkClick}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive(link.href) ? "bg-primary/10 text-foreground" : "text-foreground hover:bg-muted"
                    }`}
                  >
                    <link.icon className="w-4 h-4" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Marketplace</p>
            <ul className="space-y-1">
              {marketplaceLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    onClick={handleLinkClick}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive(link.href) ? "bg-primary/10 text-foreground" : "text-foreground hover:bg-muted"
                    }`}
                  >
                    <link.icon className="w-4 h-4" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Finance</p>
            <ul className="space-y-1">
              {financeLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    onClick={handleLinkClick}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive(link.href) ? "bg-primary/10 text-foreground" : "text-foreground hover:bg-muted"
                    }`}
                  >
                    <link.icon className="w-4 h-4" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Growth</p>
            <ul className="space-y-1">
              {growthLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    onClick={handleLinkClick}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive(link.href) ? "bg-primary/10 text-foreground" : "text-foreground hover:bg-muted"
                    }`}
                  >
                    <link.icon className="w-4 h-4" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">System</p>
            <ul className="space-y-1">
              {systemLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    onClick={handleLinkClick}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive(link.href) ? "bg-primary/10 text-foreground" : "text-foreground hover:bg-muted"
                    }`}
                  >
                    <link.icon className="w-4 h-4" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </div>

      <div className="border-t border-border px-6 py-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-primary text-sm font-bold text-primary-foreground">
            {user.image ? (
              <Image src={user.image} width={40} height={40} unoptimized alt="" className="h-full w-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">Administrator</p>
          </div>
        </div>
        <Link
          href="/marketplace"
          className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Marketplace
        </Link>
        <button
          onClick={() => {
            logout();
            if (isMobile && onClose) onClose();
          }}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
