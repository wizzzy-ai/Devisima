import Image from "next/image";
import Link from "next/link";
import { User } from "lucide-react";

interface ProfileHeaderProps {
  user: {
    name: string;
    email: string;
    role: "USER" | "SELLER" | "ADMIN";
    image: string | null;
    createdAt: Date;
  };
}

export function ProfileHeader({ user }: ProfileHeaderProps) {
  const initials = user.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  const roleLabel = user.role === "USER" ? "Buyer" : user.role === "SELLER" ? "Seller" : "Administrator";
  const joinDate = new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(user.createdAt);

  return (
    <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
      <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:gap-8">
        {/* Avatar */}
        <div className="relative">
          {user.image ? (
            <Image
              src={user.image}
              alt=""
              width={96}
              height={96}
              unoptimized
              className="h-24 w-24 rounded-2xl object-cover shadow-sm"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-primary text-3xl font-semibold text-primary-foreground shadow-sm">
              {initials}
            </div>
          )}
          <button type="button" aria-label="Profile image" className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-foreground shadow-md ring-4 ring-card">
            <User className="w-4 h-4" />
          </button>
        </div>

        {/* User Info */}
        <div className="flex-1">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">{user.name}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
              {roleLabel}
            </span>
            <span className="text-sm text-muted-foreground">Member since {joinDate}</span>
          </div>
        </div>

        {/* Edit Button */}
        <Link
          href="/profile"
          className="rounded-xl border border-border bg-background px-6 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
        >
          Edit Profile
        </Link>
      </div>
    </div>
  );
}
