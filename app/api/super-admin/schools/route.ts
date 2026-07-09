import { NextResponse } from "next/server"
import { requireAuthorizedProfile } from "@/lib/api-auth"
import { supabaseAdmin } from "@/lib/supabase-admin"
import {
  getNotificationControlsMap,
  mergeNotificationControls,
  saveNotificationControls,
  type NotificationControls,
} from "@/lib/notification-controls"

type SchoolRow = {
  id: string
  name: string | null
  email: string | null
  phone: string | null
  address?: string | null
  subdomain?: string | null
  domain?: string | null
  status?: string | null
  plan?: string | null
  subscription_status?: string | null
  subscription_ends_at?: string | null
  ai_enabled?: boolean | null
  fee_notifications_enabled?: boolean | null
  other_notifications_enabled?: boolean | null
  notes?: string | null
  created_at?: string | null
}

const optionalSchoolFields = [
  "status",
  "plan",
  "subscription_status",
  "subscription_ends_at",
  "ai_enabled",
  "fee_notifications_enabled",
  "other_notifications_enabled",
  "notes",
]

function isSchemaColumnError(error: { code?: string; message?: string; details?: string } | null) {
  const text = `${error?.code || ""} ${error?.message || ""} ${error?.details || ""}`.toLowerCase()
  return text.includes("column") || text.includes("schema cache") || error?.code === "42703" || error?.code === "PGRST204"
}

function isMissingOptionalTableError(error: { code?: string; message?: string; details?: string } | null) {
  const text = `${error?.code || ""} ${error?.message || ""} ${error?.details || ""}`.toLowerCase()
  return (
    isSchemaColumnError(error) ||
    text.trim() === "" ||
    text.includes("could not find the table") ||
    text.includes("does not exist") ||
    error?.code === "42P01" ||
    error?.code === "PGRST205"
  )
}

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function normalizeNullableText(value: unknown) {
  const text = normalizeText(value)
  return text || null
}

function normalizeSubdomain(value: unknown) {
  return normalizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

async function safeCount(table: string, schoolId: string) {
  const { count, error } = await supabaseAdmin
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("school_id", schoolId)

  if (error) return 0
  return count || 0
}

async function getSchoolStats(schoolId: string) {
  const [students, teachers, parents, classes, fees, payments, enquiries] = await Promise.all([
    safeCount("students", schoolId),
    safeCount("teachers", schoolId),
    safeCount("parents", schoolId),
    safeCount("classes", schoolId),
    safeCount("fees", schoolId),
    safeCount("payments", schoolId),
    safeCount("admission_enquiries", schoolId),
  ])

  return { students, teachers, parents, classes, fees, payments, enquiries }
}

async function safeSelectIds(table: string, column: string, value: string) {
  const { data, error } = await supabaseAdmin.from(table).select("id").eq(column, value)
  if (error) {
    if (isMissingOptionalTableError(error)) return []
    throw new Error(`Could not read ${table}.${column}: ${error.message || error.details || error.code || "Unknown error"}`)
  }

  return (data || []).map((row: { id?: string | number | null }) => row.id).filter(Boolean) as Array<string | number>
}

async function deleteEq(table: string, column: string, value: string | number) {
  const { error } = await supabaseAdmin.from(table).delete().eq(column, value)
  if (error && !isMissingOptionalTableError(error)) {
    throw new Error(`Could not delete ${table}.${column}: ${error.message || error.details || error.code || "Unknown error"}`)
  }
}

async function deleteIn(table: string, column: string, values: Array<string | number>) {
  if (values.length === 0) return

  const { error } = await supabaseAdmin.from(table).delete().in(column, values)
  if (error && !isMissingOptionalTableError(error)) {
    throw new Error(`Could not delete ${table}.${column}: ${error.message || error.details || error.code || "Unknown error"}`)
  }
}

async function deleteSchoolTenantData(schoolId: string) {
  const [teacherIds, examIds, studentIds, classIds, subjectIds, feeIds] = await Promise.all([
    safeSelectIds("teachers", "school_id", schoolId),
    safeSelectIds("exams", "school_id", schoolId),
    safeSelectIds("students", "school_id", schoolId),
    safeSelectIds("classes", "school_id", schoolId),
    safeSelectIds("subjects", "school_id", schoolId),
    safeSelectIds("fees", "school_id", schoolId),
  ])

  await Promise.all([
    deleteIn("teacher_classes", "teacher_id", teacherIds),
    deleteIn("teacher_subjects", "teacher_id", teacherIds),
    deleteIn("exam_subjects", "exam_id", examIds),
    deleteIn("exam_results", "exam_id", examIds),
    deleteIn("student_documents", "student_id", studentIds),
    deleteIn("class_subjects", "class_id", classIds),
    deleteIn("class_subjects", "subject_id", subjectIds),
    deleteIn("fee_payments", "fee_id", feeIds),
  ])

  const schoolScopedTables = [
    "notifications_log",
    "notifications",
    "notices",
    "events",
    "question_papers",
    "homework",
    "teacher_attendance",
    "attendance",
    "marks",
    "results",
    "exam_results",
    "fees",
    "payments",
    "fee_payments",
    "admissions",
    "admission_enquiries",
    "student_enrollments",
    "parents",
    "students",
    "class_fee_settings",
    "teacher_classes",
    "teacher_subjects",
    "class_subjects",
    "exam_subjects",
    "exams",
    "subjects",
    "sections",
    "teachers",
    "academic_years",
    "settings",
    "school_whatsapp",
    "classes",
    "profiles",
  ]

  for (const table of schoolScopedTables) {
    await deleteEq(table, "school_id", schoolId)
  }
}

async function listUsersByEmail(email: string) {
  const found = []
  let page = 1

  while (page <= 10) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 100 })
    if (error) throw error

    const users = data?.users || []
    found.push(...users.filter((user) => String(user.email || "").trim().toLowerCase() === email))

    if (users.length < 100) break
    page += 1
  }

  return found
}

