import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isAuthenticated = !!req.auth;
  const userStatus = req.auth?.user?.status;

  // Allow suspended users to access the forbidden page
  if (pathname === "/forbidden") {
    return NextResponse.next();
  }

  // Redirect suspended users to forbidden page
  if (isAuthenticated && userStatus === "SUSPENDED") {
    return NextResponse.redirect(new URL("/forbidden", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
