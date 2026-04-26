type SendWhatsAppMessageInput = {
  schoolId: string
  phone: string
  message: string
}

type WhatsAppCloudConfig = {
  accessToken: string | null
  phoneNumberId: string | null
  businessAccountId: string | null
  phoneNumber: string | null
  displayName: string | null
}

function normalizePhoneNumber(phone: string) {
  let formatted = String(phone || "").trim().replace(/^whatsapp:/i, "").replace(/\D/g, "")

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

async function loadSchoolWhatsAppConfig(schoolId: string): Promise<WhatsAppCloudConfig> {
  const { supabaseAdmin } = await import("@/lib/supabase-admin")

  const { data, error } = await supabaseAdmin
    .from("school_whatsapp")
    .select("access_token, phone_number_id, business_account_id, phone_number, display_name")
    .eq("school_id", schoolId)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to load WhatsApp configuration: ${error.message}`)
  }

  return {
    accessToken: data?.access_token ?? null,
    phoneNumberId: data?.phone_number_id ?? null,
    businessAccountId: data?.business_account_id ?? null,
    phoneNumber: data?.phone_number ?? null,
    displayName: data?.display_name ?? null,
  }
}

export async function sendWhatsAppMessage(
  schoolId: string,
  phone: string,
  message: string
): Promise<{ to: string; messageId: string | null }> {
  const config = await loadSchoolWhatsAppConfig(schoolId)

  if (!config.accessToken || !config.phoneNumberId) {
    throw new Error("WhatsApp is not connected for this school. Ask the admin to connect it in Settings.")
  }

  const apiVersion = process.env.WHATSAPP_CLOUD_API_VERSION || "v23.0"
  const to = normalizePhoneNumber(phone)
  const body = String(message || "").trim()

  if (!to) throw new Error("Invalid phone number")
  if (!body) throw new Error("Message cannot be empty")

  const response = await fetch(
    `https://graph.facebook.com/${apiVersion}/${config.phoneNumberId}/messages`,
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
          body,
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
    messageId: data?.messages?.[0]?.id ?? null,
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
      messageId: result.messageId,
    },
  }
}

export async function getWhatsAppCloudStatus(schoolId: string) {
  const config = await loadSchoolWhatsAppConfig(schoolId)
  const missing: string[] = []

  if (!config.accessToken) {
    missing.push("access_token")
  }

  if (!config.phoneNumberId) {
    missing.push("phone_number_id")
  }

  return {
    configured: missing.length === 0,
    missing,
    provider: "whatsapp-cloud-api",
    phoneNumberId: config.phoneNumberId,
    businessAccountId: config.businessAccountId,
    phoneNumber: config.phoneNumber,
    displayName: config.displayName,
    apiVersion: process.env.WHATSAPP_CLOUD_API_VERSION || "v23.0",
  }
}

export async function isWhatsAppCloudConfigured(schoolId: string) {
  const status = await getWhatsAppCloudStatus(schoolId)
  return status.configured
}
