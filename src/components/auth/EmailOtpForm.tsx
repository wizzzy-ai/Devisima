"use client";

import { useEffect, useRef, useState, type FormEvent, type ClipboardEvent, type KeyboardEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { getSafeCallbackUrl } from "@/lib/utils";

const otpLength = 6;

export function EmailOtpForm({ email: initialEmail, callbackUrl = "", initialSecondsLeft = 0 }: { email: string; callbackUrl?: string; initialSecondsLeft?: number }) {
  const [email, setEmail] = useState(initialEmail);
  const [digits, setDigits] = useState<string[]>(() => Array(otpLength).fill(""));
  const [secondsLeft, setSecondsLeft] = useState(initialSecondsLeft);
  const [pending, setPending] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const router = useRouter();
  const safeCallback = getSafeCallbackUrl(callbackUrl || new URLSearchParams(window.location.search).get("callbackUrl"), window.location.origin);

  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = window.setInterval(() => setSecondsLeft((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [secondsLeft]);

  function updateDigits(start: number, value: string) {
    const numeric = value.replace(/\D/g, "").slice(0, otpLength - start);
    const next = [...digits];
    if (!numeric) {
      next[start] = "";
      setDigits(next);
      return;
    }
    numeric.split("").forEach((digit, offset) => { next[start + offset] = digit; });
    setDigits(next);
    const focusIndex = Math.min(start + Math.max(numeric.length, 1), otpLength - 1);
    inputs.current[focusIndex]?.focus();
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>, index: number) {
    event.preventDefault();
    updateDigits(index, event.clipboardData.getData("text"));
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>, index: number) {
    if (event.key === "Backspace") {
      event.preventDefault();
      const next = [...digits];
      const targetIndex = digits[index] || index === 0 ? index : index - 1;
      next[targetIndex] = "";
      setDigits(next);
      inputs.current[targetIndex]?.focus();
    } else if (event.key === "ArrowLeft" && index > 0) {
      inputs.current[index - 1]?.focus();
    } else if (event.key === "ArrowRight" && index < otpLength - 1) {
      inputs.current[index + 1]?.focus();
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setPending(true);
    try {
      const response = await fetch("/api/accounts/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: digits.join("") }),
      });
      const result = await response.json().catch(() => null) as { message?: string } | null;
      if (!response.ok) throw new Error(result?.message ?? "We could not verify that code. Please try again.");
      setSuccess(result?.message ?? "Your email has been verified.");
      const loginQuery = new URLSearchParams({ verified: "1" });
      if (safeCallback) loginQuery.set("callbackUrl", safeCallback);
      window.setTimeout(() => router.replace(`/login?${loginQuery.toString()}`), 1200);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "A network error occurred. Please try again.");
    } finally {
      setPending(false);
    }
  }

  async function resendCode() {
    setError("");
    setSuccess("");
    setResending(true);
    try {
      const response = await fetch("/api/accounts/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = await response.json().catch(() => null) as { message?: string; resendInSeconds?: number } | null;
      if (!response.ok) throw new Error(result?.message ?? "We could not send a new code. Please try again shortly.");
      setSuccess(result?.message ?? "If this address needs verification, a new code will be sent shortly.");
      setSecondsLeft(result?.resendInSeconds ?? 60);
      setDigits(Array(otpLength).fill(""));
      inputs.current[0]?.focus();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "A network error occurred. Please try again.");
    } finally {
      setResending(false);
    }
  }

  const changeEmailHref = safeCallback
    ? `/register?callbackUrl=${encodeURIComponent(safeCallback)}`
    : "/register";

  return (
    <div>
      <div className="mb-8">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#0F4C5C]">Devisima account</p>
        <h2 className="text-3xl font-semibold tracking-tight">Verify your email</h2>
        <p className="mt-2 text-sm leading-6 text-[#697579]">
          {email ? <>We sent a 6-digit verification code to <span className="font-semibold text-[#26343a]">{email}</span>.</> : "Enter your email and the 6-digit verification code we sent you."}
          {" "}The code expires in 10 minutes.
        </p>
      </div>

      {!email && <label className="mb-5 block text-sm font-semibold text-[#26343a]" htmlFor="verification-email">Email address<input className="mt-2 h-12 w-full rounded-xl border border-[#d9dedb] bg-white px-4 text-sm font-normal text-[#101820] outline-none transition focus:border-[#0F4C5C] focus:ring-4 focus:ring-[#0F4C5C]/10" id="verification-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required/></label>}

      <form onSubmit={submit} className="space-y-6">
        <fieldset disabled={pending || resending}>
          <legend className="sr-only">6-digit verification code</legend>
          <div className="flex justify-center gap-2 sm:gap-3" dir="ltr">
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(element) => { inputs.current[index] = element; }}
                aria-label={`Digit ${index + 1} of ${otpLength}`}
                autoComplete={index === 0 ? "one-time-code" : "off"}
                className="aspect-square min-w-0 max-w-14 flex-1 rounded-xl border border-[#d9dedb] bg-white text-center text-xl font-semibold text-[#101820] outline-none transition focus:border-[#0F4C5C] focus:ring-4 focus:ring-[#0F4C5C]/10 disabled:opacity-70"
                inputMode="numeric"
                maxLength={1}
                pattern="[0-9]*"
                required
                type="text"
                value={digit}
                onChange={(event) => updateDigits(index, event.target.value)}
                onKeyDown={(event) => handleKeyDown(event, index)}
                onPaste={(event) => handlePaste(event, index)}
              />
            ))}
          </div>
        </fieldset>

        {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        {success && <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{success}</p>}

        <button disabled={pending || resending || !email || digits.join("").length !== otpLength} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0F4C5C] px-4 text-sm font-semibold text-white transition hover:bg-[#0a3b48] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F4C5C] disabled:cursor-not-allowed disabled:opacity-60">
          {pending && <LoaderCircle className="animate-spin" size={17}/ >}{pending ? "Verifying..." : "Verify email"}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-[#697579]">
        <p>Didn’t receive the code?</p>
        {secondsLeft > 0
          ? <p className="mt-2 font-medium text-[#778386]" aria-live="polite">Resend code in {secondsLeft}s</p>
          : <button type="button" onClick={resendCode} disabled={resending || pending || !email} className="mt-2 font-semibold text-[#0F4C5C] hover:underline disabled:opacity-60">{resending ? "Sending code..." : "Resend code"}</button>}
      </div>

      <p className="mt-6 text-center text-sm"><Link className="font-semibold text-[#0F4C5C] hover:underline" href={changeEmailHref}>← Change email</Link></p>
      <p className="mt-3 text-center text-sm text-[#697579]">Already verified? <Link className="font-semibold text-[#0F4C5C] hover:underline" href="/login">Sign in</Link></p>
    </div>
  );
}
