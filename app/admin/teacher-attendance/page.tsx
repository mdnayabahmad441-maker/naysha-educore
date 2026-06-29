"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { getSchoolId } from "@/lib/school"
import { apiFetch } from "@/lib/api-client"

type Row = {
  id: string
  teacher_id: string
  date: string
  status: string
  check_in_time: string | null
  check_out_time: string | null
  distance_meters: number | null
  teacher_name?: string | null
  teacher_email?: string | null
}

const STATUS_COLORS: Record<string, string> = {
  present: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  late:    "text-amber-400  bg-amber-400/10  border-amber-400/20",
  absent:  "text-red-400    bg-red-400/10    border-red-400/20",
}

const TARGET_GPS_ACCURACY_METERS = 50
const MAX_SCHOOL_GPS_ACCURACY_METERS = 100

function getGpsErrorMessage(error?: GeolocationPositionError) {
  if (typeof window !== "undefined" && !window.isSecureContext) {
    return "Location needs HTTPS. Localhost works for testing, but the live app must use HTTPS."
  }

  if (!error) return "Could not get location. Please try again."

  if (error.code === error.PERMISSION_DENIED) {
    return "Location permission is blocked. Click the site icon in the address bar and allow Location, then try again."
  }
  if (error.code === error.POSITION_UNAVAILABLE) {
    return "Your device could not find a location. Turn on device location/GPS and try again."
  }
  if (error.code === error.TIMEOUT) {
    return "Location request timed out. Move near a window or try again."
  }

  return error.message || "Could not get location. Please try again."
}

