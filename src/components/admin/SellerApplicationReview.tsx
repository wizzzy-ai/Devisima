"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, CircleAlert, LoaderCircle, X } from "lucide-react";
import SquishSwitch from "@/components/ui/SquishSwitch";

const rejectionReasons = [
  { value: "Your application needs more detail about your experience and the products you plan to offer. Please add this information and resubmit.", label: "More detail needed" },
  { value: "We could not verify the portfolio or sample work linked in your application. Please provide working links or examples and resubmit.", label: "Portfolio needs attention" },
  { value: "The products described in your application need more clarity before we can assess their fit for the marketplace. Please clarify what buyers will receive and resubmit.", label: "Product information needs clarification" },
  { value: "Your application needs updates to align with Devisima's seller and marketplace requirements. Please review the seller guidance, update your details, and resubmit.", label: "Marketplace requirements" },
  { value: "CUSTOM", label: "Write a custom explanation" },
] as const;

type ApplicantSummary = {
  name: string;
  email: string;
  storeName: string;
  description: string;
  productTypes: string[];
  technologies: string[];
  portfolioUrl: string | null;
  githubUrl: string | null;
  whyJoin: string | null;
};

export function SellerApplicationReview({ applicationId, applicant }: {
  applicationId: string;
  applicant: ApplicantSummary;
}) {
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [rejectionOpen, setRejectionOpen] = useState(false);
  const [reviewDecision, setReviewDecision] = useState<"REJECT" | "REQUEST_CHANGES">("REQUEST_CHANGES");
  const [reasonType, setReasonType] = useState<string>(rejectionReasons[0].value);
  const [customReason, setCustomReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const rejectionReason = reasonType === "CUSTOM"
    ? customReason.trim()
    : rejectionReasons.find((reason) => reason.value === reasonType)?.value ?? "";

  async function review(decision: "APPROVE" | "REJECT" | "REQUEST_CHANGES") {
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/admin/seller-applications/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId,
          decision,
          adminNotes: notes,
          ...(decision !== "APPROVE" ? { rejectionReason, confirmRejection: confirmed } : {}),
        }),
      });
      const result = await response.json().catch(() => null) as { message?: string } | null;
      if (!response.ok) throw new Error(result?.message ?? "Review could not be saved.");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "A network error occurred. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <section className="rounded-xl border border-border bg-muted/30 p-4 sm:p-5">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-foreground">Review decision</h3>
          <p className="mt-1 text-xs text-muted-foreground">Approve seller access, request updates, or reject with clear applicant-facing feedback.</p>
        </div>
        <label htmlFor={`admin-notes-${applicationId}`} className="block text-sm font-medium text-foreground">
          Private internal note <span className="font-normal text-muted-foreground">(optional, only visible to administrators)</span>
        </label>
        <textarea
          id={`admin-notes-${applicationId}`}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          maxLength={1000}
          rows={2}
          placeholder="Add context for the review teamâ€¦"
          className="mt-2 w-full resize-y rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:opacity-60"
          disabled={pending}
        />
        <div className="mt-2 flex justify-end">
          <span className="text-xs text-muted-foreground">{notes.length}/1000</span>
        </div>
        {error && (
          <p role="alert" className="mt-3 flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            <CircleAlert className="h-4 w-4 shrink-0" />{error}
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={() => review("APPROVE")}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {pending ? "Saving decisionâ€¦" : "Approve seller"}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => { setReviewDecision("REQUEST_CHANGES"); setRejectionOpen(true); setError(""); }}
            className="inline-flex items-center gap-2 rounded-lg border border-destructive/30 bg-background px-4 py-2.5 text-sm font-semibold text-destructive transition hover:bg-destructive/5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <X className="h-4 w-4" />Request changes
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => { setReviewDecision("REJECT"); setRejectionOpen(true); setError(""); }}
            className="inline-flex items-center gap-2 rounded-lg border border-destructive/30 bg-background px-4 py-2.5 text-sm font-semibold text-destructive transition hover:bg-destructive/5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <X className="h-4 w-4" />Reject application
          </button>
        </div>
      </section>

      {rejectionOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-foreground/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => { if (event.target === event.currentTarget && !pending) setRejectionOpen(false); }}
        >
          <section role="dialog" aria-modal="true" aria-labelledby={`reject-title-${applicationId}`} className="my-auto w-full max-w-2xl rounded-2xl border border-border bg-card shadow-2xl">
            <header className="border-b border-border px-5 py-5 sm:px-6">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-destructive">
                {reviewDecision === "REJECT" ? "Confirm rejection" : "Applicant updates"}
              </p>
              <h2 id={`reject-title-${applicationId}`} className="mt-1 text-xl font-semibold tracking-tight text-foreground">
                {reviewDecision === "REJECT" ? "Reject seller application" : "Request application changes"}
              </h2>
              <p className="mt-2 text-sm leading-5 text-muted-foreground">
                {reviewDecision === "REJECT"
                  ? "The account will remain an active buyer. Your applicant-facing reason will be saved to the application and sent by email and in-app notification."
                  : "The account will remain an active buyer. The applicant can address your feedback and resubmit for review."}
              </p>
            </header>
            <div className="max-h-[calc(100dvh-12rem)] space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
              <section className="rounded-xl border border-border bg-muted/40 p-4">
                <h3 className="text-sm font-semibold text-foreground">{applicant.storeName}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{applicant.name} Â· {applicant.email}</p>
                <p className="mt-3 line-clamp-4 whitespace-pre-wrap text-sm leading-5 text-foreground">{applicant.description}</p>
                <p className="mt-3 text-xs leading-5 text-muted-foreground">
                  Products: {applicant.productTypes.join(", ") || "Not provided"}<br />
                  Technologies: {applicant.technologies.join(", ") || "Not provided"}
                </p>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm">
                  {applicant.portfolioUrl && <a href={applicant.portfolioUrl} target="_blank" rel="noreferrer" className="font-medium text-primary hover:underline">Open portfolio</a>}
                  {applicant.githubUrl && <a href={applicant.githubUrl} target="_blank" rel="noreferrer" className="font-medium text-primary hover:underline">Open GitHub</a>}
                </div>
                {applicant.whyJoin && <p className="mt-3 text-sm leading-5 text-foreground"><span className="font-medium">Motivation: </span>{applicant.whyJoin}</p>}
              </section>

              <div>
                <label htmlFor={`rejection-reason-${applicationId}`} className="block text-sm font-semibold text-foreground">
                  Applicant-facing feedback <span className="text-destructive">*</span>
                </label>
                <select
                  id={`rejection-reason-${applicationId}`}
                  value={reasonType}
                  onChange={(event) => { setReasonType(event.target.value); setConfirmed(false); }}
                  className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                >
                  {rejectionReasons.map((reason) => <option key={reason.value} value={reason.value}>{reason.label}</option>)}
                </select>
                {reasonType === "CUSTOM" && (
                  <textarea
                    value={customReason}
                    onChange={(event) => { setCustomReason(event.target.value); setConfirmed(false); }}
                    maxLength={1500}
                    rows={4}
                    placeholder="Explain clearly what the applicant can improve."
                    className="mt-3 w-full resize-y rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/10"
                  />
                )}
                <p className="mt-2 text-xs text-muted-foreground">This message is visible to the applicant. Never include private review notes here.</p>
              </div>

              <section className="rounded-xl border border-primary/15 bg-primary/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">Applicant notification preview</p>
                <p className="mt-2 text-sm font-semibold text-foreground">
                  {reviewDecision === "REJECT" ? "Your seller application was not approved" : "Updates requested for your seller application"}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-5 text-muted-foreground">
                  {reviewDecision === "REJECT"
                    ? `Your application for ${applicant.storeName} was not approved. Feedback: ${rejectionReason || "Your written feedback will appear here."} Your account remains active as a buyer.`
                    : `Please update your application for ${applicant.storeName}. Feedback: ${rejectionReason || "Your written feedback will appear here."} Your account remains active as a buyer.`}
                </p>
              </section>

              <div className="flex items-center justify-between gap-4 rounded-xl border border-border p-4 text-sm leading-5 text-foreground">
                <span>
                  I have reviewed the applicant-facing feedback and confirm that I want to
                  {reviewDecision === "REJECT" ? " reject this application" : " request these changes"}.
                  This decision will be recorded in the application history.
                </span>
                <SquishSwitch checked={confirmed} onChange={setConfirmed} ariaLabel="Confirm seller application decision" trackColor="#dce5e2" trackOnColor="#174c43" thumbColor="#ffffff" thumbOnColor="#ffffff" width={76} height={38} radius={19} speed={50} stretch={36} hoverScale={1.035} colorDuration={320} />
              </div>
              {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            </div>
            <footer className="flex flex-col-reverse gap-2 border-t border-border px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
              <button type="button" disabled={pending} onClick={() => setRejectionOpen(false)} className="rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted disabled:opacity-60">
                Cancel
              </button>
              <button
                type="button"
                disabled={pending || !confirmed || rejectionReason.length < 10}
                onClick={() => review(reviewDecision)}
                className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 ${reviewDecision === "REJECT" ? "bg-destructive hover:bg-destructive/90" : "bg-primary hover:bg-primary/90"}`}
              >
                {pending && <LoaderCircle className="h-4 w-4 animate-spin" />}
                {reviewDecision === "REJECT" ? "Confirm rejection" : "Confirm request for changes"}
              </button>
            </footer>
          </section>
        </div>
      )}
    </>
  );
}

