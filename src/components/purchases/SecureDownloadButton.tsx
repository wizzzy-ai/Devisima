"use client";

import { useState } from "react";
import { Download, LoaderCircle } from "lucide-react";

export function SecureDownloadButton({ href, fileName, compact = false }: { href: string; fileName: string; compact?: boolean }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function download() {
    if (pending) return;
    setPending(true);
    setError("");
    try {
      const response = await fetch(href, { method: "GET", credentials: "same-origin", cache: "no-store" });
      if (!response.ok || response.headers.get("content-type")?.includes("application/json")) {
        const result = await response.json().catch(() => null) as { message?: string } | null;
        throw new Error(result?.message || "This file could not be downloaded. Please try again.");
      }
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = fileName;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "A network error prevented the download. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return <div className="flex flex-col items-start gap-1 sm:items-end"><button type="button" disabled={pending} onClick={() => void download()} className={`inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#0F4C5C] px-4 text-sm font-semibold text-white hover:bg-[#0a3b48] disabled:cursor-wait disabled:opacity-70 ${compact ? "w-full sm:w-auto" : ""}`} aria-label={`Download ${fileName}`}>
    {pending ? <><LoaderCircle className="h-4 w-4 animate-spin" />Preparing…</> : <><Download className="h-4 w-4" />Download</>}
  </button>{error && <p role="alert" className="max-w-56 text-xs text-red-700">{error}</p>}{pending && <p role="status" className="sr-only">Preparing secure download</p>}</div>;
}
