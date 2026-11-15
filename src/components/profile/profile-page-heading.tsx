import { Sparkles } from "lucide-react";

export function ProfilePageHeading({ title, description }: { title: string; description: string }) {
  return (
    <section className="relative isolate mb-8 overflow-hidden rounded-[1.75rem] bg-primary px-6 py-7 text-primary-foreground sm:px-8 sm:py-8">
      <div className="pointer-events-none absolute -right-14 -top-28 -z-10 h-64 w-64 rounded-full border-[32px] border-border/20" />
      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-accent"><Sparkles className="h-3.5 w-3.5"/> Account settings</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-2 max-w-xl text-sm leading-6 text-primary-foreground/70">{description}</p>
    </section>
  );
}
