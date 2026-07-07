"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { apiFetch } from "@/lib/api-client"

type WaStatus =
  | { connected: false; source?: string; missing?: string[] }
  | {
      connected: true
      source: "school" | "central"
      phoneNumber: string | null
      displayName: string | null
      businessAccountId: string | null
      connectedAt: string | null
      lastWebhookAt: string | null
      lastWebhookStatus: string | null
      apiVersion: string
    }

function fmtDate(iso: string | null) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
}

export default function WhatsAppConnect() {
  const params = useSearchParams()

  const [status,       setStatus]       = useState<WaStatus | null>(null)
  const [loading,      setLoading]      = useState(true)
  const [connecting,   setConnecting]   = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [toast,        setToast]        = useState<{ type: "success" | "error"; msg: string } | null>(null)

  // Handle OAuth callback result in URL params
  useEffect(() => {
    const result  = params.get("whatsapp")
    const message = params.get("message")
    if (result === "connected") {
      showToast("success", "WhatsApp connected successfully! Your own number is now active.")
      clean()
    } else if (result === "error") {
      showToast("error", message ? decodeURIComponent(message) : "Connection failed. Please try again.")
      clean()
    }
  }, [params])

  useEffect(() => { fetchStatus() }, [])

  function clean() {
    const url = new URL(window.location.href)
    url.searchParams.delete("whatsapp")
    url.searchParams.delete("message")
    window.history.replaceState({}, "", url.toString())
  }

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 6000)
  }

  async function fetchStatus() {
    setLoading(true)
    try {
      const res  = await apiFetch("/api/whatsapp/status")
      const data = await res.json()
      setStatus(res.ok && typeof data?.connected === "boolean" ? data : { connected: false })
    } catch {
      setStatus({ connected: false })
    } finally {
      setLoading(false)
    }
  }

  async function startConnect() {
    setConnecting(true)
    try {
      const res  = await apiFetch("/api/whatsapp/connect")
      const data = await res.json()
      if (!res.ok || !data.url) {
        showToast("error", data.error || "Could not start connection. Check META_APP_ID in Vercel.")
        return
      }
      window.location.href = data.url
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Network error")
    } finally {
      setConnecting(false)
    }
  }

  async function disconnect() {
    if (!confirm("Disconnect your WhatsApp number? Notifications will fall back to the shared EduCore number.")) return
    setDisconnecting(true)
    try {
      const res  = await apiFetch("/api/whatsapp/disconnect", { method: "DELETE" })
      const data = await res.json()
      if (res.ok) {
        showToast("success", "Disconnected. Falling back to shared number.")
        await fetchStatus()
      } else {
        showToast("error", data.error || "Disconnect failed.")
      }
    } catch {
      showToast("error", "Network error.")
    } finally {
      setDisconnecting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-3 py-8 text-slate-400 text-sm">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
        Checking WhatsApp status…
      </div>
    )
  }

  const isSchoolOwn  = status?.connected && status.source === "school"
  const isCentralized = status?.connected && status.source === "central"

  return (
    <div className="max-w-2xl space-y-6">

      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-white">WhatsApp Business</h2>
        <p className="mt-1.5 text-sm leading-6 text-slate-400">
          Connect your school&apos;s own WhatsApp Business number so notifications are sent from your name and number.
          If you don&apos;t connect one, the shared EduCore number is used as a fallback.
        </p>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${
          toast.type === "success"
            ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
            : "border-red-400/20 bg-red-400/10 text-red-200"
        }`}>
          <span className="flex-1">{toast.msg}</span>
          <button onClick={() => setToast(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* ── School's own number connected ── */}
      {isSchoolOwn && status.connected && status.source === "school" && (
        <div className="rounded-3xl border border-emerald-400/20 bg-[linear-gradient(160deg,rgba(16,185,129,0.08),rgba(6,78,59,0.04))] p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]" />
              <span className="text-sm font-semibold text-emerald-300">Your Number — Active</span>
            </div>
            <button
              onClick={disconnect}
              disabled={disconnecting}
              className="rounded-xl border border-red-400/20 bg-red-400/5 px-3 py-1.5 text-xs font-semibold text-red-400 transition hover:bg-red-400/10 disabled:opacity-50"
            >
              {disconnecting ? "Disconnecting…" : "Disconnect"}
            </button>
          </div>

          <div className="grid gap-2.5 text-sm">
            <Row label="Display Name"     value={status.displayName || "—"} highlight />
            <Row label="Phone Number"     value={status.phoneNumber  || "—"} highlight />
            <Row label="WABA ID"          value={status.businessAccountId || "—"} mono />
            <Row label="Connected"        value={fmtDate(status.connectedAt)} />
            <Row label="Last Webhook"     value={fmtDate(status.lastWebhookAt)} />
            <Row label="Webhook Status"   value={status.lastWebhookStatus || "—"} />
            <Row label="API Version"      value={status.apiVersion} mono />
          </div>

          <p className="text-xs text-slate-500 leading-5">
            All notifications (attendance, fees, reports) for your school are sent from <strong className="text-slate-400">{status.displayName || "your number"}</strong>.
            Parents will see your school&apos;s name in WhatsApp.
          </p>
        </div>
      )}

      {/* ── Using centralized fallback ── */}
      {isCentralized && status.connected && (
        <div className="rounded-3xl border border-amber-400/20 bg-amber-400/5 p-6 space-y-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-2.5 w-2.5 rounded-full bg-amber-400" />
            <span className="text-sm font-semibold text-amber-300">Using Shared EduCore Number</span>
          </div>
          <p className="text-sm text-slate-300 leading-6">
            Notifications are being sent from the shared EduCore number. Parents will see <em>&quot;EduCore&quot;</em> as the sender, not your school&apos;s name.
            Connect your own WhatsApp number below to fix this.
          </p>
        </div>
      )}

      {/* ── Not configured at all ── */}
      {!status?.connected && (
        <div className="rounded-3xl border border-red-400/20 bg-red-400/5 p-5 space-y-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-2.5 w-2.5 rounded-full bg-red-400" />
            <span className="text-sm font-semibold text-red-300">WhatsApp Not Active</span>
          </div>
          <p className="text-sm text-slate-400">No WhatsApp number is configured. Notifications will not be sent.</p>
        </div>
      )}

      {/* ── Connect button (shown when not using school's own) ── */}
      {!isSchoolOwn && (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-5">
          <div>
            <h3 className="font-semibold text-white">Connect Your School&apos;s WhatsApp Number</h3>
            <p className="mt-1 text-sm text-slate-400 leading-6">
              Click below to link your school&apos;s WhatsApp Business number via Meta. Parents will receive messages from your school&apos;s name and number directly.
            </p>
          </div>

          {/* Steps */}
          <ol className="space-y-2.5 text-sm text-slate-300">
            {[
              'Click "Connect WhatsApp" — you\'ll be redirected to Meta/Facebook.',
              "Log in with the Facebook account that owns your WhatsApp Business Account.",
              "Select your WhatsApp Business Account and phone number.",
              "You'll be brought back here and your number will be active immediately.",
            ].map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[11px] font-bold text-slate-400">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>

          <button
            onClick={startConnect}
            disabled={connecting}
            className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-[linear-gradient(135deg,#25D366,#128C7E)] py-3.5 text-sm font-semibold text-white shadow-lg transition hover:brightness-110 disabled:opacity-60"
          >
            {connecting ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Redirecting to Meta…
              </>
            ) : (
              <>
                {/* WhatsApp icon */}
                <svg viewBox="0 0 32 32" width="18" height="18" fill="currentColor">
                  <path d="M16 0C7.163 0 0 7.163 0 16c0 2.835.744 5.494 2.043 7.797L0 32l8.418-2.01A15.94 15.94 0 0016 32c8.837 0 16-7.163 16-16S24.837 0 16 0zm8.322 22.573c-.35.977-2.03 1.873-2.795 1.96-.714.083-1.597.118-2.576-.16-.594-.17-1.357-.398-2.337-.78-4.115-1.592-6.8-5.623-7.001-5.886-.2-.263-1.63-2.166-1.63-4.132 0-1.965 1.033-2.932 1.399-3.33.366-.398.8-.498 1.066-.498.267 0 .534.002.767.013.246.012.577-.093.904.69.35.832 1.19 2.882 1.292 3.09.103.208.172.45.034.724-.137.274-.206.443-.41.683-.205.24-.43.537-.614.721-.205.205-.418.428-.18.84.24.413 1.064 1.753 2.283 2.84 1.569 1.398 2.892 1.83 3.304 2.034.413.205.653.172.893-.103.24-.274 1.03-1.2 1.303-1.612.274-.413.548-.344.92-.206.374.137 2.378 1.12 2.784 1.325.41.205.684.308.785.479.103.17.103.977-.247 1.953z"/>
                </svg>
                Connect WhatsApp Business Number
              </>
            )}
          </button>

          <p className="text-center text-xs text-slate-500">
            Requires a Meta Business Account with a verified WhatsApp Business number.
            <br />Your billing stays with EduCore — schools pay nothing directly to Meta.
          </p>
        </div>
      )}

      {/* Info box */}
      <div className="rounded-2xl border border-white/6 bg-white/3 px-5 py-4 text-xs leading-6 text-slate-500 space-y-1.5">
        <p className="font-semibold text-slate-400">How billing works</p>
        <p>
          When you connect your school&apos;s number, the WhatsApp Business Account (WABA) is linked under <strong className="text-slate-400">EduCore&apos;s Meta Business Portfolio</strong>.
          All conversation costs are billed to EduCore — schools don&apos;t need a Meta billing account.
          Each school still gets their own phone number, display name, and profile logo visible to parents.
        </p>
      </div>
    </div>
  )
}

// ── Small helper row ──────────────────────────────────────────────────────────
function Row({ label, value, highlight, mono }: { label: string; value: string; highlight?: boolean; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/4 px-4 py-3">
      <span className="text-slate-400">{label}</span>
      <span className={`max-w-[55%] truncate text-right ${mono ? "font-mono text-xs text-slate-300" : highlight ? "font-semibold text-white" : "text-slate-300"}`}>
        {value}
      </span>
    </div>
  )
}
