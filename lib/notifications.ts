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

  try{

    // =========================
    // 1. SAVE IN DB
    // =========================
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
      console.error("❌ DB Notification Error:", error)
    } else {
      console.log("✅ Notification saved in DB")
    }

    // =========================
    // 2. GET STUDENT PHONE
    // =========================
    const { data: student, error: studentError } = await supabase
      .from("students")
      .select("phone, name")
      .eq("id", student_id)
      .single()

    if(studentError){
      console.error("❌ Student fetch error:", studentError)
      return
    }

    if (!student?.phone) {
      console.log("⚠️ No phone number for:", student?.name)
      return
    }

    console.log("📞 Sending WhatsApp to:", student.phone)

    // =========================
    // 3. CALL WHATSAPP API
    // =========================
    const res = await apiFetch("/api/send-whatsapp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        to: student.phone,   // ✅ IMPORTANT
        message: `${title}\n${message}`
      })
    })

    const data = await res.json()

    if(!res.ok){
      console.error("❌ WhatsApp API Error:", data)
    }else{
      console.log("✅ WhatsApp Sent:", data)
    }

  }catch(err){
    console.error("❌ WhatsApp Failed:", err)
  }
}
