import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/prisma";
import { getSafeCallbackUrl } from "@/lib/utils";
import { getAppBaseUrl } from "@/lib/app-url";
import type { Role } from "@prisma/client";

export async function redirectIfAuthenticated() {
  const session = await auth();
  if (session?.user?.id) redirect("/dashboard");
}

export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user || user.sessionVersion !== session.sessionVersion) return null;
  const isSellerSuspended = user.role === "SELLER" && user.sellerSuspendedAt !== null;
  return {
    ...user,
    role: isSellerSuspended ? "USER" as const : user.role,
    isSellerSuspended,
  };
}

export async function requireAuth(callbackUrl = "/dashboard") {
  const user = await getCurrentUser();
  if (!user) {
    const safeCallback = getSafeCallbackUrl(callbackUrl, getAppBaseUrl().origin) ?? "/dashboard";
    redirect(`/login?callbackUrl=${encodeURIComponent(safeCallback)}`);
  }
  return user;
}

export async function requireRole(...roles: Role[]) {
  const callbackUrl = roles.length === 1 && roles[0] === "ADMIN" ? "/admin" : roles.includes("SELLER") ? "/seller" : "/dashboard";
  const user = await requireAuth(callbackUrl);
  if (!roles.includes(user.role)) redirect("/forbidden");
  return user;
}

export const requireAdmin = () => requireRole("ADMIN");
export const requireSeller = () => requireRole("SELLER", "ADMIN");
export const requireUser = () => requireRole("USER", "SELLER", "ADMIN");

export function canManageSellerResource(actor: { id: string; role: Role }, ownerId: string) {
  return actor.role === "ADMIN" || (actor.role === "SELLER" && actor.id === ownerId);
}

export async function requireSellerResourceOwner(ownerId: string) {
  const user = await requireAuth();
  if (!canManageSellerResource(user, ownerId)) redirect("/unauthorized");
  return user;
}
