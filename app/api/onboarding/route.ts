import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import bcrypt from "bcryptjs"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {

  const body = await req.json()

  const {
    school_name,
    domain,
    email,
    phone,
    username,
    pin
  } = body

  // 1️⃣ Create School
  const { data: school, error: schoolError } = await supabase
    .from("schools")
    .insert([{
      name: school_name,
      domain,
      email,
      phone
    }])
    .select()
    .single()

  if (schoolError) {
    return NextResponse.json({ error: schoolError.message }, { status: 400 })
  }

  // 2️⃣ Hash PIN
  const hashedPin = await bcrypt.hash(pin, 10)

  // 3️⃣ Create Admin User
  const { error: adminError } = await supabase
    .from("admin_users")
    .insert([{
      school_id: school.id,
      username,
      pin: hashedPin
    }])

  if (adminError) {
    return NextResponse.json({ error: adminError.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}