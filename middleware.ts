import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {

  const host = request.headers.get("host") || ""
  const slug = host.split(".")[0]

  const headers = new Headers(request.headers)

  // Tenant detection only
  if (
    slug !== "erp" &&
    slug !== "www" &&
    !host.includes("localhost")
  ) {
    headers.set("x-tenant", slug)
  }

  return NextResponse.next({
    request: { headers }
  })
}

export const config = {
  matcher: ["/((?!_next|favicon.ico).*)"]
}