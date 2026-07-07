import { NextResponse } from "next/server"

export async function POST() {
  return NextResponse.json(
    { error: "School creation is restricted to Super Admin." },
    { status: 403 }
  )
}
