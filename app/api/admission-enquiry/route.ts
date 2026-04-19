import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { getSchoolFromRequest } from "@/lib/schoolFromRequest"

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

    // Get school from request (tenant detection)
    const school = await getSchoolFromRequest(req)
    if (!school) {
      return NextResponse.json(
        { success: false, error: "School not found" },
        { status: 400 }
      )
    }

    const enquiryId = crypto.randomUUID()

    // Insert enquiry
    const { error: insertError } = await supabase
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
        created_at: new Date().toISOString()
      })

    if (insertError) {
      console.error("Enquiry insert error:", insertError)
      return NextResponse.json(
        { success: false, error: insertError.message },
        { status: 500 }
      )
    }

    // Get school name for notifications
    const schoolName = school.name

    // Send welcome message to enquiry person
    const welcomeMessage = `
Thank you for your interest in ${schoolName}!

Dear ${fatherName},

We have received your admission enquiry for ${studentName} in ${classWanted}.

Our team will contact you soon to discuss the admission process.

Best regards,
${schoolName} Admissions Team
    `.trim()

    // Send email
    try {
      await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          subject: `Admission Enquiry Received - ${schoolName}`,
          message: welcomeMessage
        })
      })
    } catch (err) {
      console.error("Welcome email failed:", err)
    }

    // Send WhatsApp
    try {
      await fetch("/api/send-whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phone.trim(),
          message: `Thank you for your admission enquiry at ${schoolName}! 📚

Dear ${fatherName},

We received your enquiry for ${studentName} in ${classWanted}.

Our team will contact you soon.

Best regards,
${schoolName} Team`
        })
      })
    } catch (err) {
      console.error("Welcome WhatsApp failed:", err)
    }

    // Send notification to admin
    // Get admin email/phone from school settings or profiles
    const { data: admins } = await supabase
      .from("profiles")
      .select("email")
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

      for (const admin of admins) {
        if (admin.email) {
          try {
            await fetch("/api/send-email", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: admin.email,
                subject: `New Admission Enquiry - ${studentName}`,
                message: adminMessage
              })
            })
          } catch (err) {
            console.error("Admin notification email failed:", err)
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      enquiryId,
      message: "Enquiry submitted successfully"
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
  try {
    // Get school from request (tenant detection)
    const school = await getSchoolFromRequest(req)
    if (!school) {
      return NextResponse.json(
        { success: false, error: "School not found" },
        { status: 400 }
      )
    }

    const { data: enquiries, error } = await supabase
      .from("admission_enquiries")
      .select("*")
      .eq("school_id", school.id)
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
      enquiries: enquiries || []
    })

  } catch (err: any) {
    console.error("Fetch enquiries error:", err)
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    )
  }
}