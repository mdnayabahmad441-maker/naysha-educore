import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { getSchoolFromRequest } from "@/lib/schoolFromRequest"
import { getBaseUrl, getInternalApiHeaders } from "@/lib/internal-api"
import { requireAdminProfile } from "@/lib/api-auth"
import { consumeRateLimit, getClientIp, normalizeIndianPhone, sanitizeDatabaseError } from "@/lib/security"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null)
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "Invalid request payload" },
        { status: 400 }
      )
    }

    const studentName = String(body.studentName || "").trim()
    const fatherName = String(body.fatherName || "").trim()
    const classWanted = String(body.classWanted || "").trim()
    const phone = String(body.phone || "").trim()
    const email = String(body.email || "").trim().toLowerCase()
    const address = String(body.address || "").trim()
    const schoolId = typeof body.schoolId === "string" ? body.schoolId.trim() : null

    // Comprehensive input validation before consuming any rate-limit quota or invoking downstream services
    if (!studentName || !fatherName || !classWanted || !phone || !email || !address) {
      return NextResponse.json(
        { success: false, error: "All fields are required" },
        { status: 400 }
      )
    }

    if (studentName.length < 2 || studentName.length > 100) {
      return NextResponse.json(
        { success: false, error: "Student name must be between 2 and 100 characters" },
        { status: 400 }
      )
    }

    if (fatherName.length < 2 || fatherName.length > 100) {
      return NextResponse.json(
        { success: false, error: "Father/Guardian name must be between 2 and 100 characters" },
        { status: 400 }
      )
    }

    if (classWanted.length < 1 || classWanted.length > 50) {
      return NextResponse.json(
        { success: false, error: "Class must be between 1 and 50 characters" },
        { status: 400 }
      )
    }

    const phoneValidation = normalizeIndianPhone(phone)
    if (!phoneValidation.valid) {
      return NextResponse.json(
        { success: false, error: phoneValidation.error || "Please provide a valid 10-15 digit phone number" },
        { status: 400 }
      )
    }

    if (!EMAIL_REGEX.test(email) || email.length > 100) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid email address" },
        { status: 400 }
      )
    }

    if (address.length < 3 || address.length > 300) {
      return NextResponse.json(
        { success: false, error: "Address must be between 3 and 300 characters" },
        { status: 400 }
      )
    }

    const clientIp = getClientIp(req)
    // IP-level rate limit: max 5 enquiries per 10 minutes (only consumed for well-formed valid requests)
    const ipLimit = await consumeRateLimit(`admission-enquiry:ip:${clientIp}`, 5, 10 * 60 * 1000)
    if (!ipLimit.allowed) {
      return NextResponse.json(
        { success: false, error: "Too many enquiries from this network. Please wait a few minutes before trying again." },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.max(1, Math.ceil((ipLimit.resetAt - Date.now()) / 1000))),
          },
        }
      )
    }

    // Phone-level rate limit: max 3 enquiries per phone number per hour to prevent targeted messaging abuse
    // Keyed by canonicalized phone representation
    const phoneLimit = await consumeRateLimit(`admission-enquiry:phone:${phoneValidation.canonical}`, 3, 60 * 60 * 1000)
    if (!phoneLimit.allowed) {
      return NextResponse.json(
        { success: false, error: "An enquiry was recently submitted for this phone number. Please wait before submitting another." },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.max(1, Math.ceil((phoneLimit.resetAt - Date.now()) / 1000))),
          },
        }
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
        student_name: studentName,
        father_name: fatherName,
        class_wanted: classWanted,
        phone: phoneValidation.canonical,
        email: email,
        address: address,
        status: "new",
        created_at: new Date().toISOString(),
      })

    if (insertError) {
      return NextResponse.json(
        { success: false, error: sanitizeDatabaseError(insertError, "Failed to submit enquiry. Please try again later.") },
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
          phone: phoneValidation.canonical,
          message: `${schoolName || "School"}: Thank you for your admission enquiry!\n\nWe received your enquiry for ${studentName} in ${classWanted}.\n\nOur team will contact you soon.`,
          schoolId: school.id,
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
    return NextResponse.json(
      { success: false, error: sanitizeDatabaseError(err, "An unexpected error occurred. Please try again later.") },
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
      return NextResponse.json(
        { success: false, error: sanitizeDatabaseError(error, "Failed to fetch enquiries") },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      enquiries: enquiries || [],
    })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: sanitizeDatabaseError(err, "Failed to load enquiries") },
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
      return NextResponse.json(
        { success: false, error: sanitizeDatabaseError(error, "Failed to update enquiry status") },
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
    return NextResponse.json(
      { success: false, error: sanitizeDatabaseError(err, "Failed to update enquiry") },
      { status: 500 }
    )
  }
}
