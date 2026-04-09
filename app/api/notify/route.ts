import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function POST(req: Request){

  try{

    const { type, refId } = await req.json()

    if(type !== "payment"){
      return NextResponse.json({ error: "Invalid type" })
    }

    // ================= PAYMENT =================
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from("payments")
      .select("*")
      .eq("id", refId)
      .single()

    if(paymentError || !payment){
      console.error("❌ Payment error:", paymentError)
      return NextResponse.json({ error: "Payment not found" })
    }

    // ================= STUDENT =================
    const { data: student } = await supabaseAdmin
      .from("students")
      .select("id,name")
      .eq("id", payment.student_id)
      .single()

    // ================= PARENT =================
    const { data: parent } = await supabaseAdmin
      .from("parents")
      .select("name,email,phone")
      .eq("student_id", payment.student_id)
      .maybeSingle()

    // ================= SCHOOL =================
    const { data: school } = await supabaseAdmin
      .from("schools")
      .select("name")
      .eq("id", payment.school_id)
      .single()

    // ================= ENROLLMENT =================
    const { data: enrollment } = await supabaseAdmin
      .from("student_enrollments")
      .select("roll_number, class_id")
      .eq("student_id", payment.student_id)
      .maybeSingle()

    let className = "N/A"
    let roll = "-"

    if(enrollment){
      roll = enrollment.roll_number || "-"

      const { data: cls } = await supabaseAdmin
        .from("classes")
        .select("name")
        .eq("id", enrollment.class_id)
        .single()

      className = cls?.name || "N/A"
    }

    console.log("✅ DEBUG:", {
      student,
      parent,
      school,
      className,
      roll,
      payment
    })

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
              <h2>${school?.name || "School"}</h2>

              <p>Dear ${parent?.name || "Parent"},</p>

              <p>Payment received for <b>${student?.name || "Student"}</b></p>

              <p>Class: ${className}</p>
              <p>Roll: ${roll}</p>

              <p><b>Amount: ₹${payment.amount}</b></p>

              <p>Thank you</p>
            `
          })
        })

        if(!res.ok){
          console.error("❌ Email API failed")
        }

      }catch(err){
        console.error("❌ Email send error:", err)
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
${school?.name || "School"}

Payment Received ✅

Student: ${student?.name || "Student"}
Class: ${className}
Roll: ${roll}

Amount: ₹${payment.amount}

Thank you
            `
          })
        })

        if(!res.ok){
          console.error("❌ WhatsApp API failed")
        }

      }catch(err){
        console.error("❌ WhatsApp send error:", err)
      }

    }

    return NextResponse.json({ success:true })

  }catch(err){
    console.error("🔥 SERVER ERROR:", err)
    return NextResponse.json({ error:"Server error" })
  }
}