async function ensureSchoolAdminAccount(school: SchoolRow, password: string) {
  const email = normalizeText(school.email).toLowerCase()
  if (!email) throw new Error("School email is required before setting admin password")
  if (password.length < 8) throw new Error("Password must be at least 8 characters")

  const existing = (await listUsersByEmail(email))[0]
  const metadata = { role: "admin", active_role: "admin", school_id: school.id }

  if (existing) {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      user_metadata: { ...(existing.user_metadata || {}), ...metadata },
    })
    if (error) throw error

    await supabaseAdmin.from("profiles").upsert({
      id: existing.id,
      school_id: school.id,
      role: "admin",
    })

    return { created: false, userId: existing.id }
  }

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: metadata,
  })
  if (error) throw error

  if (data.user) {
    await supabaseAdmin.from("profiles").upsert({
      id: data.user.id,
      school_id: school.id,
      role: "admin",
    })
  }

  return { created: true, userId: data.user?.id || null }
}

async function updateSchool(schoolId: string, updates: Record<string, unknown>) {
  const coreUpdate = {
    name: normalizeText(updates.name),
    email: normalizeText(updates.email).toLowerCase(),
    phone: normalizeNullableText(updates.phone),
    address: normalizeNullableText(updates.address),
    subdomain: normalizeSubdomain(updates.subdomain),
    domain: normalizeNullableText(updates.domain),
  }

  if (!coreUpdate.name || !coreUpdate.email || !coreUpdate.subdomain) {
    throw new Error("School name, email, and subdomain are required")
  }

  const notificationControls: NotificationControls = {
    fee_notifications_enabled: Boolean(updates.fee_notifications_enabled),
    other_notifications_enabled: Boolean(updates.other_notifications_enabled),
  }

  const fullUpdate: Record<string, unknown> = { ...coreUpdate }
  for (const field of optionalSchoolFields) {
    if ((field === "ai_enabled" || field === "fee_notifications_enabled" || field === "other_notifications_enabled") && field in updates) {
      fullUpdate[field] = Boolean(updates[field])
    } else if (field in updates) {
      fullUpdate[field] = normalizeNullableText(updates[field])
    }
  }

  const first = await supabaseAdmin
    .from("schools")
    .update(fullUpdate)
    .eq("id", schoolId)
    .select("*")
    .single()

  if (!first.error) {
    await saveNotificationControls(schoolId, notificationControls)
    return { school: mergeNotificationControls(first.data as SchoolRow, notificationControls), warning: "" }
  }

  if (!isSchemaColumnError(first.error)) {
    throw first.error
  }

  const fallback = await supabaseAdmin
    .from("schools")
    .update(coreUpdate)
    .eq("id", schoolId)
    .select("*")
    .single()

  if (fallback.error) throw fallback.error

  await saveNotificationControls(schoolId, notificationControls)

  return {
    school: mergeNotificationControls(fallback.data as SchoolRow, notificationControls),
    warning: "Saved school details. Run super_admin_control_schema.sql to store optional controls directly on schools.",
  }
}

