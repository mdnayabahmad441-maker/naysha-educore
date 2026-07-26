import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { getBaseUrl, getInternalApiHeaders } from "@/lib/internal-api"
import { ensureSameSchool, isInternalRequest, requireAdminProfile } from "@/lib/api-auth"
import { requireNotificationEnabled } from "@/lib/notification-access"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { type, refId } = body

    if (type !== "payment") {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 })
    }

    let adminSchoolId: string | null = null

    if (!isInternalRequest(req)) {
      const authResult = await requireAdminProfile(req)
      if ("response" in authResult) {
        return authResult.response
      }

      adminSchoolId = authResult.profile.schoolId
    }

    const { data: payment } = await supabaseAdmin
      .from("payments")
      .select("*")
      .eq("id", refId)
      .single()

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    if (adminSchoolId && adminSchoolId !== payment.school_id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const permissionCheck = await requireNotificationEnabled(payment.school_id, "fee")
    if (permissionCheck) return permissionCheck

    const { data: student } = await supabaseAdmin
      .from("students")
      .select("id,name")
      .eq("id", payment.student_id)
      .single()

    const { data: parent } = await supabaseAdmin
      .from("parents")
      .select("name,email,phone")
      .eq("student_id", payment.student_id)
      .maybeSingle()

    const { data: school } = await supabaseAdmin
      .from("schools")
      .select("name")
      .eq("id", payment.school_id)
      .single()

    const { data: enrollment } = await supabaseAdmin
      .from("student_enrollments")
      .select("roll_number, class_id, school_id")
      .eq("student_id", payment.student_id)
      .maybeSingle()

    if (adminSchoolId) {
      const schoolMismatch = ensureSameSchool(
        { userId: "", schoolId: adminSchoolId, role: "admin" },
        enrollment?.school_id || payment.school_id
      )

      if (schoolMismatch) {
        return schoolMismatch
      }
    }

    let className = "N/A"
    let roll = "-"

    if (enrollment) {
      roll = enrollment.roll_number || "-"

      const { data: cls } = await supabaseAdmin
        .from("classes")
        .select("name")
        .eq("id", enrollment.class_id)
        .single()

      className = cls?.name || "N/A"
    }

    const baseUrl = getBaseUrl(req)
    const receiptUrl = `${baseUrl}/receipt/${payment.id}`
    const internalHeaders = getInternalApiHeaders()

    let whatsappStatus = "skipped"
    let whatsappError: string | null = null

    if (parent?.phone) {
      try {
        const whatsappMessage = `${school?.name || "School"}: Payment received for ${student?.name}. Class: ${className}. Roll: ${roll}. Amount: Rs.${payment.amount}. Receipt: ${receiptUrl}`
        const res = await fetch(`${baseUrl}/api/send-whatsapp`, {
          method: "POST",
          headers: internalHeaders,
          body: JSON.stringify({
            phone: parent.phone,
            message: whatsappMessage,
            templateName: "school_notice",
            variables: [whatsappMessage],
            schoolId: payment.school_id,   // use school's own WhatsApp number if connected
          }),
        })

        const json = await res.json().catch(() => null)
        whatsappStatus = res.ok && json?.success !== false ? "sent" : "failed"
        whatsappError = whatsappStatus === "sent" ? null : json?.error || res.statusText
      } catch (err) {
        console.error("WhatsApp error:", err)
        whatsappStatus = "error"
        whatsappError = err instanceof Error ? err.message : "WhatsApp error"
      }
    }

    const { error: logError } = await supabaseAdmin.from("notifications_log").insert({
      type: "payment",
      ref_id: payment.id,
      student_id: payment.student_id,
      school_id: payment.school_id,
      email: parent?.email || null,
      phone: parent?.phone || null,
      email_status: "skipped",
      whatsapp_status: whatsappStatus,
    })

    if (logError) {
      console.warn("Notification log skipped:", logError.message)
    }

    return NextResponse.json({
      success: true,
      emailStatus: "skipped",
      whatsappStatus,
      emailError: null,
      whatsappError,
    })
  } catch (err) {
    console.error("SERVER ERROR:", err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
