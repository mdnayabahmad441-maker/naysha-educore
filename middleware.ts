import { NextRequest, NextResponse } from "next/server"

export function middleware(req: NextRequest) {

  const pathname = req.nextUrl.pathname

  // allow auth pages
  if (pathname.startsWith("/auth")) {
    return NextResponse.next()
  }

  const host = req.headers.get("host") || ""

  // example host:
  // nayshaschool.erp.naysha.online

  const subdomain = host.split(".")[0]

  // attach school subdomain to request header
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set("x-school-subdomain", subdomain)

  return NextResponse.next({
    request: {
      headers: requestHeaders
    }
  })
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
}