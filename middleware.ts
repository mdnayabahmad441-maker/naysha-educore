import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {

  const url = request.nextUrl
  const host = request.headers.get("host") || ""

  // =========================
  // 🚨 BYPASS IMPORTANT ROUTES
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
  // 🌐 SAFE SUBDOMAIN HANDLING
  // =========================

  const subdomain = host.split(".")[0]

  const headers = new Headers(request.headers)

  // ✅ only set tenant for REAL subdomains
  if (
    subdomain &&
    subdomain !== "www" &&
    subdomain !== "naysha" &&
    subdomain !== "erp" && // 🔥 IMPORTANT FIX
    !host.includes("localhost")
  ) {
    headers.set("x-tenant", subdomain)
  }

  // =========================
  // ❌ REMOVE AUTH FROM MIDDLEWARE
  // =========================
  // (handled in frontend with Supabase)

  return NextResponse.next({
    request: {
      headers
    }
  })
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
}