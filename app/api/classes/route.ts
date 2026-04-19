import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { getSchoolFromRequest } from "@/lib/schoolFromRequest"

export async function GET(req: Request) {
  try {
    // Get school from request (tenant detection)
    const school = await getSchoolFromRequest(req)
    if (!school) {
      return NextResponse.json(
        { success: false, error: "School not found" },
        { status: 400 }
      )
    }

    const { data: classes, error } = await supabase
      .from("classes")
      .select("id, name")
      .eq("school_id", school.id)
      .order("name")

    if (error) {
      console.error("Fetch classes error:", error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      classes: classes || []
    })

  } catch (err: any) {
    console.error("Fetch classes error:", err)
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    )
  }
}