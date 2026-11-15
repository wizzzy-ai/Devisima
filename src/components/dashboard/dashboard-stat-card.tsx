import { LucideIcon } from "lucide-react";

interface DashboardStatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  href: string;
  description?: string;
}

export function DashboardStatCard({ title, value, icon: Icon, href, description }: DashboardStatCardProps) {
  return (
    <a
      href={href}
      className="group block rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md sm:p-6"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{value}</p>
          {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted transition-colors group-hover:bg-accent">
          <Icon className="h-5 w-5 text-foreground" />
        </div>
      </div>
    </a>
  );
}
