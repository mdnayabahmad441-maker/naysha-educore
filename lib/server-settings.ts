import { supabaseAdmin } from "@/lib/supabase-admin"

export async function getServerSetting(schoolId: string, key: string) {
  if (!schoolId || !key) return null

  const { data, error } = await supabaseAdmin
    .from("settings")
    .select("value")
    .eq("school_id", schoolId)
    .eq("key", key)
    .maybeSingle()

  if (error) {
    console.error(`Server setting fetch error for ${key}:`, error)
    return null
  }

  return data?.value ?? null
}

export async function getAiSystemInstructions(schoolId: string) {
  const value = await getServerSetting(schoolId, "ai_system_instructions")
  return typeof value === "string" ? value.trim() : ""
}

function summarizeObject(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return ""
  }

  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, entryValue]) => entryValue !== null && entryValue !== undefined && entryValue !== "")
    .slice(0, 12)

  if (!entries.length) return ""

  return entries
    .map(([key, entryValue]) => `${key}: ${String(entryValue)}`)
    .join("\n")
}

function summarizeLayout(value: unknown) {
  if (!value || typeof value !== "object") return ""

  const fields = Array.isArray((value as { fields?: unknown[] }).fields)
    ? ((value as { fields?: Array<Record<string, unknown>> }).fields ?? [])
    : []

  if (!fields.length) return ""

  return fields
    .slice(0, 20)
    .map((field) => {
      const id = String(field.id || "")
      const label = String(field.label || id)
      const align = field.align ? `, align=${String(field.align)}` : ""
      return `${id}: ${label}${align}`
    })
    .join("\n")
}

export async function getAiTenantContext(schoolId: string) {
  if (!schoolId) return ""

  const [{ data: school }, aiInstructions, examSettings, feeSettings, idCardLayout, reportCardLayout, certificateLayout] =
    await Promise.all([
      supabaseAdmin
        .from("schools")
        .select("name,email,phone,address,subdomain")
        .eq("id", schoolId)
        .maybeSingle(),
      getAiSystemInstructions(schoolId),
      getServerSetting(schoolId, "exam"),
      getServerSetting(schoolId, "fees"),
      getServerSetting(schoolId, "id_card_layout"),
      getServerSetting(schoolId, "report_card_layout"),
      getServerSetting(schoolId, "certificate_layout")
    ])

  const schoolLines = [
    school?.name ? `School name: ${school.name}` : "",
    school?.address ? `School address: ${school.address}` : "",
    school?.subdomain ? `Tenant subdomain: ${school.subdomain}` : "",
    school?.email ? `School email: ${school.email}` : "",
    school?.phone ? `School phone: ${school.phone}` : ""
  ].filter(Boolean)

  const sections = [
    schoolLines.length ? `Tenant profile:\n${schoolLines.join("\n")}` : "",
    summarizeObject(examSettings) ? `Saved exam settings:\n${summarizeObject(examSettings)}` : "",
    summarizeObject(feeSettings) ? `Saved fee settings:\n${summarizeObject(feeSettings)}` : "",
    summarizeLayout(idCardLayout) ? `Saved ID card field conventions:\n${summarizeLayout(idCardLayout)}` : "",
    summarizeLayout(reportCardLayout) ? `Saved report card field conventions:\n${summarizeLayout(reportCardLayout)}` : "",
    summarizeLayout(certificateLayout) ? `Saved certificate field conventions:\n${summarizeLayout(certificateLayout)}` : "",
    aiInstructions ? `Saved school AI instructions:\n${aiInstructions}` : ""
  ].filter(Boolean)

  if (!sections.length) return ""

  return `Tenant-specific ERP context:\n${sections.join("\n\n")}`
}
