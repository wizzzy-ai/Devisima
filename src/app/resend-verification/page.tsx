import { AuthShell } from "@/components/auth/AuthShell";
import { AuthForm } from "@/components/auth/AuthForms";
export default async function ResendVerificationPage({ searchParams }: PageProps<"/resend-verification">) {
  const params = await searchParams;
  const rawCallback = params.callbackUrl;
  const callbackUrl = Array.isArray(rawCallback) ? rawCallback[0] ?? "" : rawCallback ?? "";
  return <AuthShell><AuthForm kind="resend" callbackUrl={callbackUrl}/></AuthShell>;
}
