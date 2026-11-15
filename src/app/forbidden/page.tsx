"use client";

import Link from "next/link";
import { AlertTriangle, Mail, LogOut, ArrowLeft, ShieldAlert } from "lucide-react";
import { signOut } from "next-auth/react";
import { Navbar } from "@/components/layout/Navbar";

export default function ForbiddenPage() {
  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" });
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background flex items-center justify-center px-6 py-12 pt-20">
        <div className="mx-auto max-w-2xl w-full">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Return to homepage
          </Link>

          <div className="rounded-2xl border border-border bg-card p-8 sm:p-12 text-center shadow-sm">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
            <ShieldAlert className="h-10 w-10 text-destructive" />
          </div>

          <h1 className="text-3xl font-bold text-foreground mb-3">Account Suspended</h1>

          <p className="text-muted-foreground mb-6 leading-relaxed">
            Your account has been temporarily suspended in accordance with our platform policies.
            We take such actions seriously to maintain a safe and trustworthy environment for all users.
          </p>

          <div className="rounded-xl bg-muted/50 p-6 mb-8 text-left border border-border">
            <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              What This Means
            </h2>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-3">
                <span className="text-destructive mt-0.5">•</span>
                <span>Your access to platform features is restricted during this review period.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-destructive mt-0.5">•</span>
                <span>If you are a seller, your product listings may be temporarily hidden from the marketplace.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-destructive mt-0.5">•</span>
                <span>This action is not permanent and can be resolved through proper review channels.</span>
              </li>
            </ul>
          </div>

          <div className="rounded-xl bg-primary/5 p-6 mb-8 text-left border border-primary/20">
            <h2 className="text-base font-semibold text-foreground mb-4">Next Steps</h2>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-3">
                <span className="text-primary mt-0.5">1.</span>
                <span>If you believe this suspension is an error, please contact our support team for assistance.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary mt-0.5">2.</span>
                <span>Provide any relevant information that may help us review your case promptly.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary mt-0.5">3.</span>
                <span>Our team will respond within 24-48 hours regarding your account status.</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:support@devisima.app?subject=Account Suspension Inquiry"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Mail className="h-4 w-4" />
              Contact Support
            </a>
            <button
              onClick={handleLogout}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>

          <p className="mt-8 text-xs text-muted-foreground">
            Reference our Terms of Service and Community Guidelines for more information about account policies.
          </p>
        </div>
      </div>
    </main>
    </>
  );
}
