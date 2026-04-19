"use client"

import { useEffect, useState } from "react"
import { getActiveAcademicYear } from "@/lib/academic"
import { getSchoolId } from "@/lib/school"
import { supabase } from "@/lib/supabase"

type StudentFormProps = {
  reload?: () => void | Promise<void>
}

type SchoolClass = {
  id: string
  name: string
}

type AcademicYear = {
  id: string
}

export default function StudentForm({ reload }: StudentFormProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [roll, setRoll] = useState("")
  const [photo, setPhoto] = useState<File | null>(null)

  const [classes, setClasses] = useState<SchoolClass[]>([])
  const [selectedClass, setSelectedClass] = useState("")
  const [studentType, setStudentType] = useState("day_scholar")

  const [loading, setLoading] = useState(false)

  const [fatherName, setFatherName] = useState("")
  const [motherName, setMotherName] = useState("")
  const [parentEmail, setParentEmail] = useState("")
  const [parentPhone, setParentPhone] = useState("")

  const [schoolId, setSchoolId] = useState<string | null>(null)

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
          console.error("Class load error:", error)
          setClasses([])
          return
        }

        setClasses((data as SchoolClass[] | null) ?? [])
      })
  }, [schoolId])

  const generateStudentCode = async (currentSchoolId: string) => {
    const { count, error } = await supabase
      .from("students")
      .select("*", { count: "exact", head: true })
      .eq("school_id", currentSchoolId)

    if (error) {
      throw error
    }

    const next = (count || 0) + 1
    return `ST${String(next).padStart(2, "0")}`
  }

  const save = async () => {
    if (!name.trim() || !selectedClass || !studentType) {
      alert("Fill required fields")
      return
    }

    if (!schoolId) {
      alert("School not found")
      return
    }

    const trimmedRoll = roll.trim()
    const parsedRoll = trimmedRoll ? Number(trimmedRoll) : null

    if (trimmedRoll && Number.isNaN(parsedRoll)) {
      alert("Roll number must be numeric")
      return
    }

    setLoading(true)

    try {
      const activeYear = (await getActiveAcademicYear()) as AcademicYear | null

      if (!activeYear) {
        alert("No active academic year")
        return
      }

      let photoUrl = ""

      if (photo) {
        const fileName = `${Date.now()}-${photo.name}`

        const { error } = await supabase.storage
          .from("students")
          .upload(fileName, photo)

        if (error) {
          console.error(error)
          alert("Image upload failed")
          return
        }

        photoUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/students/${fileName}`
      }

      const studentId = crypto.randomUUID()
      const studentCode = await generateStudentCode(schoolId)

      const { error: studentError } = await supabase.from("students").insert({
        id: studentId,
        school_id: schoolId,
        name: name.trim(),
        email: email.trim() || null,
        photo: photoUrl || null,
        student_code: studentCode,
        class_id: selectedClass,
        roll_number: parsedRoll,
        student_type: studentType
      })

      if (studentError) {
        console.error("Student insert error:", studentError)
        alert(studentError.message)
        return
      }

      const { error: enrollError } = await supabase
        .from("student_enrollments")
        .insert({
          id: crypto.randomUUID(),
          student_id: studentId,
          class_id: selectedClass,
          school_id: schoolId,
          academic_year_id: activeYear.id,
          roll_number: parsedRoll
        })

      if (enrollError) {
        console.error("Enrollment error:", enrollError)
        alert(enrollError.message)
        return
      }

      if (fatherName || motherName || parentEmail || parentPhone) {
        const { error: parentError } = await supabase.from("parents").insert({
          id: crypto.randomUUID(),
          school_id: schoolId,
          student_id: studentId,
          name: fatherName.trim() || motherName.trim() || null,
          father_name: fatherName.trim() || null,
          mother_name: motherName.trim() || null,
          email: parentEmail.trim() || null,
          phone: parentPhone.trim() || null
        })

        if (parentError) {
          console.error("Parent error:", parentError)
        }
      }

      // ================= WELCOME NOTIFICATIONS =================
      if (parentEmail || parentPhone) {
        // Get school name
        const { data: school } = await supabase
          .from("schools")
          .select("name")
          .eq("id", schoolId)
          .single()

        const schoolName = school?.name || "Our School"

        const welcomeMessage = `
Welcome to ${schoolName}!

Dear Parent,

We are delighted to welcome your child ${name.trim()} to our school family.

Thank you for choosing ${schoolName}.

Best regards,
${schoolName} Team
        `.trim()

        // Send Email
        if (parentEmail) {
          try {
            await fetch("/api/send-email", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: parentEmail.trim(),
                subject: `Welcome to ${schoolName}`,
                message: welcomeMessage
              })
            })
          } catch (err) {
            console.error("Welcome email failed:", err)
          }
        }

        // Send WhatsApp
        if (parentPhone) {
          try {
            await fetch("/api/send-whatsapp", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                phone: parentPhone.trim(),
                message: `Welcome to ${schoolName}! 🎉

Dear Parent,

We are delighted to welcome your child ${name.trim()} to our school family.

Thank you for choosing ${schoolName}.

Best regards,
${schoolName} Team`
              })
            })
          } catch (err) {
            console.error("Welcome WhatsApp failed:", err)
          }
        }
      }

      setName("")
      setEmail("")
      setRoll("")
      setPhoto(null)
      setSelectedClass("")
      setStudentType("day_scholar")
      setFatherName("")
      setMotherName("")
      setParentEmail("")
      setParentPhone("")

      alert(`Student created (${studentCode})`)

      if (reload) {
        await reload()
      }

    } catch (error) {
      console.error("Student create error:", error)
      alert("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold">Student Details</h2>

        <div className="grid gap-4 md:grid-cols-2">
          <input
            placeholder="Student Name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="rounded-xl border border-white/10 bg-[#0b1220] px-4 py-3 text-white"
          />

          <input
            placeholder="Student Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="rounded-xl border border-white/10 bg-[#0b1220] px-4 py-3 text-white"
          />

          <input
            placeholder="Roll Number"
            value={roll}
            onChange={(event) => setRoll(event.target.value)}
            className="rounded-xl border border-white/10 bg-[#0b1220] px-4 py-3 text-white"
          />

          <input
            type="file"
            accept="image/png,image/jpeg"
            onChange={(event) => setPhoto(event.target.files?.[0] || null)}
            className="text-sm text-gray-300"
          />

          <select
            value={selectedClass}
            onChange={(event) => setSelectedClass(event.target.value)}
            className="rounded-xl border border-white/10 bg-[#0b1220] px-4 py-3 text-white"
          >
            <option value="">Select Class</option>
            {classes.map((schoolClass) => (
              <option key={schoolClass.id} value={schoolClass.id}>
                {schoolClass.name}
              </option>
            ))}
          </select>

          <select
            value={studentType}
            onChange={(event) => setStudentType(event.target.value)}
            className="rounded-xl border border-white/10 bg-[#0b1220] px-4 py-3 text-white"
          >
            <option value="day_scholar">Day Scholar</option>
            <option value="day_scholar_transport">Day Scholar + Transport</option>
            <option value="hosteler">Hosteler</option>
          </select>
        </div>
      </div>

      <div className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold">Parent Details</h2>

        <div className="grid gap-4 md:grid-cols-2">
          <input
            placeholder="Father Name"
            value={fatherName}
            onChange={(event) => setFatherName(event.target.value)}
            className="rounded-xl border border-white/10 bg-[#0b1220] px-4 py-3 text-white"
          />

          <input
            placeholder="Mother Name"
            value={motherName}
            onChange={(event) => setMotherName(event.target.value)}
            className="rounded-xl border border-white/10 bg-[#0b1220] px-4 py-3 text-white"
          />

          <input
            placeholder="Parent Email"
            value={parentEmail}
            onChange={(event) => setParentEmail(event.target.value)}
            className="rounded-xl border border-white/10 bg-[#0b1220] px-4 py-3 text-white"
          />

          <input
            placeholder="Parent Phone"
            value={parentPhone}
            onChange={(event) => setParentPhone(event.target.value)}
            className="rounded-xl border border-white/10 bg-[#0b1220] px-4 py-3 text-white"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={save}
          disabled={loading}
          className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-3 font-medium"
        >
          {loading ? "Saving..." : "Save Student"}
        </button>
      </div>
    </div>
  )
}
