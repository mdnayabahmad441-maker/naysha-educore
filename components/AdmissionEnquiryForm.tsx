"use client"

import { useEffect, useState } from "react"
import { getSchoolId } from "@/lib/school"

type SchoolClass = {
  id: string
  name: string
}

export default function AdmissionEnquiryForm() {
  const [studentName, setStudentName] = useState("")
  const [fatherName, setFatherName] = useState("")
  const [classWanted, setClassWanted] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [address, setAddress] = useState("")

  const [classes, setClasses] = useState<SchoolClass[]>([])
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [schoolId, setSchoolId] = useState<string | null>(null)

  useEffect(() => {
    void getSchoolId().then(setSchoolId)
  }, [])

  useEffect(() => {
    if (!schoolId) return

    // Fetch available classes
    void fetch(`/api/classes?schoolId=${schoolId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setClasses(data.classes || [])
        }
      })
      .catch(err => console.error("Failed to load classes:", err))
  }, [schoolId])

  const submitEnquiry = async () => {
    if (!studentName.trim() || !fatherName.trim() || !classWanted || !phone.trim() || !email.trim() || !address.trim()) {
      alert("Please fill all required fields")
      return
    }

    if (!schoolId) {
      alert("School information not available")
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/admission-enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName: studentName.trim(),
          fatherName: fatherName.trim(),
          classWanted,
          phone: phone.trim(),
          email: email.trim(),
          address: address.trim(),
          schoolId
        })
      })

      const data = await response.json()

      if (data.success) {
        setSubmitted(true)
        // Reset form
        setStudentName("")
        setFatherName("")
        setClassWanted("")
        setPhone("")
        setEmail("")
        setAddress("")
      } else {
        alert(data.error || "Failed to submit enquiry")
      }
    } catch (error) {
      console.error("Enquiry submission error:", error)
      alert("Failed to submit enquiry. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-lg text-center">
        <div className="text-green-600 text-6xl mb-4">✓</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Enquiry Submitted!</h2>
        <p className="text-gray-600 mb-6">
          Thank you for your interest. We have received your admission enquiry and will contact you soon.
        </p>
        <button
          onClick={() => setSubmitted(false)}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Submit Another Enquiry
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Admission Enquiry</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Student Name *
          </label>
          <input
            type="text"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter student name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Father Name *
          </label>
          <input
            type="text"
            value={fatherName}
            onChange={(e) => setFatherName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter father name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Class Interested In *
          </label>
          <select
            value={classWanted}
            onChange={(e) => setClassWanted(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Class</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.name}>
                {cls.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number *
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter phone number"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email Address *
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter email address"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Address *
          </label>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter full address"
          />
        </div>

        <button
          onClick={submitEnquiry}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Submitting..." : "Submit Enquiry"}
        </button>
      </div>
    </div>
  )
}