"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, ChevronLeft, ChevronRight, CircleAlert, CreditCard, Download, MessageSquareText, PackageCheck, ShoppingBag, Store, Wallet } from "lucide-react";

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: Date | string;
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

export function NotificationCenter({ notifications, page, totalPages, unreadOnly }: {
  notifications: NotificationItem[];
  page: number;
  totalPages: number;
  unreadOnly: boolean;
}) {
  const router = useRouter();
  const [items, setItems] = useState(notifications);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function markAllRead() {
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/notifications", { method: "POST" });
      if (!response.ok) throw new Error("Notifications could not be marked as read. Try again.");
      setItems((current) => unreadOnly ? [] : current.map((item) => ({ ...item, isRead: true })));
      window.dispatchEvent(new Event("devisima:notifications-updated"));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Notifications could not be marked as read.");
    } finally {
      setPending(false);
    }
  }

  async function openNotification(notification: NotificationItem) {
    if (!notification.isRead) {
      try {
        const response = await fetch(`/api/notifications/${encodeURIComponent(notification.id)}`, { method: "PATCH" });
        if (!response.ok) throw new Error("This notification could not be marked as read.");
        setItems((current) => current.map((item) => item.id === notification.id ? { ...item, isRead: true } : item));
        window.dispatchEvent(new Event("devisima:notifications-updated"));
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "This notification could not be marked as read.");
        return;
      }
    }
    router.push(notification.link ?? "/notifications");
  }

  const previousHref = page > 1 ? notificationPageUrl(page - 1, unreadOnly) : null;
  const nextHref = page < totalPages ? notificationPageUrl(page + 1, unreadOnly) : null;

  return (
    <section aria-label="Notifications">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Link href="/notifications" className={`rounded-full border px-4 py-2 text-sm font-semibold ${!unreadOnly ? "border-primary bg-primary text-primary-foreground" : "border-border text-foreground hover:bg-muted"}`}>All</Link>
          <Link href="/notifications?filter=unread" className={`rounded-full border px-4 py-2 text-sm font-semibold ${unreadOnly ? "border-primary bg-primary text-primary-foreground" : "border-border text-foreground hover:bg-muted"}`}>Unread</Link>
        </div>
        {items.some((item) => !item.isRead) && <button type="button" disabled={pending} onClick={() => void markAllRead()} className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted disabled:opacity-50"><CheckCheck className="h-4 w-4" />{pending ? "Marking…" : "Mark all as read"}</button>}
      </div>
      {error && <div role="alert" className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"><span>{error}</span><button type="button" onClick={() => setError("")} className="font-semibold underline">Dismiss</button></div>}
      {items.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card px-6 py-14 text-center shadow-sm">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary/10 text-primary"><Bell className="h-6 w-6" /></span>
          <h2 className="mt-4 text-xl font-semibold text-foreground">No notifications yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">You&apos;ll see updates about your purchases, products, payments and account activity here.</p>
        </div>
      ) : (
        <>
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            {items.map((item) => {
              const Icon = iconByType[item.type] ?? Bell;
              return <li key={item.id}><button type="button" onClick={() => void openNotification(item)} className={`flex w-full gap-4 p-4 text-left transition hover:bg-muted/60 sm:p-5 ${item.isRead ? "" : "bg-primary/[0.04]"}`}><span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary"><Icon className="h-5 w-5" /></span><span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-x-2 gap-y-1"><span className="font-semibold text-foreground">{item.title}</span>{!item.isRead && <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary"><span className="h-1.5 w-1.5 rounded-full bg-primary" />Unread</span>}</span><span className="mt-1 block text-sm leading-6 text-muted-foreground">{item.message}</span><time dateTime={new Date(item.createdAt).toISOString()} className="mt-2 block text-xs text-muted-foreground">{relativeTime(item.createdAt)}</time></span></button></li>;
            })}
          </ul>
          {totalPages > 1 && <nav aria-label="Notification pagination" className="mt-5 flex items-center justify-between"><span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span><div className="flex gap-2">{previousHref ? <Link href={previousHref} className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm font-semibold hover:bg-muted"><ChevronLeft className="h-4 w-4" />Previous</Link> : <span className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground opacity-50"><ChevronLeft className="h-4 w-4" />Previous</span>}{nextHref ? <Link href={nextHref} className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm font-semibold hover:bg-muted">Next<ChevronRight className="h-4 w-4" /></Link> : <span className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground opacity-50">Next<ChevronRight className="h-4 w-4" /></span>}</div></nav>}
        </>
      )}
    </section>
  );
}

function notificationPageUrl(page: number, unreadOnly: boolean) {
  return `/notifications?page=${page}${unreadOnly ? "&filter=unread" : ""}`;
}

function relativeTime(value: Date | string) {
  const date = new Date(value);
  const elapsed = Math.max(0, Date.now() - date.getTime());
  const minutes = Math.floor(elapsed / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  return date.toLocaleDateString();
}
