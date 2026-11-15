"use client";

import { HelpCircle, FileText, Shield, MessageSquare, ExternalLink } from "lucide-react";
import Link from "next/link";

export function HelpLegal() {
  return (
    <div className="space-y-6">
      {/* Support */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <HelpCircle className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">Support</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">Get help with your account or marketplace</p>

        <div className="space-y-3">
          <Link href="/contact" className="flex w-full items-center justify-between rounded-xl border border-border bg-background px-4 py-3 text-left transition hover:bg-muted">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-foreground">Contact Support</p>
                <p className="text-xs text-muted-foreground">Send us a message</p>
              </div>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </Link>

          <button className="flex w-full items-center justify-between rounded-xl border border-border bg-background px-4 py-3 text-left transition hover:bg-muted">
            <div className="flex items-center gap-3">
              <HelpCircle className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-foreground">Help Center</p>
                <p className="text-xs text-muted-foreground">Browse our knowledge base</p>
              </div>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Terms and Policies */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">Terms and Policies</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">Review our legal documents</p>

        <div className="space-y-3">
          <Link href="/terms" className="flex w-full items-center justify-between rounded-xl border border-border bg-background px-4 py-3 text-left transition hover:bg-muted">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-foreground">Terms of Service</p>
                <p className="text-xs text-muted-foreground">Our terms and conditions</p>
              </div>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </Link>

          <Link href="/privacy" className="flex w-full items-center justify-between rounded-xl border border-border bg-background px-4 py-3 text-left transition hover:bg-muted">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-foreground">Privacy Policy</p>
                <p className="text-xs text-muted-foreground">How we handle your data</p>
              </div>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </Link>

          <Link href="/cookies" className="flex w-full items-center justify-between rounded-xl border border-border bg-background px-4 py-3 text-left transition hover:bg-muted">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-foreground">Cookie Policy</p>
                <p className="text-xs text-muted-foreground">Information about cookies</p>
              </div>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </Link>

          <Link href="/refund-policy" className="flex w-full items-center justify-between rounded-xl border border-border bg-background px-4 py-3 text-left transition hover:bg-muted">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-foreground">Refund Policy</p>
                <p className="text-xs text-muted-foreground">Our refund terms</p>
              </div>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </Link>
        </div>
      </div>
    </div>
  );
}
