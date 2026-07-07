"use client"

import { useEffect, useMemo, useState } from "react"
import StudentForm from "@/components/students/StudentForm"
import { getUserRole } from "@/lib/getUserRole"
import { getSchoolId } from "@/lib/school"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

type StudentListRow = {
  id: string
  name: string
  roll_number: number | null
  class_name: string | null
  display_id: string
}

async function fetchStudentsForSchool(schoolId: string): Promise<StudentListRow[]> {
  const { data: year } = await supabase
    .from("academic_years")
    .select("id")
    .eq("school_id", schoolId)
    .eq("is_active", true)
    .maybeSingle()

  let enrollmentQuery = supabase
    .from("student_enrollments")
    .select("student_id, roll_number, students:student_id(id, name, student_code), classes:class_id(name)")
    .eq("school_id", schoolId)

  if (year?.id) enrollmentQuery = enrollmentQuery.eq("academic_year_id", year.id)

  const { data: enrollments, error: enrollmentError } = await enrollmentQuery

  if (enrollmentError) {
    console.error("Enrollment fetch error:", enrollmentError)
  }

  const enrolledRows: StudentListRow[] = ((enrollments || []) as any[])
    .filter((enrollment) => enrollment.students?.id)
    .map((enrollment, index) => ({
      id: enrollment.students.id,
      name: enrollment.students.name || "Unnamed Student",
      roll_number: enrollment.roll_number ?? null,
      class_name: enrollment.classes?.name || null,
      display_id: enrollment.students.student_code || `ST${String(index + 1).padStart(2, "0")}`,
    }))

  const enrolledIds = new Set(enrolledRows.map((row) => row.id))

  const { data: allStudents, error: studentsError } = await supabase
    .from("students")
    .select("id, name, student_code")
    .eq("school_id", schoolId)
    .order("name", { ascending: true })

  if (studentsError) {
    console.error("Students fetch error:", studentsError)
  }

  const unenrolledRows: StudentListRow[] = ((allStudents || []) as any[])
    .filter((student) => !enrolledIds.has(student.id))
    .map((student, index) => ({
      id: student.id,
      name: student.name || "Unnamed Student",
      roll_number: null,
      class_name: null,
      display_id: student.student_code || `ST${String(enrolledRows.length + index + 1).padStart(2, "0")}`,
    }))

  const rows = [...enrolledRows, ...unenrolledRows]

  return rows.sort((a, b) => {
    const classA = a.class_name || "zzzz"
    const classB = b.class_name || "zzzz"
    const classCompare = classA.localeCompare(classB)
    if (classCompare !== 0) return classCompare

    const rollA = a.roll_number ?? Number.MAX_SAFE_INTEGER
    const rollB = b.roll_number ?? Number.MAX_SAFE_INTEGER
    if (rollA !== rollB) return rollA - rollB

    return a.name.localeCompare(b.name)
  })
}

