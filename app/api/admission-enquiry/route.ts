import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { getSchoolFromRequest } from "@/lib/schoolFromRequest"
import { getBaseUrl, getInternalApiHeaders } from "@/lib/internal-api"
import { requireAdminProfile } from "@/lib/api-auth"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { studentName, fatherName, classWanted, phone, email, address, schoolId } = body

    if (!studentName || !fatherName || !classWanted || !phone || !email || !address) {
      return NextResponse.json(
        { success: false, error: "All fields are required" },
        { status: 400 }
      )
    }

    // Prefer schoolId from body (single-domain flow), fall back to subdomain detection
    let school: any = null
    if (schoolId) {
      const { data } = await supabaseAdmin.from("schools").select("*").eq("id", schoolId).maybeSingle()
      school = data
    }
    if (!school) {
      school = await getSchoolFromRequest(req)
    }
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

    try {
      await fetch(`${baseUrl}/api/send-whatsapp`, {
        method: "POST",
        headers: internalHeaders,
        body: JSON.stringify({
          phone: phone.trim(),
          message: `${schoolName || "School"}: Thank you for your admission enquiry!\n\nWe received your enquiry for ${studentName} in ${classWanted}.\n\nOur team will contact you soon.`,
        }),
      })
    } catch (err) {
      console.error("Welcome WhatsApp failed:", err)
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
