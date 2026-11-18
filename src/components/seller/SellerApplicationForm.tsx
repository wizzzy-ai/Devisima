"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { sellerApplicationSchema } from "@/lib/validation/auth";
import { LoaderCircle } from "lucide-react";

const fieldClass = "mt-2 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10";

const productTypeOptions = [
  "Flutter apps",
  "React/Next.js projects",
  "Websites",
  "SaaS applications",
  "APIs",
  "UI kits",
  "Templates",
  "Business systems",
  "Other",
];

const technologyOptions = [
  "Flutter",
  "React",
  "Next.js",
  "Node.js",
  "Laravel",
  "Django",
  "PHP",
  "Java",
  "C#",
  "Other",
];

type SellerApplicationValues = {
  id: string;
  storeName: string;
  description: string;
  productTypes: string[];
  technologies: string[];
  portfolioUrl: string | null;
  githubUrl: string | null;
  whyJoin: string | null;
};

export function SellerApplicationForm({ initialApplication, resubmission = false, onCancel }: {
  initialApplication?: SellerApplicationValues;
  resubmission?: boolean;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [selectedProductTypes, setSelectedProductTypes] = useState<string[]>(initialApplication?.productTypes ?? []);
  const [selectedTechnologies, setSelectedTechnologies] = useState<string[]>(initialApplication?.technologies ?? []);
  const [confirmedResubmission, setConfirmedResubmission] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const productTypes = form.getAll("productTypes") as string[];
    const technologies = form.getAll("technologies") as string[];
    const values = {
      storeName: form.get("storeName"),
      description: form.get("description"),
      productTypes,
      technologies,
      portfolioUrl: form.get("portfolioUrl") || "",
      githubUrl: form.get("githubUrl") || "",
      whyJoin: form.get("whyJoin") || "",
      ...(resubmission && initialApplication ? {
        applicationId: initialApplication.id,
        confirmResubmission: confirmedResubmission,
      } : {}),
    };
    const parsed = sellerApplicationSchema.safeParse(values);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check your application details.");
      return;
    }
    setPending(true);
    try {
      const response = await fetch("/api/seller/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const result = await response.json().catch(() => null) as { message?: string } | null;
      if (!response.ok) throw new Error(result?.message ?? "We could not submit your application.");
      router.replace("/seller/apply?submitted=1");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "A network error occurred. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-foreground">Store name</label>
        <input name="storeName" required minLength={2} maxLength={80} defaultValue={initialApplication?.storeName} className={fieldClass} placeholder="What should buyers see as your seller/store name?" />
      </div>

      <div>
        <label className="block text-sm font-semibold text-foreground">About you</label>
        <textarea name="description" required minLength={40} maxLength={2000} rows={4} defaultValue={initialApplication?.description} className={fieldClass} placeholder="Tell us briefly about yourself and what you build." />
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-foreground">What do you plan to sell? <span className="font-normal text-muted-foreground">(Select all that apply)</span></legend>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {productTypeOptions.map((option) => (
            <label key={option} className="flex cursor-pointer items-center justify-between gap-3 text-sm text-muted-foreground">
              <span>{option}</span>
              <input
                type="checkbox"
                name="productTypes"
                value={option}
                checked={selectedProductTypes.includes(option)}
                onChange={(event) => setSelectedProductTypes((current) => event.target.checked ? [...current, option] : current.filter((value) => value !== option))}
                className="h-5 w-5 shrink-0 cursor-pointer accent-primary"
              />
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-foreground">Technologies <span className="font-normal text-muted-foreground">(Select all that apply)</span></legend>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {technologyOptions.map((option) => (
            <label key={option} className="flex cursor-pointer items-center justify-between gap-3 text-sm text-muted-foreground">
              <span>{option}</span>
              <input
                type="checkbox"
                name="technologies"
                value={option}
                checked={selectedTechnologies.includes(option)}
                onChange={(event) => setSelectedTechnologies((current) => event.target.checked ? [...current, option] : current.filter((value) => value !== option))}
                className="h-5 w-5 shrink-0 cursor-pointer accent-primary"
              />
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label className="block text-sm font-semibold text-foreground">Portfolio URL <span className="font-normal text-muted-foreground">(optional)</span></label>
        <input name="portfolioUrl" type="url" maxLength={2048} defaultValue={initialApplication?.portfolioUrl ?? ""} className={fieldClass} placeholder="https://yourportfolio.com" />
      </div>

      <div>
        <label className="block text-sm font-semibold text-foreground">GitHub URL <span className="font-normal text-muted-foreground">(optional)</span></label>
        <input name="githubUrl" type="url" maxLength={2048} defaultValue={initialApplication?.githubUrl ?? ""} className={fieldClass} placeholder="https://github.com/yourusername" />
      </div>

      <div>
        <label className="block text-sm font-semibold text-foreground">Why do you want to sell on Devisima? <span className="font-normal text-muted-foreground">(optional)</span></label>
        <textarea name="whyJoin" maxLength={1500} rows={3} defaultValue={initialApplication?.whyJoin ?? ""} className={fieldClass} placeholder="Tell us what motivates you to join our marketplace." />
      </div>

      {resubmission && (
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-muted/40 p-4 text-sm leading-6 text-foreground">
          <input
            type="checkbox"
            checked={confirmedResubmission}
            onChange={(event) => setConfirmedResubmission(event.target.checked)}
            className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-primary"
          />
          <span>I confirm that these details are accurate and I want to resubmit this application for review.</span>
        </label>
      )}

      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3">
          <p role="alert" className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className={resubmission ? "flex flex-col gap-3 sm:flex-row sm:justify-end" : undefined}>
        {resubmission && onCancel && (
          <button
            type="button"
            disabled={pending}
            onClick={onCancel}
            className="inline-flex w-full items-center justify-center rounded-xl border border-border bg-background px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            Cancel
          </button>
        )}
        <button
          disabled={pending}
          className={`${resubmission ? "w-full sm:w-auto" : "w-full"} flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60`}
        >
          {pending ? (
            <>
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Submitting applicationâ€¦
            </>
          ) : (
            resubmission ? "Resubmit application" : "Submit application"
          )}
        </button>
      </div>
    </form>
  );
}