function getBestLocation(
  onSuccess: (coords: { lat: number; lng: number; accuracy: number }) => void,
  onError: (message: string) => void
) {
  if (!navigator.geolocation) {
    onError("GPS is not supported on this browser or device.")
    return
  }

  let best: GeolocationPosition | null = null
  let settled = false
  let watchId: number | null = null

  const finish = () => {
    if (settled) return
    settled = true
    if (watchId !== null) navigator.geolocation.clearWatch(watchId)

    if (!best) {
      onError("Could not get location. Please try again.")
      return
    }

    onSuccess({
      lat: best.coords.latitude,
      lng: best.coords.longitude,
      accuracy: Math.round(best.coords.accuracy),
    })
  }

  watchId = navigator.geolocation.watchPosition(
    (pos) => {
      if (!best || pos.coords.accuracy < best.coords.accuracy) {
        best = pos
      }
      if (pos.coords.accuracy <= TARGET_GPS_ACCURACY_METERS) {
        finish()
      }
    },
    (error) => {
      if (best) {
        finish()
      } else {
        if (watchId !== null) navigator.geolocation.clearWatch(watchId)
        settled = true
        onError(getGpsErrorMessage(error))
      }
    },
    { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
  )

  window.setTimeout(finish, 12000)
}

function fmt(iso: string | null) {
  if (!iso) return "--"
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

function monthStart(m: string) { return `${m}-01` }
function monthEnd(m: string) {
  const [y, mo] = m.split("-").map(Number)
  return new Date(y, mo, 0).toISOString().slice(0, 10)
}

export default function AdminTeacherAttendancePage() {
  const [records, setRecords] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(today())
  const [viewMode, setViewMode] = useState<"day" | "month">("day")
  const [selectedMonth, setSelectedMonth] = useState(today().slice(0, 7))

  // School location setup
  const [schoolLat, setSchoolLat] = useState("")
  const [schoolLng, setSchoolLng] = useState("")
  const [checkInStart, setCheckInStart] = useState("07:00")
  const [checkInEnd, setCheckInEnd] = useState("10:30")
  const [lateAfter, setLateAfter] = useState("09:00")
  const [savingLocation, setSavingLocation] = useState(false)
  const [locationSaved, setLocationSaved] = useState(false)
  const [gettingGps, setGettingGps] = useState(false)
  const [gpsError, setGpsError] = useState("")
  const [setupError, setSetupError] = useState("")
  const [recordsError, setRecordsError] = useState("")

  useEffect(() => {
    loadSchoolSettings()
  }, [])

  useEffect(() => {
    loadRecords()
  }, [viewMode, selectedDate, selectedMonth])

  async function loadSchoolSettings() {
    setSetupError("")
    const schoolId = await getSchoolId()
    if (!schoolId) return
    const { data, error } = await supabase
      .from("schools")
      .select("latitude, longitude, check_in_start, check_in_end, late_after")
      .eq("id", schoolId)
      .maybeSingle()

    if (error) {
      setSetupError(
        error.message.includes("latitude") || error.message.includes("schema cache")
          ? "Teacher attendance setup is not installed yet. Run teacher_attendance_schema.sql in Supabase SQL Editor."
          : error.message
      )
      return
    }

    if (data) {
      setSchoolLat(data.latitude?.toString() ?? "")
      setSchoolLng(data.longitude?.toString() ?? "")
      setCheckInStart(data.check_in_start?.slice(0, 5) ?? "07:00")
      setCheckInEnd(data.check_in_end?.slice(0, 5) ?? "10:30")
      setLateAfter(data.late_after?.slice(0, 5) ?? "09:00")
    }
  }

  async function loadRecords() {
    setLoading(true)
    setRecordsError("")

    const params = new URLSearchParams({
      view: viewMode,
      date: selectedDate,
      month: selectedMonth,
    })

    const response = await apiFetch(`/api/admin/teacher-attendance?${params.toString()}`)
    const result = await response.json().catch(() => ({}))

    if (!response.ok || !result.success) {
      setRecordsError(result.error || "Could not load teacher attendance records.")
      setRecords([])
      setLoading(false)
      return
    }

    setRecords((result.records as Row[]) || [])
    setLoading(false)
  }

  const getSchoolGps = () => {
    setGpsError("")
    setGettingGps(true)
    getBestLocation(
      ({ lat, lng, accuracy }) => {
        if (accuracy > MAX_SCHOOL_GPS_ACCURACY_METERS) {
          setGpsError(`School GPS accuracy is too low (±${accuracy}m). Use a phone at the school location or enter the exact coordinates manually.`)
          setGettingGps(false)
          return
        }
        setSchoolLat(lat.toFixed(8))
        setSchoolLng(lng.toFixed(8))
        setGpsError("")
        setGettingGps(false)
      },
      (message) => {
        setGpsError(message)
        setGettingGps(false)
      }
    )
  }

  const saveSchoolLocation = async () => {
    const lat = parseFloat(schoolLat)
    const lng = parseFloat(schoolLng)
    if (isNaN(lat) || isNaN(lng)) { alert("Enter valid coordinates"); return }

    setSavingLocation(true)
    const schoolId = await getSchoolId()
    if (!schoolId) { setSavingLocation(false); return }

    const { error } = await supabase
      .from("schools")
      .update({
        latitude: lat,
        longitude: lng,
        check_in_start: checkInStart,
        check_in_end: checkInEnd,
        late_after: lateAfter,
      })
      .eq("id", schoolId)

    setSavingLocation(false)
    if (error) {
      setSetupError(
        error.message.includes("latitude") || error.message.includes("schema cache")
          ? "Teacher attendance setup is not installed yet. Run teacher_attendance_schema.sql in Supabase SQL Editor."
          : error.message
      )
      return
    }
    setLocationSaved(true)
    setGpsError("")
    setTimeout(() => setLocationSaved(false), 3000)
  }

  const summary = {
    present: records.filter(r => r.status === "present").length,
    late:    records.filter(r => r.status === "late").length,
    absent:  records.filter(r => r.status === "absent").length,
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-10 text-white">
      <h1 className="text-2xl font-semibold">Teacher Attendance</h1>

      {/* School Location Setup */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400">School Location &amp; Timing</h2>
        <p className="text-xs text-slate-500">Set the school GPS coordinates so teachers can verify their location within 100m.</p>

        {setupError && (
          <div className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
            <p className="font-semibold">Setup required</p>
            <p className="mt-1">{setupError}</p>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-slate-400">Latitude</label>
            <input
              value={schoolLat}
              onChange={e => setSchoolLat(e.target.value)}
              placeholder="e.g. 28.6139"
              className="w-full rounded-xl border border-white/10 bg-[#08111f] px-4 py-2.5 text-sm text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">Longitude</label>
            <input
              value={schoolLng}
              onChange={e => setSchoolLng(e.target.value)}
              placeholder="e.g. 77.2090"
              className="w-full rounded-xl border border-white/10 bg-[#08111f] px-4 py-2.5 text-sm text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">Check-in Opens</label>
            <input type="time" value={checkInStart} onChange={e => setCheckInStart(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#08111f] px-4 py-2.5 text-sm text-white" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">Mark Late After</label>
            <input type="time" value={lateAfter} onChange={e => setLateAfter(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#08111f] px-4 py-2.5 text-sm text-white" />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs text-slate-400">Check-in Closes (after this = not allowed)</label>
            <input type="time" value={checkInEnd} onChange={e => setCheckInEnd(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#08111f] px-4 py-2.5 text-sm text-white" />
          </div>
        </div>

        <div className="flex gap-3 flex-wrap">
          <button
            onClick={getSchoolGps}
            disabled={gettingGps}
            className="rounded-xl border border-cyan-400/20 bg-cyan-500/10 px-5 py-2.5 text-sm font-semibold text-cyan-100 hover:bg-cyan-500/20 disabled:opacity-60"
          >
            {gettingGps ? "Getting Best GPS..." : "Use My Current Location"}
          </button>
          <button
            onClick={saveSchoolLocation}
            disabled={savingLocation}
            className="rounded-xl bg-[linear-gradient(135deg,#10b981,#0f766e)] px-5 py-2.5 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-60"
          >
            {savingLocation ? "Saving..." : locationSaved ? "Saved!" : "Save Settings"}
          </button>
        </div>

        {gpsError && !(schoolLat && schoolLng) && (
          <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
            {gpsError}
          </div>
        )}
      </div>

      {/* View Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-xl border border-white/10 overflow-hidden">
          <button onClick={() => setViewMode("day")}
            className={`px-4 py-2 text-sm font-semibold transition ${viewMode === "day" ? "bg-blue-600 text-white" : "bg-white/5 text-slate-300 hover:bg-white/10"}`}>
            Day View
          </button>
          <button onClick={() => setViewMode("month")}
            className={`px-4 py-2 text-sm font-semibold transition ${viewMode === "month" ? "bg-blue-600 text-white" : "bg-white/5 text-slate-300 hover:bg-white/10"}`}>
            Month View
          </button>
        </div>

        {viewMode === "day" ? (
          <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
            className="rounded-xl border border-white/10 bg-[#08111f] px-4 py-2 text-sm text-white" />
        ) : (
          <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}
            className="rounded-xl border border-white/10 bg-[#08111f] px-4 py-2 text-sm text-white" />
        )}
      </div>

      {/* Summary */}
      {records.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Present", count: summary.present, color: "text-emerald-400" },
            { label: "Late",    count: summary.late,    color: "text-amber-400"   },
            { label: "Absent",  count: summary.absent,  color: "text-red-400"     },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
              <p className="text-xs text-slate-400 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Records Table */}
      <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">Loading...</div>
        ) : records.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            {recordsError || "No attendance records for this period."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase text-slate-400">
                  <th className="px-5 py-3 text-left">Teacher</th>
                  {viewMode === "month" && <th className="px-5 py-3 text-left">Date</th>}
                  <th className="px-5 py-3 text-left">Check In</th>
                  <th className="px-5 py-3 text-left">Check Out</th>
                  <th className="px-5 py-3 text-left">Distance</th>
                  <th className="px-5 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {records.map(r => (
                  <tr key={r.id} className="border-b border-white/5 hover:bg-white/5 transition">
                    <td className="px-5 py-3">
                      <p className="font-medium text-white">{r.teacher_name ?? "—"}</p>
                      <p className="text-xs text-slate-400">{r.teacher_email ?? ""}</p>
                    </td>
                    {viewMode === "month" && (
                      <td className="px-5 py-3 text-slate-300">
                        {new Date(r.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                      </td>
                    )}
                    <td className="px-5 py-3 text-slate-300">{fmt(r.check_in_time)}</td>
                    <td className="px-5 py-3 text-slate-300">{fmt(r.check_out_time)}</td>
                    <td className="px-5 py-3 text-slate-300">
                      {r.distance_meters != null ? `${r.distance_meters}m` : "—"}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full border px-3 py-0.5 text-xs font-semibold capitalize ${STATUS_COLORS[r.status] ?? ""}`}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
