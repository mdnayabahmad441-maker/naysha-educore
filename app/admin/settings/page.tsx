"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { getSchoolId } from "@/lib/school"
import { getSettings, updateSettings } from "@/lib/settings"
import { apiFetch } from "@/lib/api-client"
import { ID_CARD_PRESETS } from "@/lib/document-layouts"

type UploadKind = "logo" | "report-card-template" | "certificate-template"

type TemplateInfo = {
  kind: "report_card" | "certificate"
  layoutKey: string
  label: string
}

const templateInfoMap: Record<Exclude<UploadKind, "logo">, TemplateInfo> = {
  "report-card-template": { kind: "report_card", layoutKey: "report_card_layout", label: "Report Card" },
  "certificate-template": { kind: "certificate", layoutKey: "certificate_layout", label: "Certificate" },
}

async function getImageDimensions(file: File) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const image = new Image()
    const objectUrl = URL.createObjectURL(file)

    image.onload = () => {
      resolve({
        width: image.naturalWidth,
        height: image.naturalHeight,
      })
      URL.revokeObjectURL(objectUrl)
    }

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error("Could not read image size"))
    }

    image.src = objectUrl
  })
}

export default function SettingsPage() {
  const [tab, setTab] = useState<"school" | "exam" | "fees" | "academic">("school")
  const [schoolId, setSchoolId] = useState<string | null>(null)

  const [school, setSchool] = useState<any>({})
  const [exam, setExam] = useState<any>({})
  const [fees, setFees] = useState<any>({})
  const [classes, setClasses] = useState<any[]>([])
  const [classFees, setClassFees] = useState<any>({})
  const [years, setYears] = useState<any[]>([])
  const [yearName, setYearName] = useState("")
  const [reportCardTemplateUrl, setReportCardTemplateUrl] = useState("")
  const [certificateTemplateUrl, setCertificateTemplateUrl] = useState("")
  const [aiInstructions, setAiInstructions] = useState("")
  const [selectedIdCardPreset, setSelectedIdCardPreset] = useState(ID_CARD_PRESETS[0].id)
  const [uploadingAsset, setUploadingAsset] = useState<UploadKind | null>(null)
  const [analyzingLayout, setAnalyzingLayout] = useState<UploadKind | null>(null)
  const [deletingAsset, setDeletingAsset] = useState<UploadKind | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void getSchoolId().then(setSchoolId)
  }, [])

  useEffect(() => {
    if (!schoolId) return

    const load = async () => {
      setLoading(true)

      const [{ data: schoolData }, examSettings, feeSettings, reportTemplate, certificateTemplate, aiText, idCardLayout, { data: cls }, { data: classFeeData }, { data: yrs }] =
        await Promise.all([
          supabase.from("schools").select("*").eq("id", schoolId).single(),
          getSettings("exam"),
          getSettings("fees"),
          getSettings("report_card_template"),
          getSettings("certificate_template"),
          getSettings("ai_system_instructions"),
          getSettings("id_card_layout"),
          supabase.from("classes").select("*").eq("school_id", schoolId),
          supabase.from("class_fee_settings").select("*").eq("school_id", schoolId),
          supabase.from("academic_years").select("*").eq("school_id", schoolId).order("created_at", { ascending: false }),
        ])

      setSchool(schoolData || {})
      setExam(examSettings || { passing: 33, grading: "percentage" })
      setFees(
        feeSettings || {
          late_fee: 0,
          prefix: "INV",
          tuition_fee: 0,
          transport_fee: 0,
          hostel_fee: 0,
        }
      )
      setReportCardTemplateUrl(typeof reportTemplate === "string" ? reportTemplate : "")
      setCertificateTemplateUrl(typeof certificateTemplate === "string" ? certificateTemplate : "")
      setAiInstructions(typeof aiText === "string" ? aiText : "")
      const matchedPreset = ID_CARD_PRESETS.find((preset) => JSON.stringify(preset.layout) === JSON.stringify(idCardLayout))
      setSelectedIdCardPreset(matchedPreset?.id || ID_CARD_PRESETS[0].id)
      setClasses(cls || [])
      setYears(yrs || [])

      const feeMap: any = {}

      ;(cls || []).forEach((schoolClass: any) => {
        const existing = (classFeeData || []).find((item: any) => item.class_id === schoolClass.id)

        feeMap[schoolClass.id] = {
          tuition: existing?.tuition_fee || 0,
          transport: existing?.transport_fee || 0,
          hostel: existing?.hostel_fee || 0,
        }
      })

      setClassFees(feeMap)
      setLoading(false)
    }

    void load()
  }, [schoolId])

  const uploadAsset = async (assetType: UploadKind, file: File | null) => {
    if (!schoolId || !file) return

    try {
      setUploadingAsset(assetType)
      const imageSize = assetType === "logo" ? null : await getImageDimensions(file)

      const body = new FormData()
      body.append("schoolId", schoolId)
      body.append("assetType", assetType)
      body.append("file", file)

      const response = await apiFetch("/api/school-assets/upload", {
        method: "POST",
        body,
      })
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Upload failed")
      }

      if (assetType === "logo") {
        setSchool((current: any) => ({ ...current, logo_url: result.url }))
        alert("Logo uploaded successfully")
        return
      }

      if (assetType === "report-card-template") {
        setReportCardTemplateUrl(result.url)
      }

      if (assetType === "certificate-template") {
        setCertificateTemplateUrl(result.url)
      }

      const info = templateInfoMap[assetType]

      setUploadingAsset(null)
      setAnalyzingLayout(assetType)

      try {
        const layoutResponse = await apiFetch("/api/ai/document-layout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kind: info.kind,
            imageUrl: result.url,
            schoolId,
            sourceWidth: imageSize?.width,
            sourceHeight: imageSize?.height,
          }),
        })

        const layoutResult = await layoutResponse.json()

        if (layoutResponse.ok && layoutResult?.layout) {
          await updateSettings(info.layoutKey, layoutResult.layout)
          alert(`${info.label} template uploaded and its layout was auto-detected by AI.`)
        } else {
          alert(`${info.label} template uploaded. AI layout detection failed.`)
        }
      } catch (error) {
        console.error("AI layout error:", error)
        alert(`${info.label} template uploaded. AI layout detection failed.`)
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

  const deleteAsset = async (assetType: UploadKind) => {
    if (!schoolId) return

    const currentUrl =
      assetType === "logo" ? school.logo_url || "" :
      assetType === "report-card-template" ? reportCardTemplateUrl :
      certificateTemplateUrl

    if (!currentUrl) {
      alert("Nothing uploaded yet")
      return
    }

    if (!confirm("Delete this uploaded asset?")) {
      return
    }

    try {
      setDeletingAsset(assetType)

      const response = await apiFetch("/api/school-assets/upload", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schoolId,
          assetType,
          currentUrl,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Delete failed")
      }

      if (assetType === "logo") {
        setSchool((current: any) => ({ ...current, logo_url: null }))
      }

      if (assetType === "report-card-template") {
        setReportCardTemplateUrl("")
      }

      if (assetType === "certificate-template") {
        setCertificateTemplateUrl("")
      }

      alert("Deleted successfully")
    } catch (error) {
      console.error(error)
      alert(error instanceof Error ? error.message : "Delete failed")
    } finally {
      setDeletingAsset(null)
    }
  }

  const saveSchool = async () => {
    const { error } = await supabase
      .from("schools")
      .update({
        name: school.name || null,
        email: school.email || null,
        phone: school.phone || null,
        address: school.address || null,
      })
      .eq("id", schoolId)

    if (error) {
      console.error(error)
      alert(error.message)
      return
    }

    alert("Saved")
  }

  const saveExam = async () => {
    await updateSettings("exam", exam)
    alert("Saved")
  }

  const saveFees = async () => {
    await updateSettings("fees", fees)
    alert("Saved")
  }

  const saveAiInstructions = async () => {
    await updateSettings("ai_system_instructions", aiInstructions)
    alert("AI instructions saved")
  }

  const applyIdCardPreset = async (presetId: string) => {
    const preset = ID_CARD_PRESETS.find((item) => item.id === presetId)

    if (!preset) return

    await updateSettings("id_card_layout", preset.layout)
    await updateSettings("id_card_preset", preset.id)
    setSelectedIdCardPreset(preset.id)
    alert(`${preset.name} applied to student ID cards`)
  }

  const saveClassFees = async () => {
    for (const classId in classFees) {
      const value = classFees[classId]

      const { error } = await supabase
        .from("class_fee_settings")
        .upsert(
          {
            class_id: classId,
            school_id: schoolId,
            tuition_fee: Number(value.tuition || 0),
            transport_fee: Number(value.transport || 0),
            hostel_fee: Number(value.hostel || 0),
          },
          {
            onConflict: "class_id,school_id",
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
    const { data } = await supabase.from("academic_years").select("*").eq("school_id", schoolId)
    setYears(data || [])
  }

  const addYear = async () => {
    if (!yearName) {
      alert("Enter year")
      return
    }

    const { error } = await supabase.from("academic_years").insert({
      id: crypto.randomUUID(),
      name: yearName,
      school_id: schoolId,
      is_active: false,
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

  if (loading) {
    return <div className="p-10 text-white">Loading...</div>
  }

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
          <div className="max-w-5xl space-y-8">
            <div className="space-y-4">
              <input className="input" placeholder="Name" value={school.name || ""} onChange={(e) => setSchool({ ...school, name: e.target.value })} />
              <input className="input" placeholder="Email" value={school.email || ""} onChange={(e) => setSchool({ ...school, email: e.target.value })} />
              <input className="input" placeholder="Phone" value={school.phone || ""} onChange={(e) => setSchool({ ...school, phone: e.target.value })} />
              <input className="input" placeholder="Address" value={school.address || ""} onChange={(e) => setSchool({ ...school, address: e.target.value })} />
              <button onClick={saveSchool} className="btn bg-blue-600">Save</button>
            </div>

            <div className="grid gap-6 lg:grid-cols-4">
              <AssetUploader
                title="School Logo"
                helpText="Upload or remove the school logo used across admin pages and printouts."
                previewUrl={school.logo_url || ""}
                status={uploadingAsset === "logo" ? "uploading" : deletingAsset === "logo" ? "deleting" : "idle"}
                disabled={uploadingAsset !== null || analyzingLayout !== null || deletingAsset !== null}
                onFileSelect={(file) => void uploadAsset("logo", file)}
                onDelete={() => void deleteAsset("logo")}
              />

              <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                <div>
                  <h3 className="text-lg font-semibold">ID Card Design</h3>
                  <p className="mt-1 text-sm text-gray-400">
                    Pick from ready-made ID card templates. Each template uses the student photo, student details, and school logo automatically.
                  </p>
                </div>
                <div className="grid gap-3">
                  {ID_CARD_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => void applyIdCardPreset(preset.id)}
                      className={`rounded-2xl border p-3 text-left transition ${
                        selectedIdCardPreset === preset.id
                          ? "border-cyan-400/40 bg-cyan-500/10"
                          : "border-white/10 bg-[#0b1220] hover:bg-white/10"
                      }`}
                    >
                      <div
                        className="mb-3 h-16 rounded-xl"
                        style={{ background: preset.accent }}
                      />
                      <div className="text-sm font-semibold text-white">{preset.name}</div>
                      <div className="mt-1 text-xs text-slate-400">{preset.description}</div>
                      {selectedIdCardPreset === preset.id && (
                        <div className="mt-2 text-xs font-semibold text-cyan-200">Active template</div>
                      )}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-400">
                  Available presets: {ID_CARD_PRESETS.length}. Logo changes from school settings apply automatically.
                </p>
              </div>

              <AssetUploader
                title="Report Card Template"
                helpText="Upload or delete the report card background used for generated report cards."
                previewUrl={reportCardTemplateUrl}
                status={
                  uploadingAsset === "report-card-template" ? "uploading" :
                  analyzingLayout === "report-card-template" ? "analyzing" :
                  deletingAsset === "report-card-template" ? "deleting" :
                  "idle"
                }
                disabled={uploadingAsset !== null || analyzingLayout !== null || deletingAsset !== null}
                onFileSelect={(file) => void uploadAsset("report-card-template", file)}
                onDelete={() => void deleteAsset("report-card-template")}
              />

              <AssetUploader
                title="Certificate Template"
                helpText="Upload or delete the certificate or transfer certificate background."
                previewUrl={certificateTemplateUrl}
                status={
                  uploadingAsset === "certificate-template" ? "uploading" :
                  analyzingLayout === "certificate-template" ? "analyzing" :
                  deletingAsset === "certificate-template" ? "deleting" :
                  "idle"
                }
                disabled={uploadingAsset !== null || analyzingLayout !== null || deletingAsset !== null}
                onFileSelect={(file) => void uploadAsset("certificate-template", file)}
                onDelete={() => void deleteAsset("certificate-template")}
              />
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <h3 className="text-lg font-semibold">AI System Instructions</h3>
              <p className="mt-2 text-sm text-gray-400">
                Save your school workflow, formatting rules, language style, and document rules here. The AI assistant,
                notices, enquiry replies, certificate drafts, and template analysis will follow these instructions.
              </p>
              <textarea
                value={aiInstructions}
                onChange={(event) => setAiInstructions(event.target.value)}
                className="mt-4 min-h-56 w-full rounded-2xl bg-[#0b1220] p-4"
                placeholder={`Example:
Use English only.
Always use the current tenant school's real name from the ERP data.
For ID cards use labels exactly as: Name, Father's Name, Course, Er. No., Mobile No.
For class values write "Class 01", "Class 02", etc.
Admission enquiry replies should be warm and short.
Notices should use this format: Title, Date, Message, Principal.
Never invent data that is not provided.`}
              />
              <div className="mt-4 flex justify-end">
                <button onClick={saveAiInstructions} className="btn bg-blue-600">
                  Save AI Instructions
                </button>
              </div>
            </div>
          </div>
        )}

        {tab === "exam" && (
          <div className="max-w-lg space-y-4">
            <input className="input" placeholder="Passing %" value={exam.passing || ""} onChange={(e) => setExam({ ...exam, passing: e.target.value })} />
            <select className="input" value={exam.grading || "percentage"} onChange={(e) => setExam({ ...exam, grading: e.target.value })}>
              <option value="percentage">Percentage</option>
              <option value="grade">Grade</option>
            </select>
            <button onClick={saveExam} className="btn bg-blue-600">Save</button>
          </div>
        )}

        {tab === "fees" && (
          <div className="space-y-6">
            <div className="max-w-lg space-y-3">
              <input className="input" placeholder="Prefix" value={fees.prefix || ""} onChange={(e) => setFees({ ...fees, prefix: e.target.value })} />
              <input className="input" placeholder="Late Fee" value={fees.late_fee || ""} onChange={(e) => setFees({ ...fees, late_fee: e.target.value })} />
              <button onClick={saveFees} className="btn bg-blue-600">Save</button>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg">Class Fees</h3>
              {classes.map((schoolClass) => (
                <div key={schoolClass.id} className="grid grid-cols-3 gap-2">
                  <input
                    className="input"
                    value={classFees[schoolClass.id]?.tuition || ""}
                    onChange={(e) => setClassFees({ ...classFees, [schoolClass.id]: { ...classFees[schoolClass.id], tuition: e.target.value } })}
                    placeholder={`${schoolClass.name} Tuition`}
                  />
                  <input
                    className="input"
                    value={classFees[schoolClass.id]?.transport || ""}
                    onChange={(e) => setClassFees({ ...classFees, [schoolClass.id]: { ...classFees[schoolClass.id], transport: e.target.value } })}
                    placeholder="Transport"
                  />
                  <input
                    className="input"
                    value={classFees[schoolClass.id]?.hostel || ""}
                    onChange={(e) => setClassFees({ ...classFees, [schoolClass.id]: { ...classFees[schoolClass.id], hostel: e.target.value } })}
                    placeholder="Hostel"
                  />
                </div>
              ))}
              <button onClick={saveClassFees} className="btn bg-green-600">Save Class Fees</button>
            </div>
          </div>
        )}

        {tab === "academic" && (
          <div className="max-w-lg space-y-6">
            <h2 className="text-xl font-semibold">Academic Year</h2>

            <div className="flex gap-3">
              <input placeholder="2024-2025" value={yearName} onChange={(e) => setYearName(e.target.value)} className="input" />
              <button onClick={addYear} className="btn bg-green-600">Add</button>
            </div>

            {years.map((year) => (
              <div key={year.id} className="flex justify-between rounded-xl bg-white/5 p-4">
                <div>
                  <p>{year.name}</p>
                  {year.is_active && <span className="text-sm text-green-400">Active</span>}
                </div>

                <div className="flex gap-3">
                  {!year.is_active && <button onClick={() => void setActiveYear(year.id)}>Active</button>}
                  <button onClick={() => void deleteYear(year.id)}>Delete</button>
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
  onFileSelect,
  onDelete,
}: {
  title: string
  helpText: string
  previewUrl: string
  status: "idle" | "uploading" | "analyzing" | "deleting"
  disabled: boolean
  onFileSelect: (file: File | null) => void
  onDelete: () => void
}) {
  const statusLabel =
    status === "uploading" ? "Uploading..." :
    status === "analyzing" ? "AI analyzing template..." :
    status === "deleting" ? "Deleting..." :
    previewUrl ? "Replace image" :
    "Choose image"

  const isBusy = status !== "idle"

  return (
    <div className={`space-y-3 rounded-2xl border p-4 transition ${isBusy ? "border-cyan-400/30 bg-cyan-500/5" : "border-white/10 bg-white/5"}`}>
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-gray-400">{helpText}</p>
      </div>

      {isBusy ? (
        <div className="flex h-40 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-cyan-400/30 text-sm text-cyan-300">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
          <span>
            {status === "analyzing" ? "AI is reading your template..." : status === "deleting" ? "Removing uploaded file..." : "Uploading..."}
          </span>
        </div>
      ) : previewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={previewUrl} alt={title} className="h-40 w-full rounded-xl border border-white/10 object-cover" />
      ) : (
        <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-white/10 text-sm text-gray-500">
          No image uploaded yet
        </div>
      )}

      <label className={`block ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}>
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
        <button
          type="button"
          onClick={onDelete}
          className="w-full rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-100 hover:bg-red-500/15"
        >
          Delete Uploaded Asset
        </button>
      )}
    </div>
  )
}
