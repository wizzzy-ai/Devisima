"use client";

import { useEffect, useState } from "react";
import { Bell, CreditCard, Megaphone, MessageSquareText, PackageCheck, ShoppingBag, Store, Wallet } from "lucide-react";
import SquishSwitch from "@/components/ui/SquishSwitch";

type Preferences = {
  orderEmails: boolean;
  paymentEmails: boolean;
  purchaseEmails: boolean;
  reviewEmails: boolean;
  sellerEmails: boolean;
  payoutEmails: boolean;
  marketingEmails: boolean;
  systemEmails: boolean;
};

const categories: { key: keyof Preferences; title: string; description: string; icon: typeof Bell }[] = [
  { key: "orderEmails", title: "Orders", description: "Order confirmations and order activity.", icon: ShoppingBag },
  { key: "paymentEmails", title: "Payments", description: "Payment results and refund updates.", icon: CreditCard },
  { key: "purchaseEmails", title: "Purchases", description: "Purchase access and download availability.", icon: PackageCheck },
  { key: "reviewEmails", title: "Reviews", description: "Review moderation and product review activity.", icon: MessageSquareText },
  { key: "sellerEmails", title: "Seller activity", description: "Seller application and product moderation updates.", icon: Store },
  { key: "payoutEmails", title: "Payouts", description: "Payout request and transfer status updates.", icon: Wallet },
  { key: "marketingEmails", title: "Marketing", description: "Optional offers, coupons and marketplace recommendations.", icon: Megaphone },
  { key: "systemEmails", title: "System notifications", description: "Important service notices. These emails are enabled by default.", icon: Bell },
];

export function NotificationPreferencesForm() {
  const [preferences, setPreferences] = useState<Preferences | null>(null);
  const [saved, setSaved] = useState<Preferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    try {
      const response = await fetch("/api/notification-preferences", { cache: "no-store" });
      const data = await response.json() as { preferences?: Preferences; message?: string };
      if (!response.ok || !data.preferences) throw new Error(data.message ?? "Notification preferences could not be loaded.");
      setPreferences(data.preferences);
      setSaved(data.preferences);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Notification preferences could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let mounted = true;
    const initialize = async () => {
      try {
        const response = await fetch("/api/notification-preferences", { cache: "no-store" });
        const data = await response.json() as { preferences?: Preferences; message?: string };
        if (!response.ok || !data.preferences) throw new Error(data.message ?? "Notification preferences could not be loaded.");
        if (mounted) {
          setPreferences(data.preferences);
          setSaved(data.preferences);
        }
      } catch (cause) {
        if (mounted) setError(cause instanceof Error ? cause.message : "Notification preferences could not be loaded.");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void initialize();
    return () => { mounted = false; };
  }, []);

  async function save() {
    if (!preferences) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/notification-preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      });
      const data = await response.json() as { preferences?: Preferences; message?: string };
      if (!response.ok || !data.preferences) throw new Error(data.message ?? "Notification preferences could not be saved.");
      setPreferences(data.preferences);
      setSaved(data.preferences);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Notification preferences could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  const isDirty = preferences && saved && categories.some(({ key }) => preferences[key] !== saved[key]);

  return (
    <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Email preferences</p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight text-foreground">Notification settings</h1>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">Choose which activity updates you receive by email. Your in-app notifications remain available in the notification center.</p>
      </div>
      {loading ? <div className="space-y-3" aria-label="Loading preferences">{categories.slice(0, 5).map(({ key }) => <div key={key} className="h-20 animate-pulse rounded-xl bg-muted" />)}</div> : error && !preferences ? <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"><p>{error}</p><button type="button" onClick={() => { setLoading(true); setError(""); void load(); }} className="mt-2 font-semibold underline">Retry</button></div> : preferences ? <>
        {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
        <div className="divide-y divide-border">
          {categories.map(({ key, title, description, icon: Icon }) => (
            <div key={key} className="flex items-center gap-4 py-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-foreground">{title}</span>
                <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">{description}</span>
              </span>
              <SquishSwitch
                checked={preferences[key]}
                onChange={(checked) => setPreferences({ ...preferences, [key]: checked })}
                ariaLabel={`${title} email notifications`}
                trackColor="#dce5e2"
                trackOnColor="#174c43" thumbColor="#ffffff" thumbOnColor="#ffffff"
                width={76}
                height={38}
                radius={19}
                speed={50}
                stretch={36}
                hoverScale={1.035}
                colorDuration={320}
              />
            </div>
          ))}
        </div>
        <div className="mt-5 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-5 text-muted-foreground">Security and account access emails are managed separately and cannot be disabled here.</p>
          <button type="button" disabled={!isDirty || saving} onClick={() => void save()} className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">{saving ? "Savingâ€¦" : "Save preferences"}</button>
        </div>
      </> : null}
    </section>
  );
}

