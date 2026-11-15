import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/guards";
import { db } from "@/lib/db/prisma";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { SellerApplicationForm } from "@/components/seller/SellerApplicationForm";
import { RejectedSellerApplication } from "@/components/seller/RejectedSellerApplication";
import { Sparkles, ArrowUpRight, Clock, CheckCircle } from "lucide-react";

export default async function SellerApplyPage({ searchParams }: { searchParams: Promise<{ submitted?: string }> }) {
  const user = await requireAuth("/seller/apply");
  if (user.role === "SELLER") redirect("/seller/dashboard");
  if (user.role === "ADMIN") redirect("/admin");

  const application = await db.sellerApplication.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      history: {
        orderBy: { createdAt: "desc" },
        select: { action: true, version: true, reason: true, createdAt: true },
      },
    },
  });
  if (user.isSellerSuspended) {
    return (
      <DashboardShell user={user}>
        <section className="mx-auto max-w-3xl rounded-2xl border border-amber-500/25 bg-card p-6 shadow-sm sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-700">Seller account access</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">Seller access is temporarily restricted</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Your Devisima account remains active for buyer features and access to your purchases. Seller tools and product listings are temporarily unavailable while the restriction is in place.
          </p>
          {user.sellerSuspensionReason && (
            <div className="mt-5 rounded-xl border border-border bg-muted/40 p-4">
              <h2 className="text-sm font-semibold text-foreground">Reason provided by the review team</h2>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{user.sellerSuspensionReason}</p>
            </div>
          )}
          <Link href="/contact" className="mt-6 inline-flex rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
            Contact support
          </Link>
        </section>
      </DashboardShell>
    );
  }
  if (application?.status === "REJECTED" || application?.status === "CHANGES_REQUESTED") {
    return (
      <DashboardShell user={user}>
        <RejectedSellerApplication application={{
          id: application.id,
          status: application.status,
          version: application.version,
          storeName: application.storeName,
          description: application.description,
          productTypes: application.productTypes,
          technologies: application.technologies,
          portfolioUrl: application.portfolioUrl,
          githubUrl: application.githubUrl,
          whyJoin: application.whyJoin,
          rejectionReason: application.rejectionReason,
          reviewedAt: application.reviewedAt?.toISOString() ?? null,
          history: application.history.map((event) => ({
            action: event.action,
            version: event.version,
            reason: event.reason,
            createdAt: event.createdAt.toISOString(),
          })),
        }} />
      </DashboardShell>
    );
  }
  if (application?.status === "PENDING") {
    return (
      <DashboardShell user={user}>
        <section className="relative isolate mb-8 overflow-hidden rounded-[2rem] bg-primary px-6 py-8 text-primary-foreground sm:px-10 sm:py-10">
          <div className="pointer-events-none absolute -right-20 -top-36 -z-10 h-80 w-80 rounded-full border-[40px] border-border/20" />
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-accent"><Sparkles className="h-4 w-4" /> Seller program</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Application under review</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-primary-foreground/70 sm:text-base">
            Thanks for applying to become a Devisima seller. Our team will review your application and notify you when a decision has been made.
          </p>
        </section>

        <div className="rounded-2xl border border-border bg-card p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100">
              <Clock className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Review in progress</h2>
              <p className="text-sm text-muted-foreground">Your application is being reviewed by our team</p>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Store name</span>
              <span className="font-medium text-foreground">{application.storeName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Status</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                Pending
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Submitted</span>
              <span className="font-medium text-foreground">
                {new Date(application.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            Return to dashboard
          </Link>
        </div>
      </DashboardShell>
    );
  }

  const params = await searchParams;
  return (
    <DashboardShell user={user}>
      <section className="relative isolate mb-8 overflow-hidden rounded-[2rem] bg-primary px-6 py-8 text-primary-foreground sm:px-10 sm:py-10">
        <div className="pointer-events-none absolute -right-20 -top-36 -z-10 h-80 w-80 rounded-full border-[40px] border-border/20" />
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-accent"><Sparkles className="h-4 w-4" /> Seller program</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Apply to become a seller</h1>
        <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <p className="max-w-xl text-sm leading-6 text-primary-foreground/70 sm:text-base">
            Tell us about your store and the digital products you plan to offer. Every application is reviewed by the Devisima team.
          </p>
          <Link href="/marketplace" className="inline-flex w-fit items-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-bold text-accent-foreground transition hover:bg-accent/90">
            Browse marketplace <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <div className="rounded-2xl border border-border bg-card p-8 sm:p-10">
        {params.submitted === "1" && (
          <div className="mb-6 flex items-center gap-3 rounded-xl bg-emerald-50 border border-emerald-200 p-4">
            <CheckCircle className="h-5 w-5 text-emerald-600" />
            <div>
              <p className="text-sm font-semibold text-emerald-900">Application submitted</p>
              <p className="text-xs text-emerald-700">Your application is pending review. We&apos;ll notify you when a decision has been made.</p>
            </div>
          </div>
        )}

        <SellerApplicationForm />
      </div>
    </DashboardShell>
  );
}
