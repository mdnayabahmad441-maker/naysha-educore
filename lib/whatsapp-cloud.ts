const META_API_VERSION = "v19.0"
const META_API_BASE = `https://graph.facebook.com/${META_API_VERSION}`
const TEMPLATE_NAME = process.env.WHATSAPP_TEMPLATE_NAME || "school_notice"

function getMetaConfig() {
  return {
    token: process.env.META_WHATSAPP_TOKEN || null,
    phoneNumberId: process.env.META_PHONE_NUMBER_ID || null,
  }
}

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

export async function getWhatsAppCloudStatus(_schoolId?: string) {
  const { token, phoneNumberId } = getMetaConfig()
  const missing: string[] = []
  if (!token) missing.push("META_WHATSAPP_TOKEN")
  if (!phoneNumberId) missing.push("META_PHONE_NUMBER_ID")

  return {
    configured: missing.length === 0,
    missing,
    provider: "meta-cloud-api",
    phoneNumberId: phoneNumberId || null,
    businessAccountId: null,
    phoneNumber: null,
    displayName: null,
    apiVersion: META_API_VERSION,
  }
}

export async function isWhatsAppCloudConfigured(_schoolId?: string) {
  const status = await getWhatsAppCloudStatus()
  return status.configured
}

export async function sendWhatsAppTemplateMessage({
  phone,
  templateName,
  variables,
  languageCode = "en",
}: {
  phone: string
  templateName: string
  variables: string[]
  languageCode?: string
}): Promise<{ to: string; messageId: string | null }> {
  const { token, phoneNumberId } = getMetaConfig()

  if (!token || !phoneNumberId) {
    throw new Error("Meta WhatsApp Cloud API is not configured. Set META_WHATSAPP_TOKEN and META_PHONE_NUMBER_ID.")
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
        ? [
            {
              type: "body",
              parameters: variables.map((v) => ({
                type: "text",
                text: sanitize(v),
              })),
            },
          ]
        : [],
    },
  }

  const response = await fetch(`${META_API_BASE}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  const data = await response.json()
  console.log("[Meta WhatsApp] API response:", JSON.stringify(data))

  if (!response.ok) {
    const errObj = data?.error || {}
    const msg = errObj.message || data?.message || "Meta WhatsApp API request failed"
    const code = errObj.code ? `(#${errObj.code}) ` : ""
    throw new Error(`${code}${msg}`)
  }

  return {
    to,
    messageId: data?.messages?.[0]?.id ?? null,
  }
}

// General-purpose wrapper — uses school_notice template: "Dear Parent this is to inform you that {{1}}."
// {{1}} = full message text
export async function sendWhatsAppCloudMessage({
  phone,
  message,
}: {
  schoolId?: string
  phone: string
  message: string
  schoolName?: string
  parentName?: string
}) {
  const result = await sendWhatsAppTemplateMessage({
    phone,
    templateName: TEMPLATE_NAME,
    variables: [sanitize(message)],
  })
  return { to: result.to, data: { messageId: result.messageId } }
}
