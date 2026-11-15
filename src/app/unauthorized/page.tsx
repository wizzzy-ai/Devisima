import Link from "next/link";

export default function UnauthorizedPage() {
  return <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-6 py-24 text-center"><p className="text-sm font-semibold uppercase tracking-widest text-primary">Access restricted</p><h1 className="mt-3 text-3xl font-semibold">You don’t have permission to access this page.</h1><p className="mt-3 text-muted-foreground">Sign in with an account that has access, or return to your dashboard.</p><Link href="/dashboard" className="mt-7 rounded-xl bg-[#0F4C5C] px-5 py-3 font-semibold text-white">Go to Dashboard</Link></main>;
}
