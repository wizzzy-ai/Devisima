"use client";

import { useState, type FormEvent } from "react";
import { useSession } from "next-auth/react";
import { LoaderCircle, CheckCircle, XCircle } from "lucide-react";

interface SecuritySettingsProps {
  emailVerified: boolean;
}

export function SecuritySettings({ emailVerified }: SecuritySettingsProps) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    setError("");

    const form = new FormData(event.currentTarget);
    const currentPassword = form.get("currentPassword");
    const newPassword = form.get("newPassword");
    const confirmPassword = form.get("confirmPassword");

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      setPending(false);
      return;
    }

    try {
      const response = await fetch("/api/accounts/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message ?? "Could not change your password.");
      setMessage("Your password has been changed successfully.");
      (event.target as HTMLFormElement).reset();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "A network error occurred.");
    } finally {
      setPending(false);
    }
  }

  const fieldClass = "mt-2 h-12 w-full rounded-xl border border-border bg-card px-4 text-sm text-foreground outline-none placeholder:text-muted-foreground transition focus:border-primary focus:ring-4 focus:ring-primary/10";

  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-8">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Stay protected</p>
      <h3 className="mt-1 text-xl font-semibold tracking-tight text-foreground">Security</h3>
      <p className="mt-1 text-sm text-muted-foreground">Manage your password and account security settings.</p>

      {/* Email Verification Status */}
      <div className="mt-6 rounded-2xl border border-border bg-background p-4">
        <div className="flex items-center gap-3">
          {emailVerified ? (
            <CheckCircle className="w-5 h-5 text-emerald-600" />
          ) : (
            <XCircle className="w-5 h-5 text-amber-600" />
          )}
          <div>
            <p className="text-sm font-semibold">Email Verification</p>
            <p className="text-sm text-muted-foreground">
              {emailVerified ? "Your email is verified" : "Your email is not verified"}
            </p>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <form onSubmit={submit} className="mt-6 space-y-5">
        <label className="block text-sm font-semibold text-foreground" htmlFor="currentPassword">
          Current password
          <input
            id="currentPassword"
            name="currentPassword"
            type="password"
            required
            minLength={1}
            maxLength={128}
            className={fieldClass}
          />
        </label>

        <label className="block text-sm font-semibold text-foreground" htmlFor="newPassword">
          New password
          <input
            id="newPassword"
            name="newPassword"
            type="password"
            required
            minLength={8}
            maxLength={128}
            className={fieldClass}
          />
          <p className="mt-1 text-xs text-muted-foreground">Use at least 8 characters with an uppercase letter, a lowercase letter, and a number.</p>
        </label>

        <label className="block text-sm font-semibold text-foreground" htmlFor="confirmPassword">
          Confirm new password
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            minLength={8}
            maxLength={128}
            className={fieldClass}
          />
        </label>

        {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        {message && <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</p>}

        <button
          disabled={pending}
            className="flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending && <LoaderCircle className="animate-spin" size={17} />}
          {pending ? "Changing password..." : "Change Password"}
        </button>
      </form>
    </div>
  );
}
