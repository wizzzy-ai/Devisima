import Link from "next/link";
import { ArrowUpRight, ShieldCheck } from "lucide-react";
import { TrueFocus } from "@/components/auth/TrueFocus";

export function AuthShell({ children }: { children: React.ReactNode }) {
  return <main className="min-h-screen bg-[#F7F5EF] text-[#101820] lg:grid lg:grid-cols-[minmax(0,0.95fr)_minmax(420px,1.05fr)]">
    <aside className="relative hidden min-h-screen flex-col justify-between overflow-hidden bg-[#0F4C5C] p-12 text-white lg:flex xl:p-16">
      <Link href="/" className="text-xl font-black tracking-tight">devisima<span className="text-[#35D0BA]">.</span></Link>
      <div className="relative z-10 max-w-lg pb-16">
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1.5 text-xs font-semibold text-white/80"><ShieldCheck size={15} className="text-[#35D0BA]"/> A home for digital builders</div>
        <h1 className="max-w-full text-5xl font-semibold leading-[1.08] tracking-tight xl:text-6xl">
          <TrueFocus
            sentence="Find your next great digital product."
            blurAmount={4}
            animationDuration={0.55}
            pauseBetweenAnimations={1.1}
          />
        </h1>
        <p className="mt-6 max-w-sm text-base leading-7 text-white/70">Discover the tools, software, and ideas that help great work move forward.</p>
        <Link href="/marketplace" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[#35D0BA] hover:text-white">Explore the marketplace <ArrowUpRight size={16}/></Link>
      </div>
      <p className="text-xs text-white/50">© {new Date().getFullYear()} Devisima</p>
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 -right-24 h-[34rem] w-[34rem] rounded-full border border-white/10"><div className="absolute inset-10 rounded-full border border-white/10"><div className="absolute inset-10 rounded-full border border-[#35D0BA]/20"/></div></div>
    </aside>
    <section className="flex min-h-screen flex-col px-5 py-6 sm:px-10 lg:px-14 xl:px-24">
      <div className="mb-12 flex items-center justify-between lg:mb-0"><Link href="/" className="text-lg font-black tracking-tight text-[#0F4C5C] lg:hidden">devisima<span className="text-[#35D0BA]">.</span></Link><Link href="/" className="ml-auto text-sm font-medium text-[#5b676e] hover:text-[#0F4C5C]">Back to home</Link></div>
      <div className="mx-auto flex w-full max-w-[440px] flex-1 flex-col justify-center pb-10">{children}</div>
      <p className="pt-6 text-center text-xs text-[#7a8589]">A more thoughtful way to find your next digital tool.</p>
    </section>
  </main>;
}
