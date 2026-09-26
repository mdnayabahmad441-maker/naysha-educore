import { supabaseAdmin } from "@/lib/supabase-admin"

const META_API_VERSION = "v19.0"
const META_API_BASE = `https://graph.facebook.com/${META_API_VERSION}`

// ── Config resolution ──────────────────────────────────────────────────────────
// A school's own WhatsApp credentials always take priority. Schools that have
// not onboarded a number use the EduCore sender configured on the server.
// The fallback is sender-only: credentials are never copied between schools.

type MetaConfig = {
  token: string
  phoneNumberId: string
  source: "school" | "central"
}

async function getMetaConfig(schoolId?: string): Promise<MetaConfig | null> {
  if (schoolId) {
    const { data } = await supabaseAdmin
      .from("school_whatsapp")
      .select("access_token, phone_number_id, phone_number")
      .eq("school_id", schoolId)
      .maybeSingle()

    // Only use the school's token if it has been verified with Meta (phone_number is populated)
    if (data?.access_token && data?.phone_number_id && data?.phone_number && !data.phone_number.startsWith("ID:")) {
      return { token: data.access_token.trim(), phoneNumberId: data.phone_number_id.trim(), source: "school" }
    }
  }

  const token = process.env.META_WHATSAPP_TOKEN
  const phoneNumberId = process.env.META_PHONE_NUMBER_ID
  if (token && phoneNumberId) return { token: token.trim(), phoneNumberId: phoneNumberId.trim(), source: "central" }

  return null
}

// ── Status check ───────────────────────────────────────────────────────────────

export async function getWhatsAppCloudStatus(schoolId?: string) {
  if (schoolId) {
    const { data } = await supabaseAdmin
      .from("school_whatsapp")
      .select("access_token, phone_number_id, phone_number, display_name, created_at, business_account_id")
      .eq("school_id", schoolId)
      .maybeSingle()

    if (data?.access_token && data?.phone_number_id) {
      const isFullyVerified = Boolean(data.phone_number && !data.phone_number.startsWith("ID:"))
      return {
        configured: isFullyVerified,
        missing: isFullyVerified ? [] : ["WHATSAPP_PERMISSION_VERIFICATION_REQUIRED"],
        source: "school" as const,
        connectionStatus: isFullyVerified ? "connected" : "authorization_required",
        phoneNumberId: data.phone_number_id,
        phoneNumber: data.phone_number ?? null,
        displayName: data.display_name ?? null,
        connectedAt: data.created_at ?? null,
        businessAccountId: data.business_account_id ?? null,
        lastWebhookAt: null,
        lastWebhookStatus: isFullyVerified ? "subscribed" : "pending",
        provider: "meta-cloud-api",
        apiVersion: META_API_VERSION,
      }
    }
  }

  const centralToken = process.env.META_WHATSAPP_TOKEN
  const centralPhoneNumberId = process.env.META_PHONE_NUMBER_ID
  if (centralToken && centralPhoneNumberId) {
    return {
      configured: true,
      missing: [] as string[],
      source: "central" as const,
      connectionStatus: "fallback",
      phoneNumberId: centralPhoneNumberId,
      phoneNumber: null,
      displayName: "EduCore WhatsApp",
      connectedAt: null,
      businessAccountId: null,
      lastWebhookAt: null,
      lastWebhookStatus: null,
      provider: "meta-cloud-api",
      apiVersion: META_API_VERSION,
    }
  }

  return {
    configured: false,
    missing: ["SCHOOL_WHATSAPP_CONNECTION", "META_WHATSAPP_TOKEN", "META_PHONE_NUMBER_ID"],
    source: "central" as const,
    connectionStatus: "disconnected",
    phoneNumberId: null,
    phoneNumber: null,
    displayName: null,
    connectedAt: null,
    businessAccountId: null,
    lastWebhookAt: null,
    lastWebhookStatus: null,
    provider: "meta-cloud-api",
    apiVersion: META_API_VERSION,
  }
}

export async function isWhatsAppCloudConfigured(schoolId?: string) {
  const status = await getWhatsAppCloudStatus(schoolId)
  return status.configured
}

// ── Phone normalisation ────────────────────────────────────────────────────────

function parsePhone(phone: string): string | null {
  let n = String(phone || "").trim().replace(/\s+/g, "").replace(/^whatsapp:/i, "")
  if (n.startsWith("+")) n = n.slice(1)
  n = n.replace(/\D/g, "")
  if (n.startsWith("0")) n = n.slice(1)
  if (n.length === 10) return `91${n}`
  if (n.length === 12 && n.startsWith("91")) return n
  if (n.length > 10) return n
  return null
}

const sanitize = (s: string) =>
  String(s).replace(/[\t\n\r]/g, " ").replace(/ {3,}/g, "  ").trim()

// ── Sending ────────────────────────────────────────────────────────────────────

export async function sendWhatsAppTemplateMessage({
  phone,
  templateName,
  variables,
  languageCode = "en",
  schoolId,
}: {
  phone: string
  templateName: string
  variables: string[]
  languageCode?: string
  schoolId?: string
}): Promise<{ to: string; messageId: string | null; source: "school" | "central" }> {
  const config = await getMetaConfig(schoolId)

  if (!config) {
    throw new Error("WhatsApp is not configured. Connect the school’s number or configure the EduCore fallback sender.")
  }

  const to = parsePhone(phone)
  if (!to) throw new Error("Invalid phone number")

  const payload = {
    messaging_product: "whatsapp",
    to,
    type: "template",
    template: {
      name: templateName,
      language: { code: languageCode },
      components: variables.length > 0
        ? [{ type: "body", parameters: variables.map(v => ({ type: "text", text: sanitize(v) })) }]
        : [],
    },
  }

  const response = await fetch(`${META_API_BASE}/${config.phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  const data = await response.json()
  console.log(`[Meta WhatsApp][${config.source}] response:`, JSON.stringify(data))

  if (!response.ok) {
    const errObj = data?.error || {}
    const msg = errObj.message || data?.message || "Meta WhatsApp API request failed"
    const code = errObj.code ? `(#${errObj.code}) ` : ""
    throw new Error(`${code}${msg}`)
  }

  return { to, messageId: data?.messages?.[0]?.id ?? null, source: config.source }
}

export async function sendWhatsAppCloudMessage({
  phone,
  message,
  schoolId,
}: {
  schoolId?: string
  phone: string
  message: string
  schoolName?: string
  parentName?: string
}) {
  const templateName = process.env.WHATSAPP_TEMPLATE_NAME || "school_notice"
  const result = await sendWhatsAppTemplateMessage({
    phone,
    templateName,
    variables: [sanitize(message)],
    schoolId,
  })
  return { to: result.to, data: { messageId: result.messageId }, source: result.source }
}
