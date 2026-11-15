"use client";

import Link from "next/link";
import Image from "next/image";
import { Separator } from "@/components/ui/separator";
import { Mail } from "lucide-react";

export function Footer() {
  const footerLinks = {
    marketplace: [
      { name: "Browse Products", href: "/marketplace" },
      { name: "Featured", href: "/marketplace?sort=featured" },
      { name: "New Arrivals", href: "/marketplace?sort=newest" },
      { name: "Deals", href: "/deals" },
    ],
    sell: [
      { name: "Become a Seller", href: "/seller/apply" },
      { name: "Seller Guide", href: "/seller-guide" },
      { name: "Seller Resources", href: "/seller-guide#seller-help" },
    ],
    resources: [
      { name: "Buyer Help", href: "/resources#buying" },
      { name: "Downloads & Refunds", href: "/resources#downloads" },
      { name: "Contact Support", href: "/contact" },
      { name: "Refund Policy", href: "/refund-policy" },
    ],
    company: [
      { name: "Contact", href: "/contact" },
      { name: "Terms", href: "/terms" },
      { name: "Privacy", href: "/privacy" },
    ],
  };

  return (
    <footer className="border-t border-border/50 bg-muted/30">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            <div className="mb-4">
              <Link href="/" aria-label="Devisima home" className="inline-flex">
                <Image src="/logo.png" alt="Devisima" width={160} height={48} className="h-10 w-auto" />
              </Link>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Discover ready-made software and digital products from independent creators.
            </p>
            <a
              href="mailto:support@devisima.app"
              className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              <Mail className="h-4 w-4" /> Contact support
            </a>
          </div>

          {/* Marketplace */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Marketplace</h3>
            <ul className="space-y-2">
              {footerLinks.marketplace.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Sell */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Sell</h3>
            <ul className="space-y-2">
              {footerLinks.sell.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Resources</h3>
            <ul className="space-y-2">
              {footerLinks.resources.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Company</h3>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © 2026 Devisima. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link
              href="/terms"
              className="text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              Terms
            </Link>
            <Link
              href="/privacy"
              className="text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              Privacy
            </Link>
            <Link
              href="/cookies"
              className="text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              Cookies
            </Link>
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent("devisima:open-cookie-settings"))}
              className="text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              Cookie Settings
            </button>
            <Link
              href="/refund-policy"
              className="text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              Refund Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
