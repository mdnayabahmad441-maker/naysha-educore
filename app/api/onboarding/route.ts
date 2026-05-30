import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(req: Request) {
  try {

    console.log("🔥 API HIT")

    const body = await req.json()

    const { schoolName, domain, email, phone } = body

    // ✅ VALIDATION
    if (!schoolName || !domain || !email || !phone) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      )
    }

    // ✅ CREATE ADMIN CLIENT (BYPASS RLS)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // ✅ CHECK SUBDOMAIN EXISTS
    const { data: existing } = await supabase
      .from("schools")
      .select("id")
      .eq("subdomain", domain)
      .maybeSingle()

    if (existing) {
      return NextResponse.json(
        { error: "Domain already taken" },
        { status: 400 }
      )
    }

    // ✅ INSERT SCHOOL
    const { data, error } = await supabase
      .from("schools")
      .insert([
        {
          name: schoolName,
          subdomain: domain,
          email,
          phone
        }
      ])
      .select()
      .single()

    if (error) {
      console.error("❌ Insert error:", error)

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    console.log("✅ School created:", data)

    return NextResponse.json({
      success: true,
      school: data
    })

  } catch (err: any) {

    console.error("❌ Server error:", err)

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    )
  }
}
