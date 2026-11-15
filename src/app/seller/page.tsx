import { requireSeller } from "@/lib/auth/guards";
import { redirect } from "next/navigation";
export default async function SellerPage() { await requireSeller(); redirect("/seller/dashboard"); }
