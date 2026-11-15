import { AuthShell } from "@/components/auth/AuthShell";
import { AuthForm } from "@/components/auth/AuthForms";
export default async function ResetPasswordPage({ searchParams }: PageProps<"/reset-password">) {
  const params = await searchParams;
  const rawToken = params.token;
  const token = Array.isArray(rawToken) ? rawToken[0] ?? "" : rawToken ?? "";
  const rawCallback = params.callbackUrl;
  const callbackUrl = Array.isArray(rawCallback) ? rawCallback[0] ?? "" : rawCallback ?? "";
  return <AuthShell><AuthForm kind="reset" token={token} callbackUrl={callbackUrl}/></AuthShell>;
}
