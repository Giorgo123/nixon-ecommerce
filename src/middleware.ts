import { NextRequest, NextResponse } from "next/server";
import { adminSessionCookie } from "@/lib/auth-cookie";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isAdminPath = pathname.startsWith("/admin");
  const isLoggedIn = request.cookies.get(adminSessionCookie)?.value === "active";

  if (isAdminPath && !isLoggedIn) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  if (isLoggedIn && !isAdminPath && !pathname.startsWith("/_next") && !pathname.startsWith("/api") && pathname !== "/favicon.ico") {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
