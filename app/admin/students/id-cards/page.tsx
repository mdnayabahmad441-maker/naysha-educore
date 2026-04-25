"use client"

import { useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabase"
import { getSchoolId } from "@/lib/school"
import { useSchool } from "@/context/SchoolContext"
import { getSettings } from "@/lib/settings"
import DocumentCanvas from "@/components/documents/DocumentCanvas"
import { normalizeDocumentLayout, type DocumentLayout } from "@/lib/document-layouts"

type Student = {
  id: string
  name: string
  student_code: string | null
  class_id: string | null
  roll_number: number | null
  photo: string | null
  father_name: string | null
  phone: string | null
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
  const [idCardLayout, setIdCardLayout] = useState(() => normalizeDocumentLayout("id_card", null))

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
      const [{ data: classData, error: classError }, { data: studentData, error: studentError }, templateUrl, layoutSetting] =
        await Promise.all([
          supabase.from("classes").select("id,name").eq("school_id", schoolId),
          supabase
            .from("students")
            .select("id,name,student_code,class_id,roll_number,photo")
            .eq("school_id", schoolId)
            .order("name", { ascending: true }),
          getSettings("id_card_template"),
          getSettings("id_card_layout")
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
        const studentRows = ((studentData as Student[]) ?? [])
        const studentIds = studentRows.map((student) => student.id)

        let parentMap = new Map<string, { father_name: string | null; phone: string | null }>()

        if (studentIds.length > 0) {
          const { data: parentData, error: parentError } = await supabase
            .from("parents")
            .select("student_id,father_name,phone")
            .in("student_id", studentIds)

          if (parentError) {
            console.error("Parent fetch error:", parentError)
          } else {
            parentMap = new Map(
              ((parentData as Array<{ student_id: string; father_name: string | null; phone: string | null }>) ?? []).map(
                (parent) => [
                  parent.student_id,
                  {
                    father_name: parent.father_name,
                    phone: parent.phone
                  }
                ]
              )
            )
          }
        }

        setStudents(
          studentRows.map((student) => ({
            ...student,
            father_name: parentMap.get(student.id)?.father_name ?? null,
            phone: parentMap.get(student.id)?.phone ?? null
          }))
        )
      }

      setIdCardTemplateUrl(typeof templateUrl === "string" ? templateUrl : "")
      setIdCardLayout(normalizeDocumentLayout("id_card", layoutSetting))
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
              <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center text-gray-400">Loading students...</div>
            ) : selectedCount === 0 ? (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center text-gray-400">
                Choose a target and select students to generate cards.
              </div>
            ) : (
              <div className="print-area grid grid-cols-[repeat(auto-fit,minmax(340px,340px))] justify-center gap-8 overflow-x-auto rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                {selectedStudents.map((student) => (
                  <div key={student.id} className="w-[340px] min-w-[340px]">
                    <StudentCard
                      layout={idCardLayout}
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
  layout,
  student,
  studentClass,
  schoolName,
  schoolLocation,
  schoolLogo,
  templateUrl
}: {
  layout: DocumentLayout
  student: Student
  studentClass: string
  schoolName: string
  schoolLocation: string
  schoolLogo: string | null
  templateUrl: string | null
}) {
  const values = {
    schoolName,
    schoolLocation,
    studentName: student.name,
    fatherName: student.father_name || "Father's Name",
    className: studentClass,
    studentCode: student.student_code || "Enrollment No.",
    studentPhone: student.phone || "Mobile Number",
    rollBadge: `Roll ${student.roll_number ?? "N/A"}`
  }

  return (
    <DocumentCanvas
      layout={layout}
      backgroundUrl={templateUrl || null}
      values={values}
      photoUrl={student.photo || schoolLogo || null}
      className="print-page-break mx-auto w-[340px]"
    />
  )
}
