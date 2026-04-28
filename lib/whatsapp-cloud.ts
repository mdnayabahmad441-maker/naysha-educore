const API_VERSION = process.env.WHATSAPP_CLOUD_API_VERSION || "v23.0"
const TEMPLATE_NAME = "school_notice"

function normalizePhoneNumber(phone: string): string {
  let n = String(phone || "").trim().replace(/^whatsapp:/i, "").replace(/\D/g, "")
  if (n.startsWith("0")) n = n.slice(1)
  if (n.length === 10) n = `91${n}`
  if (!n.startsWith("91")) n = `91${n}`
  return n
}

function getCentralizedConfig() {
  return {
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || null,
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN || null,
  }
}

export async function getWhatsAppCloudStatus(_schoolId?: string) {
  const { phoneNumberId, accessToken } = getCentralizedConfig()
  const missing: string[] = []
  if (!phoneNumberId) missing.push("WHATSAPP_PHONE_NUMBER_ID")
  if (!accessToken) missing.push("WHATSAPP_ACCESS_TOKEN")

  return {
    configured: missing.length === 0,
    missing,
    provider: "whatsapp-cloud-api",
    phoneNumberId,
    businessAccountId: null,
    phoneNumber: null,
    displayName: null,
    apiVersion: API_VERSION,
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
  const { phoneNumberId, accessToken } = getCentralizedConfig()

  if (!phoneNumberId || !accessToken) {
    throw new Error(
      "WhatsApp is not configured. Set WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN in environment variables."
    )
  }

  const to = normalizePhoneNumber(phone)
  if (!to) throw new Error("Invalid phone number")

  const payload = {
    messaging_product: "whatsapp",
    to,
    type: "template",
    template: {
      name: templateName,
      language: { code: "en" },
      components: variables.length > 0
        ? [
            {
              type: "body",
              parameters: variables.map((v) => ({ type: "text", text: String(v).slice(0, 1024) })),
            },
          ]
        : [],
    },
  }

  const response = await fetch(
    `https://graph.facebook.com/${API_VERSION}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  )

  const data = await response.json()
  console.log("[WhatsApp] Meta API response:", JSON.stringify(data))

  if (!response.ok) {
    const msg = data?.error?.message || "WhatsApp Cloud API request failed"
    const code = data?.error?.code ? `(#${data.error.code}) ` : ""
    throw new Error(`${code}${msg}`)
  }

  return {
    to,
    messageId: data?.messages?.[0]?.id ?? null,
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
