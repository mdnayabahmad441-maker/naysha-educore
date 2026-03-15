import { supabase } from "@/lib/supabase"

export async function saveMarks(rows: any[]) {
  const { error } = await supabase
    .from("marks")
    .upsert(rows)

  if (error) throw error
}

export async function getMarks(examId: string) {
  const { data, error } = await supabase
    .from("marks")
    .select("*")
    .eq("exam_id", examId)

  if (error) throw error
  return data
}