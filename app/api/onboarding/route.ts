import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import bcrypt from "bcryptjs"

// ✅ CREATE ADMIN CLIENT (BYPASS RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {

  try {

    const body = await req.json()

    const {
      school_name,
      domain,
      email,
      phone,
      username,
      pin
    } = body

    // ✅ VALIDATION
    if (!school_name || !domain || !email || !username || !pin) {
      return NextResponse.json(
        { error: "All required fields must be filled" },
        { status: 400 }
      )
    }

    // ✅ CHECK DOMAIN EXISTS
    const { data: existingDomain } = await supabase
      .from("schools")
      .select("id")
      .eq("domain", domain)
      .single()

    if (existingDomain) {
      return NextResponse.json(
        { error: "Domain already exists" },
        { status: 400 }
      )
    }

    // ✅ CHECK USERNAME EXISTS
    const { data: existingUser } = await supabase
      .from("admin_users")
      .select("id")
      .eq("username", username)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: "Username already exists" },
        { status: 400 }
      )
    }

    // ✅ CREATE SCHOOL
    const { data: school, error: schoolError } = await supabase
      .from("schools")
      .insert([
        {
          name: school_name,
          domain,
          email,
          phone
        }
      ])
      .select()
      .single()

    if (schoolError) {
      console.log("SCHOOL ERROR:", schoolError)
      return NextResponse.json(
        { error: schoolError.message },
        { status: 400 }
      )
    }

    // ✅ HASH PIN
    const hashedPin = await bcrypt.hash(pin, 10)

    // ✅ CREATE ADMIN USER
    const { error: adminError } = await supabase
      .from("admin_users")
      .insert([
        {
          school_id: school.id,
          username,
          pin: hashedPin
        }
      ])

    if (adminError) {
      console.log("ADMIN ERROR:", adminError)

      // rollback school if admin fails
      await supabase
        .from("schools")
        .delete()
        .eq("id", school.id)

      return NextResponse.json(
        { error: adminError.message },
        { status: 400 }
      )
    }

    // ✅ SUCCESS
    return NextResponse.json({
      success: true,
      message: "School created successfully"
    })

  } catch (err: any) {

    console.log("SERVER ERROR:", err)

    return NextResponse.json(
      { error: "Server error occurred" },
      { status: 500 }
    )
  }
}