"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { getSchoolId } from "@/lib/school"
import { getSettings, updateSettings } from "@/lib/settings"
import { apiFetch } from "@/lib/api-client"
import { ID_CARD_PRESETS } from "@/lib/document-layouts"
import WhatsAppConnect from "./WhatsAppConnect"
import BulkImportPage from "../import/page"
import ThemePage from "./appearance/page"
import AiAssistantPage from "../ai-assistant/page"

type UploadKind = "logo" | "report-card-template" | "certificate-template"
type SettingsTab = "school" | "exam" | "fees" | "academic" | "whatsapp" | "bulk" | "theme" | "ai" | "about"
const validSettingsTabs: SettingsTab[] = ["school", "exam", "fees", "academic", "whatsapp", "bulk", "theme", "ai", "about"]

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
  const [tab, setTab] = useState<SettingsTab>("school")
  const [schoolId, setSchoolId] = useState<string | null>(null)

  const [school, setSchool] = useState<any>({})
  const [exam, setExam] = useState<any>({})
  const [fees, setFees] = useState<any>({})
  const [classes, setClasses] = useState<any[]>([])
  const [classFees, setClassFees] = useState<any>({})
  const [classFeeLoadError, setClassFeeLoadError] = useState("")
  const [years, setYears] = useState<any[]>([])
  const [yearName, setYearName] = useState("")
  const [reportCardTemplateUrl, setReportCardTemplateUrl] = useState("")
  const [certificateTemplateUrl, setCertificateTemplateUrl] = useState("")
  const [aiInstructions, setAiInstructions] = useState("")
  const [selectedIdCardPreset, setSelectedIdCardPreset] = useState(ID_CARD_PRESETS[0].id)
  const [uploadingAsset, setUploadingAsset] = useState<UploadKind | null>(null)
  const [analyzingLayout, setAnalyzingLayout] = useState<UploadKind | null>(null)
  const [deletingAsset, setDeletingAsset] = useState<UploadKind | null>(null)
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void getSchoolId().then(setSchoolId)
  }, [])

  useEffect(() => {
    const requestedTab = new URLSearchParams(window.location.search).get("tab") as SettingsTab | null

    if (requestedTab && validSettingsTabs.includes(requestedTab)) {
      setTab(requestedTab)
    }
  }, [])

  useEffect(() => {
    if (!schoolId) return

    const load = async () => {
      setLoading(true)

      setClassFeeLoadError("")

      const [
        { data: schoolData },
        examSettings,
        feeSettings,
        reportTemplate,
        certificateTemplate,
        aiText,
        idCardLayout,
        classResult,
        classFeeResult,
        { data: yrs }
      ] =
        await Promise.all([
          supabase.from("schools").select("*").eq("id", schoolId).single(),
          getSettings("exam"),
          getSettings("fees"),
          getSettings("report_card_template"),
          getSettings("certificate_template"),
          getSettings("ai_system_instructions"),
          getSettings("id_card_layout"),
          supabase.from("classes").select("id,name").eq("school_id", schoolId).order("name"),
          supabase.from("class_fee_settings").select("*").eq("school_id", schoolId),
          supabase.from("academic_years").select("*").eq("school_id", schoolId).order("created_at", { ascending: false }),
        ])

      if (classResult.error) {
        console.error("Failed to load classes for fee settings:", classResult.error)
        setClassFeeLoadError(classResult.error.message)
      }

      if (classFeeResult.error) {
        console.error("Failed to load class fee settings:", classFeeResult.error)
        setClassFeeLoadError(classFeeResult.error.message)
      }

      const loadedClasses = classResult.error ? [] : classResult.data || []
      const loadedClassFees = classFeeResult.error ? [] : classFeeResult.data || []

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
      setClasses(loadedClasses)
      setYears(yrs || [])

      const feeMap: any = {}

      loadedClasses.forEach((schoolClass: any) => {
        const existing = loadedClassFees.find((item: any) => item.class_id === schoolClass.id)

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

  const persistClassFees = async () => {
    if (!schoolId) {
      alert("School not loaded")
      return false
    }

    if (classes.length === 0) {
      alert("Classes are not loaded. Please refresh before saving class fees.")
      return false
    }

    const { error: deleteError } = await supabase
      .from("class_fee_settings")
      .delete()
      .eq("school_id", schoolId)

    if (deleteError) {
      console.error(deleteError)
      alert(deleteError.message)
      return false
    }

    const rows = Object.entries(classFees).map(([classId, value]: [string, any]) => ({
      class_id: classId,
      school_id: schoolId,
      tuition_fee: Number(value.tuition || 0),
      transport_fee: Number(value.transport || 0),
      hostel_fee: Number(value.hostel || 0),
    }))

    if (rows.length === 0) {
      return true
    }

    const { error: insertError } = await supabase
      .from("class_fee_settings")
      .insert(rows)

    if (insertError) {
      console.error(insertError)
      alert(insertError.message)
      return false
    }

    return true
  }

  const saveFees = async () => {
    await updateSettings("fees", fees)

    const classFeesSaved = await persistClassFees()
    if (!classFeesSaved) return

    alert("Fee settings saved")
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
    const classFeesSaved = await persistClassFees()
    if (!classFeesSaved) return

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

  const deleteAccount = async () => {
    const confirmed = window.prompt('Type DELETE to permanently remove this login account.')

    if (confirmed !== "DELETE") {
      alert("Account deletion cancelled")
      return
    }

    try {
      setDeletingAccount(true)

      const response = await apiFetch("/api/auth/delete-account", {
        method: "DELETE",
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to delete account")
      }

      await supabase.auth.signOut({ scope: "local" })
      window.location.href = "/login"
    } catch (error) {
      console.error("Delete account error:", error)
      alert(error instanceof Error ? error.message : "Failed to delete account")
      setDeletingAccount(false)
    }
  }

  if (loading) {
    return <div className="p-4 text-white sm:p-6">Loading...</div>
  }

  const tabs: Array<{ id: SettingsTab; label: string }> = [
    { id: "school", label: "School" },
    { id: "exam", label: "Exam" },
    { id: "fees", label: "Fees" },
    { id: "academic", label: "Academic Year" },
    { id: "whatsapp", label: "WhatsApp" },
    { id: "bulk", label: "Bulk Import" },
    { id: "theme", label: "Theme" },
    { id: "ai", label: "AI Assistant" },
    { id: "about", label: "About" },
  ]

  const tabButtonClass = (id: SettingsTab) =>
    `shrink-0 rounded-xl border px-4 py-2.5 text-sm font-semibold transition md:w-full md:text-left ${
      tab === id
        ? "border-cyan-300/40 bg-cyan-400/15 text-cyan-100 shadow-[0_12px_30px_rgba(8,145,178,0.14)]"
        : "border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
    }`

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 text-white md:flex-row md:gap-6">
      <div className="rounded-2xl border border-white/10 bg-[#0b1a33]/90 p-3 md:sticky md:top-4 md:h-fit md:w-64 md:shrink-0 md:p-4">
        <div className="mb-3 px-1 md:px-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Settings</p>
          <h1 className="mt-1 text-lg font-bold text-white">Settings</h1>
        </div>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 md:mx-0 md:flex-col md:overflow-visible md:px-0 md:pb-0">
          {tabs.map((item) => (
            <button key={item.id} type="button" onClick={() => setTab(item.id)} className={tabButtonClass(item.id)}>
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-5 md:p-8">
        {tab === "school" && (
          <div className="space-y-6 md:space-y-8">
            <div className="space-y-4">
              <input className="input" placeholder="Name" value={school.name || ""} onChange={(e) => setSchool({ ...school, name: e.target.value })} />
              <input className="input" placeholder="Email" value={school.email || ""} onChange={(e) => setSchool({ ...school, email: e.target.value })} />
              <input className="input" placeholder="Phone" value={school.phone || ""} onChange={(e) => setSchool({ ...school, phone: e.target.value })} />
              <input className="input" placeholder="Address" value={school.address || ""} onChange={(e) => setSchool({ ...school, address: e.target.value })} />
              <button onClick={saveSchool} className="btn bg-blue-600">Save</button>
            </div>

            {school.subdomain && (
              <div className="rounded-3xl border border-cyan-400/20 bg-cyan-400/5 p-5">
                <h3 className="text-lg font-semibold text-white">Admission Enquiry Form</h3>
                <p className="mt-1 text-sm text-gray-400">
                  Share this link with parents so they can submit admission enquiries directly for your school.
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center">
                  <code className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap rounded-xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm text-cyan-300">
                    {`https://erp.naysha.online/admission-enquiry?school=${school.subdomain}`}
                  </code>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(`https://erp.naysha.online/admission-enquiry?school=${school.subdomain}`)
                      alert("Link copied!")
                    }}
                    className="rounded-xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-3 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-500/20"
                  >
                    Copy
                  </button>
                  <a
                    href={`/admission-enquiry?school=${school.subdomain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-sm font-semibold text-slate-200 transition hover:bg-white/10"
                  >
                    Open
                  </a>
                </div>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
Notice messages must be 30-40 words only.
Never invent data that is not provided.`}
              />
              <div className="mt-4 flex">
                <button onClick={saveAiInstructions} className="btn bg-blue-600">
                  Save AI Instructions
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-5">
              <h3 className="text-lg font-semibold text-red-100">Danger Zone</h3>
              <p className="mt-2 text-sm text-red-100/80">
                Delete this login account if you want to remove access for the current signed-in user. School ERP data stays in the database, but this account and its profile will be removed.
              </p>
              <div className="mt-4 flex">
                <button
                  type="button"
                  onClick={() => void deleteAccount()}
                  disabled={deletingAccount}
                  className="btn bg-red-600 text-white disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {deletingAccount ? "Deleting Account..." : "Delete Account"}
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
              {classFeeLoadError && (
                <div className="rounded-xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-100">
                  Could not load classes: {classFeeLoadError}
                </div>
              )}
              {!classFeeLoadError && classes.length === 0 && (
                <div className="rounded-xl border border-yellow-400/20 bg-yellow-500/10 p-4 text-sm text-yellow-100">
                  No classes found for this school yet. Add classes first, then come back to set class fees.
                </div>
              )}
              {classes.map((schoolClass) => (
                <div key={schoolClass.id} className="grid gap-2 sm:grid-cols-3">
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

            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
              <input placeholder="2024-2025" value={yearName} onChange={(e) => setYearName(e.target.value)} className="input" />
              <button onClick={addYear} className="btn bg-green-600">Add</button>
            </div>

            {years.map((year) => (
              <div key={year.id} className="grid gap-4 rounded-xl bg-white/5 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <div>
                  <p>{year.name}</p>
                  {year.is_active && <span className="text-sm text-green-400">Active</span>}
                </div>

                <div className="flex flex-wrap gap-3">
                  {!year.is_active && <button onClick={() => void setActiveYear(year.id)}>Active</button>}
                  <button onClick={() => void deleteYear(year.id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "whatsapp" && (
          <div className="py-2">
            <WhatsAppConnect />
          </div>
        )}

        {tab === "about" && (
          <div className="max-w-2xl space-y-6">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
                About
              </p>
              <h1 className="mt-2 text-3xl font-bold">NaySha EduCore</h1>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                NaySha EduCore is a school ERP platform for academic, administrative,
                attendance, examination, fee, and parent communication workflows.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-slate-400">Product company</p>
              <p className="mt-1 text-xl font-semibold text-white">Groenics</p>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                NaySha EduCore is a product of Groenics.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-slate-400">Version</p>
              <p className="mt-1 text-lg font-semibold text-white">1.0</p>
            </div>
          </div>
        )}

        {tab === "bulk" && (
          <div className="-m-4 sm:-m-5 md:-m-8">
            <BulkImportPage />
          </div>
        )}

        {tab === "theme" && (
          <div className="pb-4">
            <ThemePage />
          </div>
        )}

        {tab === "ai" && (
          <div className="-m-4 sm:-m-5 md:-m-8">
            <AiAssistantPage />
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
