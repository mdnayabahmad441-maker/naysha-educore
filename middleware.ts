import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {

  const url = request.nextUrl.clone()
  const host = request.headers.get("host") || ""
  const pathname = url.pathname

  // =========================
  // 🚨 BYPASS IMPORTANT ROUTES
  // =========================
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/verify") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next()
  }

  // =========================
  // 🌐 SUBDOMAIN (UNCHANGED)
  // =========================
  const subdomain = host.split(".")[0]
  const headers = new Headers(request.headers)

  if (
    subdomain &&
    subdomain !== "www" &&
    subdomain !== "naysha" &&
    subdomain !== "erp" &&
    !host.includes("localhost")
  ) {
    headers.set("x-tenant", subdomain)
  }

  // =========================
  // 🔐 AUTH CHECK (ADDED)
  // =========================
  const token = request.cookies.get("sb-access-token")?.value

  if (
    !token &&
    (
      pathname.startsWith("/admin") ||
      pathname.startsWith("/teacher") ||
      pathname.startsWith("/parent")
    )
  ) {
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  // =========================
  // 🔐 ROLE CHECK (ADDED)
  // =========================
  const role = request.cookies.get("user-role")?.value

  if (pathname.startsWith("/admin") && role !== "admin") {
    url.pathname = "/unauthorized"
    return NextResponse.redirect(url)
  }

  if (pathname.startsWith("/teacher") && role !== "teacher") {
    url.pathname = "/unauthorized"
    return NextResponse.redirect(url)
  }

  if (pathname.startsWith("/parent") && role !== "parent") {
    url.pathname = "/unauthorized"
    return NextResponse.redirect(url)
  }

  // =========================
  // 🔥 PREVENT BACK BUTTON CACHE
  // =========================
  const response = NextResponse.next({
    request: { headers }
  })

  response.headers.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate"
  )
  response.headers.set("Pragma", "no-cache")
  response.headers.set("Expires", "0")

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
}