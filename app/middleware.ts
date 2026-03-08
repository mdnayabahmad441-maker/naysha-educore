import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {

  const host = request.headers.get("host") || ""

  // remove localhost or root domain
  const subdomain = host.split(".")[0]

  // if visiting erp.naysha.online
  if (host.startsWith("erp.")) {
    return NextResponse.rewrite(new URL(`/erp${request.nextUrl.pathname}`, request.url))
  }

  // if visiting school subdomain
  if (subdomain !== "www" && subdomain !== "naysha" && subdomain !== "erp") {
    return NextResponse.rewrite(
      new URL(`/erp${request.nextUrl.pathname}?school=${subdomain}`, request.url)
    )
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next|api).*)"],
}