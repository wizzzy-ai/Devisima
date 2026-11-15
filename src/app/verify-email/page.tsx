import { AuthShell } from "@/components/auth/AuthShell";
import { AuthForm } from "@/components/auth/AuthForms";
import { EmailOtpForm } from "@/components/auth/EmailOtpForm";
export default async function VerifyEmailPage({ searchParams }: PageProps<"/verify-email">) {
  const params = await searchParams;
  const rawToken = params.token;
  const token = Array.isArray(rawToken) ? rawToken[0] ?? "" : rawToken ?? "";
  const rawCallback = params.callbackUrl;
  const callbackUrl = Array.isArray(rawCallback) ? rawCallback[0] ?? "" : rawCallback ?? "";
  if (token) return <AuthShell><AuthForm kind="verify" token={token} callbackUrl={callbackUrl}/></AuthShell>;
  const rawEmail = params.email;
  const email = Array.isArray(rawEmail) ? rawEmail[0] ?? "" : rawEmail ?? "";
  const initialSeconds = params.resendIn === "60" ? 60 : 0;
  return <AuthShell><EmailOtpForm email={email} callbackUrl={callbackUrl} initialSecondsLeft={initialSeconds}/></AuthShell>;
}
