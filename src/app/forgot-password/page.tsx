import { AuthShell } from "@/components/auth/AuthShell";
import { AuthForm } from "@/components/auth/AuthForms";
export default async function ForgotPasswordPage({ searchParams }: PageProps<"/forgot-password">) {
  const params = await searchParams;
  const rawCallback = params.callbackUrl;
  const callbackUrl = Array.isArray(rawCallback) ? rawCallback[0] ?? "" : rawCallback ?? "";
  return <AuthShell><AuthForm kind="forgot" callbackUrl={callbackUrl}/></AuthShell>;
}