export default function StudentsPage() {
  const router = useRouter()

  const [students, setStudents] = useState<StudentListRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [classFilter, setClassFilter] = useState("")
  const [role, setRole] = useState<string | null>(null)
  const [schoolId, setSchoolId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    let cancelled = false

    Promise.all([getUserRole(), getSchoolId()]).then(([result, id]) => {
      if (cancelled) return
      setRole(result?.role || null)
      setSchoolId(id)
    })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!schoolId) return

    let cancelled = false
    setLoading(true)

    fetchStudentsForSchool(schoolId)
      .then((rows) => {
        if (!cancelled) setStudents(rows)
      })
      .catch((err) => {
        console.error(err)
        if (!cancelled) setStudents([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [schoolId])

  const reloadStudents = async () => {
    if (!schoolId) return
    setLoading(true)

    try {
      const rows = await fetchStudentsForSchool(schoolId)
      setStudents(rows)
    } catch (err) {
      console.error(err)
      setStudents([])
    } finally {
      setLoading(false)
    }
  }

  const handleView = (id: string) => {
    if (role === "teacher") {
      alert("Not allowed")
      return
    }
    router.push(`/admin/students/${id}`)
  }

  const classOptions = useMemo(
    () => [...new Set((students.map((student) => student.class_name).filter(Boolean) as string[]))],
    [students]
  )

  const searchTerm = search.toLowerCase()

  const filteredStudents = students.filter((student) => {
    if (classFilter && student.class_name !== classFilter) return false
    if (!searchTerm) return true

    return (
      student.name.toLowerCase().includes(searchTerm) ||
      student.display_id.toLowerCase().includes(searchTerm) ||
      (student.class_name || "").toLowerCase().includes(searchTerm)
    )
  })

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 text-white md:p-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Students</h1>
          <p className="text-sm text-gray-400">{students.length} students</p>
        </div>

        {role === "admin" && (
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => router.push("/admin/import")}
              className="rounded-lg bg-purple-600 px-4 py-2 text-sm hover:bg-purple-700"
            >
              Import Students
            </button>

            <button
              onClick={() => setShowForm((current) => !current)}
              className="rounded-lg bg-blue-500 px-4 py-2 text-sm"
            >
              {showForm ? "Close" : "+ Add Student"}
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center">
          <select
            value={classFilter}
            onChange={(event) => setClassFilter(event.target.value)}
            className="w-full max-w-sm rounded-lg border border-white/10 bg-[#0b1220] px-4 py-2 text-sm text-white"
          >
            <option value="">All Classes</option>
            {classOptions.map((className) => (
              <option key={className} value={className}>
                {className}
              </option>
            ))}
          </select>

          <input
            placeholder="Search by name, ID, or class..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded-lg border border-white/10 bg-[#0b1220] px-4 py-2 text-sm text-white"
          />
        </div>
      </div>

      {role === "admin" && showForm && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <StudentForm
            reload={async () => {
              await reloadStudents()
              setShowForm(false)
            }}
          />
        </div>
      )}

      <div className="space-y-3 md:hidden">
        {loading ? (
          <div className="rounded-[24px] border border-white/10 bg-[#0b1220] p-6 text-center text-gray-400">
            Loading...
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="rounded-[24px] border border-white/10 bg-[#0b1220] p-6 text-center text-gray-400">
            No students found.
          </div>
        ) : (
          filteredStudents.map((student) => (
            <div
              key={student.id}
              className="rounded-[24px] border border-white/10 bg-[#0b1220] p-4 shadow-[0_18px_48px_rgba(2,8,23,0.24)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{student.display_id}</p>
                  <h3 className="mt-2 text-lg font-semibold text-white">{student.name}</h3>
                </div>
                <button
                  onClick={() => handleView(student.id)}
                  className="rounded-xl bg-white/10 px-3 py-2 text-xs hover:bg-white/20"
                >
                  View
                </button>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl bg-white/5 px-3 py-3">
                  <p className="text-xs text-slate-400">Class</p>
                  <p className="mt-1 font-medium text-white">{student.class_name || "-"}</p>
                </div>
                <div className="rounded-2xl bg-white/5 px-3 py-3">
                  <p className="text-xs text-slate-400">Roll</p>
                  <p className="mt-1 font-medium text-white">{student.roll_number || "-"}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="hidden overflow-hidden rounded-xl border border-white/10 bg-[#0b1220] md:block">
        <table className="w-full text-sm">
          <thead className="border-b border-white/10 text-gray-400">
            <tr>
              <th className="p-4 text-left">ID</th>
              <th className="p-4 text-left">Name</th>
              <th className="p-4 text-left">Class</th>
              <th className="p-4 text-left">Roll</th>
              <th className="p-4 text-right">Action</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-gray-400">
                  Loading...
                </td>
              </tr>
            ) : (
              filteredStudents.map((student) => (
                <tr key={student.id} className="border-t border-white/5 hover:bg-white/5">
                  <td className="p-4 text-gray-400">{student.display_id}</td>
                  <td className="p-4">{student.name}</td>
                  <td className="p-4">{student.class_name || "-"}</td>
                  <td className="p-4">{student.roll_number || "-"}</td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleView(student.id)}
                      className="rounded-md bg-white/10 px-3 py-1 text-xs hover:bg-white/20"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
