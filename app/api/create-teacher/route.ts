import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { getBaseUrl, getInternalApiHeaders } from "@/lib/internal-api"
import { requireAdminProfile } from "@/lib/api-auth"

export async function POST(req: Request) {
  const authResult = await requireAdminProfile(req)

  if ("response" in authResult) {
    return authResult.response
  }

  try {
    const body = await req.json()

    const {
      name,
      email,
      phone,
      qualification,
      experience_years,
      classes,
      subjects,
    } = body

    const schoolId = authResult.profile.schoolId
    const normalizedEmail = String(email || "").trim().toLowerCase()

    if (!name || !normalizedEmail || !schoolId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      email_confirm: true,
    })

    if (authError || !authData?.user) {
      return NextResponse.json(
        { error: authError?.message || "Auth user not created" },
        { status: 400 }
      )
    }

    const authId = authData.user.id
    const teacherId = crypto.randomUUID()

    const { error: teacherError } = await supabaseAdmin
      .from("teachers")
      .insert({
        id: teacherId,
        auth_id: authId,
        name,
        email: normalizedEmail,
        phone,
        qualification,
        experience_years,
        school_id: schoolId,
      })

    if (teacherError) {
      return NextResponse.json({ error: teacherError.message }, { status: 400 })
    }

    await supabaseAdmin.from("profiles").upsert({
      id: authId,
      school_id: schoolId,
      role: "teacher",
    })

    await supabaseAdmin.auth.admin.updateUserById(authId, {
      user_metadata: {
        school_id: schoolId,
        role: "teacher",
      },
    })

    if (classes?.length) {
      const rows = classes.map((classId: string) => ({
        teacher_id: teacherId,
        class_id: classId,
        school_id: schoolId,
      }))

      const { error: teacherClassesError } = await supabaseAdmin.from("teacher_classes").insert(rows)

      if (teacherClassesError) {
        return NextResponse.json({ error: teacherClassesError.message }, { status: 400 })
      }
    }

    if (subjects?.length) {
      const rows = subjects.map((item: { subject_id: string; class_id: string | null }) => ({
        teacher_id: teacherId,
        subject_id: item.subject_id,
        class_id: item.class_id,
        school_id: schoolId,
      }))

      const { error: teacherSubjectsError } = await supabaseAdmin.from("teacher_subjects").insert(rows)

      if (teacherSubjectsError) {
        return NextResponse.json({ error: teacherSubjectsError.message }, { status: 400 })
      }
    }

    const baseUrl = getBaseUrl(req)
    const internalHeaders = getInternalApiHeaders()
    const loginUrl = `${baseUrl}/login`

    await fetch(`${baseUrl}/api/send-email`, {
      method: "POST",
      headers: internalHeaders,
      body: JSON.stringify({
        email: normalizedEmail,
        subject: "Your Teacher Account Created",
        message: `Hello ${name},<br/><br/>Your teacher account has been created.<br/><br/>Open the login page and enter your email.<br/>If this is your first login, choose the account setup option to create your password.<br/><br/><a href="${loginUrl}">Open Login</a>`,
      }),
    })

    if (phone) {
      await fetch(`${baseUrl}/api/send-whatsapp`, {
        method: "POST",
        headers: internalHeaders,
        body: JSON.stringify({
          to: phone,
          message: `Teacher Account Created\n\nHello ${name},\n\nYour teacher account is ready.\nOpen login here:\n${loginUrl}\n\nUse your email first. If this is your first login, set your password from the login screen.`,
        }),
      })
    }

    await supabaseAdmin.from("notifications").insert({
      id: crypto.randomUUID(),
      school_id: schoolId,
      title: "New Teacher Added",
      message: `${name} has been added as a teacher`,
      type: "system",
    })

    return NextResponse.json({
      success: true,
      teacher: { id: teacherId },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
