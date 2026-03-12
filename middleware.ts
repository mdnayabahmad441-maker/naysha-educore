import { NextRequest, NextResponse } from "next/server"

export function middleware(req:NextRequest){

const pathname = req.nextUrl.pathname

if(pathname.startsWith("/auth")){
return NextResponse.next()
}

return NextResponse.next()

}

export const config = {
matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
}