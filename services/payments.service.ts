import { supabase } from "@/lib/supabase"

export async function getPayments(schoolId: string) {
  const { data, error } = await supabase
    .from("fee_payments")
    .select("*")
    .eq("school_id", schoolId)

  if (error) throw error
  return data
}

export async function createPayment(payment: any) {
  const { error } = await supabase
    .from("fee_payments")
    .insert(payment)

  if (error) throw error
}