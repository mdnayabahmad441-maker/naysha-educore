import { apiFetch } from "./api-client"

export async function sendNotification({
  school_id,
  student_id,
  title,
  message,
  type,
}: {
  school_id: string
  student_id: string
  title: string
  message: string
  type: string
}) {
  try {
    const res = await apiFetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ school_id, student_id, title, message, type }),
    })

    const data = await res.json()

    if (!res.ok) {
      console.error("[sendNotification] API error:", data?.error || data)
      return
    }

    console.log(`[sendNotification] saved ✓ | whatsapp: ${data.whatsappStatus}`)

    if (data.whatsappStatus !== "sent") {
      console.warn("[sendNotification] WhatsApp not sent:", data.whatsappError || data.whatsappStatus)
    }
  } catch (err) {
    console.error("[sendNotification] Network error:", err)
  }
}
