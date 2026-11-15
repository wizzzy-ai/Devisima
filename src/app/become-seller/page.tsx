import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/guards";

export default async function BecomeSellerPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/seller/apply");
  if (user.role === "SELLER") redirect("/seller/dashboard");
  if (user.role === "ADMIN") redirect("/admin");
  redirect("/seller/apply");
}
