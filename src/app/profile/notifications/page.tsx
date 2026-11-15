import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/guards";

export default async function NotificationsPage() {
  await requireAuth("/profile/notifications");
  redirect("/settings/notifications");
}
