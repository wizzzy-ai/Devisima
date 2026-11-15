import { AuthShell } from "@/components/auth/AuthShell";
import { AuthForm } from "@/components/auth/AuthForms";
import { redirectIfAuthenticated } from "@/lib/auth/guards";
export default async function RegisterPage({ searchParams }: PageProps<"/register">) {
  await redirectIfAuthenticated();
  const params = await searchParams;
  const rawCallback = params.callbackUrl;
  const callbackUrl = Array.isArray(rawCallback) ? rawCallback[0] ?? "" : rawCallback ?? "";
  return <AuthShell><AuthForm kind="register" callbackUrl={callbackUrl}/></AuthShell>;
}
