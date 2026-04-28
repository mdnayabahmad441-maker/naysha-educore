import { apiFetch } from "./api-client"

export async function sendWhatsApp(
  phone: string,
  message: string,
  parentName = "Parent",
  schoolName = "School"
) {
  try {
    await apiFetch("/api/send-whatsapp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone,
        templateName: "school_notice",
        variables: [parentName, schoolName, message],
      }),
    })
  } catch (err) {
    console.error("WhatsApp error:", err)
  }
}
