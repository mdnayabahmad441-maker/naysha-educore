"use client"

import { useEffect, useState } from "react"
import { getActiveAcademicYear } from "@/lib/academic"
import { getUserRole } from "@/lib/getUserRole"
import { getSchoolId } from "@/lib/school"
import { supabase } from "@/lib/supabase"
import { useParams, useRouter } from "next/navigation"

type EditFormState = {
  name: string
  email: string
  roll: string
  class_id: string
  parentEmail: string
  parentPhone: string
  father_name: string
  mother_name: string
}

type SchoolClass = {
  id: string
  name: string
}

type StudentRecord = {
  name: string
  email: string | null
  roll_number: number | null
  class_id: string | null
}

type ParentRecord = {
  id: string
  email: string | null
  phone: string | null
  father_name: string | null
  mother_name: string | null
}

type EnrollmentRecord = {
  id: string
  roll_number: number | null
  class_id: string | null
}

const EMPTY_FORM: EditFormState = {
  name: "",
  email: "",
  roll: "",
  class_id: "",
  parentEmail: "",
  parentPhone: "",
  father_name: "",
  mother_name: ""
}

export default function EditStudentPage() {
  const params = useParams()
  const id = Array.isArray(params.id) ? params.id[0] : params.id

  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState<EditFormState>(EMPTY_FORM)

  const [classes, setClasses] = useState<SchoolClass[]>([])
  const [parentId, setParentId] = useState<string | null>(null)
  const [enrollmentId, setEnrollmentId] = useState<string | null>(null)

  useEffect(() => {
    const check = async () => {
      const role = await getUserRole()

      if (role?.role !== "admin") {
        router.replace("/unauthorized")
      }
    }

    void check()
  }, [router])

  useEffect(() => {
    if (!id) return

    let cancelled = false

    const load = async () => {
      setLoading(true)

      try {
        const [schoolId, activeYear] = await Promise.all([
          getSchoolId(),
          getActiveAcademicYear()
        ])

        if (!schoolId) {
          throw new Error("School not found")
        }

        let enrollmentQuery = supabase
          .from("student_enrollments")
          .select("id,roll_number,class_id")
          .eq("student_id", id)
          .eq("school_id", schoolId)

        if (activeYear?.id) {
          enrollmentQuery = enrollmentQuery.eq("academic_year_id", activeYear.id)
        }

        const [studentRes, parentRes, classRes, enrollmentRes] = await Promise.all([
          supabase
            .from("students")
            .select("name,email,roll_number,class_id")
            .eq("id", id)
            .single(),

          supabase
            .from("parents")
            .select("id,email,phone,father_name,mother_name")
            .eq("student_id", id)
            .maybeSingle(),

          supabase
            .from("classes")
            .select("id,name")
            .eq("school_id", schoolId),

          enrollmentQuery.maybeSingle()
        ])

        if (studentRes.error) {
          throw studentRes.error
        }

        if (!cancelled) {
          const student = studentRes.data as StudentRecord
          const parent = (parentRes.data as ParentRecord | null) ?? null
          const enrollment = (enrollmentRes.data as EnrollmentRecord | null) ?? null

          setClasses((classRes.data as SchoolClass[] | null) ?? [])
          setParentId(parent?.id ?? null)
          setEnrollmentId(enrollment?.id ?? null)
          setForm({
            name: student.name || "",
            email: student.email || "",
            roll: String(enrollment?.roll_number ?? student.roll_number ?? ""),
            class_id: enrollment?.class_id || student.class_id || "",
            parentEmail: parent?.email || "",
            parentPhone: parent?.phone || "",
            father_name: parent?.father_name || "",
            mother_name: parent?.mother_name || ""
          })
        }
      } catch (error) {
        console.error("Load error:", error)
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [id])

  const updateField = <K extends keyof EditFormState>(
    key: K,
    value: EditFormState[K]
  ) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const save = async () => {
    if (!id) return

    if (!form.name.trim()) {
      alert("Student name required")
      return
    }

    if (!form.class_id) {
      alert("Select class")
      return
    }

    const trimmedRoll = form.roll.trim()
    const parsedRoll = trimmedRoll ? Number(trimmedRoll) : null

    if (trimmedRoll && Number.isNaN(parsedRoll)) {
      alert("Roll number must be numeric")
      return
    }

    setLoading(true)

    try {
      const [schoolId, activeYear] = await Promise.all([
        getSchoolId(),
        getActiveAcademicYear()
      ])

      if (!schoolId) {
        alert("School not found")
        return
      }

      if (!activeYear?.id) {
        alert("No active academic year")
        return
      }

      const { error: studentError } = await supabase
        .from("students")
        .update({
          name: form.name.trim(),
          email: form.email.trim() || null,
          class_id: form.class_id,
          roll_number: parsedRoll
        })
        .eq("id", id)
        .eq("school_id", schoolId)

      if (studentError) {
        throw studentError
      }

      const enrollmentPayload = {
        student_id: id,
        school_id: schoolId,
        academic_year_id: activeYear.id,
        class_id: form.class_id,
        roll_number: parsedRoll
      }

      if (enrollmentId) {
        const { error } = await supabase
          .from("student_enrollments")
          .update(enrollmentPayload)
          .eq("id", enrollmentId)
          .eq("school_id", schoolId)

        if (error) {
          throw error
        }
      } else {
        const { data, error } = await supabase
          .from("student_enrollments")
          .insert({
            id: crypto.randomUUID(),
            ...enrollmentPayload
          })
          .select("id")
          .single()

        if (error) {
          throw error
        }

        setEnrollmentId(data?.id ?? null)
      }

      const parentPayload = {
        student_id: id,
        school_id: schoolId,
        name: form.father_name.trim() || form.mother_name.trim() || null,
        email: form.parentEmail.trim() || null,
        phone: form.parentPhone.trim() || null,
        father_name: form.father_name.trim() || null,
        mother_name: form.mother_name.trim() || null
      }

      if (parentId) {
        const { error } = await supabase
          .from("parents")
          .update(parentPayload)
          .eq("id", parentId)
          .eq("school_id", schoolId)

        if (error) {
          throw error
        }
      } else {
        const { data, error } = await supabase
          .from("parents")
          .insert({
            id: crypto.randomUUID(),
            ...parentPayload
          })
          .select("id")
          .single()

        if (error) {
          throw error
        }

        setParentId(data?.id ?? null)
      }

      alert("Updated successfully")
      router.push(`/admin/students/${id}`)
    } catch (error) {
      console.error(error)

      if (error instanceof Error) {
        alert(error.message)
      } else {
        alert("Failed to update student")
      }
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="p-10 text-white">Loading...</div>
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6 text-white md:p-10">
      <h1 className="text-2xl font-semibold">Edit Student</h1>

      <div className="space-y-4 rounded-xl border border-white/10 bg-white/10 p-6">
        <input
          value={form.name}
          onChange={(event) => updateField("name", event.target.value)}
          placeholder="Student Name"
          className="w-full rounded bg-[#0b1220] p-3"
        />

        <input
          value={form.email}
          onChange={(event) => updateField("email", event.target.value)}
          placeholder="Student Email"
          className="w-full rounded bg-[#0b1220] p-3"
        />

        <input
          value={form.roll}
          onChange={(event) => updateField("roll", event.target.value)}
          placeholder="Roll Number"
          className="w-full rounded bg-[#0b1220] p-3"
        />

        <select
          value={form.class_id}
          onChange={(event) => updateField("class_id", event.target.value)}
          className="w-full rounded bg-[#0b1220] p-3"
        >
          <option value="">Select Class</option>
          {classes.map((schoolClass) => (
            <option key={schoolClass.id} value={schoolClass.id}>
              {schoolClass.name}
            </option>
          ))}
        </select>

        <input
          value={form.father_name}
          onChange={(event) => updateField("father_name", event.target.value)}
          placeholder="Father Name"
          className="w-full rounded bg-[#0b1220] p-3"
        />

        <input
          value={form.mother_name}
          onChange={(event) => updateField("mother_name", event.target.value)}
          placeholder="Mother Name"
          className="w-full rounded bg-[#0b1220] p-3"
        />

        <input
          value={form.parentEmail}
          onChange={(event) => updateField("parentEmail", event.target.value)}
          placeholder="Parent Email"
          className="w-full rounded bg-[#0b1220] p-3"
        />

        <input
          value={form.parentPhone}
          onChange={(event) => updateField("parentPhone", event.target.value)}
          placeholder="Parent Phone"
          className="w-full rounded bg-[#0b1220] p-3"
        />

        <div className="flex gap-3 pt-4">
          <button
            onClick={save}
            className="rounded bg-green-600 px-6 py-3 hover:bg-green-700"
          >
            Save Changes
          </button>

          <button
            onClick={() => router.push(`/admin/students/${id}`)}
            className="rounded bg-white/10 px-6 py-3"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
