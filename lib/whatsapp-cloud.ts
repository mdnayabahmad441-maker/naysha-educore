const INTERAKT_API_URL = "https://api.interakt.ai/v1/public/message/"
const TEMPLATE_NAME = process.env.INTERAKT_TEMPLATE_NAME || "school_notice"

function getInteraktConfig() {
  return {
    apiKey: process.env.INTERAKT_API_KEY || null,
  }
}

function parsePhone(phone: string): { countryCode: string; phoneNumber: string } | null {
  let n = String(phone || "").trim().replace(/\s+/g, "").replace(/^whatsapp:/i, "")
  if (n.startsWith("+")) n = n.slice(1)
  n = n.replace(/\D/g, "")
  if (n.startsWith("0")) n = n.slice(1)

  if (n.length === 10) return { countryCode: "+91", phoneNumber: n }
  if (n.length === 12 && n.startsWith("91")) return { countryCode: "+91", phoneNumber: n.slice(2) }
  if (n.length > 10) return { countryCode: `+${n.slice(0, n.length - 10)}`, phoneNumber: n.slice(-10) }
  return null
}

export async function getWhatsAppCloudStatus(_schoolId?: string) {
  const { apiKey } = getInteraktConfig()
  const missing: string[] = []
  if (!apiKey) missing.push("INTERAKT_API_KEY")

  return {
    configured: missing.length === 0,
    missing,
    provider: "interakt",
    phoneNumberId: null,
    businessAccountId: null,
    phoneNumber: null,
    displayName: null,
    apiVersion: "v1",
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
}: {
  phone: string
  templateName: string
  variables: string[]
}): Promise<{ to: string; messageId: string | null }> {
  const { apiKey } = getInteraktConfig()

  if (!apiKey) {
    throw new Error("Interakt is not configured. Set INTERAKT_API_KEY in environment variables.")
  }

  const parsed = parsePhone(phone)
  if (!parsed) throw new Error("Invalid phone number")

  const sanitize = (s: string) =>
    String(s).replace(/[\t\n\r]/g, " ").replace(/ {3,}/g, "  ").trim()

  const payload = {
    countryCode: parsed.countryCode,
    phoneNumber: parsed.phoneNumber,
    callbackData: "naysha_erp",
    type: "Template",
    template: {
      name: templateName,
      languageCode: "en",
      bodyValues: variables.map(sanitize),
    },
  }

  const response = await fetch(INTERAKT_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  const data = await response.json()
  console.log("[Interakt] API response:", JSON.stringify(data))

  if (!response.ok) {
    const msg = data?.message || data?.error || "Interakt API request failed"
    const code = data?.code ? `(#${data.code}) ` : ""
    throw new Error(`${code}${msg}`)
  }

  return {
    to: `${parsed.countryCode}${parsed.phoneNumber}`,
    messageId: data?.id ?? null,
  }
}

// Backward-compatible wrapper — uses school_notice template
export async function sendWhatsAppCloudMessage({
  phone,
  message,
  schoolName = "School",
  parentName = "Parent",
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
    variables: [parentName, schoolName, message],
  })
  return { to: result.to, data: { messageId: result.messageId } }
}
