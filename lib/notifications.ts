import { supabase } from "./supabase"
import { apiFetch } from "./api-client"

export async function sendNotification({
  school_id,
  student_id,
  title,
  message,
  type
}: {
  school_id: string
  student_id: string
  title: string
  message: string
  type: string
}) {
  try {
    const { error } = await supabase
      .from("notifications")
      .insert({
        school_id,
        student_id,
        title,
        message,
        type
      })

    if (error) {
      console.error("DB Notification Error:", error)
    } else {
      console.log("Notification saved in DB")
    }

    const { data: parent, error: parentError } = await supabase
      .from("parents")
      .select("phone")
      .eq("student_id", student_id)
      .maybeSingle()

    if (parentError) {
      console.error("Parent fetch error:", parentError)
      return
    }

    if (!parent?.phone) {
      console.log("No phone number for student:", student_id)
      return
    }

    const res = await apiFetch("/api/send-whatsapp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        schoolId: school_id,
        phone: String(parent.phone).trim(),
        message: `${title}\n${message}`
      })
    })

    const data = await res.json()

    if (!res.ok) {
      console.error("WhatsApp API Error:", data)
    } else {
      console.log("WhatsApp sent:", data)
    }
  } catch (err) {
    console.error("WhatsApp failed:", err)
  }
}
