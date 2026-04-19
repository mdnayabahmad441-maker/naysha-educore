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

  const { data: payment } = await supabase
    .from("payments")
    .select("id,student_id,fee_id,amount,receipt_number,date,payment_mode,remarks,school_id")
    .eq("id", paymentId)
    .single()

  if (!payment) return null

  const [feeRes, studentRes, parentRes, schoolRes, enrollmentRes] = await Promise.all([

    supabase
      .from("fees")
      .select("*")
      .eq("id", payment.fee_id)
      .single(),

    supabase
      .from("students")
      .select("*")
      .eq("id", payment.student_id)
      .single(),

    supabase
      .from("parents")
      .select("*")
      .eq("student_id", payment.student_id)
      .maybeSingle(),

    supabase
      .from("schools")
      .select("*")
      .eq("id", payment.school_id)
      .single(),

    supabase
      .from("student_enrollments")
      .select("roll_number,classes(name)")
      .eq("student_id", payment.student_id)
      .maybeSingle()
  ])

  const fee = feeRes.data
  const student = studentRes.data
  const parent = parentRes.data
  const school = schoolRes.data
  const enrollment = enrollmentRes.data

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
      id: fee?.id,
      label: toFeeLabel(fee),
      month: fee?.month,
      total_amount: fee?.total_amount,
      paid_amount: fee?.paid_amount,
      status: fee?.status,
      tuition_fee: fee?.tuition_fee,
      transport_fee: fee?.transport_fee,
      hostel_fee: fee?.hostel_fee
    },

    student: {
      id: student?.id,
      name: student?.name,
      class_name: classRelation?.name || null,
      roll_number: enrollment?.roll_number ?? null,
      parent_name: parentName,
      parent_phone: parent?.phone || null,
      parents: {
        name: parentName,
        phone: parent?.phone || null
      }
    },

    school: {
      id: school?.id,
      name: school?.name,
      address: school?.address,
      phone: school?.phone
    }
  }
}