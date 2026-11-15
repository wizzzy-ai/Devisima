"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema } from "@/lib/validation/auth";
import { getSafeCallbackUrl } from "@/lib/utils";
import SquishSwitch from "@/components/ui/SquishSwitch";

type FormKind = "login" | "register" | "forgot" | "reset" | "verify" | "resend";
const inputClass = "mt-2 h-12 w-full rounded-xl border border-[#d9dedb] bg-white px-4 text-sm text-[#101820] outline-none transition placeholder:text-[#a0a9a6] focus:border-[#0F4C5C] focus:ring-4 focus:ring-[#0F4C5C]/10";

export function AuthForm({ kind, token = "", callbackUrl = "" }: { kind: FormKind; token?: string; callbackUrl?: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const router = useRouter();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setSuccess("");
    const form = new FormData(event.currentTarget);
    const values: Record<string, FormDataEntryValue> = Object.fromEntries(form.entries());
    const validationValues = kind === "register" ? { ...values, acceptTerms } : values;
    const validation = kind === "register" ? registerSchema.safeParse(validationValues) : kind === "login" ? loginSchema.safeParse(values) : kind === "reset" ? resetPasswordSchema.safeParse({ ...values, token }) : kind === "forgot" || kind === "resend" ? forgotPasswordSchema.safeParse(values) : null;
    if (validation && !validation.success) { setError(validation.error.issues[0]?.message ?? "Check the information you entered."); return; }
    setPending(true);
    try {
      if (kind === "login") {
        const resolvedCallbackUrl = callbackUrl || new URLSearchParams(window.location.search).get("callbackUrl");
        const safeDestination = getSafeCallbackUrl(resolvedCallbackUrl, window.location.origin) ?? "/dashboard";
        const result = await signIn("credentials", { email: values.email, password: values.password, rememberMe, redirect: false, callbackUrl: safeDestination });
        if (result?.code === "email_not_verified") {
          const query = new URLSearchParams({ email: String(values.email) });
          if (safeDestination !== "/dashboard") query.set("callbackUrl", safeDestination);
          router.replace(`/verify-email?${query.toString()}`);
          return;
        }
        if (result?.error === "MissingCSRF") {
          throw new Error("This browser did not send the sign-in security cookie. Clear site data for localhost or try another browser, then sign in again.");
        }
        if (result?.error === "CredentialsSignin") {
          throw new Error("The email or password you entered is incorrect.");
        }
        if (result?.error) {
          throw new Error("We could not complete sign-in. Refresh this page and try again.");
        }
        window.location.assign(result?.url ?? "/dashboard");
        return;
      }
      const path = kind === "register" ? "register" : kind === "forgot" || kind === "resend" ? (kind === "forgot" ? "forgot-password" : "resend-verification") : kind === "reset" ? "reset-password" : "verify-email";
      const payload = kind === "verify" ? { token } : kind === "register" ? validationValues : kind === "reset" ? { ...values, token } : values;
      const response = await fetch(`/api/accounts/${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json().catch(() => null) as { message?: string } | null;
      if (!response.ok) throw new Error(result?.message ?? "The server could not complete this request. Please try again shortly.");
      if (!result) throw new Error("The server returned an unexpected response. Please try again shortly.");
      if (kind === "register") {
        const query = new URLSearchParams({ email: String(values.email), resendIn: "60" });
        const resolvedCallbackUrl = callbackUrl || new URLSearchParams(window.location.search).get("callbackUrl");
        const safeCallback = getSafeCallbackUrl(resolvedCallbackUrl, window.location.origin);
        if (safeCallback) query.set("callbackUrl", safeCallback);
        router.replace(`/verify-email?${query.toString()}`);
        return;
      }
      setSuccess(result.message ?? "Done.");
      if (kind === "reset" || kind === "forgot" || kind === "resend") {
        const loginQuery = new URLSearchParams();
        const safeCallback = getSafeCallbackUrl(callbackUrl || new URLSearchParams(window.location.search).get("callbackUrl"), window.location.origin);
        if (safeCallback) loginQuery.set("callbackUrl", safeCallback);
        window.setTimeout(() => router.push(`/login?${loginQuery.toString()}`), 1800);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "A network error occurred. Please try again.");
    } finally { setPending(false); }
  }

  const titles: Record<FormKind, [string, string]> = {
    login: ["Welcome back", "Sign in to continue to Devisima."],
    register: ["Create your Devisima account", "Join a marketplace built for people who build, buy, and sell digital products."],
    forgot: ["Forgot your password?", "Enter your email and weâ€™ll send a secure reset link."],
    reset: ["Choose a new password", "Create a strong password for your account."],
    verify: ["Verify your email", "Confirm your email address to finish setting up your account."],
    resend: ["Resend verification code", "Enter your email and weâ€™ll send a new 6-digit code if verification is needed."],
  };
  const [title, description] = titles[kind];
  const passwordField = (name: "password" | "confirmPassword", label: string) => <label className="block text-sm font-semibold text-[#26343a]" htmlFor={name}>{label}<span className="relative block"><input className={inputClass} id={name} name={name} type={showPassword ? "text" : "password"} autoComplete={name === "password" ? (kind === "login" ? "current-password" : "new-password") : "new-password"} required minLength={kind === "login" ? undefined : 8} maxLength={128}/><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-[#68767a] hover:text-[#0F4C5C] focus-visible:outline-2 focus-visible:outline-[#0F4C5C]">{showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button></span></label>;

  return <div>
    <div className="mb-8"><p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#0F4C5C]">Devisima account</p><h2 className="text-3xl font-semibold tracking-tight">{title}</h2><p className="mt-2 text-sm leading-6 text-[#697579]">{description}</p></div>
    {kind === "verify" ? <div className="space-y-4">
      <form onSubmit={submit}><input type="hidden" name="token" value={token}/><button disabled={pending || !token} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0F4C5C] px-4 text-sm font-semibold text-white transition hover:bg-[#0a3b48] disabled:opacity-60">{pending && <LoaderCircle className="animate-spin" size={17}/ >}{pending ? "Verifying..." : "Verify email"}</button></form>
      {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}{success && <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{success}</p>}
      <form onSubmit={(event) => { event.preventDefault(); const safeCallback = getSafeCallbackUrl(callbackUrl || new URLSearchParams(window.location.search).get("callbackUrl"), window.location.origin); router.push(safeCallback ? `/resend-verification?callbackUrl=${encodeURIComponent(safeCallback)}` : "/resend-verification"); }}><button className="text-sm font-semibold text-[#0F4C5C] hover:underline">Request a new verification email</button></form></div> :
      <form onSubmit={submit} className="space-y-5">
        {(kind === "register") && <label className="block text-sm font-semibold text-[#26343a]" htmlFor="name">Full name<input className={inputClass} id="name" name="name" autoComplete="name" minLength={2} maxLength={80} required placeholder="Your name"/></label>}
        {(kind === "login" || kind === "register" || kind === "forgot" || kind === "resend") && <label className="block text-sm font-semibold text-[#26343a]" htmlFor="email">Email address<input className={inputClass} id="email" name="email" type="email" autoComplete="email" maxLength={254} required placeholder="you@example.com"/></label>}
        {(kind === "login" || kind === "register" || kind === "reset") && passwordField("password", kind === "login" ? "Password" : "Password")}
        {(kind === "register" || kind === "reset") && passwordField("confirmPassword", "Confirm password")}
        {(kind === "register" || kind === "reset") && <p className="-mt-2 text-xs leading-5 text-[#778386]">Use at least 8 characters with an uppercase letter, a lowercase letter, and a number.</p>}
        {kind === "register" && <div className="flex items-center justify-between gap-4 text-sm leading-5 text-[#697579]"><span>I agree to Devisima's Terms &amp; Conditions.</span><SquishSwitch checked={acceptTerms} onChange={setAcceptTerms} ariaLabel="Accept Devisima terms and conditions" trackColor="#dce5e2" trackOnColor="#174c43" thumbColor="#ffffff" thumbOnColor="#ffffff" width={44} height={24} radius={12} speed={50} stretch={36} hoverScale={1.035} colorDuration={320}/></div>}
        {kind === "login" && <div className="flex items-center justify-between -mt-2"><div className="flex items-center gap-3 text-sm text-[#697579]"><span>Remember me</span><SquishSwitch checked={rememberMe} onChange={setRememberMe} ariaLabel="Remember me" trackColor="#dce5e2" trackOnColor="#174c43" thumbColor="#ffffff" thumbOnColor="#ffffff" width={44} height={24} radius={12} speed={50} stretch={36} hoverScale={1.035} colorDuration={320}/></div><Link href="/forgot-password" onClick={(event) => { const safeCallback = getSafeCallbackUrl(new URLSearchParams(window.location.search).get("callbackUrl"), window.location.origin); if (safeCallback) { event.preventDefault(); router.push(`/forgot-password?callbackUrl=${encodeURIComponent(safeCallback)}`); } }} className="text-sm font-semibold text-[#0F4C5C] hover:underline">Forgot password?</Link></div>}
        {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        {success && <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{success}</p>}
        <button disabled={pending} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0F4C5C] px-4 text-sm font-semibold text-white transition hover:bg-[#0a3b48] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F4C5C] disabled:cursor-not-allowed disabled:opacity-60">{pending && <LoaderCircle className="animate-spin" size={17}/ >}{pending ? (kind === "login" ? "Signing in..." : kind === "register" ? "Creating account..." : kind === "reset" ? "Resetting password..." : "Sending email...") : (kind === "login" ? "Sign in" : kind === "register" ? "Create Account" : kind === "forgot" || kind === "resend" ? "Send email" : "Reset password")}</button>
      </form>}
    {kind === "register" && <p className="mt-6 text-center text-sm text-[#697579]">Already have an account? <Link className="font-semibold text-[#0F4C5C] hover:underline" href="/login">Sign in</Link></p>}
    {kind === "login" && <><p className="mt-6 text-center text-sm text-[#697579]">New to Devisima? <Link className="font-semibold text-[#0F4C5C] hover:underline" href="/register" onClick={(event) => { const safeCallback = getSafeCallbackUrl(new URLSearchParams(window.location.search).get("callbackUrl"), window.location.origin); if (safeCallback) { event.preventDefault(); router.push(`/register?callbackUrl=${encodeURIComponent(safeCallback)}`); } }}>Create an account</Link></p><p className="mt-3 text-center text-sm text-[#697579]"><Link className="font-semibold text-[#0F4C5C] hover:underline" href="/resend-verification" onClick={(event) => { const safeCallback = getSafeCallbackUrl(new URLSearchParams(window.location.search).get("callbackUrl"), window.location.origin); if (safeCallback) { event.preventDefault(); router.push(`/resend-verification?callbackUrl=${encodeURIComponent(safeCallback)}`); } }}>Resend verification code</Link></p></>}
    {(kind === "forgot" || kind === "reset") && <p className="mt-6 text-center text-sm text-[#697579]"><Link className="font-semibold text-[#0F4C5C] hover:underline" href="/login" onClick={(event) => { const safeCallback = getSafeCallbackUrl(callbackUrl || new URLSearchParams(window.location.search).get("callbackUrl"), window.location.origin); if (safeCallback) { event.preventDefault(); router.push(`/login?callbackUrl=${encodeURIComponent(safeCallback)}`); } }}>Back to sign in</Link></p>}
  </div>;
}

