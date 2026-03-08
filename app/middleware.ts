import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {

  const host = request.headers.get("host") || "";
  const subdomain = host.split(".")[0];

  const url = request.nextUrl.clone();

  // MAIN ERP DOMAIN
  if (host.startsWith("erp.")) {
    return NextResponse.next(); 
  }

  // SCHOOL SUBDOMAIN
  if (subdomain !== "www" && subdomain !== "naysha" && subdomain !== "erp") {
    url.pathname = `/erp${url.pathname}`;
    url.searchParams.set("school", subdomain);
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|api|favicon.ico).*)"],
};