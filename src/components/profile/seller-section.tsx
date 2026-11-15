import { Store, PlusCircle } from "lucide-react";
import Link from "next/link";

interface SellerSectionProps {
  sellerApplicationStatus?: "PENDING" | "APPROVED" | "REJECTED" | null;
}

export function SellerSection({ sellerApplicationStatus }: SellerSectionProps) {
  if (sellerApplicationStatus === "PENDING") {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-5">
          <Store className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Seller Application</h3>
        </div>
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-5">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-sm font-semibold text-amber-900">Pending Review</span>
          </div>
          <p className="mt-2 text-sm text-amber-800">
            Your seller application is under review. We&apos;ll notify you when a decision has been made.
          </p>
        </div>
      </div>
    );
  }

  if (sellerApplicationStatus === "REJECTED") {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-5">
          <Store className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Become a Seller</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-5">
          Turn your software into income by selling it on Devisima.
        </p>
        <Link
          href="/seller/apply"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
        >
          <PlusCircle className="w-4 h-4" />
          Apply to Become a Seller
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
      <div className="flex items-center gap-3 mb-5">
        <Store className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Become a Seller</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-5">
        Turn your software into income by selling it on Devisima.
      </p>
      <Link
        href="/seller/apply"
        className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
      >
        <PlusCircle className="w-4 h-4" />
        Apply to Become a Seller
      </Link>
    </div>
  );
}
