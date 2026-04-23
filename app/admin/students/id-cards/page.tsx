"use client"

import { useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabase"
import { getSchoolId } from "@/lib/school"
import { useSchool } from "@/context/SchoolContext"
import { getSettings } from "@/lib/settings"

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

export default function StudentIdCardsPage() {
  const school = useSchool()
  const [students, setStudents] = useState<Student[]>([])
  const [classes, setClasses] = useState<SchoolClass[]>([])
  const [schoolId, setSchoolId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [idCardTemplateUrl, setIdCardTemplateUrl] = useState("")

  const schoolName = school?.name || "School"
  const schoolLocation = school?.address || school?.subdomain || ""
  const schoolLogo = school?.logo_url || null

  const [targetType, setTargetType] = useState<"all" | "class" | "students">("all")
  const [selectedClass, setSelectedClass] = useState("")
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([])
  const [search, setSearch] = useState("")

  useEffect(() => {
    void getSchoolId().then(setSchoolId)
  }, [])

  useEffect(() => {
    if (!schoolId) return

    setLoading(true)
    const load = async () => {
      const [{ data: classData, error: classError }, { data: studentData, error: studentError }, templateUrl] =
        await Promise.all([
          supabase.from("classes").select("id,name").eq("school_id", schoolId),
          supabase
            .from("students")
            .select("id,name,student_code,class_id,roll_number,photo")
            .eq("school_id", schoolId)
            .order("name", { ascending: true }),
          getSettings("id_card_template")
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

      setIdCardTemplateUrl(typeof templateUrl === "string" ? templateUrl : "")
      setLoading(false)
    }

    void load()
  }, [schoolId])

  const classMap = useMemo(() => new Map(classes.map((cls) => [cls.id, cls.name])), [classes])

  const filteredSelectionStudents = useMemo(() => {
    const searchTerm = search.toLowerCase()

    return students.filter((student) => {
      if (targetType === "class" && selectedClass && student.class_id !== selectedClass) {
        return false
      }

      if (!searchTerm) {
        return true
      }

      return (
        student.name.toLowerCase().includes(searchTerm) ||
        (student.student_code || "").toLowerCase().includes(searchTerm) ||
        (classMap.get(student.class_id || "") || "").toLowerCase().includes(searchTerm)
      )
    })
  }, [students, targetType, selectedClass, search, classMap])

  const selectedStudents = useMemo(() => {
    if (targetType === "all") return filteredSelectionStudents
    if (targetType === "class") return selectedClass ? filteredSelectionStudents : []
    return students.filter((student) => selectedStudentIds.includes(student.id))
  }, [targetType, selectedClass, selectedStudentIds, filteredSelectionStudents, students])

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    )
  }

  const selectedCount = selectedStudents.length

  return (
    <div className="space-y-6 text-white">
      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact; color-adjust: exact; }
          body * { visibility: hidden !important; }
          .print-area, .print-area * { visibility: visible !important; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
          .print-page-break { page-break-after: always; break-after: page; page-break-inside: avoid; break-inside: avoid; }
          .print-page-break:last-child { page-break-after: auto; break-after: auto; }
        }
      `}</style>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Student ID Card Generator</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-400">
            Generate cards using your school&apos;s uploaded ID card template from Settings.
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
            onClick={() => window.print()}
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
                  onChange={() => {
                    setTargetType("all")
                    setSelectedClass("")
                    setSelectedStudentIds([])
                    setSearch("")
                  }}
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
                  onChange={() => {
                    setTargetType("class")
                    setSelectedStudentIds([])
                    setSearch("")
                  }}
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
                  onChange={() => {
                    setTargetType("students")
                    setSelectedClass("")
                  }}
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
                      <label
                        key={student.id}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm"
                      >
                        <div>
                          <div className="font-medium">{student.name}</div>
                          <div className="text-gray-400">
                            {student.student_code || "No ID"} • {classMap.get(student.class_id || "") || "No class"}
                          </div>
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

          <div className="rounded-3xl border border-white/10 bg-[#0b1220] p-4 text-sm text-gray-300">
            <div className="font-semibold">Template status</div>
            <div className="mt-2">
              {idCardTemplateUrl
                ? "Your uploaded school ID card template will be used."
                : "No custom ID card template uploaded yet. A default layout will be used until you upload one in Settings."}
            </div>
            <div className="mt-3 text-xs text-gray-400">Cards selected: {selectedCount}</div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-lg font-semibold">Print preview</h2>
            <p className="mt-2 text-sm text-gray-400">
              Preview of the cards using your school template. Only selected cards will print.
            </p>
          </div>

          <div className="grid gap-4">
            {loading ? (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center text-gray-400">Loading students…</div>
            ) : selectedCount === 0 ? (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center text-gray-400">
                Choose a target and select students to generate cards.
              </div>
            ) : (
              <div className={`print-area grid gap-6 justify-items-start ${selectedStudents.length > 1 ? "xl:grid-cols-2" : ""}`}>
                {selectedStudents.map((student) => (
                  <div key={student.id} className="w-full max-w-full">
                    <StudentCard
                      student={student}
                      studentClass={classMap.get(student.class_id || "") || "N/A"}
                      schoolName={schoolName}
                      schoolLocation={schoolLocation}
                      schoolLogo={schoolLogo}
                      templateUrl={idCardTemplateUrl || null}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StudentCard({
  student,
  studentClass,
  schoolName,
  schoolLocation,
  schoolLogo,
  templateUrl
}: {
  student: Student
  studentClass: string
  schoolName: string
  schoolLocation: string
  schoolLogo: string | null
  templateUrl: string | null
}) {
  return (
    <div className="print-page-break relative mx-auto h-[540px] w-[340px] overflow-hidden rounded-[32px] border border-white/10 bg-[#0f172a] text-white shadow-[0_20px_40px_rgba(0,0,0,0.25)]">
      {templateUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={templateUrl} alt="ID card template" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#0f4c81_0%,#10243f_45%,#0f172a_100%)]" />
      )}

      <div className="absolute inset-0 bg-black/25" />

      <div className="relative flex h-full flex-col justify-between p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="max-w-[72%]">
            <div className="text-xs uppercase tracking-[0.35em] text-white/80">Student Identity Card</div>
            <div className="mt-2 text-xl font-bold leading-tight">{schoolName}</div>
            {schoolLocation ? <div className="mt-1 text-sm text-white/85">{schoolLocation}</div> : null}
          </div>

          <div className="h-16 w-16 overflow-hidden rounded-full border border-white/30 bg-white/10">
            {schoolLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={schoolLogo} alt={schoolName} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs uppercase tracking-[0.2em] text-white/70">
                Logo
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center gap-5 py-5">
          <div className="h-44 w-36 overflow-hidden rounded-[24px] border border-white/30 bg-white/10">
            {student.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={student.photo} alt={student.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs font-semibold uppercase tracking-[0.25em] text-white/70">
                Photo
              </div>
            )}
          </div>

          <div className="w-full rounded-[24px] border border-white/20 bg-black/25 p-4 text-center backdrop-blur-[2px]">
            <div className="text-2xl font-bold uppercase tracking-[0.04em]">{student.name}</div>
            <div className="mt-4 grid gap-2 text-sm text-white/90">
              <div>ID: <span className="font-semibold">{student.student_code || "N/A"}</span></div>
              <div>Class: <span className="font-semibold">{studentClass}</span></div>
              <div>Roll No: <span className="font-semibold">{student.roll_number ?? "—"}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
