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

  // PROTECT ADMIN DASHBOARD
  if (url.pathname.startsWith("/erp/dashboard")) {

    const role = req.cookies.get("role")?.value

    if (role !== "admin") {
      return NextResponse.redirect(new URL("/erp/login", req.url))
    }

  }

  // PROTECT TEACHER DASHBOARD
  if (url.pathname.startsWith("/erp/teacher")) {

    const role = req.cookies.get("role")?.value

    if (role !== "teacher") {
      return NextResponse.redirect(new URL("/erp/login", req.url))
    }

  }

  // PROTECT PARENT DASHBOARD
  if (url.pathname.startsWith("/parent")) {

    const role = req.cookies.get("role")?.value

    if (role !== "parent") {
      return NextResponse.redirect(new URL("/erp/login", req.url))
    }

  }

  // PASS SCHOOL TO APP
  url.searchParams.set("school", subdomain)

  return NextResponse.rewrite(url)
}

export const config = {
  matcher: [
    "/((?!_next|favicon.ico|api).*)",
  ],
}