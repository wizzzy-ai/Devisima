"use client";

import Link from "next/link";
import { ArrowRight, LockKeyhole } from "lucide-react";

export function SignInPromptDialog({
  open,
  onClose,
  action,
  callbackUrl,
}: {
  open: boolean;
  onClose: () => void;
  action: string;
  callbackUrl: string;
}) {
  if (!open) return null;
  const query = `?callbackUrl=${encodeURIComponent(callbackUrl)}`;

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-foreground/45 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="signin-prompt-title" className="relative w-full max-w-md rounded-3xl border border-border bg-card p-6 text-card-foreground shadow-2xl sm:p-8">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary"><LockKeyhole className="h-5 w-5" /></div>
        <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-primary">Your Devisima account</p>
        <h2 id="signin-prompt-title" className="mt-2 text-2xl font-bold tracking-tight">Sign in to {action}</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">Sign in with your email address and password to continue. New here? Create an account with your name, email, and password. We’ll bring you back to this product afterward.</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Link href={`/login${query}`} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90">Sign in <ArrowRight className="h-4 w-4" /></Link>
          <Link href={`/register${query}`} className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground transition hover:bg-muted">Create account</Link>
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">Your account keeps your wishlist and purchases together.</p>
      </section>
    </div>
  );
}
