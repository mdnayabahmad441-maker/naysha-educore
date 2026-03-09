import { NextRequest, NextResponse } from "next/server"

export function middleware(req: NextRequest) {

  const host = req.headers.get("host") || ""
  const url = req.nextUrl.clone()

  const rootDomain = "erp.naysha.online"

  // MAIN WEBSITE
  if (host === rootDomain || host.includes("vercel.app")) {
    return NextResponse.next()
  }

  // GET SUBDOMAIN
  const subdomain = host.replace(`.${rootDomain}`, "")

  // If school homepage opened → redirect to ERP login
  if (url.pathname === "/") {
    return NextResponse.redirect(new URL("/erp/login", req.url))
  }

  // Pass school to app
  url.searchParams.set("school", subdomain)

  return NextResponse.rewrite(url)
}

export const config = {
  matcher: [
    "/((?!_next|favicon.ico|api).*)",
  ],
}