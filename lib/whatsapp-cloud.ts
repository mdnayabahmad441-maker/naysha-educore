type SendWhatsAppMessageInput = {
  phone: string
  message: string
}

type WhatsAppCloudConfig = {
  accessToken: string | null
  phoneNumberId: string | null
  businessAccountId: string | null
  apiVersion: string
}

function readConfig(): WhatsAppCloudConfig {
  return {
    apiVersion: process.env.WHATSAPP_CLOUD_API_VERSION || "v23.0",
    accessToken:
      process.env.WHATSAPP_ACCESS_TOKEN ||
      process.env.META_WHATSAPP_ACCESS_TOKEN ||
      null,
    phoneNumberId:
      process.env.WHATSAPP_PHONE_NUMBER_ID ||
      process.env.META_WHATSAPP_PHONE_NUMBER_ID ||
      null,
    businessAccountId:
      process.env.WHATSAPP_BUSINESS_ACCOUNT_ID ||
      process.env.META_WHATSAPP_BUSINESS_ACCOUNT_ID ||
      null,
  }
}

function normalizePhoneNumber(phone: string) {
  let formatted = String(phone || "").trim().replace(/\D/g, "")

  if (formatted.startsWith("0")) {
    formatted = formatted.slice(1)
  }

  if (formatted.length === 10) {
    formatted = `91${formatted}`
  }

  if (!formatted.startsWith("91")) {
    formatted = `91${formatted}`
  }

  return formatted
}

export function getWhatsAppCloudStatus() {
  const config = readConfig()
  const missing: string[] = []

  if (!config.accessToken) {
    missing.push("WHATSAPP_ACCESS_TOKEN")
  }

  if (!config.phoneNumberId) {
    missing.push("WHATSAPP_PHONE_NUMBER_ID")
  }

  return {
    configured: missing.length === 0,
    missing,
    phoneNumberId: config.phoneNumberId,
    businessAccountId: config.businessAccountId,
    apiVersion: config.apiVersion,
  }
}

export function isWhatsAppCloudConfigured() {
  return getWhatsAppCloudStatus().configured
}

export async function sendWhatsAppCloudMessage({ phone, message }: SendWhatsAppMessageInput) {
  const config = readConfig()
  const status = getWhatsAppCloudStatus()

  if (!status.configured) {
    throw new Error(
      `WhatsApp Cloud API is not configured on the server. Missing: ${status.missing.join(", ")}`
    )
  }

  const to = normalizePhoneNumber(phone)

  if (!to || !message.trim()) {
    throw new Error("Phone and message are required")
  }

  const response = await fetch(
    `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "text",
        text: {
          preview_url: false,
          body: message,
        },
      }),
    }
  )

  const data = await response.json()

  if (!response.ok) {
    const errorMessage =
      data?.error?.message ||
      data?.message ||
      "WhatsApp Cloud API request failed"

    throw new Error(errorMessage)
  }

  return {
    to,
    data,
  }
}
