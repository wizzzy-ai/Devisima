import { ShoppingBag, Download, Heart, MessageSquare, Package, DollarSign, LucideIcon } from "lucide-react";

interface ProfileStatsProps {
  role: "USER" | "SELLER" | "ADMIN";
}

export function ProfileStats({ role }: ProfileStatsProps) {
  if (role === "USER") {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={ShoppingBag} label="Purchases" value="0" />
        <StatCard icon={Download} label="Downloads" value="0" />
        <StatCard icon={Heart} label="Wishlist" value="0" />
        <StatCard icon={MessageSquare} label="Reviews" value="0" />
      </div>
    );
  }

  if (role === "SELLER") {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={Package} label="Products" value="0" />
        <StatCard icon={ShoppingBag} label="Sales" value="0" />
        <StatCard icon={DollarSign} label="Earnings" value="$0" />
        <StatCard icon={MessageSquare} label="Reviews" value="0" />
      </div>
    );
  }

  return null;
}

function StatCard({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <Icon className="w-5 h-5 text-primary mb-2" />
      <p className="text-2xl font-semibold">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
