"use client";
import { useState } from "react";
import { signOut } from "next-auth/react";

export function LogoutButton() {
  const [pending, setPending] = useState(false);
  async function logout() {
    setPending(true);
    try { await fetch("/api/accounts/logout", { method: "POST" }); }
    finally { await signOut({ callbackUrl: "/" }); }
  }
  return <button type="button" onClick={logout} disabled={pending} className="rounded-lg border px-4 py-2 text-sm font-semibold hover:border-primary hover:text-primary disabled:opacity-60">{pending ? "Signing out..." : "Sign out"}</button>;
}
