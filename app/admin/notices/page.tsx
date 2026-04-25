"use client"

import { useEffect, useState } from "react"
import { sendNotification } from "@/lib/notifications"
import { getSchoolId } from "@/lib/school"
import { supabase } from "@/lib/supabase"
import { getActiveAcademicYear } from "@/lib/academic"
import { apiFetch } from "@/lib/api-client"
import { useSchool } from "@/context/SchoolContext"

type NoticeMode = "all" | "class" | "student"

type SchoolClass = {
  id: string
  name: string
}

type Student = {
  id: string
  name: string
}

type Notice = {
  id: string
  title: string
  message: string
  class_id: string | null
  created_at: string
}

type ParentContact = {
  student_id: string
  email: string | null
  phone: string | null
}

async function fetchNotices(schoolId: string): Promise<Notice[]> {
  const { data, error } = await supabase
    .from("notices")
    .select("id,title,message,class_id,created_at")
    .eq("school_id", schoolId)
    .order("created_at", { ascending: false })

  if (error) {
    throw error
  }

  return (data as Notice[] | null) ?? []
}

export default function NoticesPage() {
  const school = useSchool()
  const [schoolId, setSchoolId] = useState<string | null>(null)

  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [aiPrompt, setAiPrompt] = useState("")

  const [mode, setMode] = useState<NoticeMode>("all")
  const [selectedClass, setSelectedClass] = useState("")
  const [selectedStudent, setSelectedStudent] = useState("")

  const [classes, setClasses] = useState<SchoolClass[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [notices, setNotices] = useState<Notice[]>([])

  const [sending, setSending] = useState(false)
  const [drafting, setDrafting] = useState(false)

  useEffect(() => {
    void getSchoolId().then(setSchoolId)
  }, [])

  useEffect(() => {
    if (!schoolId) return

    void supabase
      .from("classes")
      .select("id,name")
      .eq("school_id", schoolId)
      .then(({ data, error }) => {
        if (error) {
          console.error("Failed to load classes:", error)
          setClasses([])
          return
        }

        setClasses((data as SchoolClass[] | null) ?? [])
      })
  }, [schoolId])

  useEffect(() => {
    if (!schoolId) return

    const load = async () => {
      if (mode === "class" && selectedClass) {
        const year = await getActiveAcademicYear()
        let enrollQuery = supabase
          .from("student_enrollments")
          .select("student_id, students:student_id(id, name)")
          .eq("class_id", selectedClass)
          .eq("school_id", schoolId)
        if(year) enrollQuery = enrollQuery.eq("academic_year_id", year.id)
        const { data, error } = await enrollQuery
        if(error) { console.error("Failed to load students:", error); setStudents([]); return }
        setStudents((data || []).map((e: any) => ({ id: e.student_id, name: e.students?.name ?? "Unknown" })))
      } else {
        const { data, error } = await supabase
          .from("students")
          .select("id,name")
          .eq("school_id", schoolId)
        if(error) { console.error("Failed to load students:", error); setStudents([]); return }
        setStudents((data as Student[] | null) ?? [])
      }
    }

    void load()
  }, [schoolId, selectedClass, mode])

  useEffect(() => {
    if (mode !== "class") {
      setSelectedClass("")
    }

    if (mode !== "student") {
      setSelectedStudent("")
    }
  }, [mode])

  useEffect(() => {
    if (!schoolId) return

    void fetchNotices(schoolId)
      .then(setNotices)
      .catch((error) => {
        console.error("Failed to load notices:", error)
        setNotices([])
      })
  }, [schoolId])

  const sendNotice = async () => {
    if (!title.trim() || !message.trim()) {
      alert("Enter title and message")
      return
    }

    if (!schoolId) {
      alert("School not loaded")
      return
    }

    if (mode === "class" && !selectedClass) {
      alert("Select a class")
      return
    }

    if (mode === "student" && !selectedStudent) {
      alert("Select a student")
      return
    }

    setSending(true)

    try {
      let targetStudents: Student[] = []

      if (mode === "all") {
        const { data, error } = await supabase
          .from("students")
          .select("id,name")
          .eq("school_id", schoolId)
        if(error) throw error
        targetStudents = (data as Student[] | null) ?? []
      } else if (mode === "class") {
        const year = await getActiveAcademicYear()
        let enrollQuery = supabase
          .from("student_enrollments")
          .select("student_id, students:student_id(id, name)")
          .eq("class_id", selectedClass)
          .eq("school_id", schoolId)
        if(year) enrollQuery = enrollQuery.eq("academic_year_id", year.id)
        const { data, error } = await enrollQuery
        if(error) throw error
        targetStudents = (data || []).map((e: any) => ({ id: e.student_id, name: e.students?.name ?? "Unknown" }))
      } else {
        const student = students.find((item) => item.id === selectedStudent)
        if (student) {
          targetStudents = [student]
        }
      }

      if (targetStudents.length === 0) {
        alert("No students found for the selected target")
        return
      }

      const { error: insertError } = await supabase.from("notices").insert({
        id: crypto.randomUUID(),
        school_id: schoolId,
        title: title.trim(),
        message: message.trim(),
        class_id: mode === "class" ? selectedClass : null
      })

      if (insertError) {
        throw insertError
      }

      const { data: parents, error: parentsError } = await supabase
        .from("parents")
        .select("student_id,email,phone")
        .in(
          "student_id",
          targetStudents.map((student) => student.id)
        )

      if (parentsError) {
        throw parentsError
      }

      const parentMap: Record<string, ParentContact> = {}
      ;(parents as ParentContact[] | null)?.forEach((parent) => {
        parentMap[parent.student_id] = parent
      })

      let successCount = 0

      for (const student of targetStudents) {
        const parent = parentMap[student.id]

        if (!parent) {
          console.log("No parent for student:", student.id)
          continue
        }

        await sendNotification({
          school_id: schoolId,
          student_id: student.id,
          title: title.trim(),
          message: message.trim(),
          type: "notice"
        })

        if (parent.email) {
          try {
            await apiFetch("/api/send-email", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: parent.email,
                subject: title.trim(),
                message: message.trim()
              })
            })
          } catch {
            console.log("Email failed:", parent.email)
          }
        }

        if (parent.phone) {
          try {
            console.log("Sending WhatsApp:", parent.phone)

            await apiFetch("/api/send-whatsapp", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                phone: String(parent.phone).trim(),
                message: `Notice: ${title.trim()}\n\n${message.trim()}`
              })
            })

            successCount++
          } catch {
            console.log("WhatsApp failed:", parent.phone)
          }
        }
      }

      alert(`Notice sent to ${successCount} parents`)

      setTitle("")
      setMessage("")
      setSelectedClass("")
      setSelectedStudent("")
      setMode("all")

      setNotices(await fetchNotices(schoolId))
    } catch (error) {
      console.error(error)
      alert("Error sending notice")
    } finally {
      setSending(false)
    }
  }

  const generateNoticeDraft = async () => {
    if (!schoolId) {
      alert("School not loaded")
      return
    }

    if (!aiPrompt.trim() && !title.trim()) {
      alert("Enter a notice topic first")
      return
    }

    try {
      setDrafting(true)

      const audience =
        mode === "all"
          ? "All students and parents"
          : mode === "class"
          ? `Class ${classes.find((item) => item.id === selectedClass)?.name || "selected class"}`
          : `Student ${students.find((item) => item.id === selectedStudent)?.name || "selected student"}`

      const response = await apiFetch("/api/ai/text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: "notice_draft",
          schoolId,
          schoolName: school?.name || "School",
          audience,
          topic: aiPrompt.trim() || title.trim(),
          details: message.trim()
        })
      })

      const result = await response.json()

      if (!response.ok || !result?.data) {
        throw new Error(result?.error || "Failed to draft notice")
      }

      setTitle(result.data.title)
      setMessage(result.data.message)
    } catch (error) {
      console.error(error)
      alert(error instanceof Error ? error.message : "Failed to draft notice")
    } finally {
      setDrafting(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6 text-white md:p-10">
      <h1 className="text-2xl font-semibold">Notices</h1>

      <div className="space-y-4 rounded-xl bg-white/10 p-6">
        <div className="rounded-xl border border-cyan-400/15 bg-cyan-500/5 p-4">
          <div className="flex flex-col gap-3 md:flex-row">
            <input
              placeholder="AI topic, for example: Fee reminder for April or Holiday notice for Eid"
              value={aiPrompt}
              onChange={(event) => setAiPrompt(event.target.value)}
              className="flex-1 rounded-xl bg-[#0b1220] p-3"
            />
            <button
              onClick={generateNoticeDraft}
              disabled={drafting}
              className="rounded-xl border border-cyan-400/20 bg-cyan-500/10 px-5 py-3 text-sm font-semibold text-cyan-100 hover:bg-cyan-500/20"
            >
              {drafting ? "Drafting..." : "AI Draft Notice"}
            </button>
          </div>
        </div>

        <input
          placeholder="Notice Title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="w-full rounded-xl bg-[#0b1220] p-3"
        />

        <textarea
          placeholder="Notice Message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          className="h-32 w-full rounded-xl bg-[#0b1220] p-3"
        />

        <select
          value={mode}
          onChange={(event) => setMode(event.target.value as NoticeMode)}
          className="w-full rounded-xl bg-[#0b1220] p-3"
        >
          <option value="all">All Students</option>
          <option value="class">Specific Class</option>
          <option value="student">Specific Student</option>
        </select>

        {mode === "class" && (
          <select
            value={selectedClass}
            onChange={(event) => setSelectedClass(event.target.value)}
            className="w-full rounded-xl bg-[#0b1220] p-3"
          >
            <option value="">Select Class</option>
            {classes.map((schoolClass) => (
              <option key={schoolClass.id} value={schoolClass.id}>
                {schoolClass.name}
              </option>
            ))}
          </select>
        )}

        {mode === "student" && (
          <select
            value={selectedStudent}
            onChange={(event) => setSelectedStudent(event.target.value)}
            className="w-full rounded-xl bg-[#0b1220] p-3"
          >
            <option value="">Select Student</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name}
              </option>
            ))}
          </select>
        )}

        <button
          onClick={sendNotice}
          disabled={sending}
          className="rounded-xl border border-white/10 bg-white/10 px-6 py-3 hover:bg-white/20"
        >
          {sending ? "Sending..." : "Send Notice"}
        </button>
      </div>

      <div className="space-y-4 rounded-xl bg-white/10 p-6">
        <h2 className="text-lg font-semibold">Recent Notices</h2>

        {notices.map((notice) => (
          <div key={notice.id} className="rounded-xl bg-white/5 p-4">
            <h3 className="font-semibold">{notice.title}</h3>
            <p className="mt-1 text-sm text-gray-300">{notice.message}</p>

            <p className="mt-2 text-xs text-blue-400">
              {notice.class_id ? "Class Notice" : "All Students"}
            </p>

            <p className="mt-1 text-xs text-gray-500">
              {new Date(notice.created_at).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
