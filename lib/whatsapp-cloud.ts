type SendWhatsAppMessageInput = {
  phone: string
  message: string
}

const apiVersion = process.env.WHATSAPP_CLOUD_API_VERSION || "v23.0"
const accessToken = process.env.WHATSAPP_ACCESS_TOKEN
const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID

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

export function isWhatsAppCloudConfigured() {
  return Boolean(accessToken && phoneNumberId)
}

export async function sendWhatsAppCloudMessage({ phone, message }: SendWhatsAppMessageInput) {
  if (!accessToken || !phoneNumberId) {
    throw new Error("WhatsApp Cloud API is not configured")
  }

  const to = normalizePhoneNumber(phone)

  if (!to || !message.trim()) {
    throw new Error("Phone and message are required")
  }

  const response = await fetch(
    `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
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
