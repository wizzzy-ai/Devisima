"use client";

import { Bell, Shield, Globe, User, CreditCard, Store, Lock, HelpCircle, AlertTriangle } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface SettingsTabsProps {
  activeTab: string;
  isSeller?: boolean;
}

export function SettingsTabs({ activeTab, isSeller = false }: SettingsTabsProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const tabs = [
    { id: "account", label: "My Account", icon: User },
    { id: "security", label: "Security", icon: Shield },
    { id: "preferences", label: "Preferences", icon: Globe },
    ...(isSeller ? [
      { id: "payments", label: "Payments", icon: CreditCard },
      { id: "seller", label: "Seller Settings", icon: Store }
    ] : []),
    { id: "privacy", label: "Privacy", icon: Lock },
    { id: "help", label: "Help & Legal", icon: HelpCircle },
    { id: "danger", label: "Danger Zone", icon: AlertTriangle },
  ];

  const updateTab = (tabId: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("tab", tabId);
    router.replace(`${pathname}?${newParams.toString()}`);
  };

  return (
    <nav className="rounded-2xl border border-border bg-card p-2">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => updateTab(tab.id)}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
            activeTab === tab.id
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-foreground hover:bg-muted"
          }`}
        >
          <tab.icon className="w-4 h-4" />
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
