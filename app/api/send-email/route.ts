import { NextResponse } from "next/server"

// Email notification sending has been removed from this application.
// OTP and auth emails are handled by /api/auth/parent-otp/send (Resend) and Supabase directly.

export async function GET() {
  return NextResponse.json(
    { success: false, error: "Email notifications are disabled." },
    { status: 410 }
  )
}

export async function POST() {
  return NextResponse.json(
    { success: false, error: "Email notifications are disabled." },
    { status: 410 }
  )
}
