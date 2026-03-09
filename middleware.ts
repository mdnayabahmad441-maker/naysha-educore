import { NextRequest, NextResponse } from "next/server"

export function middleware(req: NextRequest) {

  const host = req.headers.get("host") || ""

  const url = req.nextUrl.clone()

  // example: greenvalley.erp.naysha.online
  const parts = host.split(".")

  if (parts.length >= 4) {

    const subdomain = parts[0]

    url.pathname = `/erp/dashboard`
    url.searchParams.set("school", subdomain)

    return NextResponse.rewrite(url)

  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next|api).*)"],
}