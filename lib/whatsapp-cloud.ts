import { supabaseAdmin } from "@/lib/supabase-admin"

const META_API_VERSION = "v19.0"
const META_API_BASE = `https://graph.facebook.com/${META_API_VERSION}`

// ── Config resolution ──────────────────────────────────────────────────────────
// WhatsApp credentials are tenant-scoped. A school's connection is never shared
// with another school or replaced with a global sender.

type MetaConfig = {
  token: string
  phoneNumberId: string
  source: "school"
}

async function getMetaConfig(schoolId?: string): Promise<MetaConfig | null> {
  if (schoolId) {
    const { data } = await supabaseAdmin
      .from("school_whatsapp")
      .select("access_token, phone_number_id")
      .eq("school_id", schoolId)
      .maybeSingle()

    if (data?.access_token && data?.phone_number_id) {
      return { token: data.access_token, phoneNumberId: data.phone_number_id, source: "school" }
    }
  }

  return null
}

// ── Status check ───────────────────────────────────────────────────────────────

export async function getWhatsAppCloudStatus(schoolId?: string) {
  if (schoolId) {
    const { data } = await supabaseAdmin
      .from("school_whatsapp")
      .select("access_token, phone_number_id, phone_number, display_name, status, connected_at, business_account_id, last_webhook_event_at, last_webhook_status")
      .eq("school_id", schoolId)
      .maybeSingle()

    if (data?.access_token && data.phone_number_id && data.status !== "disconnected") {
      return {
        configured: true,
        missing: [] as string[],
        source: "school" as const,
        connectionStatus: data.status ?? "connected",
        phoneNumberId: data.phone_number_id,
        phoneNumber: data.phone_number ?? null,
        displayName: data.display_name ?? null,
        connectedAt: data.connected_at ?? null,
        businessAccountId: data.business_account_id ?? null,
        lastWebhookAt: data.last_webhook_event_at ?? null,
        lastWebhookStatus: data.last_webhook_status ?? null,
        provider: "meta-cloud-api",
        apiVersion: META_API_VERSION,
      }
    }
  }

  return {
    configured: false,
    missing: ["SCHOOL_WHATSAPP_CONNECTION"],
    source: "school" as const,
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
    throw new Error(
      schoolId
        ? "No WhatsApp number is connected for this school. Connect one in Settings."
        : "A school WhatsApp connection is required."
    )
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
