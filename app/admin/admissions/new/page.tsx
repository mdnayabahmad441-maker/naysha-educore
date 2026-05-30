"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { apiFetch } from "@/lib/api-client"
import { getSchoolId } from "@/lib/school"
import { supabase } from "@/lib/supabase"

const inputClass = "w-full rounded-xl border border-white/10 bg-[#0b1220] px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-white/25"

export default function NewAdmissionPage() {
  const router = useRouter()

  // Admission creation is a staff-only workflow.
  // Parents should use the public admission enquiry form instead.
  const [classes,  setClasses]  = useState<{ id: string; name: string }[]>([])
  const [form,     setForm]     = useState<Record<string, string>>({})
  const [documents, setDocuments] = useState<File[]>([])
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState<string | null>(null)
  const [autoConfirm, setAutoConfirm] = useState(false)
  const [entranceTestScore, setEntranceTestScore] = useState("")
  const [meritRank, setMeritRank] = useState("")

  useEffect(() => {
    getSchoolId().then(async (schoolId) => {
      if (!schoolId) return
      const { data } = await supabase
        .from("classes")
        .select("id, name")
        .eq("school_id", schoolId)
        .order("name")
      setClasses(data || [])
    })
  }, [])

  const set = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }))

  const sanitizeSegment = (value: string) => value.replace(/[^a-zA-Z0-9._-]/g, "-")

  const uploadDocument = async (file: File, schoolId: string) => {
    const extension = file.name.includes(".")
      ? file.name.split(".").pop()?.toLowerCase() || "bin"
      : "bin"
    const filePath = `${schoolId}/admissions/${Date.now()}-${sanitizeSegment(file.name)}`

    const { error: uploadError } = await supabase.storage
      .from("students")
      .upload(filePath, file, {
        cacheControl: "3600",
        contentType: file.type || undefined,
        upsert: true,
      })

    if (uploadError) {
      throw uploadError
    }

    const { data } = supabase.storage.from("students").getPublicUrl(filePath)
    return data.publicUrl
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const schoolId = await getSchoolId()
      if (!schoolId) {
        setError("School information not available")
        return
      }

      const documentUploads = await Promise.all(
        documents.map(async (file) => ({
          name: file.name,
          type: file.type || "document",
          url: await uploadDocument(file, schoolId),
        }))
      )

      const payload = {
        ...form,
        documents: documentUploads,
        entrance_test_score: entranceTestScore || null,
        merit_rank: meritRank || null,
        auto_confirmed: autoConfirm,
      }

      const res  = await apiFetch("/api/admissions", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Failed to save"); return }
      router.push(`/admin/admissions/${data.admission.id}`)
    } catch (err: any) {
      console.error(err)
      setError(err?.message || "Network error. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 text-white md:p-10">

      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
        >
          ← Back
        </button>
        <div>
          <h1 className="text-2xl font-semibold">New Admission</h1>
          <p className="text-sm text-slate-400">Fill in the student details below</p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <form onSubmit={submit} className="space-y-4">
        <div className="rounded-2xl border border-white/10 bg-[#0b1220] p-6 space-y-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Student Information</p>

          {/* Student Name */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">
              Student Full Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.student_name || ""}
              onChange={(e) => set("student_name", e.target.value)}
              required
              className={inputClass}
            />
          </div>

          {/* DOB + Gender */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Date of Birth</label>
              <input
                type="date"
                value={form.date_of_birth || ""}
                onChange={(e) => set("date_of_birth", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Gender</label>
              <select
                value={form.gender || ""}
                onChange={(e) => set("gender", e.target.value)}
                className={inputClass}
              >
                <option value="">Select…</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Father + Mother */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Father's Name</label>
              <input
                type="text"
                value={form.father_name || ""}
                onChange={(e) => set("father_name", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Mother's Name</label>
              <input
                type="text"
                value={form.mother_name || ""}
                onChange={(e) => set("mother_name", e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {/* Phone + Email */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                Phone <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.phone || ""}
                onChange={(e) => set("phone", e.target.value)}
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Email</label>
              <input
                type="email"
                value={form.email || ""}
                onChange={(e) => set("email", e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {/* Class + Section */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                Class Applying For <span className="text-red-400">*</span>
              </label>
              <select
                value={form.class_applied || ""}
                onChange={(e) => set("class_applied", e.target.value)}
                required
                className={inputClass}
              >
                <option value="">Select class…</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Section</label>
              <input
                type="text"
                value={form.section || ""}
                onChange={(e) => set("section", e.target.value)}
                placeholder="e.g. A"
                className={inputClass}
              />
            </div>
          </div>

          {/* Academic Year + Previous School */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Academic Year</label>
              <input
                type="text"
                value={form.academic_year || ""}
                onChange={(e) => set("academic_year", e.target.value)}
                placeholder="e.g. 2025-26"
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Previous School</label>
              <input
                type="text"
                value={form.previous_school || ""}
                onChange={(e) => set("previous_school", e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 rounded-2xl border border-white/10 bg-slate-950/10 p-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Entrance Test Score</label>
              <input
                type="number"
                min="0"
                value={entranceTestScore}
                onChange={(e) => setEntranceTestScore(e.target.value)}
                placeholder="e.g. 85"
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Merit Rank</label>
              <input
                type="number"
                min="1"
                value={meritRank}
                onChange={(e) => setMeritRank(e.target.value)}
                placeholder="Optional"
                className={inputClass}
              />
            </div>
          </div>

          <div className="space-y-4 rounded-2xl border border-white/10 bg-slate-950/10 p-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Admission Documents</label>
              <input
                type="file"
                multiple
                onChange={(e) => setDocuments(Array.from(e.target.files || []))}
                className="w-full text-sm text-slate-100 file:mr-4 file:rounded-full file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
              />
              <p className="mt-2 text-xs text-slate-400">Upload supporting admission documents such as birth certificate, previous report card, photo, and ID proof.</p>
            </div>
            <div className="flex items-end gap-3">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
                <input
                  type="checkbox"
                  checked={autoConfirm}
                  onChange={(e) => setAutoConfirm(e.target.checked)}
                  className="h-4 w-4 rounded border-white/20 bg-slate-900 text-blue-500 focus:ring-blue-500"
                />
                Auto-confirm admission after saving
              </label>
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Address</label>
            <textarea
              rows={2}
              value={form.address || ""}
              onChange={(e) => set("address", e.target.value)}
              className={inputClass + " resize-none"}
            />
          </div>

          {/* Remarks */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Remarks</label>
            <textarea
              rows={2}
              value={form.remarks || ""}
              onChange={(e) => set("remarks", e.target.value)}
              className={inputClass + " resize-none"}
            />
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-xl border border-white/10 px-5 py-2.5 text-sm hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold hover:bg-blue-500 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save Admission"}
          </button>
        </div>
      </form>
    </div>
  )
}
