import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const SECURITY_HEADERS: Record<string, string> = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), payment=()",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://connect.facebook.net",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    // connect.facebook.net is needed because the FB JS SDK makes XHR/fetch
    // requests back to that origin at runtime (e.g. app_config/json/ calls).
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://connect.facebook.net https://www.facebook.com https://web.facebook.com https://graph.facebook.com https://business.facebook.com",
    // business.facebook.com hosts the Embedded Signup iframe.
    "frame-src 'self' https://www.facebook.com https://web.facebook.com https://business.facebook.com",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; "),
}

function applySecurityHeaders(response: ReturnType<typeof NextResponse.next>) {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value)
  }
  return response
}

export function proxy(request: NextRequest) {
  const url = request.nextUrl
  const host = request.headers.get("host") || ""

  // Block cross-origin POST/PUT/DELETE to API routes (CSRF protection)
  if (url.pathname.startsWith("/api/") && request.method !== "GET") {
    const origin = request.headers.get("origin")
    if (origin && host && !origin.includes(host)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
  }

  // Pass-through routes — no subdomain logic needed
  if (
    url.pathname.startsWith("/api") ||
    url.pathname.startsWith("/onboarding") ||
    url.pathname.startsWith("/login") ||
    url.pathname.startsWith("/verify") ||
    url.pathname.startsWith("/_next") ||
    url.pathname.startsWith("/favicon")
  ) {
    return applySecurityHeaders(NextResponse.next())
  }

  // Subdomain tenant routing
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

  return applySecurityHeaders(
    NextResponse.next({ request: { headers } })
  )
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
