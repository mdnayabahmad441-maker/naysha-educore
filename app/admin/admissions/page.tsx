"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { apiFetch } from "@/lib/api-client"

type Admission = {
  id: string
  admission_number: string
  student_name: string
  father_name: string | null
  phone: string
  class_applied: string
  academic_year: string | null
  created_at: string
}


function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
}

export default function AdmissionsPage() {
  const router = useRouter()
  const [admissions, setAdmissions] = useState<Admission[]>([])
  const [loading,    setLoading]    = useState(true)
  const [search, setSearch] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      const res  = await apiFetch(`/api/admissions?${params}`)
      const data = await res.json()
      setAdmissions(res.ok ? (data.admissions ?? []) : [])
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => { void load() }, [load])

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 text-white md:p-10">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Admissions</h1>
          <p className="mt-1 text-sm text-slate-400">{admissions.length} records</p>
        </div>
        <button
          onClick={() => router.push("/admin/admissions/new")}
          className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold hover:bg-blue-500"
        >
          + New Admission
        </button>
      </div>

      {/* Search */}
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by student name…"
        className="w-full max-w-sm rounded-xl border border-white/10 bg-[#0b1220] px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-white/20"
      />

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {loading ? (
          <p className="py-8 text-center text-sm text-slate-400">Loading…</p>
        ) : admissions.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">No admissions found.</p>
        ) : admissions.map((a) => (
          <div key={a.id} className="rounded-2xl border border-white/10 bg-[#0b1220] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-mono text-slate-500">{a.admission_number}</p>
                <h3 className="mt-1 font-semibold text-white">{a.student_name}</h3>
                <p className="text-xs text-slate-400">{a.class_applied} {a.academic_year ? `· ${a.academic_year}` : ""}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <p className="text-xs text-slate-500">{fmt(a.created_at)}</p>
              <button
                onClick={() => router.push(`/admin/admissions/${a.id}`)}
                className="rounded-lg bg-white/10 px-3 py-1.5 text-xs hover:bg-white/20"
              >
                View
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-2xl border border-white/10 bg-[#0b1220] md:block">
        <table className="w-full text-sm">
          <thead className="border-b border-white/10 text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="p-4 text-left">Adm. No.</th>
              <th className="p-4 text-left">Student Name</th>
              <th className="p-4 text-left">Father's Name</th>
              <th className="p-4 text-left">Class</th>
              <th className="p-4 text-left">Phone</th>
              <th className="p-4 text-left">Date</th>
              <th className="p-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="py-10 text-center text-slate-400">Loading…</td></tr>
            ) : admissions.length === 0 ? (
              <tr><td colSpan={7} className="py-10 text-center text-slate-400">No admissions found.</td></tr>
            ) : admissions.map((a) => (
              <tr key={a.id} className="border-t border-white/5 hover:bg-white/3">
                <td className="p-4 font-mono text-xs text-slate-400">{a.admission_number}</td>
                <td className="p-4 font-medium text-white">{a.student_name}</td>
                <td className="p-4 text-slate-300">{a.father_name || "—"}</td>
                <td className="p-4 text-slate-300">{a.class_applied}</td>
                <td className="p-4 text-slate-300">{a.phone}</td>
                <td className="p-4 text-slate-400">{fmt(a.created_at)}</td>
                <td className="p-4 text-right">
                  <button
                    onClick={() => router.push(`/admin/admissions/${a.id}`)}
                    className="rounded-lg bg-white/10 px-3 py-1.5 text-xs hover:bg-white/20"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
