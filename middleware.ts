import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {

  const host = request.headers.get("host") || ""

  // abc123.naysha.online
  const subdomain = host.split(".")[0]

  const headers = new Headers(request.headers)

  // ignore main domains
  if (
    subdomain !== "www" &&
    subdomain !== "naysha" &&
    !host.includes("localhost")
  ) {
    headers.set("x-tenant", subdomain)
  }

  return NextResponse.next({
    request: { headers }
  })
}

export const config = {
  matcher: ["/((?!_next|favicon.ico).*)"],
}