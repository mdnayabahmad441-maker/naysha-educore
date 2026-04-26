"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { apiFetch } from "@/lib/api-client"

type WhatsAppStatus =
  | { connected: false }
  | {
      connected: true
      phoneNumber: string | null
      displayName: string | null
      businessAccountId: string
      phoneNumberId: string
      connectedAt: string
      updatedAt: string
    }

export default function WhatsAppConnect() {
  const params = useSearchParams()

  const [status, setStatus] = useState<WhatsAppStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // ── Read redirect result from URL (set by /api/whatsapp/callback) ──────────
  useEffect(() => {
    const result = params.get("whatsapp")
    const message = params.get("message")

    if (result === "connected") {
      setSuccessMsg("WhatsApp connected successfully!")
      // Remove query params without page reload
      const clean = new URL(window.location.href)
      clean.searchParams.delete("whatsapp")
      clean.searchParams.delete("message")
      window.history.replaceState({}, "", clean.toString())
    }

    if (result === "error") {
      setError(
        message
          ? decodeURIComponent(message)
          : "Connection failed. Please try again."
      )
      const clean = new URL(window.location.href)
      clean.searchParams.delete("whatsapp")
      clean.searchParams.delete("message")
      window.history.replaceState({}, "", clean.toString())
    }
  }, [params])

  // ── Fetch connection status ────────────────────────────────────────────────
  useEffect(() => {
    void fetchStatus()
  }, [])

  async function fetchStatus() {
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetch("/api/whatsapp/status")
      const data = await res.json()
      setStatus(data)
    } catch {
      setError("Could not load WhatsApp status. Check your connection.")
    } finally {
      setLoading(false)
    }
  }

  // ── Connect: get OAuth URL, redirect browser to Meta ──────────────────────
  async function handleConnect() {
    setConnecting(true)
    setError(null)
    try {
      const res = await apiFetch("/api/whatsapp/connect")
      const data = await res.json()

      if (!res.ok || !data.url) {
        throw new Error(data.error || "Failed to start WhatsApp connection.")
      }

      // Full-page redirect to Meta OAuth login
      window.location.href = data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed.")
      setConnecting(false)
    }
  }

  // ── Disconnect ─────────────────────────────────────────────────────────────
  async function handleDisconnect() {
    if (!confirm("Disconnect WhatsApp? Your school will no longer be able to send WhatsApp messages until reconnected.")) return

    setDisconnecting(true)
    setError(null)
    try {
      const res = await apiFetch("/api/whatsapp/disconnect", { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to disconnect.")
      }
      setSuccessMsg("WhatsApp disconnected.")
      setStatus({ connected: false })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Disconnect failed.")
    } finally {
      setDisconnecting(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center gap-3 py-6 text-slate-400 text-sm">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
        Checking WhatsApp status...
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">

      {/* ── Section header ── */}
      <div>
        <h2 className="text-2xl font-semibold text-white">WhatsApp Business</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Connect your school&apos;s WhatsApp Business number via Meta. Once connected,
          fee reminders, notices, and OTP messages will be sent from your own number.
        </p>
      </div>

      {/* ── Success banner ── */}
      {successMsg && (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
          <span className="mt-0.5 text-emerald-400">✓</span>
          <span>{successMsg}</span>
          <button
            type="button"
            onClick={() => setSuccessMsg(null)}
            className="ml-auto text-emerald-300 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Error banner ── */}
      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
          <span className="mt-0.5 text-red-400">✕</span>
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="ml-auto text-red-300 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Status card ── */}
      {status?.connected ? (
        <div className="rounded-[24px] border border-emerald-400/20 bg-[linear-gradient(160deg,rgba(16,185,129,0.08),rgba(6,78,59,0.06))] p-6 space-y-5">

          {/* Connected badge + info */}
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
            <span className="text-sm font-semibold text-emerald-300">Connected</span>
          </div>

          <div className="grid gap-3 text-sm">
            {status.displayName && (
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <span className="text-slate-400">Business name</span>
                <span className="font-medium text-white">{status.displayName}</span>
              </div>
            )}
            {status.phoneNumber && (
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <span className="text-slate-400">Phone number</span>
                <span className="font-mono font-medium text-white">{status.phoneNumber}</span>
              </div>
            )}
            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <span className="text-slate-400">WABA ID</span>
              <span className="font-mono text-xs text-slate-300">{status.businessAccountId}</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <span className="text-slate-400">Phone number ID</span>
              <span className="font-mono text-xs text-slate-300">{status.phoneNumberId}</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <span className="text-slate-400">Last updated</span>
              <span className="text-slate-300">
                {new Date(status.updatedAt).toLocaleDateString("en-IN", {
                  day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
                })}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pt-1">
            <button
              type="button"
              onClick={() => void handleConnect()}
              disabled={connecting}
              className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-5 py-2.5 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {connecting ? "Opening Meta..." : "Reconnect / Change Number"}
            </button>
            <button
              type="button"
              onClick={() => void handleDisconnect()}
              disabled={disconnecting}
              className="rounded-2xl border border-red-400/20 bg-red-400/10 px-5 py-2.5 text-sm font-semibold text-red-200 transition hover:bg-red-400/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {disconnecting ? "Disconnecting..." : "Disconnect"}
            </button>
          </div>

          {/* Token expiry note */}
          <p className="text-xs leading-5 text-slate-500">
            Access tokens are valid for 60 days. Use &quot;Reconnect&quot; before they expire to avoid interruptions.
          </p>
        </div>
      ) : (
        <div className="rounded-[24px] border border-white/10 bg-white/5 p-6 space-y-5">

          {/* Not connected badge */}
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 shrink-0 rounded-full bg-slate-500" />
            <span className="text-sm font-semibold text-slate-400">Not connected</span>
          </div>

          <p className="text-sm leading-6 text-slate-300">
            Click below to log in with your Meta (Facebook) account and authorise NaySha EduCore
            to send WhatsApp messages on behalf of your school.
          </p>

          {/* What happens step list */}
          <ol className="space-y-2 text-sm text-slate-400">
            {[
              "You will be redirected to Meta to log in.",
              "Grant the two WhatsApp permissions requested.",
              "Your phone number is saved — no manual configuration needed.",
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-slate-600 text-xs text-slate-500">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>

          <button
            type="button"
            onClick={() => void handleConnect()}
            disabled={connecting}
            className="w-full rounded-2xl bg-[linear-gradient(135deg,#25d366,#128c7e)] px-4 py-4 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(37,211,102,0.2)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {connecting
              ? "Opening Meta login..."
              : "Connect WhatsApp Business"}
          </button>
        </div>
      )}

      {/* ── Prerequisites info ── */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-xs leading-6 text-slate-500 space-y-1">
        <p className="font-semibold text-slate-400">Before connecting, make sure you have:</p>
        <ul className="list-disc list-inside space-y-0.5">
          <li>A verified Meta Business Manager account</li>
          <li>A WhatsApp Business Account (WABA) added to that Business Manager</li>
          <li>At least one phone number registered in your WABA</li>
          <li>Your Meta App has <code className="text-slate-300">whatsapp_business_management</code> and <code className="text-slate-300">whatsapp_business_messaging</code> permissions approved</li>
        </ul>
      </div>
    </div>
  )
}
