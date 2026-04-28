import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { getSchoolFromRequest } from "@/lib/schoolFromRequest"
import { getBaseUrl, getInternalApiHeaders } from "@/lib/internal-api"
import { requireAdminProfile } from "@/lib/api-auth"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { studentName, fatherName, classWanted, phone, email, address } = body

    if (!studentName || !fatherName || !classWanted || !phone || !email || !address) {
      return NextResponse.json(
        { success: false, error: "All fields are required" },
        { status: 400 }
      )
    }

    const school = await getSchoolFromRequest(req)
    if (!school) {
      return NextResponse.json(
        { success: false, error: "School not found" },
        { status: 400 }
      )
    }

    const enquiryId = crypto.randomUUID()

    const { error: insertError } = await supabaseAdmin
      .from("admission_enquiries")
      .insert({
        id: enquiryId,
        school_id: school.id,
        student_name: studentName.trim(),
        father_name: fatherName.trim(),
        class_wanted: classWanted.trim(),
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        address: address.trim(),
        status: "new",
        created_at: new Date().toISOString(),
      })

    if (insertError) {
      console.error("Enquiry insert error:", insertError)
      return NextResponse.json(
        { success: false, error: insertError.message },
        { status: 500 }
      )
    }

    const schoolName = school.name
    const baseUrl = getBaseUrl(req)
    const internalHeaders = getInternalApiHeaders()

    const welcomeMessage = `
Thank you for your interest in ${schoolName}!

Dear ${fatherName},

We have received your admission enquiry for ${studentName} in ${classWanted}.

Our team will contact you soon to discuss the admission process.

Best regards,
${schoolName} Admissions Team
    `.trim()

    try {
      await fetch(`${baseUrl}/api/send-email`, {
        method: "POST",
        headers: internalHeaders,
        body: JSON.stringify({
          email: email.trim(),
          subject: `Admission Enquiry Received - ${schoolName}`,
          message: welcomeMessage,
        }),
      })
    } catch (err) {
      console.error("Welcome email failed:", err)
    }

    try {
      await fetch(`${baseUrl}/api/send-whatsapp`, {
        method: "POST",
        headers: internalHeaders,
        body: JSON.stringify({
          phone: phone.trim(),
          templateName: "school_notice",
          variables: [
            fatherName || "Parent",
            schoolName || "School",
            `Thank you for your admission enquiry!\n\nWe received your enquiry for ${studentName} in ${classWanted}.\n\nOur team will contact you soon.`,
          ],
        }),
      })
    } catch (err) {
      console.error("Welcome WhatsApp failed:", err)
    }

    const { data: admins } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("school_id", school.id)
      .eq("role", "admin")

    if (admins && admins.length > 0) {
      const adminMessage = `
New Admission Enquiry Received!

Student: ${studentName}
Father: ${fatherName}
Class: ${classWanted}
Phone: ${phone}
Email: ${email}

Please review and follow up.
      `.trim()

      const { data: adminUsers } = await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 500,
      })

      const adminEmails = adminUsers.users
        .filter((user) => admins.some((admin) => admin.id === user.id))
        .map((user) => user.email)
        .filter((value): value is string => Boolean(value))

      for (const adminEmail of adminEmails) {
        try {
          await fetch(`${baseUrl}/api/send-email`, {
            method: "POST",
            headers: internalHeaders,
            body: JSON.stringify({
              email: adminEmail,
              subject: `New Admission Enquiry - ${studentName}`,
              message: adminMessage,
            }),
          })
        } catch (err) {
          console.error("Admin notification email failed:", err)
        }
      }
    }

    return NextResponse.json({
      success: true,
      enquiryId,
      message: "Enquiry submitted successfully",
    })
  } catch (err: any) {
    console.error("Admission enquiry error:", err)
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    )
  }
}

export async function GET(req: Request) {
  const authResult = await requireAdminProfile(req)

  if ("response" in authResult) {
    return authResult.response
  }

  const schoolId = authResult.profile.schoolId

  if (!schoolId) {
    return NextResponse.json(
      { success: false, error: "School not found" },
      { status: 400 }
    )
  }

  try {
    const { data: enquiries, error } = await supabaseAdmin
      .from("admission_enquiries")
      .select("*")
      .eq("school_id", schoolId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Fetch enquiries error:", error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      enquiries: enquiries || [],
    })
  } catch (err: any) {
    console.error("Fetch enquiries error:", err)
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    )
  }
}

export async function PATCH(req: Request) {
  const authResult = await requireAdminProfile(req)

  if ("response" in authResult) {
    return authResult.response
  }

  const schoolId = authResult.profile.schoolId

  if (!schoolId) {
    return NextResponse.json(
      { success: false, error: "School not found" },
      { status: 400 }
    )
  }

  try {
    const body = await req.json()
    const enquiryId = String(body?.enquiryId || "").trim()
    const status = String(body?.status || "").trim().toLowerCase()
    const allowedStatuses = new Set(["new", "contacted", "admitted", "rejected"])

    if (!enquiryId || !allowedStatuses.has(status)) {
      return NextResponse.json(
        { success: false, error: "Valid enquiryId and status are required" },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from("admission_enquiries")
      .update({ status })
      .eq("id", enquiryId)
      .eq("school_id", schoolId)
      .select("id, status")
      .maybeSingle()

    if (error) {
      console.error("Update enquiry status error:", error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { success: false, error: "Enquiry not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      enquiry: data,
    })
  } catch (err: any) {
    console.error("Update enquiry status error:", err)
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    )
  }
}
