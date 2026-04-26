"use client"

import { useEffect, useState } from "react"
import { apiFetch } from "@/lib/api-client"

type WhatsAppStatus =
  | { connected: false }
  | {
      connected: true
      provider: string
      accountSid: string | null
      fromNumber: string | null
      displayName: string | null
      connectedAt: string | null
      updatedAt: string | null
    }

export default function WhatsAppConnect() {
  const [status, setStatus] = useState<WhatsAppStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [form, setForm] = useState({
    accountSid: "",
    authToken: "",
    fromNumber: "",
    displayName: "",
  })

  useEffect(() => {
    void fetchStatus()
  }, [])

  async function fetchStatus() {
    setLoading(true)
    setError(null)

    try {
      const res = await apiFetch("/api/whatsapp/status")
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Could not load WhatsApp status")
      }

      setStatus(data)

      if (data.connected) {
        setForm((current) => ({
          ...current,
          fromNumber: data.fromNumber || "",
          displayName: data.displayName || "",
        }))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load WhatsApp status.")
    } finally {
      setLoading(false)
    }
  }

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function handleSave() {
    if (!form.accountSid.trim() || !form.authToken.trim() || !form.fromNumber.trim()) {
      setError("Account SID, Auth Token, and WhatsApp sender are required.")
      return
    }

    setSaving(true)
    setError(null)

    try {
      const res = await apiFetch("/api/whatsapp/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to save WhatsApp configuration.")
      }

      setSuccessMsg("Twilio WhatsApp saved for this school.")
      setForm((current) => ({
        ...current,
        authToken: "",
      }))
      await fetchStatus()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.")
    } finally {
      setSaving(false)
    }
  }

  async function handleDisconnect() {
    if (!confirm("Disconnect Twilio WhatsApp for this school?")) return

    setDisconnecting(true)
    setError(null)

    try {
      const res = await apiFetch("/api/whatsapp/disconnect", { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to disconnect.")
      }

      setStatus({ connected: false })
      setForm({
        accountSid: "",
        authToken: "",
        fromNumber: "",
        displayName: "",
      })
      setSuccessMsg("Twilio WhatsApp disconnected.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Disconnect failed.")
    } finally {
      setDisconnecting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-3 py-6 text-sm text-slate-400">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
        Checking WhatsApp status...
      </div>
    )
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white">Twilio WhatsApp</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Save this school&apos;s Twilio WhatsApp sender details here. Each school can use its own sender while billing stays under your Twilio parent account or subaccount structure.
        </p>
      </div>

      {successMsg && (
        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
          {successMsg}
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {status?.connected ? (
        <div className="space-y-4 rounded-[24px] border border-emerald-400/20 bg-[linear-gradient(160deg,rgba(16,185,129,0.08),rgba(6,78,59,0.06))] p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
            <span className="text-sm font-semibold text-emerald-300">Connected</span>
          </div>

          <div className="grid gap-3 text-sm">
            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <span className="text-slate-400">Provider</span>
              <span className="font-medium text-white">Twilio WhatsApp</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <span className="text-slate-400">Account SID</span>
              <span className="font-mono text-xs text-slate-300">{status.accountSid || "-"}</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <span className="text-slate-400">WhatsApp sender</span>
              <span className="font-mono text-xs text-slate-300">{status.fromNumber || "-"}</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <span className="text-slate-400">Display name</span>
              <span className="text-slate-300">{status.displayName || "-"}</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <span className="text-slate-400">Last updated</span>
              <span className="text-slate-300">
                {status.updatedAt
                  ? new Date(status.updatedAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "-"}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void handleDisconnect()}
            disabled={disconnecting}
            className="rounded-2xl border border-red-400/20 bg-red-400/10 px-5 py-2.5 text-sm font-semibold text-red-200 transition hover:bg-red-400/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {disconnecting ? "Disconnecting..." : "Disconnect"}
          </button>
        </div>
      ) : (
        <div className="rounded-[24px] border border-white/10 bg-white/5 p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 shrink-0 rounded-full bg-slate-500" />
            <span className="text-sm font-semibold text-slate-400">Not connected</span>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-300">
            This school will start sending WhatsApp messages as soon as you save its Twilio credentials and sender number.
          </p>
        </div>
      )}

      <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div>
          <h3 className="text-lg font-semibold text-white">School Connection Details</h3>
          <p className="mt-1 text-sm text-slate-400">
            Use the Twilio subaccount or sender assigned to this school. The sender should be in `whatsapp:+14155238886` style.
          </p>
        </div>

        <input
          value={form.accountSid}
          onChange={(event) => updateField("accountSid", event.target.value)}
          className="w-full rounded-xl bg-[#0b1220] px-4 py-3 text-white"
          placeholder="Twilio Account SID"
        />

        <input
          value={form.authToken}
          onChange={(event) => updateField("authToken", event.target.value)}
          className="w-full rounded-xl bg-[#0b1220] px-4 py-3 text-white"
          placeholder="Twilio Auth Token"
          type="password"
        />

        <input
          value={form.fromNumber}
          onChange={(event) => updateField("fromNumber", event.target.value)}
          className="w-full rounded-xl bg-[#0b1220] px-4 py-3 text-white"
          placeholder="whatsapp:+14155238886"
        />

        <input
          value={form.displayName}
          onChange={(event) => updateField("displayName", event.target.value)}
          className="w-full rounded-xl bg-[#0b1220] px-4 py-3 text-white"
          placeholder="School or sender name"
        />

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="rounded-2xl bg-[linear-gradient(135deg,#1d4ed8,#0f766e)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {saving ? "Saving..." : status?.connected ? "Update Twilio WhatsApp" : "Save Twilio WhatsApp"}
          </button>

          <button
            type="button"
            onClick={() => void fetchStatus()}
            className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Refresh Status
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-xs leading-6 text-slate-400">
        <p className="font-semibold text-slate-300">How a school connects in this setup</p>
        <p>1. You create or assign the school&apos;s Twilio subaccount or approved sender.</p>
        <p>2. You paste the Account SID, Auth Token, and WhatsApp sender here.</p>
        <p>3. This school&apos;s notices, attendance alerts, fee messages, and onboarding messages start using that sender.</p>
      </div>
    </div>
  )
}
