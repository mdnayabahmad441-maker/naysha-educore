"use client"

import { useEffect, useState } from "react"
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

type EnrollmentQueryRow = {
  roll_number: number | null
  students:
    | {
        id: string
        name: string
        student_code: string | null
      }[]
    | {
        id: string
        name: string
        student_code: string | null
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

function getSingleRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null
  return Array.isArray(value) ? value[0] ?? null : value
}

type StudentRelation = {
    id: string
    name: string
    student_code: string | null
}

type ClassRelation = {
  name: string
}

async function fetchStudentsForSchool(schoolId: string): Promise<StudentListRow[]> {
  const year = await getActiveAcademicYear()

  if (!year?.id) {
    return []
  }

  const { data, error } = await supabase
    .from("student_enrollments")
    .select(
      `
        roll_number,
        students(id,name,student_code),
        classes(name)
      `
    )
    .eq("school_id", schoolId)
    .eq("academic_year_id", year.id)

  if (error) {
    throw error
  }

  const rows = ((data as EnrollmentQueryRow[] | null) ?? [])
    .map((row, index) => {
      const student = getSingleRelation<StudentRelation>(row.students)
      const schoolClass = getSingleRelation<ClassRelation>(row.classes)

      return {
      id: student?.id ?? `missing-${index}`,
      name: student?.name ?? "Unknown",
      roll_number: row.roll_number,
      class_name: schoolClass?.name ?? null,
      display_id:
        student?.student_code || `ST${String(index + 1).padStart(2, "0")}`
    }})
    .filter((row) => !row.id.startsWith("missing-"))

  return rows.sort((a, b) => {
    if (a.class_name === b.class_name) {
      return Number(a.roll_number || 0) - Number(b.roll_number || 0)
    }

    return (a.class_name || "").localeCompare(b.class_name || "")
  })
}

export default function StudentsPage() {
  const router = useRouter()

  const [students, setStudents] = useState<StudentListRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [role, setRole] = useState<string | null>(null)
  const [schoolId, setSchoolId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    void getUserRole().then((result) => setRole(result?.role || null))
  }, [])

  useEffect(() => {
    void getSchoolId().then(setSchoolId)
  }, [])

  useEffect(() => {
    if (!schoolId) return

    let cancelled = false

    setLoading(true)

    void fetchStudentsForSchool(schoolId)
      .then((rows) => {
        if (cancelled) return
        setStudents(rows)
      })
      .catch((error) => {
        console.error(error)
        if (cancelled) return
        setStudents([])
      })
      .finally(() => {
        if (cancelled) return
        setLoading(false)
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
    } catch (error) {
      console.error(error)
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

  const searchTerm = search.trim().toLowerCase()
  const filteredStudents = students.filter((student) => {
    if (!searchTerm) return true

    return (
      student.name.toLowerCase().includes(searchTerm) ||
      student.display_id.toLowerCase().includes(searchTerm) ||
      (student.class_name || "").toLowerCase().includes(searchTerm)
    )
  })

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 text-white md:p-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Students</h1>
          <p className="text-sm text-gray-400">
            {students.length} enrolled students
          </p>
        </div>

        {role === "admin" && (
          <button
            onClick={() => setShowForm((current) => !current)}
            className="rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 px-4 py-2 text-sm"
          >
            {showForm ? "Close" : "+ Add Student"}
          </button>
        )}
      </div>

      <input
        placeholder="Search..."
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        className="w-full rounded-lg border border-white/10 bg-[#0b1220] px-4 py-2 text-sm md:w-96"
      />

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

      <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0b1220]">
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
                <tr
                  key={student.id}
                  className="border-t border-white/5 hover:bg-white/5"
                >
                  <td className="p-4 font-medium text-gray-400">
                    {student.display_id}
                  </td>

                  <td className="p-4 font-medium">{student.name}</td>

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
