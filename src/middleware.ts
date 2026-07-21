import { NextRequest, NextResponse } from "next/server";
import { adminSessionCookie } from "@/lib/auth-cookie";
import { verifySessionToken } from "@/lib/session-token";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isAdminPath = pathname.startsWith("/admin");
  const isLoginPath = pathname === "/admin/login";
  const isLoggedIn = await verifySessionToken(request.cookies.get(adminSessionCookie)?.value);

  if (isAdminPath && !isLoginPath && !isLoggedIn) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  if (isLoggedIn && isLoginPath) {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  if (isLoggedIn && !isAdminPath && !pathname.startsWith("/_next") && !pathname.startsWith("/api") && pathname !== "/favicon.ico") {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
