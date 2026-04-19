import { getActiveAcademicYear } from "./academic"
import { supabase } from "./supabase"

// ================= HELPERS =================

export function getSingleRelation(value: any) {
  if (!value) return null
  return Array.isArray(value) ? value[0] ?? null : value
}

export function toFeeLabel(fee: any) {
  if (fee?.month) return `${fee.month} Fee`

  const parts = [
    fee?.tuition_fee ? "Tuition" : null,
    fee?.transport_fee ? "Transport" : null,
    fee?.hostel_fee ? "Hostel" : null
  ].filter(Boolean)

  return parts.length ? parts.join(" + ") : "Fee"
}

export function buildFeeBreakdown(fee: any) {
  const rows = [
    { label: "Tuition Fee", value: Number(fee?.tuition_fee ?? 0) },
    { label: "Transport Fee", value: Number(fee?.transport_fee ?? 0) },
    { label: "Hostel Fee", value: Number(fee?.hostel_fee ?? 0) }
  ].filter(r => r.value > 0)

  if (rows.length) return rows

  return [{
    label: fee?.label || "Fee",
    value: Number(fee?.total_amount ?? 0)
  }]
}

// ================= MAIN =================

export async function fetchReceiptByPaymentId(paymentId: string) {
  console.log("Fetching receipt:", paymentId)

  // 🔹 PAYMENT
  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .select("*")
    .eq("id", paymentId)
    .single()

  if (paymentError || !payment) {
    console.error("Payment error:", paymentError)
    return null
  }

  // 🔹 ACTIVE YEAR (IMPORTANT FOR CLASS)
  const year = await getActiveAcademicYear()

  // 🔹 PARALLEL FETCH
  const [feeRes, studentRes, parentRes, schoolRes, enrollmentRes] = await Promise.all([

    supabase
      .from("fees")
      .select("*")
      .eq("id", payment.fee_id)
      .maybeSingle(),

    supabase
      .from("students")
      .select("*")
      .eq("id", payment.student_id)
      .maybeSingle(),

    supabase
      .from("parents")
      .select("*")
      .eq("student_id", payment.student_id)
      .maybeSingle(),

    supabase
      .from("schools")
      .select("*")
      .eq("id", payment.school_id)
      .maybeSingle(),

    // 🔥 FIXED: include academic year
    year?.id
      ? supabase
          .from("student_enrollments")
          .select("roll_number, classes(name)")
          .eq("student_id", payment.student_id)
          .eq("academic_year_id", year.id)
          .maybeSingle()
      : supabase
          .from("student_enrollments")
          .select("roll_number, classes(name)")
          .eq("student_id", payment.student_id)
          .maybeSingle()
  ])

  const fee = feeRes.data
  const student = studentRes.data
  const parent = parentRes.data
  const school = schoolRes.data
  const enrollment = enrollmentRes.data

  console.log("DEBUG:", { payment, student, parent, school, enrollment, fee })

  const classRelation = getSingleRelation(enrollment?.classes)

  const parentName =
    parent?.name || parent?.father_name || parent?.mother_name || null

  return {
    payment: {
      id: payment.id,
      receipt_number: payment.receipt_number || payment.id,
      amount: Number(payment.amount ?? 0),
      date: payment.date || new Date().toISOString(),
      payment_mode: payment.payment_mode || "cash",
      remarks: payment.remarks || null
    },

    fee: {
      id: fee?.id ?? null,
      label: toFeeLabel(fee),
      month: fee?.month ?? null,
      total_amount: Number(fee?.total_amount ?? 0),
      paid_amount: Number(fee?.paid_amount ?? 0),
      status: fee?.status ?? null,
      tuition_fee: Number(fee?.tuition_fee ?? 0),
      transport_fee: Number(fee?.transport_fee ?? 0),
      hostel_fee: Number(fee?.hostel_fee ?? 0)
    },

    student: {
      id: student?.id ?? null,
      name: student?.name || "N/A",
      class_name: classRelation?.name || "N/A",
      roll_number: enrollment?.roll_number ?? "N/A",
      parent_name: parentName || "N/A",
      parent_phone: parent?.phone || "N/A",
      parents: {
        name: parentName || "N/A",
        phone: parent?.phone || "N/A"
      }
    },

    school: {
      id: school?.id ?? null,
      name: school?.name || "School",
      address: school?.address || "",
      phone: school?.phone || ""
    }
  }
}