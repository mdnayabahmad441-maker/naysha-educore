"use client"

import { useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabase"
import { getSchoolId } from "@/lib/school"

type Student = {
  id: string
  name: string
  student_code: string | null
  class_id: string | null
  roll_number: number | null
  photo: string | null
}

type SchoolClass = {
  id: string
  name: string
}

const templates = [
  {
    id: "classic",
    title: "Classic",
    description: "Clean card with photo, school logo area, and student details."
  },
  {
    id: "modern",
    title: "Modern",
    description: "Vertical card with bold accent color and layout for easy scanning."
  },
  {
    id: "minimal",
    title: "Minimal",
    description: "Simple badge-style card with compact details and clean typography."
  }
]

export default function StudentIdCardsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [classes, setClasses] = useState<SchoolClass[]>([])
  const [schoolId, setSchoolId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const [targetType, setTargetType] = useState<"all" | "class" | "students">("all")
  const [selectedClass, setSelectedClass] = useState("")
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState("classic")
  const [search, setSearch] = useState("")

  useEffect(() => {
    void getSchoolId().then(setSchoolId)
  }, [])

  useEffect(() => {
    if (!schoolId) return

    setLoading(true)
    const load = async () => {
      const [{ data: classData, error: classError }, { data: studentData, error: studentError }] = await Promise.all([
        supabase.from("classes").select("id,name").eq("school_id", schoolId),
        supabase
          .from("students")
          .select("id,name,student_code,class_id,roll_number,photo")
          .eq("school_id", schoolId)
          .order("name", { ascending: true })
      ])

      if (classError) {
        console.error("Class fetch error:", classError)
      } else {
        setClasses((classData as SchoolClass[] | null) ?? [])
      }

      if (studentError) {
        console.error("Student fetch error:", studentError)
        setStudents([])
      } else {
        setStudents((studentData as Student[] | null) ?? [])
      }

      setLoading(false)
    }

    void load()
  }, [schoolId])

  const classMap = useMemo(
    () => new Map(classes.map((cls) => [cls.id, cls.name])),
    [classes]
  )

  const filteredSelectionStudents = useMemo(() => {
    const searchTerm = search.toLowerCase()

    return students.filter((student) => {
      if (targetType === "class" && selectedClass) {
        if (student.class_id !== selectedClass) return false
      }

      if (searchTerm) {
        return (
          student.name.toLowerCase().includes(searchTerm) ||
          (student.student_code || "").toLowerCase().includes(searchTerm) ||
          (classMap.get(student.class_id || "") || "").toLowerCase().includes(searchTerm)
        )
      }

      return true
    })
  }, [students, targetType, selectedClass, search, classMap])

  const selectedStudents = useMemo(() => {
    if (targetType === "all") {
      return filteredSelectionStudents
    }

    if (targetType === "class") {
      return selectedClass
        ? filteredSelectionStudents
        : []
    }

    return students.filter((student) => selectedStudentIds.includes(student.id))
  }, [targetType, selectedClass, selectedStudentIds, filteredSelectionStudents, students])

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    )
  }

  const selectedCount = selectedStudents.length

  const printCards = () => {
    window.print()
  }

  return (
    <div className="space-y-6 text-white">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-page-break { page-break-after: always; }
        }
      `}</style>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Student ID Card Generator</h1>
          <p className="text-sm text-gray-400 mt-2 max-w-2xl">
            Create printable ID cards for the whole school, a class, or specific students. Choose one of three card models and print directly from the browser.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => {
              setTargetType("all")
              setSelectedClass("")
              setSelectedStudentIds([])
            }}
            className="no-print rounded-lg border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
            disabled={loading || students.length === 0}
          >
            Generate all cards{students.length > 0 ? ` (${students.length})` : ""}
          </button>

          <button
            onClick={printCards}
            className="no-print rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            disabled={selectedCount === 0}
          >
            Print {selectedCount > 0 ? `(${selectedCount})` : "Cards"}
          </button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(320px,420px)_1fr]">
        <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Select cards to generate</h2>
            <div className="space-y-3">
              <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3">
                <input
                  type="radio"
                  name="target"
                  checked={targetType === "all"}
                  onChange={() => setTargetType("all")}
                  className="h-4 w-4 accent-blue-500"
                />
                <div>
                  <div className="font-semibold">Entire school</div>
                  <p className="text-sm text-gray-400">Generate cards for all enrolled students.</p>
                </div>
              </label>

              <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3">
                <input
                  type="radio"
                  name="target"
                  checked={targetType === "class"}
                  onChange={() => setTargetType("class")}
                  className="h-4 w-4 accent-blue-500"
                />
                <div>
                  <div className="font-semibold">Specific class</div>
                  <p className="text-sm text-gray-400">Generate cards only for one selected class.</p>
                </div>
              </label>

              {targetType === "class" && (
                <select
                  value={selectedClass}
                  onChange={(event) => setSelectedClass(event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#0b1220] px-4 py-3 text-white"
                >
                  <option value="">Select class</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              )}

              <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3">
                <input
                  type="radio"
                  name="target"
                  checked={targetType === "students"}
                  onChange={() => setTargetType("students")}
                  className="h-4 w-4 accent-blue-500"
                />
                <div>
                  <div className="font-semibold">Specific students</div>
                  <p className="text-sm text-gray-400">Pick one or more students from the list.</p>
                </div>
              </label>

              {targetType === "students" && (
                <div className="space-y-3">
                  <input
                    placeholder="Search students..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#0b1220] px-4 py-3 text-white"
                  />
                  <div className="max-h-72 overflow-y-auto rounded-3xl border border-white/10 bg-[#0b1220]/80 p-3">
                    {filteredSelectionStudents.map((student) => (
                      <label key={student.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm">
                        <div>
                          <div className="font-medium">{student.name}</div>
                          <div className="text-gray-400">{student.student_code || "No ID"} • {classMap.get(student.class_id || "") || "No class"}</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={selectedStudentIds.includes(student.id)}
                          onChange={() => toggleStudentSelection(student.id)}
                          className="h-4 w-4 accent-blue-500"
                        />
                      </label>
                    ))}
                    {filteredSelectionStudents.length === 0 && (
                      <p className="text-sm text-gray-400">No students match this search.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Choose card model</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {templates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => setSelectedTemplate(template.id)}
                  className={`rounded-3xl border px-4 py-4 text-left transition-all ${selectedTemplate === template.id ? "border-blue-500 bg-blue-500/10" : "border-white/10 bg-white/5 hover:border-white/20"}`}
                >
                  <div className="font-semibold">{template.title}</div>
                  <p className="text-sm text-gray-400 mt-2">{template.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#0b1220] p-4 text-sm text-gray-300">
            <div className="font-semibold">Cards selected</div>
            <div className="mt-2">{selectedCount} student{selectedCount === 1 ? "" : "s"}</div>
            <div className="mt-3 text-xs text-gray-400">Use the Print button to produce a paged print layout.</div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-lg font-semibold">Print preview</h2>
            <p className="text-sm text-gray-400 mt-2">Preview of the selected template and students. Only selected cards will print.</p>
          </div>

          <div className="grid gap-4">
            {loading ? (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center text-gray-400">Loading students…</div>
            ) : selectedCount === 0 ? (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center text-gray-400">Choose a target and select students to generate cards.</div>
            ) : (
              <div className="grid gap-4 xl:grid-cols-2">
                {selectedStudents.map((student) => (
                  <StudentCard
                    key={student.id}
                    student={student}
                    studentClass={classMap.get(student.class_id || "") || "N/A"}
                    template={selectedTemplate}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StudentCard({ student, studentClass, template }: { student: Student; studentClass: string; template: string }) {
  const colors = {
    classic: "from-blue-600 to-cyan-500",
    modern: "from-fuchsia-500 to-violet-500",
    minimal: "from-emerald-500 to-teal-500"
  }

  if (template === "modern") {
    return (
      <div className="print-page-break rounded-3xl border border-white/10 bg-[#080e1b] p-6 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 overflow-hidden rounded-3xl bg-white/5">
            {student.photo ? (
              <img src={student.photo} alt={student.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-white/10 text-xs text-gray-400">Photo</div>
            )}
          </div>
          <div className="flex-1">
            <div className="text-xs uppercase tracking-[0.2em] text-gray-400">Student ID</div>
            <div className="text-xl font-semibold">{student.student_code || "N/A"}</div>
            <div className="text-sm text-gray-400">{className}</div>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-white/10 bg-linear-to-r bg-clip-padding p-4 text-white" style={{ backgroundImage: `linear-gradient(90deg, rgba(56,189,248,0.85), rgba(125,211,252,0.85))` }}>
          <div className="text-xs uppercase tracking-[0.2em]">{student.name}</div>
          <div className="mt-3 text-sm">Roll No: {student.roll_number ?? "—"}</div>
          <div className="mt-2 text-sm">Class: {className}</div>
        </div>

        <div className="mt-6 grid gap-2 rounded-3xl bg-white/5 p-4 text-sm text-gray-300">
          <div>School: NaySha EduCore</div>
          <div>Valid for current academic year</div>
        </div>
      </div>
    )
  }

  if (template === "minimal") {
    return (
      <div className="print-page-break rounded-3xl border border-white/10 bg-[#0b1220] p-6 shadow-lg">
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-gray-400">
          <span>NaySha EduCore</span>
          <span>ID Card</span>
        </div>
        <div className="mt-4 flex items-center gap-4">
          <div className="h-20 w-20 overflow-hidden rounded-3xl bg-white/5">
            {student.photo ? (
              <img src={student.photo} alt={student.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-white/10 text-xs text-gray-400">Photo</div>
            )}
          </div>
          <div>
            <div className="text-xl font-semibold">{student.name}</div>
            <div className="text-sm text-gray-400">{student.student_code || "N/A"}</div>
          </div>
        </div>
        <div className="mt-6 grid gap-2 text-sm text-gray-300">
          <div>Class: {className}</div>
          <div>Roll: {student.roll_number ?? "—"}</div>
          <div>Type: Student</div>
        </div>
      </div>
    )
  }

  return (
    <div className="print-page-break rounded-3xl border border-white/10 bg-[#0b1220] p-6 shadow-lg">
      <div className={`rounded-3xl bg-linear-to-r ${colors[template as keyof typeof colors] || colors.classic} bg-clip-padding p-4 text-white`}>
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 overflow-hidden rounded-3xl bg-white/10">
            {student.photo ? (
              <img src={student.photo} alt={student.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs">Photo</div>
            )}
          </div>
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-blue-100/80">ID Card</div>
            <div className="text-2xl font-semibold">{student.student_code || "N/A"}</div>
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-2 text-sm text-gray-300">
        <div className="font-semibold text-white">{student.name}</div>
        <div>Class: {className}</div>
        <div>Roll: {student.roll_number ?? "—"}</div>
        <div>Valid: Current year</div>
      </div>
    </div>
  )
}
