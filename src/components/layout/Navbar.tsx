"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  ClipboardList,
  ChevronDown,
  Heart,
  LayoutDashboard,
  LogOut,
  PackageCheck,
  Shapes,
  ShoppingCart,
  Store,
  Tag,
  Users,
  UserRound,
  UserRoundPlus,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import { NotificationBell } from "@/components/notifications/NotificationBell";

export function Navbar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuTriggerRef = useRef<HTMLButtonElement>(null);
  const mobileMenuCloseRef = useRef<HTMLButtonElement>(null);
  const accountDropdownTriggerRef = useRef<HTMLButtonElement>(null);
  const { data: session, status } = useSession();
  const [cartCount, setCartCount] = useState(0);
  const isSignedIn = status === "authenticated";
  const role = session?.user?.role ?? "USER";
  const displayName = session?.user?.name ?? "Your account";
  const initials = displayName.split(/\s+/).slice(0, 2).map((part: string) => part[0]).join("").toUpperCase();
  const isDashboard = pathname === "/dashboard" || pathname.startsWith("/dashboard/");
  const accountDestination = role === "ADMIN" ? "/admin" : role === "SELLER" ? "/seller/dashboard" : "/dashboard";
  const dashboardLabel = role === "ADMIN" ? "Admin Panel" : role === "SELLER" ? "Seller Dashboard" : "Dashboard";

  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const menuTrigger = mobileMenuTriggerRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    mobileMenuCloseRef.current?.focus();

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMobileMenuOpen(false);

      if (event.key === "Tab" && mobileMenuRef.current) {
        const focusable = Array.from(
          mobileMenuRef.current.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
          ),
        ).filter((element) => element.tabIndex >= 0);
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    const desktopBreakpoint = window.matchMedia("(min-width: 80rem)");
    const closeOnDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) setIsMobileMenuOpen(false);
    };

    document.addEventListener("keydown", closeOnEscape);
    desktopBreakpoint.addEventListener("change", closeOnDesktop);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
      desktopBreakpoint.removeEventListener("change", closeOnDesktop);
      if (menuTrigger?.getClientRects().length) {
        menuTrigger.focus();
      }
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    if (!isSignedIn || role === "ADMIN") return;
    let mounted = true;
    const refreshCartCount = async () => {
      try {
        const response = await fetch("/api/cart/count", { cache: "no-store" });
        if (!response.ok) return;
        const result = await response.json() as { count?: number };
        if (mounted) setCartCount(typeof result.count === "number" ? result.count : 0);
      } catch { /* The count can be refreshed by navigating or changing the cart later. */ }
    };
    refreshCartCount();
    window.addEventListener("devisima:cart-updated", refreshCartCount);
    return () => {
      mounted = false;
      window.removeEventListener("devisima:cart-updated", refreshCartCount);
    };
  }, [isSignedIn, role]);
  async function logout() {
    try { await fetch("/api/accounts/logout", { method: "POST" }); }
    finally { await signOut({ callbackUrl: "/" }); }
  }

  const navLinks = !isSignedIn
    ? [
      { name: "Marketplace", href: "/marketplace" },
      { name: "Categories", href: "/categories" },
      { name: "Deals", href: "/deals" },
      { name: "Resources", href: "/resources" },
    ]
    : role === "ADMIN"
      ? [
        { name: "Marketplace", href: "/marketplace" },
        { name: "Admin Dashboard", href: "/admin" },
        { name: "Users", href: "/admin/users" },
        { name: "Seller Applications", href: "/admin/seller-applications" },
        { name: "Products", href: "/admin/products" },
        { name: "Orders", href: "/admin/orders" },
        { name: "Payouts", href: "/admin/payouts" },
        { name: "Reports", href: "/admin/reports" },
      ]
      : role === "SELLER"
        ? [
          { name: "Marketplace", href: "/marketplace" },
          { name: "Wishlist", href: "/wishlist" },
          { name: "Purchases", href: "/purchases" },
          { name: "Seller Dashboard", href: "/seller/dashboard" },
          { name: "My Products", href: "/seller/products" },
          { name: "Orders", href: "/seller/orders" },
          { name: "Earnings", href: "/seller/earnings" },
        ]
        : [
          { name: "Marketplace", href: "/marketplace" },
          { name: "Wishlist", href: "/wishlist" },
          { name: "Purchases", href: "/purchases" },
          { name: "Become a Seller", href: "/seller/apply" },
        ];

  const navIcons: Record<string, LucideIcon> = {
    Marketplace: Store,
    Categories: Shapes,
    Deals: Tag,
    Resources: BookOpen,
    Wishlist: Heart,
    Purchases: PackageCheck,
    "Become a Seller": UserRoundPlus,
    "Admin Dashboard": LayoutDashboard,
    Users,
    "Seller Applications": UserRoundPlus,
    Products: PackageCheck,
    "My Products": PackageCheck,
    Orders: ClipboardList,
    Payouts: Wallet,
    Reports: BarChart3,
    "Seller Dashboard": LayoutDashboard,
    Earnings: Wallet,
  };

  const activeLinkHref = navLinks
    .filter(({ href }) => pathname === href || pathname.startsWith(`${href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;
  const isCurrentLink = (href: string) => activeLinkHref === href;
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <>
      <nav aria-label="Main navigation" className="fixed inset-x-0 top-0 z-50 w-full bg-transparent">
        <div className="mx-auto w-full max-w-[1600px] px-3 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            <Link href="/" className="flex shrink-0 items-center gap-2" onClick={closeMobileMenu}>
              <Image src="/logo.png" alt="Devisima" width={160} height={48} className="h-8 w-auto sm:h-10" />
              {isDashboard && <span className="hidden text-sm font-medium text-muted-foreground sm:inline">Dashboard</span>}
            </Link>

            <div className="hidden min-w-0 flex-1 items-center justify-center gap-3 xl:flex">
              {navLinks.map((link) => {
                const Icon = navIcons[link.name];
                const isActive = isCurrentLink(link.href);
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    aria-current={isActive ? "page" : undefined}
                    className={`inline-flex min-h-10 items-center gap-2 whitespace-nowrap rounded-lg px-3 text-sm font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                      isActive ? "text-primary" : "text-muted-foreground hover:text-primary"
                    }`}
                  >
                    {Icon && <Icon aria-hidden="true" className="h-4 w-4" />}
                    {link.name}
                  </Link>
                );
              })}
            </div>

            <div className="flex shrink-0 items-center gap-0 sm:gap-2">
              {isSignedIn && <NotificationBell />}
              {isSignedIn && role !== "ADMIN" && (
                <Link
                  href="/cart"
                  aria-label={`Cart, ${cartCount} ${cartCount === 1 ? "item" : "items"}`}
                  className="relative grid h-10 w-10 place-items-center rounded-xl text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <ShoppingCart aria-hidden="true" className="h-5 w-5" />
                  {cartCount > 0 && (
                    <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-primary-foreground">
                      {cartCount > 99 ? "99+" : cartCount}
                    </span>
                  )}
                </Link>
              )}

              <div className="hidden items-center gap-2 xl:flex">
                {!isSignedIn ? (
                  <>
                    <Link
                      href="/login"
                      className="group relative inline-flex h-10 items-center rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    >
                      <span aria-hidden="true" className="absolute left-1 top-1 h-full w-full rounded bg-[#0F4C5C]" />
                      <span className="relative inline-flex h-10 items-center rounded border-2 border-[#0F4C5C] bg-white px-3 text-sm font-bold text-[#0F4C5C] transition-colors group-hover:bg-[#f7f8f6]">
                        Sign In
                      </span>
                    </Link>
                    <Link
                      href="/register"
                      className="group relative inline-flex h-10 items-center rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    >
                      <span aria-hidden="true" className="absolute left-1 top-1 h-full w-full rounded bg-[#35D0BA]" />
                      <span className="relative inline-flex h-10 items-center gap-2 rounded border-2 border-white bg-[#0F4C5C] px-4 text-sm font-bold text-white transition-colors group-hover:bg-[#35D0BA] group-hover:text-[#0F4C5C]">
                        Get Started <ArrowRight aria-hidden="true" className="h-4 w-4" />
                      </span>
                    </Link>
                  </>
                ) : (
                  <div className="relative">
                    <button
                      ref={accountDropdownTriggerRef}
                      type="button"
                      onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                      aria-expanded={isUserDropdownOpen}
                      aria-controls="account-menu"
                      className="flex h-10 items-center gap-2 rounded-xl px-2 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                        {session?.user?.image ? (
                          <Image src={session.user.image} width={32} height={32} unoptimized alt="" className="h-full w-full object-cover" />
                        ) : initials}
                      </span>
                      <span className="hidden max-w-28 truncate text-sm font-medium lg:block">{displayName}</span>
                      <ChevronDown aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
                    </button>

                    {isUserDropdownOpen && (
                      <>
                        <button
                          type="button"
                          aria-label="Close account menu"
                          className="fixed inset-0 z-10 cursor-default"
                          onClick={() => {
                            setIsUserDropdownOpen(false);
                            accountDropdownTriggerRef.current?.focus();
                          }}
                        />
                        <div
                          id="account-menu"
                          role="group"
                          aria-label="Account actions"
                          onKeyDown={(event) => {
                            if (event.key === "Escape") {
                              setIsUserDropdownOpen(false);
                              accountDropdownTriggerRef.current?.focus();
                            }
                          }}
                          className="absolute right-0 top-full z-20 mt-2 w-56 rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-lg"
                        >
                          <Link
                            href={accountDestination}
                            className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-muted"
                            onClick={() => setIsUserDropdownOpen(false)}
                          >
                            <LayoutDashboard aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
                            {dashboardLabel}
                          </Link>
                          <Link
                            href="/profile"
                            className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-muted"
                            onClick={() => setIsUserDropdownOpen(false)}
                          >
                            <UserRound aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
                            Profile
                          </Link>
                          <div className="my-1 border-t border-border" />
                          <button
                            type="button"
                            onClick={() => {
                              setIsUserDropdownOpen(false);
                              void logout();
                            }}
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-destructive transition-colors hover:bg-muted"
                          >
                            <LogOut aria-hidden="true" className="h-4 w-4" />
                            Sign Out
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              <button
                ref={mobileMenuTriggerRef}
                type="button"
                className="group relative grid h-11 w-11 place-items-center rounded-[4px] border-2 border-[#0F4C5C] bg-white text-[#0F4C5C] shadow-[4px_4px_0_#0F4C5C] transition-all hover:-translate-y-0.5 hover:bg-[#f7f8f6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 xl:hidden"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
                aria-expanded={isMobileMenuOpen}
                aria-controls="mobile-menu"
              >
                <span aria-hidden="true" className="relative block h-5 w-5">
                  <span className={`absolute left-0 h-0.5 w-5 rounded-full bg-current transition-all duration-200 ease-out ${isMobileMenuOpen ? "top-1/2 -translate-y-1/2 rotate-45" : "top-[3px]"}`} />
                  <span className={`absolute left-0 h-0.5 w-5 rounded-full bg-current transition-all duration-200 ease-out ${isMobileMenuOpen ? "top-1/2 -translate-y-1/2 -rotate-45" : "top-[13px]"}`} />
                </span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div
          id="mobile-menu"
          ref={mobileMenuRef}
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation"
          aria-hidden={!isMobileMenuOpen}
          inert={!isMobileMenuOpen}
          className={`fixed inset-0 z-[75] transition-opacity duration-200 motion-reduce:transition-none xl:hidden ${
            isMobileMenuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          <button
            type="button"
            tabIndex={-1}
            aria-label="Close navigation menu"
            onClick={closeMobileMenu}
            className="absolute inset-0 bg-foreground/30 backdrop-blur-sm"
          />
          <div
            className={`absolute inset-y-0 right-0 flex h-full w-[min(22rem,90vw)] flex-col border-l border-border bg-background shadow-xl transition-transform duration-300 ease-out motion-reduce:transition-none ${
              isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-border/70 px-4 sm:px-6">
              <Link href="/" className="flex items-center" onClick={closeMobileMenu}>
                <Image src="/logo.png" alt="Devisima" width={160} height={48} className="h-8 w-auto sm:h-9" />
              </Link>
              <button
                ref={mobileMenuCloseRef}
                type="button"
                onClick={closeMobileMenu}
                aria-label="Close menu"
                className="grid h-11 w-11 place-items-center rounded-xl text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <X aria-hidden="true" className="h-5 w-5" />
              </button>
            </div>

            <div className="mx-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col">
              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
                <p className="px-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  {isSignedIn ? "Your workspace" : "Explore Devisima"}
                </p>
                <nav aria-label="Mobile primary navigation" className="mt-2 space-y-1">
                {navLinks.map((link) => {
                  const Icon = navIcons[link.name];
                  const isActive = isCurrentLink(link.href);
                  return (
                    <Link
                      key={link.name}
                      href={link.href}
                      aria-current={isActive ? "page" : undefined}
                      onClick={closeMobileMenu}
                      className={`group flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                        isActive ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted"
                      }`}
                    >
                      {Icon && <Icon aria-hidden="true" className={`h-[18px] w-[18px] ${isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`} />}
                      {link.name}
                    </Link>
                  );
                })}
                </nav>

                {isDashboard && (
                  <p className="mt-3 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground">
                    {dashboardLabel}
                  </p>
                )}
              </div>

              <div className="shrink-0 border-t border-border bg-background px-4 py-4 sm:px-6">
                <p className="px-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  {isSignedIn ? "Account" : "Get started"}
                </p>
                {!isSignedIn ? (
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <Link
                      href="/login"
                      onClick={closeMobileMenu}
                      className="group relative inline-flex w-full rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    >
                      <span aria-hidden="true" className="absolute left-1 top-1 h-full w-full rounded bg-[#0F4C5C]" />
                      <span className="relative inline-flex min-h-11 w-full items-center justify-center rounded border-2 border-[#0F4C5C] bg-white px-4 text-sm font-bold text-[#0F4C5C] transition-colors group-hover:bg-[#f7f8f6]">
                        Sign In
                      </span>
                    </Link>
                    <Link
                      href="/register"
                      onClick={closeMobileMenu}
                      className="group relative inline-flex w-full rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    >
                      <span aria-hidden="true" className="absolute left-1 top-1 h-full w-full rounded bg-[#35D0BA]" />
                      <span className="relative inline-flex min-h-11 w-full items-center justify-center gap-2 rounded border-2 border-white bg-[#0F4C5C] px-4 text-sm font-bold text-white transition-colors group-hover:bg-[#35D0BA] group-hover:text-[#0F4C5C]">
                        Get Started <ArrowRight aria-hidden="true" className="h-4 w-4" />
                      </span>
                    </Link>
                  </div>
                ) : (
                  <div className="mt-3 rounded-xl border border-border bg-card p-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                        {session?.user?.image ? (
                          <Image src={session.user.image} width={40} height={40} unoptimized alt="" className="h-full w-full object-cover" />
                        ) : initials}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-foreground">{displayName}</span>
                        <span className="block text-xs text-muted-foreground">{role === "ADMIN" ? "Administrator" : role === "SELLER" ? "Seller account" : "Customer account"}</span>
                      </span>
                    </div>
                    <div className="mt-3 grid gap-1 border-t border-border pt-2">
                      <Link
                        href={accountDestination}
                        onClick={closeMobileMenu}
                        className="flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                      >
                        <LayoutDashboard aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
                        {dashboardLabel}
                      </Link>
                      <Link
                        href="/profile"
                        onClick={closeMobileMenu}
                        className="flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                      >
                        <UserRound aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
                        Profile
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          closeMobileMenu();
                          void logout();
                        }}
                        className="flex min-h-10 items-center gap-2 rounded-lg px-2 text-left text-sm font-medium text-destructive transition-colors hover:bg-muted"
                      >
                        <LogOut aria-hidden="true" className="h-4 w-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
      </div>
    </>
  );
}
