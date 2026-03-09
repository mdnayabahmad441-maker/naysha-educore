import { NextRequest, NextResponse } from "next/server"

export function middleware(req: NextRequest) {

  const host = req.headers.get("host") || ""

  const url = req.nextUrl.clone()

  const rootDomain = "erp.naysha.online"

  if (host === rootDomain || host.includes("vercel.app")) {
    return NextResponse.next()
  }

  const subdomain = host.replace(`.${rootDomain}`, "")

  url.searchParams.set("school", subdomain)

  return NextResponse.rewrite(url)
}

export const config = {
  matcher: [
    "/((?!_next|favicon.ico|api).*)",
  ],
}