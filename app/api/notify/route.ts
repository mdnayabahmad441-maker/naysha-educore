import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function POST(req: Request){

  try{

    const { type, refId } = await req.json()

    if(type !== "payment"){
      return NextResponse.json({ error: "Invalid type" })
    }

    // ================= SINGLE QUERY (🔥 CORE FIX) =================
    const { data: payment, error } = await supabaseAdmin
      .from("payments")
      .select(`
        *,
        students (
          id,
          name,
          student_enrollments (
            roll_number,
            classes ( name )
          ),
          parents ( name, email, phone )
        ),
        schools ( name )
      `)
      .eq("id", refId)
      .single()

    if(error || !payment){
      console.error("❌ Payment fetch error:", error)
      return NextResponse.json({ error: "Payment not found" })
    }

    // ================= EXTRACT DATA =================
    const student = payment.students
    const parent = student?.parents?.[0]
    const enrollment = student?.student_enrollments?.[0]

    const className = enrollment?.classes?.name || "N/A"
    const roll = enrollment?.roll_number || "-"
    const schoolName = payment.schools?.name || "School"

    console.log("✅ DEBUG DATA:", {
      student,
      parent,
      className,
      roll,
      payment
    })

    // ================= STATUS TRACKING =================
    let emailStatus = "not_sent"
    let whatsappStatus = "not_sent"

    // ================= EMAIL =================
    if(parent?.email){

      try{
        const res = await fetch("http://localhost:3000/api/send-email",{
          method:"POST",
          headers:{ "Content-Type":"application/json" },
          body: JSON.stringify({
            to: parent.email,
            subject: "Payment Received",
            html: `
              <h2>${schoolName}</h2>

              <p>Dear ${parent?.name || "Parent"},</p>

              <p>Payment received for <b>${student?.name || "Student"}</b></p>

              <p>Class: ${className}</p>
              <p>Roll: ${roll}</p>

              <p><b>Amount: ₹${payment.amount}</b></p>

              <p>Thank you</p>
            `
          })
        })

        emailStatus = res.ok ? "sent" : "failed"

      }catch(err){
        console.error("❌ Email error:", err)
        emailStatus = "error"
      }

    }

    // ================= WHATSAPP =================
    if(parent?.phone){

      try{
        const res = await fetch("http://localhost:3000/api/send-whatsapp",{
          method:"POST",
          headers:{ "Content-Type":"application/json" },
          body: JSON.stringify({
            to: parent.phone,
            message: `
${schoolName}

Payment Received ✅

Student: ${student?.name}
Class: ${className}
Roll: ${roll}

Amount: ₹${payment.amount}

Thank you
            `
          })
        })

        whatsappStatus = res.ok ? "sent" : "failed"

      }catch(err){
        console.error("❌ WhatsApp error:", err)
        whatsappStatus = "error"
      }

    }

    // ================= FINAL RESPONSE =================
    return NextResponse.json({
      success: true,
      emailStatus,
      whatsappStatus
    })

  }catch(err){
    console.error("🔥 SERVER ERROR:", err)
    return NextResponse.json({ error:"Server error" })
  }
}