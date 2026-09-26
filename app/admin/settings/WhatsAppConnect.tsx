"use client"

import Script from "next/script"
import { useEffect, useRef, useState } from "react"
import { apiFetch } from "@/lib/api-client"

declare global { interface Window { FB?: { init: (options: Record<string, unknown>) => void; login: (callback: (response: { authResponse?: { code?: string } }) => void, options: Record<string, unknown>) => void } } }

type WaStatus = { connected: boolean; fallbackActive?: boolean; source?: "school" | "central"; connectionStatus?: string; phoneNumber?: string | null; displayName?: string | null; businessAccountId?: string | null; connectedAt?: string | null; lastWebhookAt?: string | null; lastWebhookStatus?: string | null }
type MetaSession = { wabaId?: string; phoneNumberId?: string }

function fmtDate(value?: string | null) { return value ? new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—" }

export default function WhatsAppConnect() {
  const [status, setStatus] = useState<WaStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [testing, setTesting] = useState(false)
  const [sdkReady, setSdkReady] = useState(false)
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null)
  const session = useRef<MetaSession>({})

  const showToast = (type: "success" | "error", msg: string) => { setToast({ type, msg }); window.setTimeout(() => setToast(null), 7000) }
  const fetchStatus = async () => {
    setLoading(true)
    try { const response = await apiFetch("/api/whatsapp/status"); const data = await response.json(); setStatus(response.ok ? data : { connected: false }) }
    catch { setStatus({ connected: false }) }
    finally { setLoading(false) }
  }

  useEffect(() => { void fetchStatus() }, [])
  useEffect(() => {
    const listener = (event: MessageEvent) => {
      if (
        event.origin !== "https://www.facebook.com" &&
        event.origin !== "https://web.facebook.com" &&
        event.origin !== "https://business.facebook.com"
      ) return
      try {
        const data = typeof event.data === "string" ? JSON.parse(event.data) : event.data
        if (data?.type !== "WA_EMBEDDED_SIGNUP") return
        if (data.event === "FINISH" || data.event === "FINISH_ONLY_WABA") {
          session.current = { wabaId: data.data?.waba_id, phoneNumberId: data.data?.phone_number_id }
          console.log("[WhatsApp Embedded Signup FINISH event]", session.current)
        } else if (data.event === "CANCEL") {
          setConnecting(false); showToast("error", "WhatsApp connection was cancelled.")
        } else if (data.event === "ERROR") {
          setConnecting(false); showToast("error", "Meta could not complete WhatsApp onboarding. Please try again.")
        }
      } catch { /* Ignore unrelated Facebook postMessage events. */ }
    }
    window.addEventListener("message", listener)
    return () => window.removeEventListener("message", listener)
  }, [])

  async function completeConnection(code: string) {
    try {
      const response = await apiFetch("/api/whatsapp/callback", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code, ...session.current }) })
      const data = await response.json()
      if (!response.ok) {
        console.error("[WhatsApp completeConnection error]", data?.error)
        throw new Error(data.error || "Connection failed")
      }
      showToast("success", "WhatsApp connected successfully. This school’s number is now active.")
      await fetchStatus()
    } catch (error) {
      console.error("[WhatsApp connection caught error]", error)
      showToast("error", error instanceof Error ? error.message : "Connection failed")
    }
    finally { setConnecting(false) }
  }

  async function startConnect() {
    if (!window.FB || !sdkReady) { showToast("error", "Meta onboarding is still loading. Please wait a moment and try again."); return }
    setConnecting(true); session.current = {}
    try {
      const response = await apiFetch("/api/whatsapp/connect", { method: "POST" }); const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Could not start WhatsApp onboarding")
      window.FB.init({ appId: data.appId, cookie: true, xfbml: false, version: "v23.0" })
      const loginOptions = {
        config_id: data.configId,
        response_type: "code",
        override_default_response_type: true,
        extras: { setup: {} },
      }
      if (process.env.NODE_ENV !== "production") {
        console.info("[WhatsApp Embedded Signup] FB.login launch", {
          app_id: data.appId,
          config_id: data.configId,
          response_type: loginOptions.response_type,
          override_default_response_type: loginOptions.override_default_response_type,
          extras: loginOptions.extras,
        })
      }
      window.FB.login((result) => {
        const code = result.authResponse?.code
        if (!code) { setConnecting(false); showToast("error", "WhatsApp connection was cancelled or not authorized."); return }
        setTimeout(() => {
          void completeConnection(code)
        }, 300)
      }, loginOptions)
    } catch (error) { setConnecting(false); showToast("error", error instanceof Error ? error.message : "Could not start WhatsApp onboarding") }
  }

  async function disconnect() {
    if (!confirm("Disconnect this school’s WhatsApp number? Its notifications will stop until it is reconnected.")) return
    setDisconnecting(true)
    try { const response = await apiFetch("/api/whatsapp/disconnect", { method: "DELETE" }); const data = await response.json(); if (!response.ok) throw new Error(data.error); showToast("success", "WhatsApp number disconnected."); await fetchStatus() }
    catch (error) { showToast("error", error instanceof Error ? error.message : "Disconnect failed") }
    finally { setDisconnecting(false) }
  }

  async function testConnection() {
    setTesting(true)
    try {
      const response = await apiFetch("/api/whatsapp/test", { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      showToast("success", `Connection verified${data.phoneNumber ? ` for ${data.phoneNumber}` : ""}.`)
      await fetchStatus()
    } catch (error) {
      showToast("error", error instanceof Error ? error.message : "Connection test failed")
    } finally {
      setTesting(false)
    }
  }

  const connected = Boolean(status?.connected && status.source === "school")
  return <div className="max-w-2xl space-y-6">
    <Script src="https://connect.facebook.net/en_US/sdk.js" strategy="afterInteractive" onLoad={() => setSdkReady(true)} onError={() => showToast("error", "Meta onboarding could not be loaded. Check your internet connection and try again.")} />
    <div><h2 className="text-2xl font-semibold text-white">WhatsApp Business</h2><p className="mt-1.5 text-sm leading-6 text-slate-400">Connect this school’s WhatsApp Business number. Its notifications will be sent only from the connected school number.</p></div>
    {toast && <div className={`rounded-2xl border px-4 py-3 text-sm ${toast.type === "success" ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200" : "border-red-400/20 bg-red-400/10 text-red-200"}`}>{toast.msg}</div>}
    {loading ? <div className="py-8 text-sm text-slate-400">Checking WhatsApp status…</div> : connected ? <div className="space-y-5 rounded-3xl border border-emerald-400/20 bg-emerald-400/5 p-6">
      <div className="flex items-center justify-between"><span className="font-semibold text-emerald-300">WhatsApp Connected ✓</span><span className="text-xs text-slate-400">{status?.connectionStatus || "connected"}</span></div>
      <div className="grid gap-2.5 text-sm"><Row label="School WhatsApp Number" value={status?.phoneNumber || "—"} /><Row label="Display Name" value={status?.displayName || "—"} /><Row label="WhatsApp Business Account" value={status?.businessAccountId || "—"} mono /><Row label="Connected" value={fmtDate(status?.connectedAt)} /></div>
      <div className="flex flex-wrap gap-3"><button onClick={() => void testConnection()} disabled={testing} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{testing ? "Testing…" : "Test Connection"}</button><button onClick={() => void startConnect()} disabled={connecting} className="rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{connecting ? "Connecting…" : "Reconnect"}</button><button onClick={() => void disconnect()} disabled={disconnecting} className="rounded-xl border border-red-400/25 px-4 py-2 text-sm font-semibold text-red-300 disabled:opacity-60">{disconnecting ? "Disconnecting…" : "Disconnect"}</button></div>
    </div> : <div className="space-y-5 rounded-3xl border border-white/10 bg-white/5 p-6">
      <div><h3 className="font-semibold text-white">Connect Your School&apos;s WhatsApp Number</h3><p className="mt-1 text-sm leading-6 text-slate-400">Meta will securely guide you to select the school’s Business Portfolio, WhatsApp Business Account, and phone number.</p></div>
      {status?.fallbackActive && <div className="rounded-2xl border border-sky-400/20 bg-sky-400/10 px-4 py-3 text-sm text-sky-100">This school has not connected its own number yet. Notifications are currently sent through the EduCore WhatsApp number.</div>}
      <button onClick={() => void startConnect()} disabled={connecting || !sdkReady} className="w-full rounded-2xl bg-[#25D366] py-3.5 text-sm font-semibold text-white disabled:opacity-60">{connecting ? "Waiting for Meta…" : sdkReady ? "Connect WhatsApp Business Number" : "Loading Meta…"}</button>
      <p className="text-xs leading-5 text-slate-500">Use the Facebook account that manages this school’s Meta Business Portfolio. Cancelling Meta’s window leaves the current connection unchanged.</p>
    </div>}
  </div>
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) { return <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3"><span className="text-slate-400">{label}</span><span className={`max-w-[55%] truncate text-right text-slate-200 ${mono ? "font-mono text-xs" : "font-semibold"}`}>{value}</span></div> }
