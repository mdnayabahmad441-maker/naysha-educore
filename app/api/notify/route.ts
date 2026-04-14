import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function POST(req: Request){

  try{

    const { type, refId } = await req.json()

    if(type !== "payment"){
      return NextResponse.json({ error: "Invalid type" })
    }

    // ================= PAYMENT =================
    const { data: payment } = await supabaseAdmin
      .from("payments")
      .select("*")
      .eq("id", refId)
      .single()

    if(!payment){
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

    // ================= CLASS =================
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

    // ================= STATUS =================
    let emailStatus = "skipped"
    let whatsappStatus = "skipped"

    // ================= EMAIL =================
    if(parent?.email){

      try{
        const res = await fetch("http://localhost:3000/api/send-email",{
          method:"POST",
          headers:{ "Content-Type":"application/json" },
          body: JSON.stringify({
            email: parent.email,
            subject: "Payment Received",
            message: `
${school?.name || "School"}

Payment received for ${student?.name}

Class: ${className}
Roll: ${roll}

Amount: ₹${payment.amount}

Thank you
            `
          })
        })

        emailStatus = res.ok ? "sent" : "failed"

      }catch(err){
        console.error("Email error:", err)
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
            phone: parent.phone,
            message: `
${school?.name || "School"}

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
        console.error("WhatsApp error:", err)
        whatsappStatus = "error"
      }
    }

    // ================= LOG =================
    await supabaseAdmin.from("notifications_log").insert({
      type: "payment",
      ref_id: payment.id,
      student_id: payment.student_id,
      school_id: payment.school_id,
      email: parent?.email || null,
      phone: parent?.phone || null,
      email_status: emailStatus,
      whatsapp_status: whatsappStatus
    })

    return NextResponse.json({
      success:true,
      emailStatus,
      whatsappStatus
    })

  }catch(err){
    console.error("SERVER ERROR:", err)
    return NextResponse.json({ error:"Server error" })
  }
}