import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { getBaseUrl, getInternalApiHeaders } from "@/lib/internal-api"
import { ensureSameSchool, isInternalRequest, requireAdminProfile } from "@/lib/api-auth"

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
    const internalHeaders = getInternalApiHeaders()

    let emailStatus = "skipped"
    let whatsappStatus = "skipped"

    if (parent?.email) {
      try {
        const res = await fetch(`${baseUrl}/api/send-email`, {
          method: "POST",
          headers: internalHeaders,
          body: JSON.stringify({
            email: parent.email,
            subject: "Payment Received",
            message: `${school?.name || "School"}\n\nPayment received for ${student?.name}\n\nClass: ${className}\nRoll: ${roll}\n\nAmount: Rs.${payment.amount}\n\nThank you`,
          }),
        })

        emailStatus = res.ok ? "sent" : "failed"
      } catch (err) {
        console.error("Email error:", err)
        emailStatus = "error"
      }
    }

    if (parent?.phone) {
      try {
        const res = await fetch(`${baseUrl}/api/send-whatsapp`, {
          method: "POST",
          headers: internalHeaders,
          body: JSON.stringify({
            phone: parent.phone,
            message: `${school?.name || "School"}: Payment Received\n\nStudent: ${student?.name}\nClass: ${className}\nRoll: ${roll}\nAmount: Rs.${payment.amount}\n\nThank you`,
            schoolId: payment.school_id,   // use school's own WhatsApp number if connected
          }),
        })

        whatsappStatus = res.ok ? "sent" : "failed"
      } catch (err) {
        console.error("WhatsApp error:", err)
        whatsappStatus = "error"
      }
    }

    await supabaseAdmin.from("notifications_log").insert({
      type: "payment",
      ref_id: payment.id,
      student_id: payment.student_id,
      school_id: payment.school_id,
      email: parent?.email || null,
      phone: parent?.phone || null,
      email_status: emailStatus,
      whatsapp_status: whatsappStatus,
    })

    return NextResponse.json({
      success: true,
      emailStatus,
      whatsappStatus,
    })
  } catch (err) {
    console.error("SERVER ERROR:", err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
