"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import SquishSwitch from "@/components/ui/SquishSwitch";

export type CookiePreferences = {
  necessary: true;
  preferences: boolean;
  analytics: boolean;
  marketing: boolean;
  savedAt: string;
  version: 1;
};

const COOKIE_KEY = "devisima-cookie-consent-v1";
const defaultPreferences: CookiePreferences = {
  necessary: true,
  preferences: false,
  analytics: false,
  marketing: false,
  savedAt: new Date().toISOString(),
  version: 1,
};

function isStoredConsent(value: unknown): value is CookiePreferences {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<CookiePreferences>;
  return candidate.necessary === true && typeof candidate.savedAt === "string" && candidate.version === 1;
}

function readStoredConsent(): CookiePreferences | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(COOKIE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!isStoredConsent(parsed)) return null;
    return {
      necessary: true,
      preferences: Boolean(parsed.preferences),
      analytics: Boolean(parsed.analytics),
      marketing: Boolean(parsed.marketing),
      savedAt: parsed.savedAt,
      version: 1,
    };
  } catch {
    return null;
  }
}

function persistConsent(preferences: CookiePreferences) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(COOKIE_KEY, JSON.stringify(preferences));
}

function subscribeToConsent(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  window.addEventListener("devisima:cookie-consent-updated", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("devisima:cookie-consent-updated", callback);
  };
}

const hasNoStoredConsent = () => readStoredConsent() === null;
const getServerConsentSnapshot = () => false;

export function CookieConsent() {
  const missingConsent = useSyncExternalStore(subscribeToConsent, hasNoStoredConsent, getServerConsentSnapshot);
  const [forcedVisible, setForcedVisible] = useState(false);
  const [customize, setCustomize] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>(defaultPreferences);
  const visible = missingConsent || forcedVisible;

  useEffect(() => {
    const onOpen = () => {
      setPreferences(readStoredConsent() ?? defaultPreferences);
      setCustomize(true);
      setForcedVisible(true);
    };

    window.addEventListener("devisima:open-cookie-settings", onOpen);
    return () => window.removeEventListener("devisima:open-cookie-settings", onOpen);
  }, []);

  function acceptPreferences(next: Partial<CookiePreferences>) {
    const saved = {
      necessary: true,
      preferences: next.preferences ?? false,
      analytics: next.analytics ?? false,
      marketing: next.marketing ?? false,
      savedAt: new Date().toISOString(),
      version: 1,
    } satisfies CookiePreferences;
    setPreferences(saved);
    persistConsent(saved);
    window.dispatchEvent(new Event("devisima:cookie-consent-updated"));
    setForcedVisible(false);
    setCustomize(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[80] border-t border-border bg-background/95 p-4 shadow-[0_-12px_32px_rgba(0,0,0,0.08)] backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Cookie preferences</p>
          <h2 className="mt-1 text-xl font-semibold text-foreground">We use cookies to keep the marketplace secure and improve your experience.</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Necessary cookies support sign-in, checkout, and security. Optional preferences, analytics, and marketing cookies are only used when you explicitly allow them.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => acceptPreferences({ preferences: true, analytics: true, marketing: true })}
            className="group relative inline-flex w-full rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:w-auto"
          >
            <span aria-hidden="true" className="absolute left-1 top-1 h-full w-full rounded bg-[#35D0BA]" />
            <span className="relative inline-flex h-10 w-full items-center justify-center rounded border-2 border-white bg-[#0F4C5C] px-4 text-sm font-bold text-white transition-all duration-200 group-hover:bg-[#35D0BA] group-hover:text-[#0F4C5C] sm:w-auto">
              Accept all
            </span>
          </button>
          <button
            type="button"
            onClick={() => acceptPreferences({ preferences: false, analytics: false, marketing: false })}
            className="inline-flex h-10 items-center justify-center rounded-[4px] border-2 border-[#0F4C5C] bg-white px-4 text-sm font-bold text-[#0F4C5C] shadow-[4px_4px_0_#0F4C5C] transition-all hover:-translate-y-0.5 hover:bg-[#f7f8f6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Only essential
          </button>
          <button
            type="button"
            onClick={() => setCustomize((value) => !value)}
            className="inline-flex h-10 items-center justify-center rounded-[4px] border-2 border-[#0F4C5C] bg-white px-4 text-sm font-bold text-[#0F4C5C] shadow-[4px_4px_0_#0F4C5C] transition-all hover:-translate-y-0.5 hover:bg-[#f7f8f6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Customize
          </button>
        </div>
      </div>

      {customize && (
        <div className="mx-auto mt-4 max-w-6xl rounded-2xl border border-border bg-card p-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-background p-3 text-sm text-foreground">
              <span>
                <strong className="block">Necessary</strong>
                <small className="text-muted-foreground">Authentication, security, and checkout continuity.</small>
              </span>
              <SquishSwitch checked disabled ariaLabel="Necessary cookies are always on" trackColor="#dce5e2" trackOnColor="#174c43" thumbColor="#ffffff" thumbOnColor="#ffffff" width={76} height={38} radius={19} speed={50} stretch={36} hoverScale={1.035} colorDuration={320} />
            </div>

            <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-background p-3 text-sm text-foreground">
              <span>
                <strong className="block">Preferences</strong>
                <small className="text-muted-foreground">Remember theme and interface choices.</small>
              </span>
              <SquishSwitch
                checked={preferences.preferences}
                onChange={(checked) => setPreferences((current) => ({ ...current, preferences: checked }))}
                ariaLabel="Allow preference cookies"
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

            <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-background p-3 text-sm text-foreground">
              <span>
                <strong className="block">Analytics</strong>
                <small className="text-muted-foreground">Aggregated usage and performance insight.</small>
              </span>
              <SquishSwitch
                checked={preferences.analytics}
                onChange={(checked) => setPreferences((current) => ({ ...current, analytics: checked }))}
                ariaLabel="Allow analytics cookies"
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

            <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-background p-3 text-sm text-foreground">
              <span>
                <strong className="block">Marketing</strong>
                <small className="text-muted-foreground">Campaign measurement and personalized offers.</small>
              </span>
              <SquishSwitch
                checked={preferences.marketing}
                onChange={(checked) => setPreferences((current) => ({ ...current, marketing: checked }))}
                ariaLabel="Allow marketing cookies"
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
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => acceptPreferences(preferences)}
              className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
            >
              Save preferences
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

