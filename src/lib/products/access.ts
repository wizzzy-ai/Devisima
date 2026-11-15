import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/guards";

export async function getSellerApiUser() {
  const user = await getCurrentUser();
  if (!user) return { user: null, response: NextResponse.json({ message: "Sign in to manage products." }, { status: 401 }) };
  if (user.role !== "SELLER") return { user: null, response: NextResponse.json({ message: "Only approved sellers can manage products." }, { status: 403 }) };
  if (user.status !== "ACTIVE") return { user: null, response: NextResponse.json({ message: "This account cannot manage products." }, { status: 403 }) };
  return { user, response: null };
}
