import { getActiveAcademicYear } from "./academic"
import { supabase } from "./supabase"

type ReceiptPayment = {
  id: string
  receipt_number?: string | null
  student_id: string
  fee_id: string
  school_id: string
  amount?: number | string | null
  date?: string | null
  payment_mode?: string | null
}

type FeeBreakdownInput = {
  month?: string | null
  total_amount?: number | string | null
  tuition_fee?: number | string | null
  transport_fee?: number | string | null
  hostel_fee?: number | string | null
} | null | undefined

export function buildFeeBreakdown(fee: FeeBreakdownInput) {
  const rows = [
    { label: "Tuition Fee", value: Number(fee?.tuition_fee ?? 0) },
    { label: "Transport Fee", value: Number(fee?.transport_fee ?? 0) },
    { label: "Hostel Fee", value: Number(fee?.hostel_fee ?? 0) }
  ].filter((row) => row.value > 0)

  return rows.length
    ? rows
    : [{ label: fee?.month || "Fee", value: Number(fee?.total_amount ?? 0) }]
}

async function findPayment(paymentId: string): Promise<ReceiptPayment | null> {
  const { data: paymentById, error: paymentByIdError } = await supabase
    .from("payments")
    .select("*")
    .eq("id", paymentId)
    .maybeSingle()

  if (paymentByIdError) {
    console.error("Payment lookup error:", paymentByIdError)
    return null
  }

  if (paymentById) {
    return paymentById as ReceiptPayment
  }

  const { data: paymentByReceipt, error: paymentByReceiptError } = await supabase
    .from("payments")
    .select("*")
    .eq("receipt_number", paymentId)
    .maybeSingle()

  if (paymentByReceiptError) {
    console.error("Payment receipt lookup error:", paymentByReceiptError)
    return null
  }

  return (paymentByReceipt as ReceiptPayment | null) ?? null
}

export async function fetchReceiptByPaymentId(paymentId: string) {
  try {
    const payment = await findPayment(paymentId)

    if (!payment) return null

    const activeYear = await getActiveAcademicYear()

    let enrollmentQuery = supabase
      .from("student_enrollments")
      .select("roll_number,class_id")
      .eq("student_id", payment.student_id)
      .eq("school_id", payment.school_id)

    if (activeYear?.id) {
      enrollmentQuery = enrollmentQuery.eq("academic_year_id", activeYear.id)
    }

    const [feeRes, studentRes, parentRes, schoolRes, enrollmentRes] =
      await Promise.all([
        supabase
          .from("fees")
          .select("*")
          .eq("id", payment.fee_id)
          .eq("school_id", payment.school_id)
          .maybeSingle(),

        supabase
          .from("students")
          .select("id,name,student_code,roll_number,class_id")
          .eq("id", payment.student_id)
          .eq("school_id", payment.school_id)
          .maybeSingle(),

        supabase
          .from("parents")
          .select("father_name,mother_name,name,phone,email")
          .eq("student_id", payment.student_id)
          .eq("school_id", payment.school_id)
          .limit(1)
          .maybeSingle(),

        supabase
          .from("schools")
          .select("name,address,phone,logo_url")
          .eq("id", payment.school_id)
          .maybeSingle(),

        enrollmentQuery.limit(1).maybeSingle()
      ])

    if (feeRes.error) console.error("Fee receipt error:", feeRes.error)
    if (studentRes.error) console.error("Student receipt error:", studentRes.error)
    if (parentRes.error) console.error("Parent receipt error:", parentRes.error)
    if (schoolRes.error) console.error("School receipt error:", schoolRes.error)
    if (enrollmentRes.error) console.error("Enrollment receipt error:", enrollmentRes.error)

    const fee = feeRes.data
    const student = studentRes.data
    const parent = parentRes.data
    const school = schoolRes.data
    const enrollment = enrollmentRes.data

    const classId = enrollment?.class_id || student?.class_id
    let className = "N/A"

    if (classId) {
      const { data: cls, error: classError } = await supabase
        .from("classes")
        .select("name")
        .eq("id", classId)
        .eq("school_id", payment.school_id)
        .maybeSingle()

      if (classError) {
        console.error("Class receipt error:", classError)
      }

      className = cls?.name || "N/A"
    }

    const parentName =
      parent?.name ||
      parent?.father_name ||
      parent?.mother_name ||
      "N/A"

    return {
      payment: {
        id: payment.id,
        receipt_number: payment.receipt_number || payment.id,
        amount: Number(payment.amount ?? 0),
        date: payment.date || new Date().toISOString(),
        payment_mode: payment.payment_mode || "cash"
      },

      fee: {
        month: fee?.month || "Fee",
        total_amount: Number(fee?.total_amount ?? payment.amount ?? 0),
        tuition_fee: Number(fee?.tuition_fee ?? 0),
        transport_fee: Number(fee?.transport_fee ?? 0),
        hostel_fee: Number(fee?.hostel_fee ?? 0)
      },

      student: {
        id: student?.id || payment.student_id,
        name: student?.name || "N/A",
        student_code: student?.student_code || "",
        class_name: className,
        roll_number: enrollment?.roll_number ?? student?.roll_number ?? "N/A",
        parent_name: parentName,
        parent_phone: parent?.phone || "N/A",
        parent_email: parent?.email || "N/A"
      },

      school: {
        name: school?.name || "School",
        address: school?.address || "",
        phone: school?.phone || "",
        logo_url: school?.logo_url || ""
      }
    }
  } catch (err) {
    console.error("Receipt fetch error:", err)
    return null
  }
}
