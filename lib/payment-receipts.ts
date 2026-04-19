import { getActiveAcademicYear } from "./academic"
import { supabase } from "./supabase"

type PaymentRecord = {
  id: string
  student_id: string
  fee_id: string
  amount: number | null
  receipt_number: string | null
  date: string | null
  is_manual: boolean | null
  payment_mode: string | null
  remarks: string | null
  school_id: string
}

type FeeRecord = {
  id: string
  student_id: string
  month: string | null
  total_amount: number | null
  paid_amount: number | null
  status: string | null
  tuition_fee: number | null
  transport_fee: number | null
  hostel_fee: number | null
}

type StudentRecord = {
  id: string
  name: string
}

type ParentRecord = {
  name: string | null
  father_name: string | null
  mother_name: string | null
  phone: string | null
}

type SchoolRecord = {
  id: string
  name: string | null
  address: string | null
  phone: string | null
}

type EnrollmentRecord = {
  student_id: string
  roll_number: number | null
  class_id: string | null
  students:
    | {
        id: string
        name: string
      }[]
    | {
        id: string
        name: string
      }
    | null
  classes:
    | {
        name: string
      }[]
    | {
        name: string
      }
    | null
}

export type ReceiptSchool = {
  id?: string
  name: string | null
  address: string | null
  phone: string | null
}

export type ReceiptStudent = {
  id: string
  name: string
  class_name: string | null
  roll_number: number | null
  parent_name: string | null
  parent_phone: string | null
  parents: {
    name: string | null
    phone: string | null
  }
}

export type ReceiptFee = {
  id: string
  label: string
  month: string | null
  total_amount: number | null
  paid_amount: number | null
  status: string | null
  tuition_fee: number | null
  transport_fee: number | null
  hostel_fee: number | null
}

export type ReceiptPayment = {
  id: string
  receipt_number: string
  amount: number
  date: string
  is_manual: boolean
  payment_mode: string | null
  remarks: string | null
}

export type ReceiptHistoryItem = {
  id: string
  amount: number
  paymentDate: string
  receiptNumber: string
  isManual: boolean
  paymentMode: string
  studentName: string
  studentClass: string | null
  feeLabel: string
}

export type ReceiptViewData = {
  payment: ReceiptPayment
  fee: ReceiptFee
  student: ReceiptStudent
  school: ReceiptSchool | null
}

export function getSingleRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null
  return Array.isArray(value) ? value[0] ?? null : value
}

export function toFeeLabel(fee: Pick<
  FeeRecord,
  "month" | "tuition_fee" | "transport_fee" | "hostel_fee"
>) {
  if (fee.month) {
    return `${fee.month} Fee`
  }

  const parts = [
    fee.tuition_fee ? "Tuition" : null,
    fee.transport_fee ? "Transport" : null,
    fee.hostel_fee ? "Hostel" : null
  ].filter(Boolean)

  if (parts.length > 0) {
    return parts.join(" + ")
  }

  return "Fee"
}

export function buildFeeBreakdown(fee: Partial<ReceiptFee>) {
  const rows = [
    { label: "Tuition Fee", value: Number(fee.tuition_fee || 0) },
    { label: "Transport Fee", value: Number(fee.transport_fee || 0) },
    { label: "Hostel Fee", value: Number(fee.hostel_fee || 0) }
  ].filter((item) => item.value > 0)

  if (rows.length > 0) {
    return rows
  }

  return [
    {
      label: fee.label || (fee.month ? `${fee.month} Fee` : "Total Fee"),
      value: Number(fee.total_amount || 0)
    }
  ]
}

async function fetchSchoolById(schoolId: string): Promise<ReceiptSchool | null> {
  const { data, error } = await supabase
    .from("schools")
    .select("id,name,address,phone")
    .eq("id", schoolId)
    .single()

  if (error) {
    throw error
  }

  const school = data as SchoolRecord | null

  if (!school) {
    return null
  }

  return {
    id: school.id,
    name: school.name,
    address: school.address,
    phone: school.phone
  }
}

async function fetchEnrollmentForStudent(
  schoolId: string,
  studentId: string
): Promise<EnrollmentRecord | null> {
  const year = await getActiveAcademicYear()

  let query = supabase
    .from("student_enrollments")
    .select(
      `
        student_id,
        roll_number,
        class_id,
        students(id,name),
        classes(name)
      `
    )
    .eq("school_id", schoolId)
    .eq("student_id", studentId)

  if (year?.id) {
    query = query.eq("academic_year_id", year.id)
  }

  const { data, error } = await query.maybeSingle()

  if (error) {
    throw error
  }

  return (data as EnrollmentRecord | null) ?? null
}

