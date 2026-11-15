"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { User, Shield, Bell, Settings, LayoutDashboard, PlusCircle, CreditCard, LogOut, Building2, Menu, X, LucideIcon, ShoppingBag, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { SignOutDialog } from "@/components/profile/sign-out-dialog";

interface ProfileSidebarProps {
  user: {
    name: string;
    email: string;
    role: "USER" | "SELLER" | "ADMIN";
    image: string | null;
    createdAt: Date;
  };
  sellerApplicationStatus?: "PENDING" | "APPROVED" | "REJECTED" | null;
}

function NavLink({ href, icon: Icon, children }: { href: string; icon: LucideIcon; children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
        pathname === href ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <Icon className="w-4 h-4" />
      {children}
    </Link>
  );
}

export function ProfileSidebar({ user, sellerApplicationStatus }: ProfileSidebarProps) {
  const router = useRouter();
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const initials = user.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  const roleLabel = user.role === "USER" ? "Buyer" : user.role === "SELLER" ? "Seller" : "Administrator";
  const joinDate = new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(user.createdAt);

  async function handleSignOut() {
    await fetch("/api/accounts/logout", { method: "POST" });
    router.push("/");
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
      >
        {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        <span>Menu</span>
      </button>

      <aside className={cn(
        "w-full space-y-5 lg:sticky lg:top-24 lg:w-72 lg:shrink-0 lg:self-start",
        isMobileMenuOpen ? "block" : "hidden lg:block"
      )}>
        {/* Profile Identity */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-4">
            {user.image ? (
              <Image src={user.image} alt="" width={64} height={64} unoptimized className="h-16 w-16 rounded-full object-cover" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-xl font-semibold text-primary">
                {initials}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate">{user.name}</h3>
              <p className="text-sm text-muted-foreground truncate">{user.email}</p>
              <div className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-foreground">
                {roleLabel}
              </div>
            </div>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">Member since {joinDate}</p>
          <Link href="/profile" className="mt-4 block w-full rounded-xl border border-border bg-background px-4 py-2.5 text-center text-sm font-semibold text-foreground transition-colors hover:bg-muted">
            Edit Profile
          </Link>
        </div>

      {/* Navigation */}
      <nav className="space-y-6">
        {/* Account Settings */}
        <div>
          <h4 className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Account settings</h4>
          <div className="space-y-1 rounded-2xl border border-border bg-card p-2">
            <NavLink href="/profile" icon={User}>Profile</NavLink>
            <NavLink href="/profile/security" icon={Shield}>Security</NavLink>
            <NavLink href="/profile/notifications" icon={Bell}>Notifications</NavLink>
            <NavLink href="/profile/preferences" icon={Settings}>Preferences</NavLink>
          </div>
        </div>

        {/* Seller Settings */}
        {user.role === "SELLER" && (
          <div>
            <h4 className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Seller settings</h4>
            <div className="space-y-1 rounded-2xl border border-border bg-card p-2">
              <NavLink href="/seller/settings" icon={Settings}>Store Settings</NavLink>
              <NavLink href="/seller/payouts" icon={CreditCard}>Payout Settings</NavLink>
            </div>
          </div>
        )}

        {/* User who wants to become seller */}
        {user.role === "USER" && (
          <div>
            <h4 className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Seller</h4>
            {sellerApplicationStatus === "PENDING" ? (
              <div className="px-3 py-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Building2 className="w-4 h-4" />
                  Seller Application
                </div>
                <div className="mt-1 ml-7 inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                  Pending
                </div>
              </div>
            ) : (
              <NavLink href="/seller/apply" icon={PlusCircle}>Become a Seller</NavLink>
            )}
          </div>
        )}

        {/* Quick Links to Dashboard */}
        <div>
          <h4 className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Activity</h4>
          <div className="space-y-1 rounded-2xl border border-border bg-card p-2">
            <NavLink href="/dashboard" icon={LayoutDashboard}>Go to Dashboard</NavLink>
            <NavLink href="/purchases" icon={ShoppingBag}>Purchases</NavLink>
            <NavLink href="/downloads" icon={Download}>Downloads</NavLink>
            <NavLink href="/notifications" icon={Bell}>Notifications</NavLink>
          </div>
        </div>

        {/* Sign Out */}
        <div className="pt-4 border-t border-border">
          <button
            onClick={() => setShowSignOutDialog(true)}
            className="flex w-full items-center gap-3 px-3 py-2 text-sm font-medium text-muted-foreground rounded-lg hover:bg-red-50 hover:text-red-700 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </nav>

      <SignOutDialog
        isOpen={showSignOutDialog}
        onClose={() => setShowSignOutDialog(false)}
        onConfirm={handleSignOut}
      />
    </aside>
    </>
  );
}
