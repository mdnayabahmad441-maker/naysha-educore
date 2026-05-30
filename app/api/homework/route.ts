import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { requireAuthorizedProfile } from "@/lib/api-auth"
import { getBaseUrl, getInternalApiHeaders } from "@/lib/internal-api"

export async function GET(req: Request) {
  const auth = await requireAuthorizedProfile(req, ["admin", "teacher", "parent"])
  if ("response" in auth) return auth.response

  const { schoolId, userId } = auth.profile
  if (!schoolId) return NextResponse.json({ error: "No school linked" }, { status: 400 })

  const url      = new URL(req.url)
  const classId  = url.searchParams.get("classId")
  const upcoming = url.searchParams.get("upcoming") // "1" = only future

  let query = supabaseAdmin
    .from("homework")
    .select("*, classes:class_id(name)")
    .eq("school_id", schoolId)
    .order("due_date", { ascending: true })

  if (classId)  query = query.eq("class_id", classId)
  if (upcoming === "1") query = query.gte("due_date", new Date().toISOString().slice(0, 10))

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ homework: data })
}

export async function POST(req: Request) {
  const auth = await requireAuthorizedProfile(req, ["admin", "teacher"])
  if ("response" in auth) return auth.response

  const { schoolId, userId } = auth.profile
  if (!schoolId) return NextResponse.json({ error: "No school linked" }, { status: 400 })

  const body = await req.json()
  const { class_id, subject, title, description, due_date, questions } = body

  if (!class_id || !subject?.trim() || !title?.trim() || !due_date) {
    return NextResponse.json({ error: "Class, subject, title and due date are required" }, { status: 400 })
  }

  // Get teacher name for display
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("name")
    .eq("id", userId)
    .maybeSingle()

  const { data, error } = await supabaseAdmin
    .from("homework")
    .insert({
      school_id:    schoolId,
      class_id,
      subject:      subject.trim(),
      title:        title.trim(),
      description:  description?.trim() || null,
      due_date,
      assigned_by:  userId,
      teacher_name: profile?.name || null,
      questions:    questions?.trim() || null,
    })
    .select("*, classes:class_id(name)")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Non-blocking: notify parents of students in this class via WhatsApp
  if (data) {
    void notifyClassParents(req, data, schoolId)
  }

  return NextResponse.json({ homework: data }, { status: 201 })
}

async function notifyClassParents(
  req: Request,
  hw: { id: string; title: string; subject: string; due_date: string; class_id: string; questions: string | null; teacher_name: string | null },
  schoolId: string
) {
  try {
    // Get school name
    const { data: school } = await supabaseAdmin
      .from("schools")
      .select("name")
      .eq("id", schoolId)
      .maybeSingle()

    // Get all students enrolled in this class
    const { data: enrollments } = await supabaseAdmin
      .from("student_enrollments")
      .select("student_id")
      .eq("class_id", hw.class_id)
      .eq("school_id", schoolId)
      .eq("school_id", schoolId)

    if (!enrollments?.length) return

    const studentIds = enrollments.map((e: any) => e.student_id)

    // Get parent phone numbers for these students
    const { data: parents } = await supabaseAdmin
      .from("parents")
      .select("phone, name")
      .in("student_id", studentIds)

    if (!parents?.length) return

    const dueFormatted = new Date(hw.due_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    const schoolName   = school?.name || "School"
    const teacherLine  = hw.teacher_name ? `\nAssigned by: ${hw.teacher_name}` : ""
    const questionsNote = hw.questions ? "\n\nPractice questions are available in the parent app." : ""

    const message = `📚 *${schoolName} — Homework Assigned*\n\nSubject: ${hw.subject}\nTitle: ${hw.title}\nDue Date: ${dueFormatted}${teacherLine}${questionsNote}\n\nPlease ensure your child completes it on time.`

    const baseUrl        = getBaseUrl(req)
    const internalHeaders = getInternalApiHeaders()

    // Deduplicate phones and send
    const seen = new Set<string>()
    for (const parent of parents) {
      const phone = parent.phone?.trim()
      if (!phone || seen.has(phone)) continue
      seen.add(phone)
      try {
        await fetch(`${baseUrl}/api/send-whatsapp`, {
          method:  "POST",
          headers: internalHeaders,
          body:    JSON.stringify({ phone, message, schoolId }),
        })
      } catch { /* ignore per-parent errors */ }
    }
  } catch (e) {
    console.warn("[homework] WhatsApp notify error:", e)
  }
}
