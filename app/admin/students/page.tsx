"use client"

import { useEffect, useState } from "react"
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

const PAGE_SIZE = 50

async function fetchStudentsForSchool({
  schoolId,
  page = 1,
  pageSize = PAGE_SIZE,
  search = "",
  className = "",
}: {
  schoolId: string
  page?: number
  pageSize?: number
  search?: string
  className?: string
}): Promise<{ rows: StudentListRow[]; totalCount: number }> {
  const { data: year } = await supabase
    .from("academic_years")
    .select("id")
    .eq("school_id", schoolId)
    .eq("is_active", true)
    .maybeSingle()

  let studentQuery = supabase
    .from("students")
    .select("id, name, student_code", { count: "exact" })
    .eq("school_id", schoolId)
    .order("name", { ascending: true })

  const trimmedSearch = search.trim()
  if (trimmedSearch) {
    studentQuery = studentQuery.or(`name.ilike.%${trimmedSearch}%,student_code.ilike.%${trimmedSearch}%`)
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  studentQuery = studentQuery.range(from, to)

  const { data: allStudents, error: studentsError, count } = await studentQuery

  if (studentsError) {
    console.error("Students fetch error:", studentsError)
    return { rows: [], totalCount: 0 }
  }

  const studentList = allStudents || []
  const totalCount = count ?? studentList.length

  if (studentList.length === 0) {
    return { rows: [], totalCount }
  }

  const studentIds = studentList.map((s) => s.id)
  let enrollmentQuery = supabase
    .from("student_enrollments")
    .select("student_id, roll_number, classes:class_id(name)")
    .in("student_id", studentIds)
    .eq("school_id", schoolId)

  if (year?.id) {
    enrollmentQuery = enrollmentQuery.eq("academic_year_id", year.id)
  }

  const { data: enrollments, error: enrollmentError } = await enrollmentQuery
  if (enrollmentError) {
    console.error("Enrollment fetch error:", enrollmentError)
  }

  const enrollmentMap = new Map<string, { roll_number: number | null; class_name: string | null }>()
  ;((enrollments || []) as any[]).forEach((enr) => {
    enrollmentMap.set(enr.student_id, {
      roll_number: enr.roll_number ?? null,
      class_name: enr.classes?.name || null,
    })
  })

  let rows: StudentListRow[] = studentList.map((student, idx) => {
    const enr = enrollmentMap.get(student.id)
    return {
      id: student.id,
      name: student.name || "Unnamed Student",
      roll_number: enr?.roll_number ?? null,
      class_name: enr?.class_name ?? null,
      display_id: student.student_code || `ST${String(from + idx + 1).padStart(2, "0")}`,
    }
  })

  if (className) {
    rows = rows.filter((r) => r.class_name === className)
  }

  return { rows, totalCount }
}

export default function StudentsPage() {
  const router = useRouter()

  const [students, setStudents] = useState<StudentListRow[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [classFilter, setClassFilter] = useState("")
  const [availableClasses, setAvailableClasses] = useState<string[]>([])
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
    supabase
      .from("classes")
      .select("name")
      .eq("school_id", schoolId)
      .order("name", { ascending: true })
      .then(({ data }) => {
        if (data) {
          setAvailableClasses(data.map((c) => c.name).filter(Boolean))
        }
      })
  }, [schoolId])

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setPage(1)
  }, [search, classFilter])

  useEffect(() => {
    if (!schoolId) return

    let cancelled = false
    setLoading(true)

    fetchStudentsForSchool({
      schoolId,
      page,
      pageSize: PAGE_SIZE,
      search,
      className: classFilter,
    })
      .then(({ rows, totalCount: total }) => {
        if (!cancelled) {
          setStudents(rows)
          setTotalCount(total)
        }
      })
      .catch((err) => {
        console.error(err)
        if (!cancelled) {
          setStudents([])
          setTotalCount(0)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [schoolId, page, search, classFilter])

  const reloadStudents = async () => {
    if (!schoolId) return
    setLoading(true)

    try {
      const { rows, totalCount: total } = await fetchStudentsForSchool({
        schoolId,
        page,
        pageSize: PAGE_SIZE,
        search,
        className: classFilter,
      })
      setStudents(rows)
      setTotalCount(total)
    } catch (err) {
      console.error(err)
      setStudents([])
      setTotalCount(0)
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

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 text-white md:p-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Students</h1>
          <p className="text-sm text-gray-400">
            {totalCount} total students {students.length > 0 && `(showing page ${page} of ${totalPages})`}
          </p>
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
            {availableClasses.map((className) => (
              <option key={className} value={className}>
                {className}
              </option>
            ))}
          </select>

          <input
            placeholder="Search by name or student ID..."
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

      {/* Mobile Card List */}
      <div className="space-y-3 md:hidden">
        {loading ? (
          <div className="rounded-[24px] border border-white/10 bg-[#0b1220] p-6 text-center text-gray-400">
            Loading...
          </div>
        ) : students.length === 0 ? (
          <div className="rounded-[24px] border border-white/10 bg-[#0b1220] p-6 text-center text-gray-400">
            No students found.
          </div>
        ) : (
          students.map((student) => (
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

      {/* Desktop Table */}
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
            ) : students.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-gray-400">
                  No students found.
                </td>
              </tr>
            ) : (
              students.map((student) => (
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

      {/* Server-Side Pagination Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-3 text-sm text-gray-400">
        <p>
          Showing {students.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1} to{" "}
          {Math.min(page * PAGE_SIZE, totalCount)} of {totalCount} students
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || loading}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="px-2 text-xs">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => (page < totalPages ? p + 1 : p))}
            disabled={page >= totalPages || loading}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
