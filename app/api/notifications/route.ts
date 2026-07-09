import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { isInternalRequest, requireAuthorizedProfile } from "@/lib/api-auth"
import { getBaseUrl, getInternalApiHeaders } from "@/lib/internal-api"
import { requireNotificationEnabled } from "@/lib/notification-access"

export async function POST(req: Request) {
  try {
    let callerSchoolId: string | null = null

    if (!isInternalRequest(req)) {
      const auth = await requireAuthorizedProfile(req, ["admin", "teacher"])
      if ("response" in auth) return auth.response
      callerSchoolId = auth.profile.schoolId
    }

    const body = await req.json()
    const { school_id, student_id, title, message, type } = body

    const schoolId = callerSchoolId || String(school_id || "").trim() || null

    if (!schoolId || !student_id || !title || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const permissionCheck = await requireNotificationEnabled(schoolId, "general")
    if (permissionCheck) return permissionCheck

    const { error: dbError } = await supabaseAdmin
      .from("notifications")
      .insert({ school_id: schoolId, student_id, title, message, type: type || "general" })

    if (dbError) {
      console.error("[notifications] DB insert error:", dbError.message)
    }

    const [{ data: parent }, { data: school }] = await Promise.all([
      supabaseAdmin.from("parents").select("name, phone").eq("student_id", student_id).maybeSingle(),
      supabaseAdmin.from("schools").select("name").eq("id", schoolId).maybeSingle(),
    ])

    let whatsappStatus = "skipped"
    let whatsappError: string | null = null

    if (parent?.phone) {
      try {
        const res = await fetch(`${getBaseUrl(req)}/api/send-whatsapp`, {
          method: "POST",
          headers: getInternalApiHeaders(),
          body: JSON.stringify({
            phone: String(parent.phone).trim(),
            message: `${school?.name || "School"}: ${title}\n${message}`,
            templateName: "school_notice",
            variables: [message],
            schoolId,                 // use school's own number if connected
          }),
        })

        const waResult = await res.json().catch(() => ({}))
        if (res.ok && waResult.success) {
          whatsappStatus = "sent"
        } else {
          whatsappStatus = "failed"
          whatsappError = waResult?.error || `HTTP ${res.status}`
          console.warn("[notifications] WhatsApp not sent:", whatsappError)
        }
      } catch (err) {
        console.error("[notifications] WhatsApp error:", err)
        whatsappStatus = "error"
        whatsappError = err instanceof Error ? err.message : "Unknown error"
      }
    } else {
      whatsappError = "No phone number on file for this student's parent"
    }

    return NextResponse.json({ success: true, whatsappStatus, whatsappError })
  } catch (err) {
    console.error("[notifications] Error:", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
