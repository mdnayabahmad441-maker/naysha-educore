import { supabase } from "./supabase"
import { sendWhatsApp } from "./whatsapp"

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

  // ✅ SAVE IN DB
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
    console.error("Notification error:", error)
  }

  // 🔥 GET PARENT PHONE
  const { data: parent } = await supabase
    .from("parents")
    .select("phone")
    .eq("student_id", student_id)
    .single()

  if(!parent?.phone) return

  // 🔥 SEND WHATSAPP
  try{
    await sendWhatsApp(parent.phone, `${title}\n\n${message}`)
  }catch(err){
    console.error("WhatsApp failed:", err)
  }

}