"use client"

import { useEffect, useMemo, useState } from "react"
import { apiFetch } from "@/lib/api-client"

type SchoolStats = {
  students: number
  teachers: number
  parents: number
  classes: number
  fees: number
  payments: number
  enquiries: number
}

type School = {
  id: string
  name: string | null
  email: string | null
  phone: string | null
  address?: string | null
  subdomain?: string | null
  domain?: string | null
  status?: string | null
  plan?: string | null
  subscription_status?: string | null
  subscription_ends_at?: string | null
  ai_enabled?: boolean | null
  notes?: string | null
  created_at?: string | null
  stats: SchoolStats
}

type SchoolForm = {
  name: string
  email: string
  phone: string
  address: string
  subdomain: string
  domain: string
  status: string
  plan: string
  subscription_status: string
  subscription_ends_at: string
  ai_enabled: boolean
  notes: string
  adminPassword: string
}

const blankForm: SchoolForm = {
  name: "",
  email: "",
  phone: "",
  address: "",
  subdomain: "",
  domain: "",
  status: "active",
  plan: "standard",
  subscription_status: "trial",
  subscription_ends_at: "",
  ai_enabled: false,
  notes: "",
  adminPassword: "",
}

function toForm(school: School): SchoolForm {
  return {
    name: school.name || "",
    email: school.email || "",
    phone: school.phone || "",
    address: school.address || "",
    subdomain: school.subdomain || "",
    domain: school.domain || "",
    status: school.status || "active",
    plan: school.plan || "standard",
    subscription_status: school.subscription_status || "trial",
    subscription_ends_at: school.subscription_ends_at?.slice(0, 10) || "",
    ai_enabled: Boolean(school.ai_enabled),
    notes: school.notes || "",
    adminPassword: "",
  }
}

function domainLabel(school: School) {
  const tenant = school.subdomain || school.domain
  return tenant ? `${tenant}.erp.naysha.online` : "Not set"
}

