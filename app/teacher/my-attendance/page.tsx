"use client"

import { useEffect, useState, useCallback } from "react"
import { apiFetch } from "@/lib/api-client"

type AttendanceRecord = {
  id: string
  date: string
  status: string
  check_in_time: string | null
  check_out_time: string | null
  distance_meters: number | null
}

type GpsState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; lat: number; lng: number; accuracy: number }
  | { status: "error"; message: string }

type TodayRecord = {
  check_in_time: string | null
  check_out_time: string | null
  status: string
} | null

const TARGET_GPS_ACCURACY_METERS = 50
const MAX_GPS_ACCURACY_METERS = 250

function fmt(iso: string | null) {
  if (!iso) return "--"
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", weekday: "short" })
}

const STATUS_COLORS: Record<string, string> = {
  present: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  late:    "text-amber-400 bg-amber-400/10 border-amber-400/20",
  absent:  "text-red-400 bg-red-400/10 border-red-400/20",
}

function getGpsErrorMessage(error?: GeolocationPositionError) {
  if (typeof window !== "undefined" && !window.isSecureContext) {
    return "Location needs HTTPS. Localhost works for testing, but the live app must use HTTPS."
  }

  if (!error) return "Unable to get location. Please try again."

  if (error.code === error.PERMISSION_DENIED) {
    return "Location permission is blocked. Click the site icon in the address bar and allow Location, then try again."
  }
  if (error.code === error.POSITION_UNAVAILABLE) {
    return "Your device could not find a location. Turn on device location/GPS and try again."
  }
  if (error.code === error.TIMEOUT) {
    return "Location request timed out. Move near a window or try again."
  }

  return error.message || "Unable to get location. Try again."
}

