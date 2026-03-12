import { NextRequest, NextResponse } from "next/server"

export function middleware(req:NextRequest){

const role=req.cookies.get("role")?.value

const pathname=req.nextUrl.pathname

if(pathname.startsWith("/admin") && role!=="admin"){
return NextResponse.redirect(new URL("/auth/login",req.url))
}

if(pathname.startsWith("/teacher") && role!=="teacher"){
return NextResponse.redirect(new URL("/auth/login",req.url))
}

if(pathname.startsWith("/parent") && role!=="parent"){
return NextResponse.redirect(new URL("/auth/login",req.url))
}

return NextResponse.next()

}