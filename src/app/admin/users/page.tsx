import { requireAdmin } from "@/lib/auth/guards";
import { AdminShell } from "@/components/admin/admin-shell";
import { UsersTable } from "./users-table";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Users - Devisima Admin",
  description: "Manage user accounts.",
  robots: "noindex",
};

export default async function AdminUsersPage() {
  const user = await requireAdmin();

  return (
    <AdminShell user={user}>
      <UsersTable />
    </AdminShell>
  );
}
