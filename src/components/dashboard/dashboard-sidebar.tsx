"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  BarChart3,
  ShoppingBag,
  Download,
  Heart,
  MessageSquare,
  Store,
  Plus,
  Package,
  DollarSign,
  CreditCard,
  Settings,
  User,
  HelpCircle,
  LogOut,
  X,
} from "lucide-react";
import { useState } from "react";

interface DashboardSidebarProps {
  user: {
    name: string;
    email: string;
    role: "USER" | "SELLER" | "ADMIN";
    image?: string | null;
  };
  isMobile?: boolean;
  onClose?: () => void;
}

export function DashboardSidebar({ user, isMobile = false, onClose }: DashboardSidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const initials = user.name.split(/\s+/).slice(0, 2).map((part: string) => part[0]).join("").toUpperCase();

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  const mainLinks = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Marketplace", href: "/marketplace", icon: ShoppingBag },
    { name: "Purchases", href: "/purchases", icon: ShoppingBag },
    { name: "Downloads", href: "/downloads", icon: Download },
    { name: "Wishlist", href: "/wishlist", icon: Heart },
    { name: "Reviews", href: "/reviews", icon: MessageSquare },
  ];

  const sellerLinks =
    user.role === "SELLER"
      ? [
          { name: "Seller Dashboard", href: "/seller/dashboard", icon: Store },
          { name: "Analytics", href: "/seller/analytics", icon: BarChart3 },
          { name: "My Products", href: "/seller/products", icon: Package },
          { name: "Add Product", href: "/seller/products/new", icon: Plus },
          { name: "Orders", href: "/seller/orders", icon: ShoppingBag },
          { name: "Earnings", href: "/seller/earnings", icon: DollarSign },
          { name: "Payouts", href: "/seller/payouts", icon: CreditCard },
          { name: "Store Settings", href: "/seller/settings", icon: Settings },
        ]
      : user.role === "USER"
        ? [{ name: "Become a Seller", href: "/seller/apply", icon: Store }]
        : [];

  const accountLinks = [
    { name: "Profile", href: "/profile", icon: User },
    { name: "Settings", href: "/settings", icon: Settings },
    { name: "Help & Support", href: "/contact", icon: HelpCircle },
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

        <nav className="space-y-8 px-3">
          <div>
            <p className="px-3 mb-3 text-xs font-bold uppercase tracking-[0.18em] text-primary">Main</p>
            <ul className="space-y-1">
              {mainLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    onClick={handleLinkClick}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive(link.href)
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-foreground hover:bg-muted"
                    }`}
                  >
                    <link.icon className="w-4 h-4" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {sellerLinks.length > 0 && (
            <div>
              <p className="px-3 mb-3 text-xs font-bold uppercase tracking-[0.18em] text-primary">Seller</p>
              <ul className="space-y-1">
                {sellerLinks.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      onClick={handleLinkClick}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        isActive(link.href)
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-foreground hover:bg-muted"
                      }`}
                    >
                      <link.icon className="w-4 h-4" />
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <p className="px-3 mb-3 text-xs font-bold uppercase tracking-[0.18em] text-primary">Account</p>
            <ul className="space-y-1">
              {accountLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    onClick={handleLinkClick}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive(link.href)
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-foreground hover:bg-muted"
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

      <div className="border-t border-border px-6 py-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-sm">
            {user.image ? (
              <Image src={user.image} width={44} height={44} unoptimized alt="" className="h-full w-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate text-foreground">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        </div>
        <button
          onClick={() => {
            logout();
            if (isMobile && onClose) onClose();
          }}
          className="flex items-center gap-2 w-full px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
