import { db } from "@/lib/db/prisma";
import { Users, Search, Filter } from "lucide-react";
import { Prisma } from "@prisma/client";

async function withDatabaseFallback<T>(fallback: T, operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P1001") {
      return fallback;
    }
    throw error;
  }
}

export async function SellerFollowers({ sellerId }: { sellerId: string }) {
  const followers = await withDatabaseFallback([], async () =>
    db.storeFollow.findMany({
      where: { sellerId },
      include: {
        follower: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            createdAt: true,
          },
        },
      },
      orderBy: { followedAt: "desc" },
    })
  );

  const followerCount = followers.length;

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Header with follower count */}
      <div className="border-b border-border p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Your store</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
              {followerCount.toLocaleString()} Follower{followerCount !== 1 ? 's' : ''}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-foreground hover:bg-muted/50 transition">
              <Filter className="h-4 w-4" />
              <span>Filter</span>
            </button>
            <button className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-foreground hover:bg-muted/50 transition">
              <Search className="h-4 w-4" />
              <span>Search</span>
            </button>
          </div>
        </div>
      </div>

      {/* Followers list */}
      {followers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted/30">
            <Users className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-foreground">No followers yet</h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm">
            Share your store and products to attract more followers. When people follow your store, they'll see your new products in their feed.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {followers.map((follow) => {
            const follower = follow.follower;
            const initials = follower.name?.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "U";
            const joinedDate = new Intl.DateTimeFormat("en", { month: "short", year: "numeric" }).format(follower.createdAt);
            const followedDate = new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(follow.followedAt);

            return (
              <div key={follow.id} className="flex items-center gap-4 p-4 hover:bg-muted/30 transition">
                {/* Profile picture */}
                <div className="relative shrink-0">
                  <div className="h-14 w-14 rounded-full border-2 border-border bg-muted/30 flex items-center justify-center overflow-hidden">
                    {follower.image ? (
                      <img src={follower.image} alt={follower.name || "User"} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-lg font-semibold text-muted-foreground">{initials}</span>
                    )}
                  </div>
                </div>

                {/* User info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-foreground truncate">{follower.name || "User"}</p>
                    <span className="text-xs text-muted-foreground">•</span>
                    <p className="text-xs text-muted-foreground">Joined {joinedDate}</p>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{follower.email}</p>
                  <p className="text-xs text-muted-foreground mt-1">Started following {followedDate}</p>
                </div>

                {/* Action button */}
                <button className="shrink-0 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition">
                  Following
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
