import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {

  const host = request.headers.get("host") || ""
  const slug = host.split(".")[0]

  const headers = new Headers(request.headers)

  // Detect tenant from subdomain
  if (slug !== "erp" && slug !== "www" && slug !== "localhost") {
    headers.set("x-tenant", slug)
  }

  // Protect admin routes
  const token = request.cookies.get("sb-access-token")

  if (!token && request.nextUrl.pathname.startsWith("/admin")) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return NextResponse.next({
    request: {
      headers
    }
  })
}

export const config = {
  matcher: ["/((?!_next|favicon.ico).*)"]
}