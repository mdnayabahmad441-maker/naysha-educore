import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {

  const url = request.nextUrl
  const host = request.headers.get("host") || ""

  // 🔥 ALLOW PUBLIC ROUTES
  if (
    url.pathname.startsWith("/api") ||
    url.pathname.startsWith("/login") ||
    url.pathname.startsWith("/verify") ||
    url.pathname.startsWith("/onboarding") ||
    url.pathname.startsWith("/auth") ||
    url.pathname.startsWith("/_next") ||
    url.pathname.startsWith("/favicon")
  ) {
    return NextResponse.next()
  }

  // 🔥 EXTRACT SUBDOMAIN
  const subdomain = host.split(".")[0]

  // ✅ ALLOW MAIN DOMAIN (erp)
  if (
    subdomain === "erp" ||
    subdomain === "www" ||
    host.includes("localhost")
  ) {
    return NextResponse.next()
  }

  // 🔥 PROTECT TENANT ROUTES
  const isAdmin = url.pathname.startsWith("/admin")

  const token = request.cookies.get("sb-access-token")

  if (isAdmin && !token) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
}