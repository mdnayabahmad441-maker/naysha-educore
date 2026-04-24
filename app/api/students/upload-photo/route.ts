import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { ensureSameSchool, requireAdminProfile } from "@/lib/api-auth"

const MAX_PHOTO_BYTES = 5 * 1024 * 1024

export async function POST(req: Request) {
  const authResult = await requireAdminProfile(req)

  if ("response" in authResult) {
    return authResult.response
  }

  try {
    const formData = await req.formData()
    const studentId = formData.get("studentId")
    const schoolId = formData.get("schoolId")
    const file = formData.get("file")

    if (
      typeof studentId !== "string" ||
      typeof schoolId !== "string" ||
      !(file instanceof File)
    ) {
      return NextResponse.json(
        { success: false, error: "studentId, schoolId and file are required" },
        { status: 400 }
      )
    }

    const schoolMismatch = ensureSameSchool(authResult.profile, schoolId)
    if (schoolMismatch) {
      return schoolMismatch
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { success: false, error: "Please upload an image file" },
        { status: 400 }
      )
    }

    if (file.size > MAX_PHOTO_BYTES) {
      return NextResponse.json(
        { success: false, error: "Student photo must be 5 MB or smaller" },
        { status: 400 }
      )
    }

    const extension = file.name.includes(".")
      ? file.name.split(".").pop()?.toLowerCase() || "jpg"
      : "jpg"
    const safeExtension = extension.replace(/[^a-zA-Z0-9]/g, "") || "jpg"
    const filePath = `${schoolId}/${studentId}/profile-photo-${Date.now()}.${safeExtension}`

    const { error: uploadError } = await supabaseAdmin.storage
      .from("students")
      .upload(filePath, file, {
        cacheControl: "3600",
        contentType: file.type || undefined,
        upsert: true
      })

    if (uploadError) {
      console.error("Student photo upload error:", uploadError)
      return NextResponse.json(
        { success: false, error: uploadError.message },
        { status: 500 }
      )
    }

    const { data } = supabaseAdmin.storage.from("students").getPublicUrl(filePath)
    const photoUrl = data.publicUrl

    const { error: updateError } = await supabaseAdmin
      .from("students")
      .update({ photo: photoUrl })
      .eq("id", studentId)
      .eq("school_id", schoolId)

    if (updateError) {
      console.error("Student photo database update error:", updateError)
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      photoUrl
    })
  } catch (err: any) {
    console.error("Student photo API error:", err)
    return NextResponse.json(
      { success: false, error: err.message || "Failed to upload photo" },
      { status: 500 }
    )
  }
}
