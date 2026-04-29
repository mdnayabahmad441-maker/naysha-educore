"use client"

import { useRef, useState } from "react"
import Papa from "papaparse"
import Button from "@/components/ui/Button"
import { apiFetch } from "@/lib/api-client"

type ImportType = "students" | "teachers" | "classes"

const TEMPLATES: Record<ImportType, { headers: string[]; example: string[] }> = {
  students: {
    headers: [
      "Name",
      "Roll Number",
      "Class",
      "Student Email",
      "Student Type",
      "Father Name",
      "Mother Name",
      "Parent Email",
      "Parent Phone",
      "Date of Birth",
      "Address",
    ],
    example: [
      "Riya Sharma",
      "12",
      "Class 5A",
      "riya@example.com",
      "day_scholar",
      "Ramesh Sharma",
      "Sunita Sharma",
      "parent@example.com",
      "9876543210",
      "2012-05-15",
      "123 Main Street, City",
    ],
  },
  teachers: {
    headers: ["Name", "Email", "Phone", "Subject", "Qualification", "Experience Years"],
    example: ["John Smith", "john@example.com", "9876543210", "Mathematics", "B.Sc", "5"],
  },
  classes: {
    headers: ["Name", "Capacity", "Teacher Name"],
    example: ["Class 5A", "40", "John Smith"],
  },
}

export default function ImportPage() {
  const [importType, setImportType] = useState<ImportType>("students")
  const [allRows, setAllRows] = useState<string[][]>([])
  const [preview, setPreview] = useState<string[][]>([])
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const parseCsv = (text: string): string[][] => {
    const result = Papa.parse<string[]>(text, {
      skipEmptyLines: true,
    })
    return result.data as string[][]
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setStatus({ type: "info", text: "Reading file…" })

    try {
      const text = await file.text()
      const rows = parseCsv(text)
      setAllRows(rows)
      setPreview(rows.slice(0, 6))
      setStatus(null)
    } catch {
      setStatus({ type: "error", text: "Could not read file. Make sure it is a valid CSV." })
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSheetUrl = async (url: string) => {
    if (!url.trim()) return

    const sheetId = url.match(/\/d\/([a-zA-Z0-9-_]+)/)?.[1]
    if (!sheetId) {
      setStatus({ type: "error", text: "Invalid Google Sheets URL." })
      return
    }

    setLoading(true)
    setStatus({ type: "info", text: "Fetching Google Sheet…" })

    try {
      const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`
      const response = await fetch(csvUrl)
      const text = await response.text()
      const rows = parseCsv(text)
      setAllRows(rows)
      setPreview(rows.slice(0, 6))
      setStatus(null)
    } catch {
      setStatus({ type: "error", text: "Could not fetch sheet. Make sure it is publicly shared." })
    } finally {
      setLoading(false)
    }
  }

  const downloadTemplate = () => {
    const t = TEMPLATES[importType]
    const csv = [t.headers, t.example].map((row) => row.map((v) => `"${v}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${importType}_template.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = async () => {
    if (allRows.length < 2) {
      alert("Upload a file with at least one data row.")
      return
    }

    setLoading(true)
    setStatus({ type: "info", text: `Importing ${allRows.length - 1} records…` })

    try {
      const response = await apiFetch("/api/bulk-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: importType, data: allRows }),
      })

      const result = await response.json()

      if (result.imported > 0 || result.success) {
        const errNote = result.errors?.length
          ? ` (${result.errors.length} skipped — see details below)`
          : ""
        setStatus({ type: "success", text: `Imported ${result.imported} records successfully.${errNote}` })

        if (result.errors?.length) {
          console.warn("[bulk-import] row errors:", result.errors)
        }

        setAllRows([])
        setPreview([])
        if (fileInputRef.current) fileInputRef.current.value = ""
      } else {
        setStatus({
          type: "error",
          text: result.error || result.errors?.[0] || "Import failed.",
        })
      }
    } catch {
      setStatus({ type: "error", text: "Network error during import." })
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setAllRows([])
    setPreview([])
    setStatus(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const headers = preview[0] ?? []
  const dataRows = preview.slice(1)

  return (
    <div className="p-6 md:p-10 text-white max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Bulk Import</h1>
        <p className="mt-1 text-gray-400">Import students, teachers, or classes from CSV or Google Sheets.</p>
      </div>

      {/* TYPE SELECTOR */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-5">
        <p className="mb-3 text-sm font-medium text-slate-300">Select Data Type</p>
        <div className="flex gap-3">
          {(["students", "teachers", "classes"] as ImportType[]).map((t) => (
            <button
              key={t}
              onClick={() => { setImportType(t); reset() }}
              className={`rounded-lg px-4 py-2 capitalize font-medium transition ${
                importType === t ? "bg-blue-600" : "bg-white/10 hover:bg-white/20"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* UPLOAD OPTIONS */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <h3 className="text-base font-semibold mb-3">Upload CSV / Excel</h3>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileUpload}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm"
          />
          <p className="mt-2 text-xs text-gray-400">Supports CSV format. Use the template below.</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <h3 className="text-base font-semibold mb-3">Google Sheets URL</h3>
          <input
            type="text"
            placeholder="Paste Google Sheet URL…"
            onChange={(e) => handleGoogleSheetUrl(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-[#0b1220] px-4 py-2 text-sm outline-none focus:border-blue-500"
          />
          <p className="mt-2 text-xs text-gray-400">Sheet must be publicly viewable.</p>
        </div>
      </div>

      {/* DOWNLOAD TEMPLATE */}
      <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 px-5 py-4">
        <div className="flex-1">
          <p className="text-sm font-medium">Download Template</p>
          <p className="text-xs text-slate-400 mt-0.5">
            {importType === "students"
              ? "Template includes: Name, Roll Number, Class, Student Email, Student Type (day_scholar / day_scholar_transport / hosteler), Father Name, Mother Name, Parent Email, Parent Phone, Date of Birth, Address"
              : importType === "teachers"
              ? "Template includes: Name, Email, Phone, Subject, Qualification, Experience Years"
              : "Template includes: Name, Capacity, Teacher Name"}
          </p>
        </div>
        <Button color="blue" onClick={downloadTemplate}>
          Download Template
        </Button>
      </div>

      {/* STATUS */}
      {status && (
        <div
          className={`rounded-xl px-4 py-3 text-sm ${
            status.type === "success"
              ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/20"
              : status.type === "error"
              ? "bg-red-500/15 text-red-300 border border-red-500/20"
              : "bg-blue-500/15 text-blue-300 border border-blue-500/20"
          }`}
        >
          {status.text}
        </div>
      )}

      {/* PREVIEW TABLE */}
      {preview.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold">
              Preview — {allRows.length - 1} row{allRows.length - 1 !== 1 ? "s" : ""} total
              {allRows.length > 6 ? ` (showing first 5)` : ""}
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs whitespace-nowrap">
              <thead className="bg-white/10">
                <tr>
                  {headers.map((col, i) => (
                    <th key={i} className="px-3 py-2 text-left font-medium text-slate-300">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dataRows.map((row, i) => (
                  <tr key={i} className="border-t border-white/5">
                    {row.map((cell, j) => (
                      <td key={j} className="px-3 py-2 text-slate-200">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-5 flex gap-3">
            <Button color="green" onClick={handleImport} disabled={loading}>
              {loading ? "Importing…" : `Import ${allRows.length - 1} Records`}
            </Button>
            <Button onClick={reset} disabled={loading}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
