import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

type PaymentRow = {
  id: string
  amount: number | string | null
  date: string | null
  receipt_number: string | null
  student_id: string
  fee_id: string
}

type StudentRow = {
  id: string
  name: string | null
  class_id: string | null
}

type FeeRow = {
  id: string
  month: string | null
  class_id: string | null
  total_amount: number | string | null
}

type EnrollmentRow = {
  student_id: string
  class_id: string | null
}

type ClassRow = {
  id: string
  name: string | null
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const schoolId = searchParams.get("school_id")

  if (!schoolId) {
    return NextResponse.json(
      { error: "school_id is required" },
      { status: 400 }
    )
  }

  const { data: payments, error: paymentsError } = await supabaseAdmin
    .from("payments")
    .select("id,amount,date,receipt_number,student_id,fee_id")
    .eq("school_id", schoolId)
    .order("date", { ascending: false })

  if (paymentsError) {
    return NextResponse.json(
      { error: paymentsError.message },
      { status: 500 }
    )
  }

  const paymentRows = (payments as PaymentRow[] | null) ?? []

  if (paymentRows.length === 0) {
    return NextResponse.json([])
  }

  const studentIds = [...new Set(paymentRows.map((payment) => payment.student_id))]
  const feeIds = [...new Set(paymentRows.map((payment) => payment.fee_id))]

  const { data: activeYear } = await supabaseAdmin
    .from("academic_years")
    .select("id")
    .eq("school_id", schoolId)
    .eq("is_active", true)
    .maybeSingle()

  let enrollmentQuery = supabaseAdmin
    .from("student_enrollments")
    .select("student_id,class_id")
    .eq("school_id", schoolId)
    .in("student_id", studentIds)

  if (activeYear?.id) {
    enrollmentQuery = enrollmentQuery.eq("academic_year_id", activeYear.id)
  }

  const [studentsRes, feesRes, enrollmentsRes] = await Promise.all([
    supabaseAdmin
      .from("students")
      .select("id,name,class_id")
      .eq("school_id", schoolId)
      .in("id", studentIds),

    supabaseAdmin
      .from("fees")
      .select("id,month,class_id,total_amount")
      .eq("school_id", schoolId)
      .in("id", feeIds),

    enrollmentQuery
  ])

  if (studentsRes.error) {
    return NextResponse.json(
      { error: studentsRes.error.message },
      { status: 500 }
    )
  }

  if (feesRes.error) {
    return NextResponse.json(
      { error: feesRes.error.message },
      { status: 500 }
    )
  }

  if (enrollmentsRes.error) {
    return NextResponse.json(
      { error: enrollmentsRes.error.message },
      { status: 500 }
    )
  }

  const students = new Map<string, StudentRow>()
  ;((studentsRes.data as StudentRow[] | null) ?? []).forEach((student) => {
    students.set(student.id, student)
  })

  const fees = new Map<string, FeeRow>()
  ;((feesRes.data as FeeRow[] | null) ?? []).forEach((fee) => {
    fees.set(fee.id, fee)
  })

  const enrollments = new Map<string, EnrollmentRow>()
  ;((enrollmentsRes.data as EnrollmentRow[] | null) ?? []).forEach(
    (enrollment) => {
      enrollments.set(enrollment.student_id, enrollment)
    }
  )

  const classIds = [
    ...new Set(
      paymentRows
        .map((payment) => {
          const student = students.get(payment.student_id)
          const fee = fees.get(payment.fee_id)
          const enrollment = enrollments.get(payment.student_id)

          return enrollment?.class_id || student?.class_id || fee?.class_id || null
        })
        .filter((classId): classId is string => Boolean(classId))
    )
  ]

  const classMap = new Map<string, ClassRow>()

  if (classIds.length > 0) {
    const { data: classes, error: classesError } = await supabaseAdmin
      .from("classes")
      .select("id,name")
      .eq("school_id", schoolId)
      .in("id", classIds)

    if (classesError) {
      return NextResponse.json(
        { error: classesError.message },
        { status: 500 }
      )
    }

    ;((classes as ClassRow[] | null) ?? []).forEach((schoolClass) => {
      classMap.set(schoolClass.id, schoolClass)
    })
  }

  const history = paymentRows.map((payment) => {
    const student = students.get(payment.student_id)
    const fee = fees.get(payment.fee_id)
    const enrollment = enrollments.get(payment.student_id)
    const classId = enrollment?.class_id || student?.class_id || fee?.class_id || null

    return {
      id: payment.id,
      amount: Number(payment.amount ?? 0),
      paymentDate: payment.date || "",
      receiptNumber: payment.receipt_number || payment.id,
      studentName: student?.name || "Unknown Student",
      studentClass: classId ? classMap.get(classId)?.name || null : null,
      feeLabel: fee?.month || "Fee"
    }
  })

  return NextResponse.json(history)
}