export default function SuperAdmin() {
  const [schools, setSchools] = useState<School[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState<School | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<SchoolForm>(blankForm)

  const loadSchools = async () => {
    setLoading(true)
    setError("")

    const response = await apiFetch("/api/super-admin/schools")
    const result = await response.json().catch(() => ({}))

    if (!response.ok || !result.success) {
      setError(result.error || "Could not load Super Admin control panel.")
      setSchools([])
      setLoading(false)
      return
    }

    setSchools((result.schools as School[]) || [])
    setLoading(false)
  }

  useEffect(() => {
    void loadSchools()
  }, [])

  const totals = useMemo(() => {
    return schools.reduce(
      (acc, school) => {
        acc.schools += 1
        acc.students += school.stats?.students || 0
        acc.teachers += school.stats?.teachers || 0
        acc.parents += school.stats?.parents || 0
        acc.classes += school.stats?.classes || 0
        acc.enquiries += school.stats?.enquiries || 0
        return acc
      },
      { schools: 0, students: 0, teachers: 0, parents: 0, classes: 0, enquiries: 0 }
    )
  }, [schools])

  const filtered = useMemo(() => {
    const text = query.trim().toLowerCase()
    if (!text) return schools

    return schools.filter((school) =>
      [school.name, school.email, school.phone, school.subdomain, school.domain]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(text))
    )
  }, [query, schools])

  const openCreate = () => {
    setSelected(null)
    setCreating(true)
    setForm(blankForm)
    setError("")
    setNotice("")
  }

  const openEdit = (school: School) => {
    setSelected(school)
    setCreating(false)
    setForm(toForm(school))
    setError("")
    setNotice("")
  }

  const closePanel = () => {
    setSelected(null)
    setCreating(false)
    setForm(blankForm)
  }

  const updateForm = (key: keyof SchoolForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const updateBooleanForm = (key: keyof SchoolForm, value: boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const saveSchool = async () => {
    setSaving(true)
    setError("")
    setNotice("")

    const method = creating ? "POST" : "PATCH"
    const body = creating ? form : { ...form, schoolId: selected?.id }

    const response = await apiFetch("/api/super-admin/schools", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    const result = await response.json().catch(() => ({}))
    setSaving(false)

    if (!response.ok || !result.success) {
      setError(result.error || "Could not save school.")
      return
    }

    setNotice(result.warning || (creating ? "School created." : "School updated."))
    await loadSchools()
    if (creating) closePanel()
  }

  const setAdminPassword = async () => {
    if (!selected) return
    if (form.adminPassword.length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }

    setSaving(true)
    setError("")
    setNotice("")

    const response = await apiFetch("/api/super-admin/schools", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "set_admin_password",
        schoolId: selected.id,
        password: form.adminPassword,
      }),
    })
    const result = await response.json().catch(() => ({}))
    setSaving(false)

    if (!response.ok || !result.success) {
      setError(result.error || "Could not set admin password.")
      return
    }

    updateForm("adminPassword", "")
    setNotice(result.created ? "Admin account created and password set." : "Admin password updated.")
  }

  const quickStatus = async (school: School, status: "active" | "suspended") => {
    setSaving(true)
    setError("")
    setNotice("")

    const payload = { ...toForm(school), status, schoolId: school.id }
    const response = await apiFetch("/api/super-admin/schools", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    const result = await response.json().catch(() => ({}))
    setSaving(false)

    if (!response.ok || !result.success) {
      setError(result.error || `Could not ${status === "active" ? "activate" : "suspend"} school.`)
      return
    }

    setNotice(result.warning || `School ${status === "active" ? "activated" : "suspended"}.`)
    await loadSchools()
  }

  const deleteSchool = async () => {
    if (!selected) return
    const typed = window.prompt(`Type DELETE to permanently delete ${selected.name || "this school"}.`)
    if (typed !== "DELETE") return

    setSaving(true)
    setError("")
    setNotice("")

    const response = await apiFetch(`/api/super-admin/schools?schoolId=${selected.id}&confirm=DELETE`, {
      method: "DELETE",
    })
    const result = await response.json().catch(() => ({}))
    setSaving(false)

    if (!response.ok || !result.success) {
      setError(result.error || "Could not delete school.")
      return
    }

    setNotice("School deleted.")
    closePanel()
    await loadSchools()
  }

  return (
    <div className="min-h-screen bg-[#07101f] text-white">
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300/70">NaySha EduCore</p>
            <h1 className="mt-2 text-3xl font-bold">Super Admin Control Panel</h1>
            <p className="mt-1 text-sm text-slate-400">Control tenants, school admins, subscription status, and platform-wide visibility.</p>
          </div>
          <button onClick={openCreate} className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold hover:bg-blue-500">
            Add School
          </button>
        </div>

        {(error || notice) && (
          <div className={`rounded-xl border px-4 py-3 text-sm ${
            error ? "border-red-400/20 bg-red-400/10 text-red-100" : "border-emerald-400/20 bg-emerald-400/10 text-emerald-100"
          }`}>
            {error || notice}
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          {[
            ["Schools", totals.schools],
            ["Students", totals.students],
            ["Teachers", totals.teachers],
            ["Parents", totals.parents],
            ["Classes", totals.classes],
            ["Enquiries", totals.enquiries],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-xs uppercase tracking-widest text-slate-500">{label}</p>
              <p className="mt-2 text-2xl font-bold">{value}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04]">
          <div className="flex flex-col gap-3 border-b border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Schools</h2>
              <p className="text-xs text-slate-500">Open a school to manage details, status, admin access, or deletion.</p>
            </div>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search schools..."
              className="w-full rounded-xl border border-white/10 bg-[#08111f] px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500 sm:max-w-xs"
            />
          </div>

          {loading ? (
            <div className="p-10 text-center text-sm text-slate-500">Loading control panel...</div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500">No schools found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-sm">
                <thead className="border-b border-white/10 text-xs uppercase tracking-widest text-slate-500">
                  <tr>
                    <th className="px-5 py-3 text-left">School</th>
                    <th className="px-5 py-3 text-left">Domain</th>
                    <th className="px-5 py-3 text-left">Status</th>
                    <th className="px-5 py-3 text-left">Counts</th>
                    <th className="px-5 py-3 text-left">Created</th>
                    <th className="px-5 py-3 text-right">Control</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((school) => (
                    <tr key={school.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                      <td className="px-5 py-4">
                        <p className="font-semibold">{school.name || "Unnamed school"}</p>
                        <p className="text-xs text-slate-500">{school.email || "No admin email"}</p>
                      </td>
                      <td className="px-5 py-4 text-slate-300">{domainLabel(school)}</td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          <span className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${
                            (school.status || "active") === "suspended"
                              ? "border-red-400/20 bg-red-400/10 text-red-200"
                              : "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
                          }`}>
                            {school.status || "active"}
                          </span>
                          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                            school.ai_enabled
                              ? "border-purple-400/20 bg-purple-400/10 text-purple-100"
                              : "border-slate-400/20 bg-slate-400/10 text-slate-300"
                          }`}>
                            AI {school.ai_enabled ? "Premium" : "Off"}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-400">
                        {school.stats.students} students · {school.stats.teachers} teachers · {school.stats.parents} parents
                      </td>
                      <td className="px-5 py-4 text-slate-400">
                        {school.created_at ? new Date(school.created_at).toLocaleDateString("en-IN") : "-"}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => openEdit(school)} className="rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10">
                            Manage
                          </button>
                          <button
                            onClick={() => void quickStatus(school, (school.status || "active") === "suspended" ? "active" : "suspended")}
                            disabled={saving}
                            className="rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10 disabled:opacity-50"
                          >
                            {(school.status || "active") === "suspended" ? "Activate" : "Suspend"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {(selected || creating) && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 p-4">
          <div className="mx-auto flex min-h-full max-w-4xl items-center">
            <div className="w-full rounded-2xl border border-white/10 bg-[#08111f] shadow-2xl">
              <div className="flex items-start justify-between gap-4 border-b border-white/10 p-5">
                <div>
                  <h2 className="text-xl font-bold">{creating ? "Create School" : "Manage School"}</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {creating ? "Create a new tenant and optionally set the first admin password." : selected?.name}
                  </p>
                </div>
                <button onClick={closePanel} className="rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300 hover:bg-white/10">
                  Close
                </button>
              </div>

              <div className="grid gap-4 p-5 md:grid-cols-2">
                <Field label="School Name" value={form.name} onChange={(value) => updateForm("name", value)} />
                <Field label="Admin Email" value={form.email} onChange={(value) => updateForm("email", value)} />
                <Field label="Phone" value={form.phone} onChange={(value) => updateForm("phone", value)} />
                <Field label="Subdomain" value={form.subdomain} onChange={(value) => updateForm("subdomain", value)} />
                <Field label="Custom Domain" value={form.domain} onChange={(value) => updateForm("domain", value)} />
                <Field label="Subscription Ends" type="date" value={form.subscription_ends_at} onChange={(value) => updateForm("subscription_ends_at", value)} />

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-400">Status</label>
                  <select value={form.status} onChange={(event) => updateForm("status", event.target.value)} className="w-full rounded-xl border border-white/10 bg-[#020817] px-4 py-2.5 text-sm">
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="trial">Trial</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-400">Plan</label>
                  <select value={form.plan} onChange={(event) => updateForm("plan", event.target.value)} className="w-full rounded-xl border border-white/10 bg-[#020817] px-4 py-2.5 text-sm">
                    <option value="standard">Standard</option>
                    <option value="premium">Premium</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-400">Subscription</label>
                  <select value={form.subscription_status} onChange={(event) => updateForm("subscription_status", event.target.value)} className="w-full rounded-xl border border-white/10 bg-[#020817] px-4 py-2.5 text-sm">
                    <option value="trial">Trial</option>
                    <option value="paid">Paid</option>
                    <option value="past_due">Past Due</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <label className="flex items-center justify-between gap-4 rounded-xl border border-purple-400/20 bg-purple-400/10 p-4 md:col-span-2">
                  <div>
                    <p className="text-sm font-semibold text-purple-100">AI Premium Access</p>
                    <p className="mt-1 text-xs text-purple-100/70">
                      Enable this only for schools that paid for AI. When off, all AI APIs return a premium-upgrade message.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={form.ai_enabled}
                    onChange={(event) => updateBooleanForm("ai_enabled", event.target.checked)}
                    className="h-5 w-5 accent-purple-500"
                  />
                </label>

                <div className="md:col-span-2">
                  <label className="mb-1 block text-xs font-semibold text-slate-400">Address</label>
                  <textarea value={form.address} onChange={(event) => updateForm("address", event.target.value)} rows={2} className="w-full rounded-xl border border-white/10 bg-[#020817] px-4 py-2.5 text-sm" />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1 block text-xs font-semibold text-slate-400">Internal Notes</label>
                  <textarea value={form.notes} onChange={(event) => updateForm("notes", event.target.value)} rows={3} className="w-full rounded-xl border border-white/10 bg-[#020817] px-4 py-2.5 text-sm" />
                </div>

                <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-4 md:col-span-2">
                  <label className="mb-1 block text-xs font-semibold text-amber-100">School Admin Password</label>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <input
                      type="password"
                      value={form.adminPassword}
                      onChange={(event) => updateForm("adminPassword", event.target.value)}
                      placeholder="Minimum 8 characters"
                      className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#020817] px-4 py-2.5 text-sm"
                    />
                    {creating ? null : (
                      <button onClick={setAdminPassword} disabled={saving} className="rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold hover:bg-amber-500 disabled:opacity-50">
                        Set Password
                      </button>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-amber-100/70">
                    This creates the admin auth user if missing, or updates the existing admin account for this school email.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 border-t border-white/10 p-5 sm:flex-row sm:items-center sm:justify-between">
                {!creating && (
                  <button onClick={deleteSchool} disabled={saving} className="rounded-xl border border-red-400/30 px-4 py-2.5 text-sm font-semibold text-red-200 hover:bg-red-400/10 disabled:opacity-50">
                    Delete School
                  </button>
                )}
                <div className="flex flex-col-reverse gap-3 sm:ml-auto sm:flex-row">
                  <button onClick={closePanel} className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold hover:bg-white/10">
                    Cancel
                  </button>
                  <button onClick={saveSchool} disabled={saving} className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold hover:bg-blue-500 disabled:opacity-50">
                    {saving ? "Saving..." : creating ? "Create School" : "Save Changes"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-slate-400">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-white/10 bg-[#020817] px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500"
      />
    </div>
  )
}