function getBestLocation(
  onSuccess: (coords: { lat: number; lng: number; accuracy: number }) => void,
  onError: (message: string) => void
) {
  if (!navigator.geolocation) {
    onError("GPS not supported on this device")
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
      onError("Unable to get location. Please try again.")
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
    (err) => {
      if (best) {
        finish()
      } else {
        if (watchId !== null) navigator.geolocation.clearWatch(watchId)
        settled = true
        onError(getGpsErrorMessage(err))
      }
    },
    { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
  )

  window.setTimeout(finish, 12000)
}

export default function TeacherMyAttendancePage() {
  const [gps, setGps] = useState<GpsState>({ status: "idle" })
  const [today, setToday] = useState<TodayRecord>(null)
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(true)
  const [clock, setClock] = useState(new Date())

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const loadRecords = useCallback(async () => {
    setRefreshing(true)
    setLoadError(null)
    try {
      const res = await apiFetch("/api/teacher-attendance")
      const data = await res.json()
      if (data.success) {
        const all: AttendanceRecord[] = data.records
        const todayStr = new Date().toISOString().slice(0, 10)
        const todayRec = all.find(r => r.date === todayStr) ?? null
        setToday(todayRec)
        setRecords(all.filter(r => r.date !== todayStr))
      } else {
        setLoadError(data.error || "Could not load attendance records.")
      }
    } catch {
      setLoadError("Network error. Please check your connection and refresh.")
    } finally {
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { loadRecords() }, [loadRecords])

  const getLocation = () => {
    setGps({ status: "loading" })
    getBestLocation(
      ({ lat, lng, accuracy }) => {
        if (accuracy > MAX_GPS_ACCURACY_METERS) {
          setGps({
            status: "error",
            message: `Location accuracy is too low (±${accuracy}m). Turn on precise location/GPS or try from a phone, then try again.`,
          })
          return
        }
        setGps({ status: "ready", lat, lng, accuracy })
      },
      (message) => setGps({ status: "error", message })
    )
  }

  const markAttendance = async (action: "check_in" | "check_out") => {
    if (gps.status !== "ready") return
    setLoading(true)
    try {
      const res = await apiFetch("/api/teacher-attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, latitude: gps.lat, longitude: gps.lng, accuracy: gps.accuracy }),
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error || "Failed")
      } else {
        setGps({ status: "idle" })
        await loadRecords()
      }
    } finally {
      setLoading(false)
    }
  }

  const canCheckIn  = !today?.check_in_time
  const canCheckOut = !!today?.check_in_time && !today?.check_out_time

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-10">
      <h1 className="text-2xl font-semibold text-white">My Attendance</h1>

      {/* Live clock */}
      <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-center">
        <p className="text-4xl font-bold text-white tabular-nums">
          {clock.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })}
        </p>
        <p className="mt-1 text-sm text-slate-400">
          {clock.toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* Error banner */}
      {loadError && (
        <div className="rounded-2xl border border-red-400/30 bg-red-400/10 px-5 py-4">
          <p className="text-sm font-semibold text-red-300">Could not load attendance</p>
          <p className="mt-1 text-xs text-red-400/80">{loadError}</p>
          {loadError.includes("schema") && (
            <p className="mt-2 text-xs text-red-300/70">
              Action required: Run <code className="rounded bg-red-900/40 px-1 py-0.5 font-mono">teacher_attendance_schema.sql</code> in your Supabase SQL Editor.
            </p>
          )}
          <button
            onClick={loadRecords}
            className="mt-3 rounded-lg border border-red-400/30 px-3 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-400/10"
          >
            Retry
          </button>
        </div>
      )}

      {/* Today status */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400">Today</h2>

        {refreshing ? (
          <p className="text-sm text-slate-500">Loading...</p>
        ) : today ? (
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-white/5 p-3 text-center">
              <p className="text-xs text-slate-400 mb-1">Check In</p>
              <p className="text-lg font-semibold text-white">{fmt(today.check_in_time)}</p>
            </div>
            <div className="rounded-xl bg-white/5 p-3 text-center">
              <p className="text-xs text-slate-400 mb-1">Check Out</p>
              <p className="text-lg font-semibold text-white">{fmt(today.check_out_time)}</p>
            </div>
            <div className="col-span-2 flex justify-center">
              <span className={`rounded-full border px-4 py-1 text-sm font-semibold capitalize ${STATUS_COLORS[today.status] ?? ""}`}>
                {today.status}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500">No attendance marked yet today.</p>
        )}
      </div>

      {/* GPS + Action */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400">Mark Attendance</h2>

        {/* Step 1 — Get location */}
        <button
          onClick={getLocation}
          disabled={gps.status === "loading"}
          className="w-full rounded-xl border border-cyan-400/20 bg-cyan-500/10 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/20 disabled:opacity-60"
        >
          {gps.status === "loading" ? "Getting Best GPS..." : "Get My Location"}
        </button>

        {gps.status === "error" && (
          <div className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
            {gps.message}
          </div>
        )}

        {gps.status === "ready" && (
          <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200 space-y-1">
            <p className="font-semibold text-emerald-100">Location detected</p>
            <p>Lat: {gps.lat.toFixed(6)}  Lng: {gps.lng.toFixed(6)}</p>
            <p className="text-emerald-300/80">Accuracy: ±{gps.accuracy}m</p>
          </div>
        )}

        {/* Step 2 — Check In / Check Out */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => markAttendance("check_in")}
            disabled={loading || gps.status !== "ready" || !canCheckIn}
            className="rounded-xl bg-[linear-gradient(135deg,#10b981,#0f766e)] py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? "..." : "Check In"}
          </button>
          <button
            onClick={() => markAttendance("check_out")}
            disabled={loading || gps.status !== "ready" || !canCheckOut}
            className="rounded-xl bg-[linear-gradient(135deg,#f59e0b,#d97706)] py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? "..." : "Check Out"}
          </button>
        </div>

        <p className="text-xs text-slate-500 text-center">
          You must be within 100 metres of school to mark attendance.
        </p>
      </div>

      {/* History */}
      {records.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400">History</h2>
          <div className="space-y-2">
            {records.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3 text-sm">
                <div>
                  <p className="font-medium text-white">{fmtDate(r.date)}</p>
                  <p className="text-xs text-slate-400">
                    In: {fmt(r.check_in_time)} &nbsp;|&nbsp; Out: {fmt(r.check_out_time)}
                    {r.distance_meters != null ? ` | ${r.distance_meters}m` : ""}
                  </p>
                </div>
                <span className={`rounded-full border px-3 py-0.5 text-xs font-semibold capitalize ${STATUS_COLORS[r.status] ?? ""}`}>
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
