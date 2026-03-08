import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {

  const host = request.headers.get("host") || ""

  const subdomain = host.split(".")[0]

  const url = request.nextUrl.clone()

  // redirect old dashboard routes to /erp
  if (url.pathname.startsWith("/dashboard")) {
    url.pathname = url.pathname.replace("/dashboard", "/erp/dashboard")
    return NextResponse.redirect(url)
  }

  if (url.pathname.startsWith("/students")) {
    url.pathname = url.pathname.replace("/students", "/erp/dashboard/students")
    return NextResponse.redirect(url)
  }

  if (url.pathname.startsWith("/fees")) {
    url.pathname = url.pathname.replace("/fees", "/erp/dashboard/fees")
    return NextResponse.redirect(url)
  }

  // ignore localhost & main domain
  if (
    host.includes("localhost") ||
    host.startsWith("www") ||
    host.startsWith("naysha")
  ) {
    return NextResponse.next()
  }

  const response = NextResponse.next()

  response.headers.set("x-school-subdomain", subdomain)

  return response
}

export const config = {
  matcher: ["/((?!_next).*)"]
}