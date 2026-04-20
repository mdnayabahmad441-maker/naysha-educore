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
  const [aadharCard, setAadharCard] = useState<File | null>(null)
  const [tcDocument, setTcDocument] = useState<File | null>(null)
  const [otherCertificates, setOtherCertificates] = useState<File[]>([])

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

  const generateStudentCode = async () => {
    // Use timestamp-based code to avoid race conditions
    // Format: STYYMMDDHHMMSS (unique per second)
    const now = new Date()
    const year = String(now.getFullYear()).slice(-2)
    const month = String(now.getMonth() + 1).padStart(2, "0")
    const date = String(now.getDate()).padStart(2, "0")
    const hours = String(now.getHours()).padStart(2, "0")
    const minutes = String(now.getMinutes()).padStart(2, "0")
    const seconds = String(now.getSeconds()).padStart(2, "0")
    return `ST${year}${month}${date}${hours}${minutes}${seconds}`
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
        setLoading(false)
        return
      }

      const studentId = crypto.randomUUID()
      const studentCode = await generateStudentCode()

      // ✅ CREATE STUDENT IMMEDIATELY (no files yet)
      const { error: studentError } = await supabase.from("students").insert({
        id: studentId,
        school_id: schoolId,
        name: name.trim(),
        email: email.trim() || null,
        photo: null,
        aadhar_card: null,
        tc_document: null,
        certificates: null,
        student_code: studentCode,
        class_id: selectedClass,
        roll_number: parsedRoll,
        student_type: studentType
      })

      if (studentError) {
        console.error("Student insert error:", studentError)
        setLoading(false)
        alert(studentError.message)
        return
      }

      // ✅ CREATE ENROLLMENT
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
      }

      // ✅ CREATE PARENT RECORD
      if (fatherName || motherName || parentEmail || parentPhone) {
        const { error: parentError } = await supabase.from("parents").insert({
          id: crypto.randomUUID(),
          school_id: schoolId,
          student_id: studentId,
          father_name: fatherName.trim() || null,
          mother_name: motherName.trim() || null,
          email: parentEmail.trim() || null,
          phone: parentPhone.trim() || null
        })

        if (parentError) {
          console.error("Parent error:", parentError)
        }
      }

      // ✅ RESET FORM IMMEDIATELY
      setName("")
      setEmail("")
      setRoll("")
      setPhoto(null)
      setAadharCard(null)
      setTcDocument(null)
      setOtherCertificates([])
      setSelectedClass("")
      setStudentType("day_scholar")
      setFatherName("")
      setMotherName("")
      setParentEmail("")
      setParentPhone("")

      setLoading(false)
      alert(`Student created (${studentCode})`)

      // ✅ BACKGROUND TASKS (fire and forget)
      // File uploads
      const uploadStudentFile = async (file: File, prefix: string) => {
        const fileName = `${prefix}-${Date.now()}-${file.name}`
        const { error } = await supabase.storage
          .from("students")
          .upload(fileName, file)

        if (error) {
          console.error("File upload error:", error)
          return null
        }

        return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/students/${fileName}`
      }

      const uploadFiles = async () => {
        let photoUrl = null
        let aadharCardUrl = null
        let tcUrl = null
        let certificatesUrls: (string | null)[] = []

        if (photo) {
          photoUrl = await uploadStudentFile(photo, `${studentCode}-photo`)
        }

        if (aadharCard) {
          aadharCardUrl = await uploadStudentFile(aadharCard, `${studentCode}-aadhar`)
        }

        if (tcDocument) {
          tcUrl = await uploadStudentFile(tcDocument, `${studentCode}-tc`)
        }

        if (otherCertificates.length) {
          certificatesUrls = await Promise.all(
            otherCertificates.map((file, index) =>
              uploadStudentFile(file, `${studentCode}-certificate-${index + 1}`)
            )
          )
        }

        // Update student with file URLs
        if (photoUrl || aadharCardUrl || tcUrl || certificatesUrls.some((u) => u)) {
          await supabase
            .from("students")
            .update({
              photo: photoUrl,
              aadhar_card: aadharCardUrl,
              tc_document: tcUrl,
              certificates: certificatesUrls.filter((u) => u).length ? certificatesUrls.filter((u) => u) : null
            })
            .eq("id", studentId)
        }
      }

      // Send notifications
      const sendNotifications = async () => {
        if (parentEmail || parentPhone) {
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
      }

      // Execute background tasks without awaiting
      void uploadFiles()
      void sendNotifications()

      if (reload) {
        await reload()
      }

    } catch (error) {
      console.error("Student create error:", error)
      setLoading(false)
      alert("Something went wrong")
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

          <label className="block text-sm text-gray-300">
            Student Photo
            <input
              type="file"
              accept="image/png,image/jpeg"
              onChange={(event) => setPhoto(event.target.files?.[0] || null)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-[#0b1220] px-4 py-3 text-white"
            />
          </label>

          <label className="block text-sm text-gray-300">
            Aadhar Card
            <input
              type="file"
              accept="image/png,image/jpeg,application/pdf"
              onChange={(event) => setAadharCard(event.target.files?.[0] || null)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-[#0b1220] px-4 py-3 text-white"
            />
          </label>

          <label className="block text-sm text-gray-300">
            Transfer Certificate (TC)
            <input
              type="file"
              accept="image/png,image/jpeg,application/pdf"
              onChange={(event) => setTcDocument(event.target.files?.[0] || null)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-[#0b1220] px-4 py-3 text-white"
            />
          </label>

          <label className="block text-sm text-gray-300">
            Other Certificates
            <input
              type="file"
              accept="image/png,image/jpeg,application/pdf"
              multiple
              onChange={(event) => setOtherCertificates(Array.from(event.target.files || []))}
              className="mt-2 w-full rounded-xl border border-white/10 bg-[#0b1220] px-4 py-3 text-white"
            />
          </label>

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
          className="rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 px-8 py-3 font-medium"
        >
          {loading ? "Saving..." : "Save Student"}
        </button>
      </div>
    </div>
  )
}
