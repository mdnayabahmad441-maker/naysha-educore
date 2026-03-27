import { supabase } from "./supabase"

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
}
export async function sendClassNotification({
  school_id,
  class_id,
  title,
  message,
  type
}: {
  school_id: string
  class_id: string
  title: string
  message: string
  type: string
}) {

  // 🔥 GET ALL STUDENTS OF CLASS
  const { data: students } = await supabase
    .from("students")
    .select("id")
    .eq("class_id", class_id)
    .eq("school_id", school_id)

  if(!students || students.length === 0) return

  // 🔥 CREATE MULTIPLE NOTIFICATIONS
  const rows = students.map(s => ({
    school_id,
    student_id: s.id,
    title,
    message,
    type
  }))

  await supabase.from("notifications").insert(rows)
}