"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bell, Check, CircleAlert, CreditCard, Download, MessageSquareText, PackageCheck, ShoppingBag, Store, Wallet, X } from "lucide-react";

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
};

const iconByType: Record<string, typeof Bell> = {
  ORDER_CREATED: ShoppingBag,
  ORDER_PAID: CreditCard,
  PAYMENT_FAILED: CircleAlert,
  PURCHASE_READY: Download,
  DOWNLOAD_AVAILABLE: Download,
  SELLER_APPLICATION_SUBMITTED: Store,
  SELLER_APPLICATION_APPROVED: Store,
  SELLER_APPLICATION_REJECTED: Store,
  PRODUCT_SUBMITTED: PackageCheck,
  PRODUCT_APPROVED: PackageCheck,
  PRODUCT_REJECTED: PackageCheck,
  PRODUCT_CHANGES_REQUESTED: PackageCheck,
  FOLLOWED_STORE_NEW_PRODUCT: Store,
  NEW_REVIEW: MessageSquareText,
  REVIEW_APPROVED: MessageSquareText,
  REVIEW_REJECTED: MessageSquareText,
  PAYOUT_REQUESTED: Wallet,
  PAYOUT_APPROVED: Wallet,
  PAYOUT_PROCESSING: Wallet,
  PAYOUT_COMPLETED: Wallet,
  PAYOUT_FAILED: Wallet,
  SELLER_SALE: Wallet,
  EARNINGS_AVAILABLE: Wallet,
  REFUND_REQUESTED: CreditCard,
  REFUND_APPROVED: CreditCard,
  REFUND_REJECTED: CreditCard,
  REFUND_COMPLETED: CreditCard,
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async (includeItems = false) => {
    if (includeItems) setLoading(true);
    try {
      const response = await fetch("/api/notifications?limit=5", { cache: "no-store" });
      if (!response.ok) throw new Error("Notifications could not be loaded.");
      const data = await response.json() as { notifications: NotificationItem[]; unreadCount: number };
      setUnreadCount(data.unreadCount);
      if (includeItems) setItems(data.notifications);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Notifications could not be loaded.");
    } finally {
      if (includeItems) setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const refreshCount = async () => {
      try {
        const response = await fetch("/api/notifications?limit=5", { cache: "no-store" });
        if (!response.ok) throw new Error("Notifications could not be loaded.");
        const data = await response.json() as { notifications: NotificationItem[]; unreadCount: number };
        if (mounted) {
          setUnreadCount(data.unreadCount);
          setError("");
        }
      } catch (cause) {
        if (mounted) setError(cause instanceof Error ? cause.message : "Notifications could not be loaded.");
      }
    };
    void refreshCount();
    const timer = window.setInterval(() => void refreshCount(), 60_000);
    const update = () => void refreshCount();
    window.addEventListener("devisima:notifications-updated", update);
    return () => {
      mounted = false;
      window.clearInterval(timer);
      window.removeEventListener("devisima:notifications-updated", update);
    };
  }, []);

  async function markRead(id: string) {
    const response = await fetch(`/api/notifications/${encodeURIComponent(id)}`, { method: "PATCH" });
    if (!response.ok && response.status !== 404) throw new Error("This notification could not be marked as read.");
    setItems((current) => current.map((item) => item.id === id ? { ...item, isRead: true } : item));
    setUnreadCount((current) => Math.max(0, current - 1));
    window.dispatchEvent(new Event("devisima:notifications-updated"));
  }

  async function markAllRead() {
    const response = await fetch("/api/notifications", { method: "POST" });
    if (!response.ok) {
      setError("Notifications could not be marked as read. Try again.");
      return;
    }
    setItems((current) => current.map((item) => ({ ...item, isRead: true })));
    setUnreadCount(0);
    window.dispatchEvent(new Event("devisima:notifications-updated"));
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={`Notifications, ${unreadCount} unread`}
        aria-expanded={open}
        onClick={() => {
          const nextOpen = !open;
          setOpen(nextOpen);
          if (nextOpen) void refresh(true);
        }}
        className="relative grid h-10 w-10 place-items-center rounded-xl text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-primary-foreground">{unreadCount > 99 ? "99+" : unreadCount}</span>}
      </button>
      {open && (
        <>
          <button type="button" aria-label="Close notifications" className="fixed inset-0 z-40 cursor-default" onClick={() => setOpen(false)} />
          <section className="absolute right-0 z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-border bg-card shadow-xl" aria-label="Recent notifications">
            <header className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <h2 className="text-sm font-bold text-foreground">Notifications</h2>
                <p className="text-xs text-muted-foreground">{unreadCount} unread</p>
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && <button type="button" onClick={() => void markAllRead()} className="text-xs font-semibold text-primary hover:underline">Mark all as read</button>}
                <button type="button" aria-label="Close notifications" onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></button>
              </div>
            </header>
            {error && <div className="flex items-center justify-between gap-3 px-4 py-3 text-xs text-destructive"><span>{error}</span><button type="button" onClick={() => void refresh(true)} className="font-semibold underline">Retry</button></div>}
            {loading ? (
              <div className="space-y-3 p-4" aria-label="Loading notifications">{[0, 1, 2].map((key) => <div key={key} className="flex gap-3"><div className="h-9 w-9 animate-pulse rounded-full bg-muted" /><div className="flex-1 space-y-2"><div className="h-3 w-2/3 animate-pulse rounded bg-muted" /><div className="h-3 w-full animate-pulse rounded bg-muted" /></div></div>)}</div>
            ) : items.length ? (
              <ul className="max-h-[min(28rem,65vh)] overflow-y-auto">
                {items.map((item) => {
                  const Icon = iconByType[item.type] ?? Bell;
                  return <li key={item.id}><Link href={item.link ?? "/notifications"} onClick={() => { setOpen(false); if (!item.isRead) void markRead(item.id).catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Could not mark notification as read.")); }} className={`flex gap-3 border-b border-border/70 px-4 py-3 transition hover:bg-muted/70 ${item.isRead ? "" : "bg-primary/5"}`}><span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary"><Icon className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="flex items-start justify-between gap-2"><span className="text-sm font-semibold text-foreground">{item.title}</span>{!item.isRead && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}</span><span className="mt-0.5 line-clamp-2 block text-xs leading-5 text-muted-foreground">{item.message}</span><time className="mt-1 block text-[11px] text-muted-foreground">{relativeTime(item.createdAt)}</time></span></Link></li>;
                })}
              </ul>
            ) : !error ? <p className="px-4 py-8 text-center text-sm text-muted-foreground">No notifications yet</p> : null}
            <Link href="/notifications" onClick={() => setOpen(false)} className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-primary transition hover:bg-muted"><Check className="h-4 w-4" />View all notifications</Link>
          </section>
        </>
      )}
    </div>
  );
}

function relativeTime(value: string) {
  const elapsed = Math.max(0, Date.now() - new Date(value).getTime());
  const minutes = Math.floor(elapsed / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Date(value).toLocaleDateString();
}
