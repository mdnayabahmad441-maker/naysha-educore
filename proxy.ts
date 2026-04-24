import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function proxy(request: NextRequest) {
  const url = request.nextUrl
  const host = request.headers.get("host") || ""
  const response = NextResponse.next()

  if (
    url.pathname.startsWith("/api") ||
    url.pathname.startsWith("/onboarding") ||
    url.pathname.startsWith("/login") ||
    url.pathname.startsWith("/verify") ||
    url.pathname.startsWith("/_next") ||
    url.pathname.startsWith("/favicon")
  ) {
    response.headers.set("X-Frame-Options", "DENY")
    response.headers.set("X-Content-Type-Options", "nosniff")
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
    response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
    return response
  }

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

  const tenantResponse = NextResponse.next({
    request: {
      headers
    }
  })

  tenantResponse.headers.set("X-Frame-Options", "DENY")
  tenantResponse.headers.set("X-Content-Type-Options", "nosniff")
  tenantResponse.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  tenantResponse.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")

  return tenantResponse
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
}
