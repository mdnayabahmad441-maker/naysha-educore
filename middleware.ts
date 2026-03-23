import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {

  const url = request.nextUrl
  const host = request.headers.get("host") || ""

  // =========================
  // 🚨 IMPORTANT BYPASS (FIXES YOUR CURRENT ERROR)
  // =========================

  if (
    url.pathname.startsWith("/api") ||
    url.pathname.startsWith("/onboarding") ||
    url.pathname.startsWith("/login") ||
    url.pathname.startsWith("/verify") ||
    url.pathname.startsWith("/_next") ||
    url.pathname.startsWith("/favicon")
  ) {
    return NextResponse.next()
  }

  // =========================
  // 🔹 SUBDOMAIN (TENANT)
  // =========================

  const subdomain = host.split(".")[0]

  const headers = new Headers(request.headers)

  if (
    subdomain &&
    subdomain !== "www" &&
    subdomain !== "naysha" &&
    !host.includes("localhost")
  ) {
    headers.set("x-tenant", subdomain)
  }

  // =========================
  // 🔐 AUTH PROTECTION
  // =========================

  const isAdminRoute = url.pathname.startsWith("/admin")

  const userCookie = request.cookies.get("user")?.value

  if (isAdminRoute && !userCookie) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // =========================
  // 🚫 BLOCK LOGIN IF LOGGED IN
  // =========================

  if (url.pathname === "/login" && userCookie) {
    return NextResponse.redirect(new URL("/admin", request.url))
  }

  // =========================
  // ✅ CONTINUE REQUEST
  // =========================

  return NextResponse.next({
    request: {
      headers
    }
  })
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
}