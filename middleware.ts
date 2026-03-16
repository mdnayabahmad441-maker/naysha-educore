import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {

  const host = request.headers.get("host") || ""
  const pathname = request.nextUrl.pathname

  const parts = host.split(".")
  const subdomain = parts[0]

  // ignore main domain
  if (
    subdomain === "erp" ||
    subdomain === "www" ||
    host.includes("localhost")
  ) {
    return NextResponse.next()
  }

  // rewrite to tenant route
  const url = request.nextUrl.clone()
  url.pathname = `/tenant/${subdomain}${pathname}`

  return NextResponse.rewrite(url)
}

export const config = {
  matcher: ["/((?!_next|favicon.ico).*)"]
}