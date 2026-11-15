import { Users } from "lucide-react";
import { db } from "@/lib/db/prisma";
import { UserStatus } from "@prisma/client";

export async function RecentUsers() {
  const recentUsers = await db.user.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
    },
  });

  if (recentUsers.length === 0) {
    return (
      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Recent Users</h2>
        </div>

        <div className="text-center py-12">
          <Users className="mx-auto w-16 h-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No users yet</h3>
          <p className="text-sm text-muted-foreground">
            User data will appear here once registrations begin.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Recent Users</h2>
      </div>

      <div className="space-y-3">
        {recentUsers.map((user) => (
          <div key={user.id} className="flex items-center justify-between p-3 rounded-lg border">
            <div>
              <p className="text-sm font-medium text-foreground">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            <div className="text-right">
              <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                user.status === UserStatus.ACTIVE ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              }`}>
                {user.status}
              </span>
              <p className="text-xs text-muted-foreground mt-1">{user.role}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
