import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { compare } from "bcryptjs";
import { db } from "@/lib/db/prisma";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { loginSchema } from "@/lib/validation/auth";

class UnverifiedEmailError extends CredentialsSignin {
  code = "email_not_verified";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  trustHost: process.env.AUTH_TRUST_HOST === "true",
  session: { strategy: "jwt", maxAge: 24 * 60 * 60 },
  pages: { signIn: "/login" },
  providers: [Credentials({
    credentials: { email: {}, password: {}, rememberMe: {} },
    async authorize(credentials, request) {
      const parsed = loginSchema.safeParse({
        email: credentials.email,
        password: credentials.password,
        rememberMe: credentials.rememberMe === "on" || credentials.rememberMe === true,
      });
      if (!parsed.success) return null;
      const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
      const [ipLimit, credentialLimit] = await Promise.all([
        checkRateLimit("loginIp", ip),
        checkRateLimit("login", `${ip}:${parsed.data.email}`),
      ]);
      if (!ipLimit.allowed || !credentialLimit.allowed) return null;
      const user = await db.user.findUnique({ where: { email: parsed.data.email } });
      if (!user || !(await compare(parsed.data.password, user.passwordHash))) return null;
      if (!user.emailVerified) throw new UnverifiedEmailError();
      return { id: user.id, name: user.name, email: user.email, image: user.image, role: user.role, status: user.status, sessionVersion: user.sessionVersion, rememberMe: parsed.data.rememberMe };
    },
  })],
  callbacks: {
    async redirect({ url, baseUrl }) {
      const baseOrigin = new URL(baseUrl).origin;
      const dashboardUrl = new URL("/dashboard", baseUrl).toString();
      const forbiddenUrl = new URL("/forbidden", baseUrl).toString();

      // If user is suspended, redirect to forbidden page
      if (token && token.status === "SUSPENDED") {
        return forbiddenUrl;
      }

      try {
        const destination = new URL(url, baseUrl);
        if (destination.origin !== baseOrigin) return dashboardUrl;
        if (["/", "/login", "/register"].includes(destination.pathname)) return dashboardUrl;
        return destination.toString();
      } catch {
        return dashboardUrl;
      }
    },
    async jwt({ token, user }) {
      if (user) {
        const extended = user as typeof user & { role?: string; status?: string; sessionVersion?: number; rememberMe?: boolean };
        token.role = extended.role;
        token.status = extended.status;
        token.sessionVersion = extended.sessionVersion;
        if (extended.rememberMe) {
          token.maxAge = 30 * 24 * 60 * 60;
        }
      }
      if (token.sub) {
        const current = await db.user.findUnique({ where: { id: token.sub }, select: { name: true, email: true, image: true, role: true, status: true, sessionVersion: true } });
        if (!current || current.sessionVersion !== token.sessionVersion) {
          delete token.sub;
          delete token.role;
          delete token.status;
          delete token.sessionVersion;
        } else {
          token.name = current.name;
          token.email = current.email;
          token.picture = current.image;
          token.role = current.role;
          token.status = current.status;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.image = (token.picture as string | null) ?? null;
        session.user.id = token.sub;
        session.user.role = token.role as "USER" | "SELLER" | "ADMIN";
        session.sessionVersion = Number(token.sessionVersion);
      }
      return session;
    },
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production" ? "__Host-devisima.session-token" : "devisima.session-token",
      options: { httpOnly: true, sameSite: "lax", path: "/", secure: process.env.NODE_ENV === "production" },
    },
  },
});
