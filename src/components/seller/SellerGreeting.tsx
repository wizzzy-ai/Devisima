import Link from "next/link";
import { ArrowUpRight, Sparkles, Plus } from "lucide-react";

interface SellerGreetingProps {
  userName?: string;
  label?: string;
  title?: string;
  subtitle?: string;
  buttonText?: string;
  buttonHref?: string;
  showGreeting?: boolean;
}

export function SellerGreeting({
  userName,
  label = "Your seller space",
  title,
  subtitle = "Manage your products, track your earnings, and grow your digital business on Devisima.",
  buttonText = "Create a product",
  buttonHref = "/seller/products/new",
  showGreeting = true
}: SellerGreetingProps) {
  const firstName = userName?.split(" ")[0];
  const hour = new Date().getHours();
  const greeting = hour >= 17 ? "Good evening" : hour >= 12 ? "Good afternoon" : "Good morning";

  return (
    <section className="relative isolate mb-8 overflow-hidden rounded-[2rem] bg-primary px-6 py-8 text-primary-foreground sm:px-10 sm:py-10">
      <div className="pointer-events-none absolute -right-20 -top-36 -z-10 h-80 w-80 rounded-full border-[40px] border-border/20" />
      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-accent"><Sparkles className="h-4 w-4" /> {label}</p>
      {showGreeting && userName ? (
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{greeting}, {firstName}.</h1>
      ) : (
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
      )}
      {!showGreeting && subtitle && <p className="mt-4 max-w-xl text-sm leading-6 text-primary-foreground/70 sm:text-base">{subtitle}</p>}
      {showGreeting && (
        <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <p className="max-w-xl text-sm leading-6 text-primary-foreground/70 sm:text-base">{subtitle}</p>
          <Link href={buttonHref} className="inline-flex w-fit items-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-bold text-accent-foreground transition hover:bg-accent/90">{buttonText} <Plus className="h-4 w-4" /></Link>
        </div>
      )}
    </section>
  );
}
