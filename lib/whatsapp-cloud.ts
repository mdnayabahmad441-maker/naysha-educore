import twilio from "twilio"

type SchoolWhatsAppConfig = {
  account_sid: string | null
  auth_token: string | null
  from_number: string | null
  provider: string | null
  display_name: string | null
}

type SendWhatsAppMessageInput = {
  schoolId: string
  phone: string
  message: string
}

function normalizePhoneNumber(phone: string) {
  let formatted = String(phone || "").trim()

  if (!formatted) {
    return ""
  }

  formatted = formatted.replace(/^whatsapp:/i, "").replace(/\s+/g, "")

  if (!formatted.startsWith("+")) {
    const digits = formatted.replace(/\D/g, "")
    const normalizedDigits = digits.length === 10 ? `91${digits}` : digits
    formatted = `+${normalizedDigits}`
  }

  return formatted
}

function normalizeWhatsAppSender(phone: string) {
  const normalized = normalizePhoneNumber(phone)
  return normalized ? `whatsapp:${normalized}` : ""
}

async function loadSchoolWhatsAppConfig(schoolId: string): Promise<SchoolWhatsAppConfig> {
  const { supabaseAdmin } = await import("@/lib/supabase-admin")

  const { data, error } = await supabaseAdmin
    .from("school_whatsapp")
    .select("account_sid, auth_token, from_number, provider, display_name")
    .eq("school_id", schoolId)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to load WhatsApp configuration: ${error.message}`)
  }

  return {
    account_sid: data?.account_sid ?? null,
    auth_token: data?.auth_token ?? null,
    from_number: data?.from_number ?? null,
    provider: data?.provider ?? null,
    display_name: data?.display_name ?? null,
  }
}

export async function sendWhatsAppMessage(
  schoolId: string,
  phone: string,
  message: string
): Promise<{ to: string; messageId: string | null }> {
  const config = await loadSchoolWhatsAppConfig(schoolId)

  if (!config.account_sid || !config.auth_token || !config.from_number) {
    throw new Error("WhatsApp is not configured for this school")
  }

  const to = normalizeWhatsAppSender(phone)
  const from = normalizeWhatsAppSender(config.from_number)
  const body = String(message || "").trim()

  if (!to) throw new Error("Invalid destination phone number")
  if (!from) throw new Error("Invalid WhatsApp sender number")
  if (!body) throw new Error("Message cannot be empty")

  const client = twilio(config.account_sid, config.auth_token)
  const result = await client.messages.create({
    from,
    to,
    body,
  })

  return {
    to,
    messageId: result.sid ?? null,
  }
}

export async function sendWhatsAppCloudMessage({
  schoolId,
  phone,
  message,
}: SendWhatsAppMessageInput) {
  const result = await sendWhatsAppMessage(schoolId, phone, message)

  return {
    to: result.to,
    data: {
      sid: result.messageId,
    },
  }
}

export async function getWhatsAppCloudStatus(schoolId: string) {
  const config = await loadSchoolWhatsAppConfig(schoolId)
  const missing: string[] = []

  if (!config.account_sid) {
    missing.push("account_sid")
  }

  if (!config.auth_token) {
    missing.push("auth_token")
  }

  if (!config.from_number) {
    missing.push("from_number")
  }

  return {
    configured: missing.length === 0,
    missing,
    provider: config.provider || "twilio_whatsapp",
    fromNumber: config.from_number ? normalizeWhatsAppSender(config.from_number) : null,
    displayName: config.display_name || null,
  }
}

export async function isWhatsAppCloudConfigured(schoolId: string) {
  const status = await getWhatsAppCloudStatus(schoolId)
  return status.configured
}
