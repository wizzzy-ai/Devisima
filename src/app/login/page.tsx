import { Suspense } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthForm } from "@/components/auth/AuthForms";
import { redirectIfAuthenticated } from "@/lib/auth/guards";
export default async function LoginPage() { await redirectIfAuthenticated(); return <AuthShell><Suspense><AuthForm kind="login"/></Suspense></AuthShell>; }
