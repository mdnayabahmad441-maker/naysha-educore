"use client"

import { useEffect, useMemo, useState } from "react"
import StudentForm from "@/components/students/StudentForm"
import { getActiveAcademicYear } from "@/lib/academic"
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

// ================= FIXED FETCH =================

async function fetchStudentsForSchool(schoolId: string): Promise<StudentListRow[]> {
  const year = await getActiveAcademicYear()
  if (!year?.id) return []

  // 🔹 SINGLE QUERY: Get enrollments with joined student and class data
  const { data: enrollments, error } = await supabase
    .from("student_enrollments")
    .select(
      `
      roll_number,
      students: student_id (id, name, student_code),
      classes: class_id (name)
      `
    )
    .eq("school_id", schoolId)
    .eq("academic_year_id", year.id)

  if (error) {
    console.error("Enrollment fetch error:", error)
    return []
  }

  // 🔹 TRANSFORM DATA
  const rows = (enrollments || []).map((row: any, index: number) => {
    const student = row.students
    const cls = row.classes

    if (!student) return null

    return {
      id: student.id,
      name: student.name,
      roll_number: row.roll_number,
      class_name: cls?.name || null,
      display_id: student.student_code || `ST${String(index + 1).padStart(2, "0")}`
    }
  })

  const cleanRows = rows.filter(Boolean) as StudentListRow[]

  return cleanRows.sort((a, b) => {
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

// ================= PAGE =================

export default function StudentsPage() {
  const router = useRouter()

  const [students, setStudents] = useState<StudentListRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [classFilter, setClassFilter] = useState("")
  const [role, setRole] = useState<string | null>(null)
  const [schoolId, setSchoolId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  // 🔹 ROLE
  useEffect(() => {
    getUserRole().then((result) => setRole(result?.role || null))
  }, [])

  // 🔹 SCHOOL
  useEffect(() => {
    getSchoolId().then(setSchoolId)
  }, [])

  // 🔹 LOAD STUDENTS
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

  const filteredStudents = students.filter((s) => {
    if (classFilter && s.class_name !== classFilter) return false
    if (!searchTerm) return true

    return (
      s.name.toLowerCase().includes(searchTerm) ||
      s.display_id.toLowerCase().includes(searchTerm) ||
      (s.class_name || "").toLowerCase().includes(searchTerm)
    )
  })

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 text-white md:p-10">

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Students</h1>
          <p className="text-sm text-gray-400">
            {students.length} enrolled students
          </p>
        </div>

        {role === "admin" && (
  <div className="flex flex-col gap-3 sm:flex-row">

    {/* IMPORT BUTTON */}
    <button
      onClick={() => router.push("/admin/import")}
      className="rounded-lg bg-purple-600 px-4 py-2 text-sm hover:bg-purple-700"
    >
      Import Students
    </button>

    {/* EXISTING BUTTON */}
    <button
      onClick={() => setShowForm((c) => !c)}
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
            onChange={(e) => setClassFilter(e.target.value)}
            className="w-full max-w-sm rounded-lg border border-white/10 bg-[#0b1220] px-4 py-2 text-sm text-white"
          >
            <option value="">All Classes</option>
            {classOptions.map((className) => (
              <option key={className ?? "unknown"} value={className ?? ""}>
                {className}
              </option>
            ))}
          </select>

          <input
            placeholder="Search by name, ID, or class..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
          filteredStudents.map((s) => (
            <div key={s.id} className="rounded-[24px] border border-white/10 bg-[#0b1220] p-4 shadow-[0_18px_48px_rgba(2,8,23,0.24)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{s.display_id}</p>
                  <h3 className="mt-2 text-lg font-semibold text-white">{s.name}</h3>
                </div>
                <button
                  onClick={() => handleView(s.id)}
                  className="rounded-xl bg-white/10 px-3 py-2 text-xs hover:bg-white/20"
                >
                  View
                </button>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl bg-white/5 px-3 py-3">
                  <p className="text-xs text-slate-400">Class</p>
                  <p className="mt-1 font-medium text-white">{s.class_name || "-"}</p>
                </div>
                <div className="rounded-2xl bg-white/5 px-3 py-3">
                  <p className="text-xs text-slate-400">Roll</p>
                  <p className="mt-1 font-medium text-white">{s.roll_number || "-"}</p>
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
              filteredStudents.map((s) => (
                <tr key={s.id} className="border-t border-white/5 hover:bg-white/5">
                  <td className="p-4 text-gray-400">{s.display_id}</td>
                  <td className="p-4">{s.name}</td>
                  <td className="p-4">{s.class_name || "-"}</td>
                  <td className="p-4">{s.roll_number || "-"}</td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleView(s.id)}
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
