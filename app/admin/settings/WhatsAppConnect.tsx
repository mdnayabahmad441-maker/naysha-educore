"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { apiFetch } from "@/lib/api-client"

type WhatsAppStatus =
  | { connected: false; missing?: string[] }
  | { connected: true; centralized: true; provider: string; apiVersion: string }

export default function WhatsAppConnect() {
  const params = useSearchParams()

  const [status, setStatus] = useState<WhatsAppStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const result = params.get("whatsapp")
    const message = params.get("message")
    if (result === "error") {
      setError(message ? decodeURIComponent(message) : "Connection failed. Please try again.")
      const clean = new URL(window.location.href)
      clean.searchParams.delete("whatsapp")
      clean.searchParams.delete("message")
      window.history.replaceState({}, "", clean.toString())
    }
  }, [params])

  useEffect(() => {
    void fetchStatus()
  }, [])

  async function fetchStatus() {
    setLoading(true)
    try {
      const res = await apiFetch("/api/whatsapp/status")
      const data = await res.json()
      setStatus(res.ok && typeof data?.connected === "boolean" ? data : { connected: false })
    } catch {
      setStatus({ connected: false })
    } finally {
      setLoading(false)
    }
  }

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
      <div>
        <h2 className="text-2xl font-semibold text-white">WhatsApp Business</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          WhatsApp notifications are sent from a centralized number managed by NaySha EduCore.
          Fee reminders, notices, attendance alerts, and onboarding messages are sent automatically.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} className="ml-auto text-red-300 hover:text-white">x</button>
        </div>
      )}

      {status?.connected ? (
        <div className="rounded-3xl border border-emerald-400/20 bg-[linear-gradient(160deg,rgba(16,185,129,0.08),rgba(6,78,59,0.06))] p-6 space-y-5">
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
            <span className="text-sm font-semibold text-emerald-300">Active — Centralized Number</span>
          </div>

          <div className="grid gap-3 text-sm">
            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <span className="text-slate-400">Provider</span>
              <span className="text-white font-medium">WhatsApp Cloud API</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <span className="text-slate-400">API Version</span>
              <span className="font-mono text-xs text-slate-300">{"apiVersion" in status ? status.apiVersion : "-"}</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <span className="text-slate-400">Configuration</span>
              <span className="text-emerald-400 text-xs font-medium">Managed centrally via environment</span>
            </div>
          </div>

          <p className="text-xs leading-5 text-slate-500">
            All schools share one WhatsApp number. Messages include the school name dynamically.
            To change the number, update <code className="text-slate-400">WHATSAPP_PHONE_NUMBER_ID</code> and <code className="text-slate-400">WHATSAPP_ACCESS_TOKEN</code> in Vercel.
          </p>
        </div>
      ) : (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 shrink-0 rounded-full bg-amber-500" />
            <span className="text-sm font-semibold text-amber-400">Not configured</span>
          </div>

          <p className="text-sm leading-6 text-slate-300">
            WhatsApp is not active. The following environment variables are missing in Vercel:
          </p>

          {!status?.connected && status?.missing && status.missing.length > 0 && (
            <ul className="space-y-1">
              {status.missing.map((v) => (
                <li key={v} className="font-mono text-xs text-red-300 bg-red-400/10 rounded-lg px-3 py-2">{v}</li>
              ))}
            </ul>
          )}

          <p className="text-xs text-slate-500">
            Add the missing variables to your Vercel project settings and redeploy to activate WhatsApp notifications.
          </p>
        </div>
      )}

      <div className="rounded-2xl border border-white/10 bg-white/3 px-5 py-4 text-xs leading-6 text-slate-500 space-y-1">
        <p className="font-semibold text-slate-400">Required environment variables:</p>
        <ul className="list-disc list-inside space-y-0.5">
          <li><code className="text-slate-400">WHATSAPP_PHONE_NUMBER_ID</code> — your Meta phone number ID</li>
          <li><code className="text-slate-400">WHATSAPP_ACCESS_TOKEN</code> — permanent access token from Meta</li>
          <li><code className="text-slate-400">WHATSAPP_CLOUD_API_VERSION</code> — e.g. <code className="text-slate-400">v23.0</code> (optional)</li>
        </ul>
      </div>
    </div>
  )
}
