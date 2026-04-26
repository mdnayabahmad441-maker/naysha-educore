import { supabase } from "./supabase"

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

export async function getCurrentParentStudentIds(): Promise<string[]> {
  // Try multiple times (important for first login)
  for (let attempt = 0; attempt < 3; attempt++) {

    const { data: userData } = await supabase.auth.getUser()
    const user = userData.user

    if (!user) {
      await wait(300)
      continue
    }

    console.log("[ParentAccess] Checking user:", user.id)

    // 1. Try auth_id
    const { data: byAuthId } = await supabase
      .from("parents")
      .select("student_id")
      .eq("auth_id", user.id)

    const idsByAuth = (byAuthId || [])
      .map((p) => p.student_id)
      .filter((id): id is string => Boolean(id))

    if (idsByAuth.length > 0) {
      console.log("[ParentAccess] Found via auth_id:", idsByAuth)
      return [...new Set(idsByAuth)]
    }

    // 2. Try email
    const email = user.email?.trim().toLowerCase()

    if (email) {
      const { data: byEmail } = await supabase
        .from("parents")
        .select("student_id")
        .eq("email", email)

      const idsByEmail = (byEmail || [])
        .map((p) => p.student_id)
        .filter((id): id is string => Boolean(id))

      if (idsByEmail.length > 0) {
        console.log("[ParentAccess] Found via email:", idsByEmail)

        // 🔥 IMPORTANT: link auth_id automatically
        await supabase
          .from("parents")
          .update({ auth_id: user.id })
          .eq("email", email)

        return [...new Set(idsByEmail)]
      }
    }

    // ⏳ wait before retry
    await wait(500)
  }

  console.warn("[ParentAccess] No student IDs found after retries")
  return []
}