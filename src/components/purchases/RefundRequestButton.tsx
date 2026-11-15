"use client";

import { useState } from "react";
import Link from "next/link";

export function RefundRequestButton({ purchaseId, orderReference }: { purchaseId: string; orderReference: string }) {
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function submit() {
    const trimmed = reason.trim();
    if (!trimmed) {
      setError("Add a short reason before submitting a refund request.");
      return;
    }

    setPending(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/purchases/${purchaseId}/refund-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ reason: trimmed }),
      });

      const data = (await response.json().catch(() => null)) as { message?: string } | null;
      if (!response.ok) {
        throw new Error(data?.message || "We could not submit the refund request. Please try again.");
      }

      setReason("");
      setMessage(data?.message || `A refund request for ${orderReference} is now pending review.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "A network problem blocked the refund request.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-6 rounded-2xl border border-[#dce3dd] bg-[#f9faf7] p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0F4C5C]">Refund request</p>
          <h3 className="mt-1 text-lg font-semibold text-[#101820]">Need a refund?</h3>
        </div>
      </div>

      <p className="mt-2 text-sm leading-6 text-[#697579]">
        Submit a review request for {orderReference}. Devisima will assess the request against your purchase and the refund policy before approving any reversal.
      </p>
      <p className="mt-2 text-sm leading-6 text-[#697579]">
        Submitting a request does not itself reverse the payment. Read the <Link href="/refund-policy" className="font-semibold text-[#0F4C5C] underline-offset-4 hover:underline">Refund Policy</Link> or <Link href="/contact" className="font-semibold text-[#0F4C5C] underline-offset-4 hover:underline">contact support</Link> for help.
      </p>

      <textarea
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        rows={4}
        placeholder="Tell us why you want a refund..."
        className="mt-4 w-full rounded-xl border border-[#dce3dd] bg-white px-3 py-2.5 text-sm text-[#101820] outline-none transition focus:border-[#0F4C5C]"
      />

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void submit()}
          disabled={pending || !reason.trim()}
          className="inline-flex h-10 items-center justify-center rounded-xl bg-[#0F4C5C] px-4 text-sm font-semibold text-white transition hover:bg-[#0a3b48] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Submitting..." : "Request refund"}
        </button>
      </div>

      {message && <p className="mt-3 text-sm font-medium text-[#0F4C5C]">{message}</p>}
      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
    </div>
  );
}
