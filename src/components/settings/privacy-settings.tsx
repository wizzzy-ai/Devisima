"use client";

import { useState } from "react";
import { Lock, Globe, Smartphone, Download, Trash2 } from "lucide-react";
import SquishSwitch from "@/components/ui/SquishSwitch";

export function PrivacySettings() {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState<"export" | "delete" | null>(null);
  const [publicProfile, setPublicProfile] = useState(true);
  const [showEmail, setShowEmail] = useState(false);

  async function exportData() {
    setBusy("export");
    setMessage("");
    try {
      const response = await fetch("/api/privacy/export", { method: "GET" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message ?? "The export request failed.");
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "devisima-data-export.json";
      anchor.click();
      URL.revokeObjectURL(url);
      setMessage("Your data export was prepared.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Your data export could not be generated.");
    } finally {
      setBusy(null);
    }
  }

  async function requestDeletion() {
    setBusy("delete");
    setMessage("");
    try {
      const response = await fetch("/api/privacy/delete", { method: "POST" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message ?? "The deletion request failed.");
      setMessage(payload.message ?? "Your deletion request is in progress.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The deletion request could not be processed.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Profile Visibility */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">Profile Visibility</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">Control who can see your profile information</p>

        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-xl border border-border bg-background p-4">
            <div>
              <p className="font-medium text-foreground">Public Profile</p>
              <p className="text-xs text-muted-foreground">Anyone can view your profile</p>
            </div>
            <SquishSwitch checked={publicProfile} onChange={setPublicProfile} ariaLabel="Public profile" trackColor="#dce5e2" trackOnColor="#174c43" thumbColor="#ffffff" thumbOnColor="#ffffff" width={76} height={38} radius={19} speed={50} stretch={36} hoverScale={1.035} colorDuration={320} />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border bg-background p-4">
            <div>
              <p className="font-medium text-foreground">Show Email</p>
              <p className="text-xs text-muted-foreground">Display email on your profile</p>
            </div>
            <SquishSwitch checked={showEmail} onChange={setShowEmail} ariaLabel="Show email on profile" trackColor="#dce5e2" trackOnColor="#174c43" thumbColor="#ffffff" thumbOnColor="#ffffff" width={76} height={38} radius={19} speed={50} stretch={36} hoverScale={1.035} colorDuration={320} />
          </div>
        </div>
      </div>

      {/* Data Requests */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Download className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">Data Requests</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">Download or request deletion of your data</p>

        <div className="space-y-3">
          <button onClick={exportData} disabled={busy === "export"} className="flex w-full items-center justify-between rounded-xl border border-border bg-background px-4 py-3 text-left transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60">
            <div>
              <p className="font-medium text-foreground">Download my data</p>
              <p className="text-xs text-muted-foreground">Get a copy of all your data</p>
            </div>
            <Download className="h-4 w-4 text-muted-foreground" />
          </button>

          <button onClick={requestDeletion} disabled={busy === "delete"} className="flex w-full items-center justify-between rounded-xl border border-border bg-background px-4 py-3 text-left transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60">
            <div>
              <p className="font-medium text-foreground">Request data deletion</p>
              <p className="text-xs text-muted-foreground">Request deletion of your personal data</p>
            </div>
            <Trash2 className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {message && <p className="mt-3 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground">{message}</p>}
      </div>

      {/* Connected Apps */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Smartphone className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">Connected Apps</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">Manage apps connected to your account</p>

        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-xl border border-border bg-background p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-foreground">Google</p>
                <p className="text-xs text-muted-foreground">Connected</p>
              </div>
            </div>
            <button className="text-sm font-medium text-destructive hover:underline">Disconnect</button>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border bg-background p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-foreground">GitHub</p>
                <p className="text-xs text-muted-foreground">Not connected</p>
              </div>
            </div>
            <button className="text-sm font-medium text-primary hover:underline">Connect</button>
          </div>
        </div>
      </div>
    </div>
  );
}

