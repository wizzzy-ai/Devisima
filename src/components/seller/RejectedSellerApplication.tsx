"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowRight, CalendarDays, ChevronDown, ChevronUp, CircleHelp, FileText, Store } from "lucide-react";
import { SellerApplicationForm } from "@/components/seller/SellerApplicationForm";

type ApplicationValues = {
  id: string;
  status: "REJECTED" | "CHANGES_REQUESTED";
  version: number;
  storeName: string;
  description: string;
  productTypes: string[];
  technologies: string[];
  portfolioUrl: string | null;
  githubUrl: string | null;
  whyJoin: string | null;
  rejectionReason: string | null;
  reviewedAt: string | null;
  history: Array<{
    action: "SUBMITTED" | "RESUBMITTED" | "APPROVED" | "REJECTED" | "CHANGES_REQUESTED";
    version: number;
    reason: string | null;
    createdAt: string;
  }>;
};

export function RejectedSellerApplication({ application }: { application: ApplicationValues }) {
  const [editing, setEditing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const rejected = application.status === "REJECTED";

  return (
    <div className="mx-auto max-w-4xl">
      <section className="relative isolate mb-6 overflow-hidden rounded-[2rem] bg-primary px-6 py-8 text-primary-foreground sm:px-10 sm:py-10">
        <div className="pointer-events-none absolute -right-20 -top-36 -z-10 h-80 w-80 rounded-full border-[40px] border-primary-foreground/10" />
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-accent">
          <Store className="h-4 w-4" /> Seller program
        </p>
        <div className="mt-4 flex items-start gap-3">
          <AlertCircle className="mt-1 h-6 w-6 shrink-0 text-accent" />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {rejected ? "Your application was not approved" : "Your application needs a few updates"}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-primary-foreground/75">
              {rejected
                ? "This decision applies only to your seller application. Your Devisima account remains active as a buyer. Review the feedback and contact support if you have questions."
                : "This decision applies only to your seller application. Your Devisima account remains active as a buyer, and you can update your application and request another review."}
            </p>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border px-5 py-5 sm:px-7">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Application status</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-foreground">{application.storeName}</h2>
          </div>
          <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${rejected ? "bg-destructive/10 text-destructive" : "bg-amber-500/10 text-amber-700"}`}>
            <span className={`size-1.5 rounded-full ${rejected ? "bg-destructive" : "bg-amber-600"}`} />
            {rejected ? "Not approved" : "Updates requested"}
          </span>
        </div>

        <div className="space-y-6 px-5 py-5 sm:px-7 sm:py-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <Info label="Application ID" value={application.id} icon={<FileText className="h-4 w-4" />} />
            <Info
              label="Reviewed"
              value={application.reviewedAt
                ? new Date(application.reviewedAt).toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" })
                : "Review date unavailable"}
              icon={<CalendarDays className="h-4 w-4" />}
            />
          </div>

          {application.rejectionReason ? (
            <div className="rounded-xl border border-border bg-muted/30 p-4 sm:p-5">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <CircleHelp className="h-4 w-4 text-primary" /> Feedback from the review team
              </h3>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-foreground">{application.rejectionReason}</p>
            </div>
          ) : (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 sm:p-5">
              <h3 className="text-sm font-semibold text-foreground">No applicant-facing reason is available</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                This decision was recorded before written applicant feedback was available. Contact support and include your application ID for assistance.
              </p>
            </div>
          )}

          <div className="rounded-xl border border-border bg-muted/40 p-4 sm:p-5">
            <h3 className="text-sm font-semibold text-foreground">What you can do next</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Update the information below to address the feedback, confirm your changes, and resubmit. Your previous application and decision history are retained for the review team.
            </p>
          </div>

          <section>
            <button
              type="button"
              aria-expanded={showDetails}
              aria-controls="seller-application-details"
              onClick={() => setShowDetails((visible) => !visible)}
              className="inline-flex items-center gap-2 rounded-lg text-sm font-semibold text-primary transition hover:text-primary/80 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
            >
              {showDetails ? "Hide application details" : "View application details"}
              {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {showDetails && (
              <dl id="seller-application-details" className="mt-4 grid gap-3 sm:grid-cols-2">
                <DescriptionDetail value={application.description} />
                <Detail label="Products offered" value={application.productTypes.join(", ") || "Not provided"} />
                <Detail label="Technologies" value={application.technologies.join(", ") || "Not provided"} />
                <Detail label="Portfolio" value={application.portfolioUrl || "Not provided"} />
                <Detail label="GitHub" value={application.githubUrl || "Not provided"} />
                <Detail label="Why you want to sell" value={application.whyJoin || "Not provided"} wide />
              </dl>
            )}
          </section>

          {application.history.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-foreground">Application history</h3>
              <ol className="mt-3 space-y-3 border-l border-border pl-4">
                {application.history.map((entry, index) => (
                  <li key={`${entry.version}-${entry.action}-${index}`} className="relative">
                    <span className="absolute -left-[1.32rem] top-1.5 size-2 rounded-full bg-primary" />
                    <p className="text-sm font-medium text-foreground">
                      {entry.action === "SUBMITTED" ? "Application submitted"
                        : entry.action === "RESUBMITTED" ? "Application resubmitted"
                          : entry.action === "REJECTED" ? "Application not approved"
                            : entry.action === "CHANGES_REQUESTED" ? "Updates requested"
                            : "Application approved"}
                      <span className="ml-2 text-xs font-normal text-muted-foreground">Version {entry.version}</span>
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(entry.createdAt).toLocaleDateString("en-NG", { year: "numeric", month: "short", day: "numeric" })}
                    </p>
                    {(entry.action === "REJECTED" || entry.action === "CHANGES_REQUESTED") && entry.reason && (
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-5 text-muted-foreground">{entry.reason}</p>
                    )}
                  </li>
                ))}
              </ol>
            </section>
          )}

          {editing ? (
            <section className="border-t border-border pt-6">
              <div className="mb-5">
                <h3 className="text-lg font-semibold text-foreground">Update your application</h3>
                <p className="mt-1 text-sm text-muted-foreground">Your previous answers are filled in. Make changes before resubmitting.</p>
              </div>
              <SellerApplicationForm
                initialApplication={application}
                resubmission
                onCancel={() => setEditing(false)}
              />
            </section>
          ) : (
            <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row">
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
              >
                Edit and resubmit <ArrowRight className="h-4 w-4" />
              </button>
              <Link href="/contact" className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-muted">
                Contact support
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function Detail({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={`min-w-0 rounded-xl border border-border bg-card p-4 sm:p-5 ${wide ? "sm:col-span-2" : ""}`}>
      <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</dt>
      <dd className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-foreground">{value}</dd>
    </div>
  );
}

function DescriptionDetail({ value }: { value: string }) {
  const paragraphs = value.split(/\n\s*\n/).map((paragraph) => paragraph.trim()).filter(Boolean);
  const [intro, ...body] = paragraphs;

  return (
    <div className="min-w-0 rounded-xl border border-border bg-card p-4 sm:col-span-2 sm:p-6">
      <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">About you</dt>
      <dd className="mt-4 text-sm leading-7 text-foreground">
        {intro && (
          <p className="mb-4 rounded-lg border-l-2 border-accent bg-accent/10 px-4 py-3 text-base font-semibold leading-6 text-primary">
            <FormattedParagraph value={intro} />
          </p>
        )}
        <div className="max-w-prose space-y-4 text-muted-foreground">
          {body.map((paragraph, index) => (
            <p key={index}><FormattedParagraph value={paragraph} /></p>
          ))}
        </div>
      </dd>
    </div>
  );
}

function FormattedParagraph({ value }: { value: string }) {
  return value.split(/(\*\*[^*]+\*\*)/g).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

function Info({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-xl border border-border bg-background p-4">
      <span className="mt-0.5 shrink-0 text-muted-foreground">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="mt-1 break-all text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}
