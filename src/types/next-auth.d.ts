import "next-auth";

declare module "next-auth" {
  interface Session { user: { id: string; role: "USER" | "SELLER" | "ADMIN" } & NonNullable<Session["user"]>; sessionVersion?: number }
  interface User { role?: "USER" | "SELLER" | "ADMIN"; sessionVersion?: number }
}

declare module "next-auth/jwt" {
  interface JWT { role?: "USER" | "SELLER" | "ADMIN"; sessionVersion?: number }
}
