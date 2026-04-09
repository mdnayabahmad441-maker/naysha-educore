import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(req: Request){

  try{

    const { type, refId } = await req.json()

    if(type !== "payment"){
      return NextResponse.json({ error: "Invalid type" })
    }

    // ================= PAYMENT =================
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .select("*")
      .eq("id", refId)
      .single()

    if(paymentError || !payment){
      console.error(paymentError)
      return NextResponse.json({ error: "Payment not found" })
    }

    // ================= STUDENT =================
    const { data: student } = await supabase
      .from("students")
      .select("id,name")
      .eq("id", payment.student_id)
      .single()

    // ================= PARENT =================
    const { data: parent } = await supabase
      .from("parents")
      .select("name,email,phone")
      .eq("student_id", payment.student_id)
      .maybeSingle()

    // ================= SCHOOL =================
    const { data: school } = await supabase
      .from("schools")
      .select("name")
      .eq("id", payment.school_id)
      .single()

    // ================= CLASS (via enrollment) =================
    const { data: enrollment } = await supabase
      .from("student_enrollments")
      .select("roll_number, class_id")
      .eq("student_id", payment.student_id)
      .maybeSingle()

    let className = "N/A"
    let roll = "-"

    if(enrollment){
      roll = enrollment.roll_number || "-"

      const { data: cls } = await supabase
        .from("classes")
        .select("name")
        .eq("id", enrollment.class_id)
        .single()

      className = cls?.name || "N/A"
    }

    console.log("DEBUG:", {
      student,
      parent,
      className,
      roll
    })

    // ================= EMAIL =================
    if(parent?.email){
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/send-email`,{
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          to: parent.email,
          subject: "Payment Received",
          html: `
            <h2>${school?.name || "School"}</h2>

            <p>Dear ${parent.name || "Parent"},</p>

            <p>Payment received for <b>${student?.name}</b></p>

            <p>Class: ${className}</p>
            <p>Roll: ${roll}</p>

            <p><b>Amount: ₹${payment.amount}</b></p>

            <p>Thank you</p>
          `
        })
      })
    }

    // ================= WHATSAPP =================
    if(parent?.phone){
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/send-whatsapp`,{
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          to: parent.phone,
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
    }

    return NextResponse.json({ success:true })

  }catch(err){
    console.error("SERVER ERROR:", err)
    return NextResponse.json({ error:"Server error" })
  }
}