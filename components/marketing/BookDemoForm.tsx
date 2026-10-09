"use client"

import { useState } from "react"

export default function BookDemoForm() {
  const [formData, setFormData] = useState({
    studentName: "", // Acts as contact person name
    fatherName: "",  // Acts as school name / designation
    classWanted: "", // Acts as estimated student strength
    phone: "",
    email: "",
    address: "",
  })

  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<{ type: "idle" | "success" | "error"; message: string }>({
    type: "idle",
    message: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setStatus({ type: "idle", message: "" })

    try {
      const res = await fetch("/api/admission-enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setStatus({
          type: "error",
          message: data.error || "Unable to submit demo request. Please try again or email support@naysha.online.",
        })
      } else {
        setStatus({
          type: "success",
          message: "Thank you! Your school demo request has been received. Our team will contact you via WhatsApp / Phone shortly.",
        })
        setFormData({
          studentName: "",
          fatherName: "",
          classWanted: "",
          phone: "",
          email: "",
          address: "",
        })
      }
    } catch {
      setStatus({
        type: "error",
        message: "Network error. Please check your internet connection or email support@naysha.online.",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {status.type === "success" && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm">
          <p className="font-semibold mb-1">Request Received!</p>
          <p>{status.message}</p>
        </div>
      )}

      {status.type === "error" && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm">
          <p className="font-semibold mb-1">Unable to Submit</p>
          <p>{status.message}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            School Name *
          </label>
          <input
            type="text"
            required
            value={formData.fatherName}
            onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
            placeholder="e.g. Jyoti Public School"
            className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900/80 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 transition"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Contact Person & Role *
          </label>
          <input
            type="text"
            required
            value={formData.studentName}
            onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
            placeholder="e.g. Ramesh Kumar (Principal)"
            className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900/80 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 transition"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Mobile Number (WhatsApp) *
          </label>
          <input
            type="tel"
            required
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="e.g. 9876543210"
            className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900/80 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 transition"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Email Address *
          </label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="e.g. principal@school.edu.in"
            className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900/80 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 transition"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Estimated Student Count *
          </label>
          <select
            required
            value={formData.classWanted}
            onChange={(e) => setFormData({ ...formData, classWanted: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900/80 border border-slate-700/80 text-white text-sm focus:outline-none focus:border-blue-500 transition"
          >
            <option value="" disabled>Select range</option>
            <option value="100-300 Students">100 – 300 Students</option>
            <option value="300-700 Students">300 – 700 Students</option>
            <option value="700-1500 Students">700 – 1,500 Students</option>
            <option value="1500+ Students">1,500+ Students</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            School Location / City *
          </label>
          <input
            type="text"
            required
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="e.g. Barsoi, Katihar, Bihar"
            className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900/80 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 transition"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/30 transition text-sm flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Submitting Request...
          </>
        ) : (
          "Schedule Free Live Demo →"
        )}
      </button>

      <p className="text-center text-[11px] text-slate-500 pt-1">
        No credit card or commitment required. Includes customized school walkthrough & onboarding guidance.
      </p>
    </form>
  )
}

