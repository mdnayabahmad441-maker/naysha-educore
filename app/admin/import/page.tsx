"use client"

import { useState } from "react"
import { getSchoolId } from "@/lib/school"
import Button from "@/components/ui/Button"

type ImportData = {
  type: "students" | "teachers" | "classes"
  file?: File
  googleSheetUrl?: string
  preview: any[]
  mapping: Record<string, string>
}

export default function ImportPage() {
  const [importData, setImportData] = useState<Partial<ImportData>>({
    type: "students",
    preview: [],
    mapping: {}
  })
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState("")

  // Sample templates
  const templates = {
    students: [
      ["Name", "Roll Number", "Class", "Email", "Phone", "Father Name", "Address"],
      ["John Doe", "1", "10A", "john@example.com", "9876543210", "Father Name", "Address"]
    ],
    teachers: [
      ["Name", "Email", "Phone", "Subject", "Qualification", "Experience Years"],
      ["John Smith", "john@example.com", "9876543210", "Mathematics", "B.Sc", "5"]
    ],
    classes: [
      ["Name", "Capacity", "Teacher Name"],
      ["10A", "40", "John Smith"]
    ]
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setStatus("Reading file...")

    try {
      const text = await file.text()
      const lines = text.split("\n").filter(line => line.trim())
      const data = lines.map(line =>
        line.split(",").map(cell => cell.trim())
      )

      setImportData(prev => ({
        ...prev,
        file,
        preview: data.slice(0, 5)
      }))
      setStatus("")
    } catch (err) {
      setStatus("Error reading file")
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSheetUrl = async (url: string) => {
    if (!url) return

    setLoading(true)
    setStatus("Fetching Google Sheet...")

    try {
      // Extract sheet ID from URL
      const sheetId = url.match(/\/d\/([a-zA-Z0-9-_]+)/)?.[1]
      if (!sheetId) {
        setStatus("Invalid Google Sheets URL")
        return
      }

      // Fetch CSV export from Google Sheets
      const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`
      const response = await fetch(csvUrl)
      const text = await response.text()

      const lines = text.split("\n").filter(line => line.trim())
      const data = lines.map(line =>
        line.split(",").map(cell => cell.trim().replace(/^"|"$/g, ""))
      )

      setImportData(prev => ({
        ...prev,
        googleSheetUrl: url,
        preview: data.slice(0, 5)
      }))
      setStatus("")
    } catch (err) {
      setStatus("Error fetching Google Sheet. Ensure it's publicly shared.")
    } finally {
      setLoading(false)
    }
  }

  const downloadTemplate = () => {
    const data = templates[importData.type as keyof typeof templates]
    const csv = data.map(row => row.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${importData.type}_template.csv`
    a.click()
  }

  const handleImport = async () => {
    if (!importData.preview || importData.preview.length === 0) {
      alert("Please upload a file or provide a Google Sheet URL")
      return
    }

    const schoolId = await getSchoolId()
    if (!schoolId) {
      alert("School not found")
      return
    }

    setLoading(true)
    setStatus("Importing data...")

    try {
      const response = await fetch("/api/bulk-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: importData.type,
          data: importData.preview,
          schoolId
        })
      })

      const result = await response.json()

      if (result.success) {
        setStatus(`✅ Imported ${result.imported} records successfully`)
        setTimeout(() => {
          setImportData({ type: "students", preview: [], mapping: {} })
          setStatus("")
        }, 2000)
      } else {
        setStatus(`❌ Import failed: ${result.error}`)
      }
    } catch (err) {
      setStatus("Error importing data")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 md:p-10 text-white max-w-6xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Bulk Import</h1>
      <p className="text-gray-400">
        Import students, teachers, or classes from Excel, CSV, or Google Sheets
      </p>

      {/* TYPE SELECTOR */}
      <div className="bg-white/10 p-6 rounded-xl">
        <label className="block text-sm font-medium mb-3">Select Data Type</label>
        <div className="flex gap-3">
          {["students", "teachers", "classes"].map(type => (
            <button
              key={type}
              onClick={() => setImportData(prev => ({ ...prev, type: type as any, preview: [] }))}
              className={`px-4 py-2 rounded-lg capitalize font-medium transition ${
                importData.type === type
                  ? "bg-blue-600"
                  : "bg-white/10 hover:bg-white/20"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* IMPORT OPTIONS */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* EXCEL/CSV UPLOAD */}
        <div className="bg-white/10 p-6 rounded-xl">
          <h3 className="text-lg font-semibold mb-4">📄 Upload Excel/CSV</h3>
          <div className="space-y-3">
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileUpload}
              className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20"
            />
            <p className="text-sm text-gray-400">
              Supports: CSV, XLSX, XLS formats
            </p>
          </div>
        </div>

        {/* GOOGLE SHEETS */}
        <div className="bg-white/10 p-6 rounded-xl">
          <h3 className="text-lg font-semibold mb-4">📊 Google Sheets</h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Paste Google Sheet URL"
              onChange={(e) => {
                if (e.target.value) {
                  handleGoogleSheetUrl(e.target.value)
                }
              }}
              className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 outline-none focus:border-blue-500"
            />
            <p className="text-sm text-gray-400">
              Sheet must be publicly shared
            </p>
          </div>
        </div>
      </div>

      {/* DOWNLOAD TEMPLATE */}
      <div className="flex gap-3">
        <Button color="blue" onClick={downloadTemplate}>
          📥 Download {importData.type} Template
        </Button>
      </div>

      {/* STATUS */}
      {status && (
        <div className={`p-4 rounded-lg ${
          status.includes("❌") ? "bg-red-500/20 text-red-300" : "bg-blue-500/20 text-blue-300"
        }`}>
          {status}
        </div>
      )}

      {/* PREVIEW */}
      {importData.preview && importData.preview.length > 0 && (
        <div className="bg-white/10 p-6 rounded-xl">
          <h3 className="text-lg font-semibold mb-4">Preview (First 5 rows)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/10">
                <tr>
                  {importData.preview[0]?.map((col: string, i: number) => (
                    <th key={i} className="p-2 text-left">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {importData.preview.slice(1).map((row: string[], i: number) => (
                  <tr key={i} className="border-t border-white/10">
                    {row.map((col: string, j: number) => (
                      <td key={j} className="p-2">
                        {col}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex gap-3">
            <Button color="green" onClick={handleImport} disabled={loading}>
              {loading ? "Importing..." : "Import Data"}
            </Button>
            <Button
              onClick={() => setImportData(prev => ({ ...prev, preview: [] }))}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
