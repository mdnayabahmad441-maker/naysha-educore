import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {

  const hostname = request.headers.get("host") || ""

  // remove port in localhost
  const host = hostname.split(":")[0]

  const parts = host.split(".")

  // default tenant
  let tenant = null

  // localhost handling
  if (host.includes("localhost")) {
    tenant = "erp"
  }

  // subdomain handling
  else if (parts.length > 2) {
    tenant = parts[0]
  }

  const headers = new Headers(request.headers)

  if (tenant && tenant !== "www" && tenant !== "erp") {
    headers.set("x-tenant", tenant)
  }

  return NextResponse.next({
    request: {
      headers,
    },
  })
}

export const config = {
  matcher: ["/((?!_next|favicon.ico).*)"],
}