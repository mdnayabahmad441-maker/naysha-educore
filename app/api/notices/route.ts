import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { requireAdminProfile } from "@/lib/api-auth"

export async function POST(req: Request) {
  const authResult = await requireAdminProfile(req)

  if ("response" in authResult) {
    return authResult.response
  }

  const schoolId = authResult.profile.schoolId

  if (!schoolId) {
    return NextResponse.json({ error: "School not found" }, { status: 400 })
  }

  try {
    const body = await req.json()
    const title = String(body?.title || "").trim()
    const message = String(body?.message || "").trim()
    const classId = body?.class_id ? String(body.class_id) : null

    if (!title || !message) {
      return NextResponse.json({ error: "Title and message are required" }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from("notices")
      .insert({
        id: crypto.randomUUID(),
        school_id: schoolId,
        title,
        message,
        class_id: classId,
      })
      .select("id")
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, id: data.id })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 })
  }
}