export async function fetchReceiptByPaymentId(
  paymentId: string
): Promise<ReceiptViewData | null> {
  const { data: paymentData, error: paymentError } = await supabase
    .from("payments")
    .select("id,student_id,fee_id,amount,receipt_number,date,is_manual,payment_mode,remarks,school_id")
    .eq("id", paymentId)
    .single()

  if (paymentError) {
    throw paymentError
  }

  const payment = paymentData as PaymentRecord | null

  if (!payment) {
    return null
  }

  const [feeRes, studentRes, parentRes, school, enrollment] = await Promise.all([
    supabase
      .from("fees")
      .select(
        "id,student_id,month,total_amount,paid_amount,status,tuition_fee,transport_fee,hostel_fee"
      )
      .eq("id", payment.fee_id)
      .single(),

    supabase
      .from("students")
      .select("id,name")
      .eq("id", payment.student_id)
      .single(),

    supabase
      .from("parents")
      .select("name,father_name,mother_name,phone")
      .eq("student_id", payment.student_id)
      .maybeSingle(),

    fetchSchoolById(payment.school_id),

    fetchEnrollmentForStudent(payment.school_id, payment.student_id)
  ])

  if (feeRes.error) {
    throw feeRes.error
  }

  if (studentRes.error) {
    throw studentRes.error
  }

  if (parentRes.error) {
    throw parentRes.error
  }

  const fee = feeRes.data as FeeRecord
  const student = studentRes.data as StudentRecord
  const parent = (parentRes.data as ParentRecord | null) ?? null
  const classRelation = getSingleRelation<{ name: string }>(enrollment?.classes)

  const parentName =
    parent?.name || parent?.father_name || parent?.mother_name || null

  return {
    payment: {
      id: payment.id,
      receipt_number: payment.receipt_number || payment.id,
      amount: Number(payment.amount ?? 0),
      date: payment.date || new Date().toISOString(),
      is_manual: Boolean(payment.is_manual),
      payment_mode: payment.payment_mode || "cash",
      remarks: payment.remarks || null
    },
    fee: {
      id: fee.id,
      label: toFeeLabel(fee),
      month: fee.month,
      total_amount: fee.total_amount,
      paid_amount: fee.paid_amount,
      status: fee.status,
      tuition_fee: fee.tuition_fee,
      transport_fee: fee.transport_fee,
      hostel_fee: fee.hostel_fee
    },
    student: {
      id: student.id,
      name: student.name,
      class_name: classRelation?.name || null,
      roll_number: enrollment?.roll_number ?? null,
      parent_name: parentName,
      parent_phone: parent?.phone || null,
      parents: {
        name: parentName,
        phone: parent?.phone || null
      }
    },
    school
  }
}

export async function fetchReceiptHistoryForSchool(
  schoolId: string
): Promise<ReceiptHistoryItem[]> {
  const { data: paymentData, error: paymentError } = await supabase
    .from("payments")
    .select("id,student_id,fee_id,amount,receipt_number,date,is_manual,payment_mode")
    .eq("school_id", schoolId)
    .order("date", { ascending: false })

  if (paymentError) {
    throw paymentError
  }

  const payments = (paymentData as PaymentRecord[] | null) ?? []

  if (payments.length === 0) {
    return []
  }

  const studentIds = [...new Set(payments.map((payment) => payment.student_id))]
  const feeIds = [...new Set(payments.map((payment) => payment.fee_id))]
  const year = await getActiveAcademicYear()

  const [studentRes, feeRes, enrollmentRes] = await Promise.all([
    supabase
      .from("students")
      .select("id,name")
      .in("id", studentIds)
      .eq("school_id", schoolId),

    supabase
      .from("fees")
      .select(
        "id,student_id,month,total_amount,paid_amount,status,tuition_fee,transport_fee,hostel_fee"
      )
      .in("id", feeIds)
      .eq("school_id", schoolId),

    year?.id
      ? supabase
          .from("student_enrollments")
          .select(
            `
              student_id,
              roll_number,
              class_id,
              students(id,name),
              classes(name)
            `
          )
          .in("student_id", studentIds)
          .eq("school_id", schoolId)
          .eq("academic_year_id", year.id)
      : Promise.resolve({ data: [], error: null })
  ])

  if (studentRes.error) {
    throw studentRes.error
  }

  if (feeRes.error) {
    throw feeRes.error
  }

  if (enrollmentRes.error) {
    throw enrollmentRes.error
  }

  const studentMap = new Map<string, StudentRecord>()
  ;((studentRes.data as StudentRecord[] | null) ?? []).forEach((student) => {
    studentMap.set(student.id, student)
  })

  const feeMap = new Map<string, FeeRecord>()
  ;((feeRes.data as FeeRecord[] | null) ?? []).forEach((fee) => {
    feeMap.set(fee.id, fee)
  })

  const classMap = new Map<string, string | null>()
  ;((enrollmentRes.data as EnrollmentRecord[] | null) ?? []).forEach((row) => {
    const schoolClass = getSingleRelation<{ name: string }>(row.classes)
    classMap.set(row.student_id, schoolClass?.name || null)
  })

  return payments.map((payment) => {
    const fee = feeMap.get(payment.fee_id)
    const student = studentMap.get(payment.student_id)

    return {
      id: payment.id,
      amount: Number(payment.amount ?? 0),
      paymentDate: payment.date || new Date().toISOString(),
      receiptNumber: payment.receipt_number || payment.id,
      isManual: Boolean(payment.is_manual),
      paymentMode: payment.payment_mode || "cash",
      studentName: student?.name || "Unknown",
      studentClass: classMap.get(payment.student_id) || null,
      feeLabel: fee ? toFeeLabel(fee) : "Fee"
    }
  })
}