export async function GET(req: Request) {
  const auth = await requireAuthorizedProfile(req, ["super_admin"])
  if ("response" in auth) return auth.response

  const { data, error } = await supabaseAdmin
    .from("schools")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const rows = (data || []) as SchoolRow[]
  const controls = await getNotificationControlsMap(rows.map((school) => school.id))
  const schools = await Promise.all(
    rows.map(async (school) => ({
      ...mergeNotificationControls(school, controls.get(school.id) || null),
      stats: await getSchoolStats(school.id),
    }))
  )

  return NextResponse.json({ success: true, schools })
}

export async function POST(req: Request) {
  const auth = await requireAuthorizedProfile(req, ["super_admin"])
  if ("response" in auth) return auth.response

  try {
    const body = await req.json()
    const action = normalizeText(body.action)

    if (action === "set_admin_password") {
      const schoolId = normalizeText(body.schoolId)
      const password = String(body.password || "")

      const { data: school, error } = await supabaseAdmin
        .from("schools")
        .select("*")
        .eq("id", schoolId)
        .single()

      if (error) throw error

      const result = await ensureSchoolAdminAccount(school as SchoolRow, password)
      return NextResponse.json({ success: true, ...result })
    }

    const name = normalizeText(body.name)
    const email = normalizeText(body.email).toLowerCase()
    const subdomain = normalizeSubdomain(body.subdomain)

    if (!name || !email || !subdomain) {
      return NextResponse.json({ error: "School name, email, and subdomain are required" }, { status: 400 })
    }

    const insertPayload: Record<string, unknown> = {
      name,
      email,
      subdomain,
      phone: normalizeNullableText(body.phone),
      address: normalizeNullableText(body.address),
      domain: normalizeNullableText(body.domain),
      status: normalizeNullableText(body.status) || "active",
      plan: normalizeNullableText(body.plan) || "standard",
      subscription_status: normalizeNullableText(body.subscription_status) || "trial",
      subscription_ends_at: normalizeNullableText(body.subscription_ends_at),
      ai_enabled: Boolean(body.ai_enabled),
      fee_notifications_enabled: Boolean(body.fee_notifications_enabled),
      other_notifications_enabled: Boolean(body.other_notifications_enabled),
      notes: normalizeNullableText(body.notes),
    }

    const notificationControls: NotificationControls = {
      fee_notifications_enabled: Boolean(body.fee_notifications_enabled),
      other_notifications_enabled: Boolean(body.other_notifications_enabled),
    }

    let created = await supabaseAdmin.from("schools").insert(insertPayload).select("*").single()

    if (created.error && isSchemaColumnError(created.error)) {
      const corePayload = { ...insertPayload }
      for (const field of optionalSchoolFields) {
        delete corePayload[field]
      }
      created = await supabaseAdmin.from("schools").insert(corePayload).select("*").single()
    }

    if (created.error) throw created.error

    await saveNotificationControls((created.data as SchoolRow).id, notificationControls)

    if (body.adminPassword) {
      await ensureSchoolAdminAccount(created.data as SchoolRow, String(body.adminPassword || ""))
    }

    return NextResponse.json({
      success: true,
      school: mergeNotificationControls(created.data as SchoolRow, notificationControls),
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not create school" },
      { status: 500 }
    )
  }
}

export async function PATCH(req: Request) {
  const auth = await requireAuthorizedProfile(req, ["super_admin"])
  if ("response" in auth) return auth.response

  try {
    const body = await req.json()
    const schoolId = normalizeText(body.schoolId)
    if (!schoolId) return NextResponse.json({ error: "schoolId is required" }, { status: 400 })

    const result = await updateSchool(schoolId, body)
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not update school" },
      { status: 500 }
    )
  }
}

export async function DELETE(req: Request) {
  const auth = await requireAuthorizedProfile(req, ["super_admin"])
  if ("response" in auth) return auth.response

  try {
    const url = new URL(req.url)
    const schoolId = normalizeText(url.searchParams.get("schoolId"))
    const confirm = url.searchParams.get("confirm") === "DELETE"

    if (!schoolId || !confirm) {
      return NextResponse.json({ error: "schoolId and confirm=DELETE are required" }, { status: 400 })
    }

    await deleteSchoolTenantData(schoolId)

    const { error } = await supabaseAdmin.from("schools").delete().eq("id", schoolId)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not delete school" },
      { status: 500 }
    )
  }
}
