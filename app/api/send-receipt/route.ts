import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(req: Request){

  const { paymentId, studentId } = await req.json()

  // 🔥 GET PAYMENT + STUDENT + PARENT
  const { data: payment } = await supabase
    .from("payments")
    .select(`
      *,
      students (
        name,
        parents (name,email,phone)
      ),
      fees (*)
    `)
    .eq("id", paymentId)
    .single()

  if(!payment){
    return NextResponse.json({ error: "Payment not found" })
  }

  const parent = payment.students?.parents

  // 🔥 EMAIL
  if(parent?.email){
    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/send-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: parent.email,
        subject: "Fee Payment Receipt",
        studentName: payment.students.name,
        amount: payment.amount
      })
    })
  }

  // 🔥 WHATSAPP
  if(parent?.phone){
    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/send-whatsapp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: parent.phone,
        studentName: payment.students.name,
        amount: payment.amount,
        receiptId: payment.id
      })
    })
  }

  return NextResponse.json({ success: true })
}