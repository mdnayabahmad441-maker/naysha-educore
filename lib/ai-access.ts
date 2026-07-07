import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function requireAiEnabled(schoolId: string) {
  if (!schoolId) {
    return NextResponse.json({ error: "School is required for AI features" }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from("schools")
    .select("ai_enabled")
    .eq("id", schoolId)
    .maybeSingle()

  if (error) {
    const text = `${error.code || ""} ${error.message || ""} ${error.details || ""}`.toLowerCase()
    if (text.includes("column") || text.includes("schema cache") || error.code === "42703" || error.code === "PGRST204") {
      return NextResponse.json(
        { error: "AI premium control is not installed yet. Run super_admin_control_schema.sql in Supabase." },
        { status: 503 }
      )
    }

    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data?.ai_enabled) {
    return NextResponse.json(
      { error: "Please upgrade to use AI features." },
      { status: 402 }
    )
  }

  return null
}
