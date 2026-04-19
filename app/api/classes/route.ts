import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const schoolId = url.searchParams.get("schoolId")

    if (!schoolId) {
      return NextResponse.json(
        { success: false, error: "School ID required" },
        { status: 400 }
      )
    }

    const { data: classes, error } = await supabase
      .from("classes")
      .select("id, name")
      .eq("school_id", schoolId)
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