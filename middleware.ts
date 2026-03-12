import { NextRequest, NextResponse } from "next/server"

export function middleware(req: NextRequest) {

  const pathname = req.nextUrl.pathname

  // Allow auth pages always
  if (pathname.startsWith("/auth")) {
    return NextResponse.next()
  }

  const role = req.cookies.get("role")?.value
  const session = req.cookies.get("session")?.value

  // If no session → send to login
  if (!session) {
    return NextResponse.redirect(new URL("/auth/login", req.url))
  }

  // Role protection
  if (pathname.startsWith("/admin") && role !== "admin") {
    return NextResponse.redirect(new URL("/auth/login", req.url))
  }

  if (pathname.startsWith("/teacher") && role !== "teacher") {
    return NextResponse.redirect(new URL("/auth/login", req.url))
  }

  if (pathname.startsWith("/parent") && role !== "parent") {
    return NextResponse.redirect(new URL("/auth/login", req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/teacher/:path*",
    "/parent/:path*"
  ]
}