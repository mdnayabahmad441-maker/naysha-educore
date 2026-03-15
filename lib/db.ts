import { supabase } from "@/lib/supabase"

export async function tenantQuery(table: string, schoolId: string) {
  return supabase.from(table).select("*").eq("school_id", schoolId)
}