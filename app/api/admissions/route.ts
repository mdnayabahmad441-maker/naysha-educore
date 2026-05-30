import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { requireAdminProfile } from "@/lib/api-auth"
import { getBaseUrl, getInternalApiHeaders } from "@/lib/internal-api"

export async function GET(req: Request) {
  const auth = await requireAdminProfile(req)
  if ("response" in auth) return auth.response

  const { schoolId } = auth.profile
  if (!schoolId) return NextResponse.json({ error: "No school linked" }, { status: 400 })

  const url    = new URL(req.url)
  const status = url.searchParams.get("status")
  const search = url.searchParams.get("search")

  let query = supabaseAdmin
    .from("admissions")
    .select("*")
    .eq("school_id", schoolId)
    .order("created_at", { ascending: false })

  if (status) query = query.eq("status", status)
  if (search) query = query.ilike("student_name", `%${search}%`)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ admissions: data })
}

export async function POST(req: Request) {
  const auth = await requireAdminProfile(req)
  if ("response" in auth) return auth.response

  const { schoolId } = auth.profile
  if (!schoolId) return NextResponse.json({ error: "No school linked" }, { status: 400 })

  const body = await req.json()
  const {
    student_name, date_of_birth, gender, father_name, mother_name,
    phone, email, address, class_applied, section, academic_year,
    previous_school, remarks, documents, entrance_test_score,
    merit_rank, auto_confirmed,
  } = body

  if (!student_name?.trim() || !phone?.trim() || !class_applied?.trim()) {
    return NextResponse.json({ error: "Student name, phone and class are required" }, { status: 400 })
  }

  // Generate sequential admission number per school per year: YYYY-NNNN
  const year = new Date().getFullYear()
  const { count } = await supabaseAdmin
    .from("admissions")
    .select("*", { count: "exact", head: true })
    .eq("school_id", schoolId)
    .gte("created_at", `${year}-01-01`)

  const seq              = String((count ?? 0) + 1).padStart(4, "0")
  const admission_number = `${year}-${seq}`

  const score = entrance_test_score != null && entrance_test_score !== "" ? Number(entrance_test_score) : null
  const rawMeritRank = merit_rank != null && merit_rank !== "" ? Number(merit_rank) : null
  const docs = Array.isArray(documents)
    ? documents.map((doc: any) => ({
        name: String(doc.name || "Document"),
        url: String(doc.url || ""),
        type: doc.type ? String(doc.type) : "document",
      })).filter((doc) => doc.url)
    : []

  let computedMeritRank = rawMeritRank
  if (score != null && !Number.isNaN(score) && rawMeritRank == null) {
    const { data: existing, error: rankError } = await supabaseAdmin
      .from("admissions")
      .select("entrance_test_score")
      .eq("school_id", schoolId)
      .eq("class_applied", class_applied.trim())
      .eq("academic_year", academic_year?.trim() || "")
      .gt("entrance_test_score", score)

    if (!rankError) {
      computedMeritRank = (existing?.length ?? 0) + 1
    }
  }

  const isAutoConfirmed = Boolean(auto_confirmed)
  const finalStatus = isAutoConfirmed ? "approved" : "pending"

  const { data, error } = await supabaseAdmin
    .from("admissions")
    .insert({
      school_id: schoolId,
      admission_number,
      student_name:    student_name.trim(),
      date_of_birth:   date_of_birth   || null,
      gender:          gender          || null,
      father_name:     father_name?.trim()     || null,
      mother_name:     mother_name?.trim()     || null,
      phone:           phone.trim(),
      email:           email?.trim()           || null,
      address:         address?.trim()         || null,
      class_applied:   class_applied.trim(),
      section:         section?.trim()         || null,
      academic_year:   academic_year?.trim()   || null,
      previous_school: previous_school?.trim() || null,
      documents:       docs.length ? docs : null,
      entrance_test_score: score,
      merit_rank:      computedMeritRank || null,
      auto_confirmed:  isAutoConfirmed,
      status:          finalStatus,
      remarks:         remarks?.trim()         || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Send WhatsApp confirmation to the parent's phone for auto-approved admissions
  if (finalStatus === "approved") {
    try {
      const { data: school } = await supabaseAdmin
        .from("schools")
        .select("name")
        .eq("id", schoolId)
        .single()

      const classLine = data.class_applied + (data.section ? ` - Section ${data.section}` : "")
      const yearLine  = data.academic_year ? ` for ${data.academic_year}` : ""
      const greeting  = data.father_name ? `Dear ${data.father_name},` : "Dear Parent,"

      const message = `*Admission Confirmed* ✅\n\n${greeting}\n\n*${data.student_name}* has been successfully admitted to *${school?.name || "our school"}*.\n\n📋 *Admission No:* ${data.admission_number}\n🏫 *Class:* ${classLine}${yearLine}\n${data.entrance_test_score != null ? `\n✏️ *Entrance Score:* ${data.entrance_test_score}` : ""}${data.merit_rank != null ? `\n🏅 *Merit Rank:* ${data.merit_rank}` : ""}\n\nWelcome to our school family! Please visit the school office to complete the remaining formalities.\n\n— ${school?.name || "School Administration"}`

      const waRes = await fetch(`${getBaseUrl(req)}/api/send-whatsapp`, {
        method:  "POST",
        headers: getInternalApiHeaders(),
        body:    JSON.stringify({
          phone:    data.phone,
          message,
          schoolId,
        }),
      })

      if (waRes.ok) {
        await supabaseAdmin
          .from("admissions")
          .update({ confirmation_sent_at: new Date().toISOString() })
          .eq("id", data.id)
      }
    } catch (waErr) {
      // WhatsApp failure must not block the admission response
      console.warn("[admissions] WhatsApp notification failed:", waErr)
    }
  }

  return NextResponse.json({ admission: data }, { status: 201 })
}
