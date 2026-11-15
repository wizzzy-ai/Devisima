"use client";

import { useState } from "react";
import { Settings, Monitor, Globe, DollarSign } from "lucide-react";

export function PreferenceSettings() {
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  const [language, setLanguage] = useState("en");
  const [currency, setCurrency] = useState("USD");

  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-8">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Make it yours</p>
      <h3 className="mt-1 text-xl font-semibold tracking-tight text-foreground">Preferences</h3>
      <p className="mt-1 text-sm text-muted-foreground">Customize your Devisima experience.</p>

      <div className="mt-6 space-y-6">
        {/* Theme */}
        <div>
          <label className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Monitor className="w-4 h-4 text-primary" />
            Theme
          </label>
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value as "light" | "dark" | "system")}
            className="mt-2 h-12 w-full rounded-xl border border-border bg-card px-4 text-sm text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
          >
            <option value="system">System default</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>

        {/* Language */}
        <div>
          <label className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Globe className="w-4 h-4 text-primary" />
            Language
          </label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="mt-2 h-12 w-full rounded-xl border border-border bg-card px-4 text-sm text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
          >
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
            <option value="de">Deutsch</option>
          </select>
        </div>

        {/* Currency */}
        <div>
          <label className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <DollarSign className="w-4 h-4 text-primary" />
            Currency
          </label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="mt-2 h-12 w-full rounded-xl border border-border bg-card px-4 text-sm text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
          >
            <option value="USD">USD - US Dollar</option>
            <option value="EUR">EUR - Euro</option>
            <option value="GBP">GBP - British Pound</option>
            <option value="NGN">NGN - Nigerian Naira</option>
          </select>
        </div>
      </div>

      <div className="mt-6 border-t border-border pt-5">
        <p className="text-xs text-muted-foreground">
          Preferences are saved automatically. Changes take effect immediately.
        </p>
      </div>
    </div>
  );
}
