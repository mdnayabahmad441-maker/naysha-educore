"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { getSchoolId } from "@/lib/school"
import { getSettings, updateSettings } from "@/lib/settings"
import { apiFetch } from "@/lib/api-client"

type UploadKind = "logo" | "id-card-template" | "report-card-template" | "certificate-template"

type TemplateInfo = {
  kind: "id_card" | "report_card" | "certificate"
  layoutKey: string
  label: string
}

const templateInfoMap: Partial<Record<UploadKind, TemplateInfo>> = {
  "id-card-template":      { kind: "id_card",     layoutKey: "id_card_layout",     label: "ID Card" },
  "report-card-template":  { kind: "report_card",  layoutKey: "report_card_layout",  label: "Report Card" },
  "certificate-template":  { kind: "certificate",  layoutKey: "certificate_layout",  label: "Certificate" }
}

export default function SettingsPage() {
  const [tab, setTab] = useState("school")
  const [schoolId, setSchoolId] = useState<string | null>(null)

  const [school, setSchool] = useState<any>({})
  const [exam, setExam] = useState<any>({})
  const [fees, setFees] = useState<any>({})

  const [classes, setClasses] = useState<any[]>([])
  const [classFees, setClassFees] = useState<any>({})

  const [years, setYears] = useState<any[]>([])
  const [yearName, setYearName] = useState("")

  const [idCardTemplateUrl, setIdCardTemplateUrl] = useState("")
  const [reportCardTemplateUrl, setReportCardTemplateUrl] = useState("")
  const [certificateTemplateUrl, setCertificateTemplateUrl] = useState("")
  const [uploadingAsset, setUploadingAsset] = useState<UploadKind | null>(null)
  const [analyzingLayout, setAnalyzingLayout] = useState<UploadKind | null>(null)

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getSchoolId().then((id) => {
      setSchoolId(id)
    })
  }, [])

  useEffect(() => {
    if (!schoolId) return

    const load = async () => {
      const { data } = await supabase
        .from("schools")
        .select("*")
        .eq("id", schoolId)
        .single()

      setSchool(data || {})

      const examSettings = await getSettings("exam")
      setExam(examSettings || { passing: 33, grading: "percentage" })

      const feeSettings = await getSettings("fees")
      setFees(
        feeSettings || {
          late_fee: 0,
          prefix: "INV",
          tuition_fee: 0,
          transport_fee: 0,
          hostel_fee: 0
        }
      )

      const [loadedIdCardTemplate, loadedReportCardTemplate, loadedCertificateTemplate] = await Promise.all([
        getSettings("id_card_template"),
        getSettings("report_card_template"),
        getSettings("certificate_template")
      ])

      setIdCardTemplateUrl(typeof loadedIdCardTemplate === "string" ? loadedIdCardTemplate : "")
      setReportCardTemplateUrl(typeof loadedReportCardTemplate === "string" ? loadedReportCardTemplate : "")
      setCertificateTemplateUrl(typeof loadedCertificateTemplate === "string" ? loadedCertificateTemplate : "")

      const { data: cls } = await supabase
        .from("classes")
        .select("*")
        .eq("school_id", schoolId)

      setClasses(cls || [])

      const { data: classFeeData } = await supabase
        .from("class_fee_settings")
        .select("*")
        .eq("school_id", schoolId)

      const map: any = {}

      cls?.forEach((c: any) => {
        const existing = classFeeData?.find((f: any) => f.class_id === c.id)

        map[c.id] = {
          tuition: existing?.tuition_fee || 0,
          transport: existing?.transport_fee || 0,
          hostel: existing?.hostel_fee || 0
        }
      })

      setClassFees(map)

      const { data: yrs } = await supabase
        .from("academic_years")
        .select("*")
        .eq("school_id", schoolId)
        .order("created_at", { ascending: false })

      setYears(yrs || [])

      setLoading(false)
    }

    void load()
  }, [schoolId])

  const uploadAsset = async (assetType: UploadKind, file: File | null) => {
    if (!schoolId || !file) return

    try {
      setUploadingAsset(assetType)

      const body = new FormData()
      body.append("schoolId", schoolId)
      body.append("assetType", assetType)
      body.append("file", file)

      const response = await apiFetch("/api/school-assets/upload", { method: "POST", body })
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Upload failed")
      }

      // Update URL state
      if (assetType === "logo") {
        setSchool((current: any) => ({ ...current, logo_url: result.url }))
        alert("Logo uploaded successfully")
        return
      }
      if (assetType === "id-card-template") setIdCardTemplateUrl(result.url)
      if (assetType === "report-card-template") setReportCardTemplateUrl(result.url)
      if (assetType === "certificate-template") setCertificateTemplateUrl(result.url)

      // Auto AI layout detection for all templates
      const info = templateInfoMap[assetType]
      if (!info || !result.url) {
        alert("Template uploaded successfully")
        return
      }

      setUploadingAsset(null)
      setAnalyzingLayout(assetType)

      try {
        const layoutResponse = await apiFetch("/api/ai/document-layout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kind: info.kind, imageUrl: result.url })
        })

        const layoutResult = await layoutResponse.json()

        if (layoutResponse.ok && layoutResult?.layout) {
          await updateSettings(info.layoutKey, layoutResult.layout)
          alert(`${info.label} template uploaded — AI has auto-detected and saved the field layout. Open Document Studio to fine-tune if needed.`)
        } else {
          alert(`${info.label} template uploaded. AI layout detection failed: ${layoutResult?.error || "unknown error"}. You can retry in Document Studio.`)
        }
      } catch (aiError) {
        console.error("AI layout error:", aiError)
        alert(`${info.label} template uploaded. AI layout detection failed — you can retry in Document Studio.`)
      } finally {
        setAnalyzingLayout(null)
      }
    } catch (error) {
      console.error(error)
      alert(error instanceof Error ? error.message : "Upload failed")
      setUploadingAsset(null)
      setAnalyzingLayout(null)
    }
  }

  const saveSchool = async () => {
    const { error } = await supabase
      .from("schools")
      .update({
        name: school.name || null,
        email: school.email || null,
        phone: school.phone || null,
        address: school.address || null
      })
      .eq("id", schoolId)

    if (error) {
      console.error(error)
      alert(error.message)
    } else {
      alert("Saved")
    }
  }

  const saveExam = async () => {
    try {
      await updateSettings("exam", exam)
      alert("Saved")
    } catch (e) {
      console.error(e)
      alert("Save failed")
    }
  }

  const saveFees = async () => {
    try {
      await updateSettings("fees", fees)
      alert("Saved")
    } catch (e) {
      console.error(e)
      alert("Save failed")
    }
  }

  const saveClassFees = async () => {
    for (const classId in classFees) {
      const f = classFees[classId]

      const { error } = await supabase
        .from("class_fee_settings")
        .upsert(
          {
            class_id: classId,
            school_id: schoolId,
            tuition_fee: Number(f.tuition || 0),
            transport_fee: Number(f.transport || 0),
            hostel_fee: Number(f.hostel || 0)
          },
          {
            onConflict: "class_id,school_id"
          }
        )

      if (error) {
        console.error(error)
        alert(error.message)
        return
      }
    }

    alert("Class fees saved")
  }

  const reloadYears = async () => {
    const { data } = await supabase
      .from("academic_years")
      .select("*")
      .eq("school_id", schoolId)

    setYears(data || [])
  }

  const addYear = async () => {
    if (!yearName) return alert("Enter year")

    const { error } = await supabase.from("academic_years").insert({
      id: crypto.randomUUID(),
      name: yearName,
      school_id: schoolId,
      is_active: false
    })

    if (error) {
      console.error(error)
      alert(error.message)
      return
    }

    setYearName("")
    void reloadYears()
  }

  const setActiveYear = async (id: string) => {
    await supabase.from("academic_years").update({ is_active: false }).eq("school_id", schoolId)
    await supabase.from("academic_years").update({ is_active: true }).eq("id", id)
    void reloadYears()
  }

  const deleteYear = async (id: string) => {
    await supabase.from("academic_years").delete().eq("id", id)
    void reloadYears()
  }

  if (loading) return <div className="p-10 text-white">Loading...</div>

  return (
    <div className="flex min-h-screen text-white">
      <div className="w-64 space-y-3 bg-[#0b1a33] p-6">
        <button onClick={() => setTab("school")} className="block w-full text-left">
          School
        </button>
        <button onClick={() => setTab("exam")} className="block w-full text-left">
          Exam
        </button>
        <button onClick={() => setTab("fees")} className="block w-full text-left">
          Fees
        </button>
        <button onClick={() => setTab("academic")} className="block w-full text-left text-cyan-400">
          Academic Year
        </button>
      </div>

      <div className="flex-1 p-10">
        {tab === "school" && (
          <div className="max-w-3xl space-y-8">
            <div className="space-y-4">
              <input
                className="input"
                placeholder="Name"
                value={school.name || ""}
                onChange={(e) => setSchool({ ...school, name: e.target.value })}
              />

              <input
                className="input"
                placeholder="Email"
                value={school.email || ""}
                onChange={(e) => setSchool({ ...school, email: e.target.value })}
              />

              <input
                className="input"
                placeholder="Phone"
                value={school.phone || ""}
                onChange={(e) => setSchool({ ...school, phone: e.target.value })}
              />

              <input
                className="input"
                placeholder="Address"
                value={school.address || ""}
                onChange={(e) => setSchool({ ...school, address: e.target.value })}
              />

              <button onClick={saveSchool} className="btn bg-blue-600">
                Save
              </button>
            </div>

            <div className="grid gap-6 lg:grid-cols-4">
              <AssetUploader
                title="School Logo"
                helpText="Uploads to the school-logos bucket and updates the school profile."
                previewUrl={school.logo_url || ""}
                status={uploadingAsset === "logo" ? "uploading" : "idle"}
                disabled={uploadingAsset !== null || analyzingLayout !== null}
                onFileSelect={(file) => void uploadAsset("logo", file)}
              />

              <AssetUploader
                title="ID Card Template"
                helpText="Upload your ID card background. AI will auto-detect field positions instantly."
                previewUrl={idCardTemplateUrl}
                status={
                  uploadingAsset === "id-card-template" ? "uploading" :
                  analyzingLayout === "id-card-template" ? "analyzing" : "idle"
                }
                disabled={uploadingAsset !== null || analyzingLayout !== null}
                onFileSelect={(file) => void uploadAsset("id-card-template", file)}
              />

              <AssetUploader
                title="Report Card Template"
                helpText="Upload your report card background. AI will auto-detect field positions instantly."
                previewUrl={reportCardTemplateUrl}
                status={
                  uploadingAsset === "report-card-template" ? "uploading" :
                  analyzingLayout === "report-card-template" ? "analyzing" : "idle"
                }
                disabled={uploadingAsset !== null || analyzingLayout !== null}
                onFileSelect={(file) => void uploadAsset("report-card-template", file)}
              />

              <AssetUploader
                title="Certificate Template"
                helpText="Upload your certificate/TC background. AI will auto-detect field positions instantly."
                previewUrl={certificateTemplateUrl}
                status={
                  uploadingAsset === "certificate-template" ? "uploading" :
                  analyzingLayout === "certificate-template" ? "analyzing" : "idle"
                }
                disabled={uploadingAsset !== null || analyzingLayout !== null}
                onFileSelect={(file) => void uploadAsset("certificate-template", file)}
              />
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <h3 className="text-lg font-semibold">Document Studio</h3>
              <p className="mt-2 text-sm text-gray-400">
                Design your ID card, report card, and certificate layouts with school-specific field positions.
              </p>
              <a
                href="/admin/documents"
                className="mt-4 inline-flex rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Open Document Studio
              </a>
            </div>
          </div>
        )}

        {tab === "exam" && (
          <div className="max-w-lg space-y-4">
            <input
              className="input"
              placeholder="Passing %"
              value={exam.passing || ""}
              onChange={(e) => setExam({ ...exam, passing: e.target.value })}
            />

            <select
              className="input"
              value={exam.grading || "percentage"}
              onChange={(e) => setExam({ ...exam, grading: e.target.value })}
            >
              <option value="percentage">Percentage</option>
              <option value="grade">Grade</option>
            </select>

            <button onClick={saveExam} className="btn bg-blue-600">
              Save
            </button>
          </div>
        )}

        {tab === "fees" && (
          <div className="space-y-6">
            <div className="max-w-lg space-y-3">
              <input
                className="input"
                placeholder="Prefix"
                value={fees.prefix || ""}
                onChange={(e) => setFees({ ...fees, prefix: e.target.value })}
              />
              <input
                className="input"
                placeholder="Late Fee"
                value={fees.late_fee || ""}
                onChange={(e) => setFees({ ...fees, late_fee: e.target.value })}
              />
              <button onClick={saveFees} className="btn bg-blue-600">
                Save
              </button>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg">Class Fees</h3>

              {classes.map((c) => (
                <div key={c.id} className="grid grid-cols-3 gap-2">
                  <input
                    className="input"
                    value={classFees[c.id]?.tuition || ""}
                    onChange={(e) =>
                      setClassFees({
                        ...classFees,
                        [c.id]: { ...classFees[c.id], tuition: e.target.value }
                      })
                    }
                    placeholder={`${c.name} Tuition`}
                  />
                  <input
                    className="input"
                    value={classFees[c.id]?.transport || ""}
                    onChange={(e) =>
                      setClassFees({
                        ...classFees,
                        [c.id]: { ...classFees[c.id], transport: e.target.value }
                      })
                    }
                    placeholder="Transport"
                  />
                  <input
                    className="input"
                    value={classFees[c.id]?.hostel || ""}
                    onChange={(e) =>
                      setClassFees({
                        ...classFees,
                        [c.id]: { ...classFees[c.id], hostel: e.target.value }
                      })
                    }
                    placeholder="Hostel"
                  />
                </div>
              ))}

              <button onClick={saveClassFees} className="btn bg-green-600">
                Save Class Fees
              </button>
            </div>
          </div>
        )}

        {tab === "academic" && (
          <div className="max-w-lg space-y-6">
            <h2 className="text-xl font-semibold">Academic Year</h2>

            <div className="flex gap-3">
              <input
                placeholder="2024-2025"
                value={yearName}
                onChange={(e) => setYearName(e.target.value)}
                className="input"
              />

              <button onClick={addYear} className="btn bg-green-600">
                Add
              </button>
            </div>

            {years.map((y) => (
              <div key={y.id} className="flex justify-between rounded-xl bg-white/5 p-4">
                <div>
                  <p>{y.name}</p>
                  {y.is_active && <span className="text-sm text-green-400">Active</span>}
                </div>

                <div className="flex gap-3">
                  {!y.is_active && <button onClick={() => setActiveYear(y.id)}>Active</button>}
                  <button onClick={() => deleteYear(y.id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .input {
          width: 100%;
          padding: 12px;
          border-radius: 8px;
          background: #0b1220;
        }
        .btn {
          padding: 10px 16px;
          border-radius: 8px;
        }
      `}</style>
    </div>
  )
}

function AssetUploader({
  title,
  helpText,
  previewUrl,
  status,
  disabled,
  onFileSelect
}: {
  title: string
  helpText: string
  previewUrl: string
  status: "idle" | "uploading" | "analyzing"
  disabled: boolean
  onFileSelect: (file: File | null) => void
}) {
  const statusLabel =
    status === "uploading" ? "Uploading..." :
    status === "analyzing" ? "AI analyzing template..." :
    previewUrl ? "Replace template" : "Choose image"

  const isActive = status !== "idle"

  return (
    <div className={`space-y-3 rounded-2xl border p-4 transition ${isActive ? "border-cyan-400/30 bg-cyan-500/5" : "border-white/10 bg-white/5"}`}>
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-gray-400">{helpText}</p>
      </div>

      {isActive ? (
        <div className="flex h-40 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-cyan-400/30 text-sm text-cyan-300">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
          <span>{status === "analyzing" ? "AI is reading your template..." : "Uploading..."}</span>
        </div>
      ) : previewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={previewUrl}
          alt={title}
          className="h-40 w-full rounded-xl border border-white/10 object-cover"
        />
      ) : (
        <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-white/10 text-sm text-gray-500">
          No template uploaded yet
        </div>
      )}

      <label className={`block ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}>
        <span className="mb-2 block text-sm text-gray-300">{statusLabel}</span>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="w-full rounded bg-[#0b1220] p-3"
          disabled={disabled}
          onChange={(event) => {
            onFileSelect(event.target.files?.[0] || null)
            event.currentTarget.value = ""
          }}
        />
      </label>

      {previewUrl && status === "idle" && (
        <p className="text-xs text-emerald-400">Template active — AI layout auto-generated</p>
      )}
    </div>
  )
}
