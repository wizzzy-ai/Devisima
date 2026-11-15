"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, Menu, X } from "lucide-react";

interface DashboardHeaderProps {
  onMobileMenuToggle?: () => void;
  isMobileMenuOpen?: boolean;
}

export function DashboardHeader({ onMobileMenuToggle, isMobileMenuOpen }: DashboardHeaderProps) {
  const { data: session } = useSession();
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const user = session?.user;
  const role = user?.role ?? "USER";
  const displayName = user?.name ?? "Your account";
  const initials = displayName.split(/\s+/).slice(0, 2).map((part: string) => part[0]).join("").toUpperCase();

  const accountDestination = role === "ADMIN" ? "/admin" : role === "SELLER" ? "/seller/dashboard" : "/dashboard";
  const accountLabel = role === "ADMIN" ? "Admin Dashboard" : role === "SELLER" ? "Seller Dashboard" : "Dashboard";

  async function logout() {
    try {
      await fetch("/api/accounts/logout", { method: "POST" });
    } finally {
      await signOut({ callbackUrl: "/" });
    }
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-card/80 backdrop-blur-lg">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors"
              onClick={onMobileMenuToggle}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <Link href="/" className="flex items-center gap-2 lg:hidden">
              <Image src="/logo.png" alt="Devisima" width={120} height={36} style={{ width: "auto", height: "36px" }} />
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="relative">
                <button
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                  className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {user?.image ? (
                      <Image src={user.image} width={32} height={32} unoptimized alt="" className="h-full w-full object-cover" />
                    ) : (
                      initials
                    )}
                  </div>
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </button>

                {isUserDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setIsUserDropdownOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-56 rounded-lg border bg-card shadow-lg py-2 z-20">
                      <div className="px-3 py-2 border-b">
                        <p className="text-sm font-semibold">{displayName}</p>
                        <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                      </div>
                      <Link
                        href="/profile"
                        className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
                        onClick={() => setIsUserDropdownOpen(false)}
                      >
                        Profile
                      </Link>
                      <Link
                        href="/settings"
                        className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
                        onClick={() => setIsUserDropdownOpen(false)}
                      >
                        Settings
                      </Link>
                      <Link
                        href="/purchases"
                        className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
                        onClick={() => setIsUserDropdownOpen(false)}
                      >
                        Purchases
                      </Link>
                      <Link
                        href="/wishlist"
                        className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
                        onClick={() => setIsUserDropdownOpen(false)}
                      >
                        Wishlist
                      </Link>
                      {role === "SELLER" && (
                        <Link
                          href="/seller/dashboard"
                          className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
                          onClick={() => setIsUserDropdownOpen(false)}
                        >
                          Seller Dashboard
                        </Link>
                      )}
                      {role === "ADMIN" && (
                        <Link
                          href="/admin"
                          className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
                          onClick={() => setIsUserDropdownOpen(false)}
                        >
                          Admin Dashboard
                        </Link>
                      )}
                      <div className="border-t mt-2 pt-2">
                        <button
                          onClick={() => {
                            logout();
                            setIsUserDropdownOpen(false);
                          }}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-muted transition-colors"
                        >
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
