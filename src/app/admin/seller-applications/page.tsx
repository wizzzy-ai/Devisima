import { AdminShell } from "@/components/admin/admin-shell";
import { SellerApplicationReview } from "@/components/admin/SellerApplicationReview";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db/prisma";
import { CalendarDays, CheckCircle2, ExternalLink, Inbox, Link2, Store, UserRound } from "lucide-react";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Seller Applications - Devisima Admin",
  description: "Review and manage seller applications.",
  robots: "noindex",
};

export default async function AdminSellerApplicationsPage() {
  const user = await requireAdmin();
  const applications = await db.sellerApplication.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 100,
    include: {
      user: {
        select: {
          name: true,
          email: true,
          termsAcceptedAt: true,
          policyAcceptances: { orderBy: { acceptedAt: "desc" }, select: { policyType: true, version: true, acceptedAt: true, source: true } },
        },
      },
      reviewedBy: { select: { name: true } },
      history: {
        orderBy: { createdAt: "desc" },
        include: { reviewer: { select: { name: true } } },
      },
    },
  });
  const pendingCount = applications.filter((application) => application.status === "PENDING").length;

  return (
    <AdminShell user={user}>
      <div className="mx-auto max-w-7xl py-2">
        <header className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Marketplace operations</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">Seller applications</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Review each seller&apos;s profile and portfolio before approving their marketplace access.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Summary value={applications.length} label="Applications loaded" icon={Store} />
            <Summary value={pendingCount} label="Awaiting review" icon={CheckCircle2} />
          </div>
        </header>

        {applications.length === 0 ? (
          <section className="rounded-2xl border border-border bg-card px-6 py-16 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
              <Inbox className="h-6 w-6 text-muted-foreground" />
            </span>
            <h2 className="mt-4 text-base font-semibold text-foreground">No applications yet</h2>
            <p className="mt-1 text-sm text-muted-foreground">New seller applications will appear here when submitted.</p>
          </section>
        ) : (
          <div className="space-y-5">
            {applications.map((application) => (
              <article key={application.id} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                <div className="flex flex-col gap-4 border-b border-border px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-6">
                  <div className="flex min-w-0 items-center gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-base font-semibold text-primary">
                      {application.storeName.trim().charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <h2 className="truncate text-lg font-semibold tracking-tight text-foreground">{application.storeName}</h2>
                      <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">{application.user.name}</span>
                        <span aria-hidden="true" className="text-border">•</span>
                        <span className="break-all">{application.user.email}</span>
                      </p>
                    </div>
                  </div>
                  <Status status={application.status} />
                </div>

                <div className="space-y-6 px-5 py-5 sm:px-6 sm:py-6">
                  <section>
                    <SectionHeading icon={UserRound} title="About this seller" />
                    <div className="mt-3 rounded-xl bg-muted/50 p-4 text-sm leading-6 text-foreground sm:p-5">
                      {formatDescription(application.description)}
                    </div>
                  </section>

                  {application.whyJoin && (
                    <section>
                      <SectionHeading icon={Store} title="Why they want to sell on Devisima" />
                      <p className="mt-3 rounded-xl border border-primary/15 bg-primary/5 p-4 text-sm leading-6 text-foreground">
                        {application.whyJoin}
                      </p>
                    </section>
                  )}

                  <div className="grid gap-5 border-t border-border pt-5 lg:grid-cols-2">
                    <TagList title="Product types" items={application.productTypes} />
                    <TagList title="Technologies" items={application.technologies} />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <ResourceLink label="Portfolio" href={application.portfolioUrl} icon={<ExternalLink className="h-4 w-4" />} />
                    <ResourceLink label="GitHub" href={application.githubUrl} icon={<Link2 className="h-4 w-4" />} />
                    <div className="flex items-start gap-3 rounded-xl border border-border bg-background p-4">
                      <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Applied</p>
                        <p className="mt-1 text-sm font-medium text-foreground">
                          {application.createdAt.toLocaleDateString("en-NG", { year: "numeric", month: "short", day: "numeric" })}
                        </p>
                      </div>
                    </div>
                  </div>

                  <section className="rounded-xl border border-border bg-background p-4">
                    <h3 className="text-sm font-semibold text-foreground">Policy declarations on file</h3>
                    {application.user.policyAcceptances.length > 0 ? (
                      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                        {application.user.policyAcceptances.map((acceptance) => (
                          <li key={`${acceptance.policyType}-${acceptance.version}`} className="rounded-lg bg-muted/40 p-3">
                            <p className="text-sm font-medium text-foreground">{acceptance.policyType.replaceAll("_", " ")}</p>
                            <p className="mt-1 text-xs text-muted-foreground">Version {acceptance.version} · {acceptance.acceptedAt.toLocaleDateString("en-NG", { dateStyle: "medium" })} · {acceptance.source}</p>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-sm leading-5 text-muted-foreground">
                        No separate policy acceptance records are stored for this applicant.
                        {application.user.termsAcceptedAt ? ` Account terms were accepted on ${application.user.termsAcceptedAt.toLocaleDateString("en-NG", { dateStyle: "medium" })}.` : ""}
                      </p>
                    )}
                  </section>

                  {application.adminNotes && (
                    <div className="rounded-xl border border-border bg-muted/40 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Previous review notes</p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-foreground">{application.adminNotes}</p>
                    </div>
                  )}

                  {application.status === "PENDING" ? (
                    <SellerApplicationReview
                      applicationId={application.id}
                      applicant={{
                        name: application.user.name,
                        email: application.user.email,
                        storeName: application.storeName,
                        description: application.description,
                        productTypes: application.productTypes,
                        technologies: application.technologies,
                        portfolioUrl: application.portfolioUrl,
                        githubUrl: application.githubUrl,
                        whyJoin: application.whyJoin,
                      }}
                    />
                  ) : (
                    <p className="border-t border-border pt-4 text-sm text-muted-foreground">
                      Reviewed{application.reviewedBy?.name ? ` by ${application.reviewedBy.name}` : ""}
                      {application.reviewedAt
                        ? ` on ${application.reviewedAt.toLocaleDateString("en-NG", { year: "numeric", month: "short", day: "numeric" })}`
                        : ""}
                      .
                    </p>
                  )}
                  {application.history.length > 0 && (
                    <details className="border-t border-border pt-4">
                      <summary className="cursor-pointer text-sm font-semibold text-foreground">
                        Decision history ({application.history.length})
                      </summary>
                      <ol className="mt-4 space-y-4">
                        {application.history.map((event) => (
                          <li key={event.id} className="rounded-xl border border-border bg-background p-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-sm font-semibold text-foreground">
                                {event.action === "CHANGES_REQUESTED" ? "Changes requested" : event.action.charAt(0) + event.action.slice(1).toLowerCase()} · version {event.version}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {event.createdAt.toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}
                                {event.reviewer?.name ? ` · ${event.reviewer.name}` : ""}
                              </p>
                            </div>
                            {event.reason && (
                              <p className="mt-3 whitespace-pre-wrap text-sm leading-5 text-foreground">
                                <span className="font-medium">Applicant-facing reason: </span>{event.reason}
                              </p>
                            )}
                            {event.internalNote && (
                              <p className="mt-2 whitespace-pre-wrap rounded-lg bg-muted p-3 text-sm leading-5 text-muted-foreground">
                                <span className="font-semibold">Private internal note: </span>{event.internalNote}
                              </p>
                            )}
                          </li>
                        ))}
                      </ol>
                    </details>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}

function Summary({ value, label, icon: Icon }: { value: number; label: string; icon: typeof Store }) {
  return (
    <div className="flex min-w-40 items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
        <Icon className="h-4 w-4 text-primary" />
      </span>
      <div>
        <p className="text-lg font-semibold leading-5 text-foreground">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function Status({ status }: { status: "PENDING" | "APPROVED" | "CHANGES_REQUESTED" | "REJECTED" }) {
  const appearance = {
    PENDING: "bg-amber-500/10 text-amber-700",
    APPROVED: "bg-primary/10 text-primary",
    CHANGES_REQUESTED: "bg-amber-500/10 text-amber-700",
    REJECTED: "bg-destructive/10 text-destructive",
  }[status];
  const label = status === "PENDING" ? "Pending review" : status === "CHANGES_REQUESTED" ? "Changes requested" : status.charAt(0) + status.slice(1).toLowerCase();

  return <span className={`inline-flex w-fit shrink-0 items-center rounded-full px-3 py-1.5 text-xs font-semibold ${appearance}`}>{label}</span>;
}

function SectionHeading({ icon: Icon, title }: { icon: typeof Store; title: string }) {
  return (
    <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
      <Icon className="h-4 w-4 text-primary" />
      {title}
    </h3>
  );
}

function TagList({ title, items }: { title: string; items: string[] }) {
  return (
    <section>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {items.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-2">
          {items.map((item) => (
            <li key={item} className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">Not provided</p>
      )}
    </section>
  );
}

function ResourceLink({ label, href, icon }: { label: string; href: string | null; icon: ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-background p-4">
      <span className="mt-0.5 shrink-0 text-muted-foreground">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        {href ? (
          <a href={href} target="_blank" rel="noreferrer" className="mt-1 inline-flex max-w-full items-center gap-1 break-all text-sm font-medium text-primary hover:underline">
            <span className="break-all">{href}</span>
          </a>
        ) : (
          <p className="mt-1 text-sm text-muted-foreground">Not provided</p>
        )}
      </div>
    </div>
  );
}

function formatDescription(description: string) {
  return description.split(/\n\s*\n/).map((paragraph, paragraphIndex) => {
    const parts = paragraph.split(/(\*\*[^*]+\*\*)/g);
    return (
      <p key={paragraphIndex} className={paragraphIndex > 0 ? "mt-3" : undefined}>
        {parts.map((part, partIndex) =>
          part.startsWith("**") && part.endsWith("**")
            ? <strong key={partIndex} className="font-semibold">{part.slice(2, -2)}</strong>
            : part,
        )}
      </p>
    );
  });
}
