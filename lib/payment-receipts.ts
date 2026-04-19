import { supabase } from "./supabase"

// ================= HELPERS =================

export function buildFeeBreakdown(fee: any) {
  const rows = [
    { label: "Tuition Fee", value: Number(fee?.tuition_fee ?? 0) },
    { label: "Transport Fee", value: Number(fee?.transport_fee ?? 0) },
    { label: "Hostel Fee", value: Number(fee?.hostel_fee ?? 0) }
  ].filter(r => r.value > 0)

  return rows.length
    ? rows
    : [{ label: "Fee", value: Number(fee?.total_amount ?? 0) }]
}

// ================= MAIN =================

export async function fetchReceiptByPaymentId(paymentId: string) {
  try {
    console.log("Fetching receipt:", paymentId)

    // 🔹 PAYMENT (STRICT)
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .select("*")
      .eq("id", paymentId)
      .single()

    if (paymentError || !payment) {
      console.error("Payment error:", paymentError)
      return null
    }

    // 🔹 FEE
    const { data: fee } = await supabase
      .from("fees")
      .select("*")
      .eq("id", payment.fee_id)
      .maybeSingle()

    // 🔹 STUDENT
    const { data: student } = await supabase
      .from("students")
      .select("id,name")
      .eq("id", payment.student_id)
      .maybeSingle()

    // 🔹 PARENT
    const { data: parent } = await supabase
      .from("parents")
      .select("father_name,mother_name,name,phone")
      .eq("student_id", payment.student_id)
      .maybeSingle()

    // 🔹 SCHOOL
    const { data: school } = await supabase
      .from("schools")
      .select("name,address,phone")
      .eq("id", payment.school_id)
      .maybeSingle()

    // 🔹 ENROLLMENT (SAFE — NO RELATION JOIN)
    const { data: enrollment } = await supabase
      .from("student_enrollments")
      .select("roll_number, class_id")
      .eq("student_id", payment.student_id)
      .limit(1)
      .maybeSingle()

    // 🔹 CLASS FETCH (SEPARATE — NO SUPABASE BUG)
    let className = "N/A"

    if (enrollment?.class_id) {
      const { data: cls } = await supabase
        .from("classes")
        .select("name")
        .eq("id", enrollment.class_id)
        .maybeSingle()

      className = cls?.name || "N/A"
    }

    // 🔹 PARENT NAME SAFE
    const parentName =
      parent?.name ||
      parent?.father_name ||
      parent?.mother_name ||
      "N/A"

    // 🔹 FINAL RESPONSE
    return {
      payment: {
        id: payment.receipt_number || payment.id,
        amount: Number(payment.amount ?? 0),
        date: payment.date || new Date().toISOString(),
        payment_mode: payment.payment_mode || "cash"
      },

      fee: {
        total_amount: Number(fee?.total_amount ?? 0),
        tuition_fee: Number(fee?.tuition_fee ?? 0),
        transport_fee: Number(fee?.transport_fee ?? 0),
        hostel_fee: Number(fee?.hostel_fee ?? 0)
      },

      student: {
        name: student?.name || "N/A",
        class_name: className,
        roll_number: enrollment?.roll_number || "N/A",
        parent_name: parentName,
        parent_phone: parent?.phone || "N/A"
      },

      school: {
        name: school?.name || "School",
        address: school?.address || "",
        phone: school?.phone || ""
      }
    }

  } catch (err) {
    console.error("Receipt fetch error:", err)
    return null
  }
}