import { NextRequest, NextResponse } from "next/server"
import { requireAdminProfile } from "@/lib/api-auth"
import { supabaseAdmin } from "@/lib/supabase-admin"

const API_VERSION = process.env.WHATSAPP_CLOUD_API_VERSION || "v23.0"
const GRAPH = `https://graph.facebook.com/${API_VERSION}`
const STATE_COOKIE = "wa_embedded_signup"
type SignupState = { schoolId?: string; nonce?: string }

function clientError(error: unknown) {
  const message = error instanceof Error ? error.message : "WhatsApp connection could not be completed."
  console.error("[WhatsApp embedded signup]", message)
  if (/phone number/i.test(message)) return "No WhatsApp phone number was selected in Meta."
  if (/business account|waba/i.test(message)) return "No WhatsApp Business Account was selected in Meta."
  if (/code|token|oauth/i.test(message)) return "Meta could not authorize this connection. Please start again."
  return "WhatsApp connection could not be completed. Please try again or contact support."
}

async function graphGet(path: string, token: string, fields?: string) {
  const url = new URL(`${GRAPH}${path}`)
  if (fields) url.searchParams.set("fields", fields)
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" })
  const data = await response.json()
  if (!response.ok) throw new Error(data?.error?.message || `Meta API request failed for ${path}`)
  return data
}

async function exchangeCode(code: string) {
  const appId = process.env.META_APP_ID
  const appSecret = process.env.META_APP_SECRET
  const redirectUri = process.env.META_REDIRECT_URI || process.env.META_WHATSAPP_REDIRECT_URI
  if (!appId || !appSecret || !redirectUri) throw new Error("WhatsApp server configuration is incomplete")
  const url = new URL(`${GRAPH}/oauth/access_token`)
  url.searchParams.set("client_id", appId); url.searchParams.set("client_secret", appSecret)
  url.searchParams.set("redirect_uri", redirectUri); url.searchParams.set("code", code)
  const response = await fetch(url, { cache: "no-store" })
  const data = await response.json()
  if (!response.ok || !data?.access_token) throw new Error(data?.error?.message || "Meta authorization code exchange failed")
  return String(data.access_token)
}

async function selectedPhone(accessToken: string, suppliedWaba?: string, suppliedPhone?: string) {
  let wabaId = suppliedWaba
  if (!wabaId) wabaId = (await graphGet("/me/whatsapp_business_accounts", accessToken, "id,name"))?.data?.[0]?.id
  if (!wabaId) throw new Error("No WhatsApp Business Account selected")
  const phones = await graphGet(`/${wabaId}/phone_numbers`, accessToken, "id,display_phone_number,verified_name,status")
  const phone = suppliedPhone ? phones?.data?.find((item: { id?: string }) => item.id === suppliedPhone) : phones?.data?.[0]
  if (!phone?.id) throw new Error("No WhatsApp phone number selected")
  return { wabaId: String(wabaId), phone }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminProfile(request)
  if ("response" in auth) return auth.response
  try {
    const rawState = request.cookies.get(STATE_COOKIE)?.value
    const state = rawState ? JSON.parse(rawState) as SignupState : null
    if (!state?.schoolId || state.schoolId !== auth.profile.schoolId || !state.nonce) {
      return NextResponse.json({ error: "This WhatsApp connection session has expired. Please start again." }, { status: 400 })
    }
    const body = await request.json()
    const code = typeof body?.code === "string" ? body.code : ""
    if (!code) return NextResponse.json({ error: "Meta did not return an authorization code. Please try again." }, { status: 400 })
    const accessToken = await exchangeCode(code)
    const selected = await selectedPhone(accessToken, typeof body?.wabaId === "string" ? body.wabaId : undefined, typeof body?.phoneNumberId === "string" ? body.phoneNumberId : undefined)
    const subscription = await fetch(`${GRAPH}/${selected.wabaId}/subscribed_apps`, { method: "POST", headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" } })
    if (!subscription.ok) { const data = await subscription.json().catch(() => null); throw new Error(data?.error?.message || "Meta could not subscribe the WhatsApp account") }
    const { error } = await supabaseAdmin.from("school_whatsapp").upsert({
      school_id: state.schoolId, access_token: accessToken, phone_number_id: selected.phone.id, business_account_id: selected.wabaId,
      phone_number: selected.phone.display_phone_number ?? null, display_name: selected.phone.verified_name ?? null, status: "connected",
      last_webhook_event_at: null, last_webhook_status: "subscribed", connected_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }, { onConflict: "school_id" })
    if (error) throw new Error(`Database error: ${error.message}`)
    const response = NextResponse.json({ success: true })
    response.cookies.delete(STATE_COOKIE)
    return response
  } catch (error) { return NextResponse.json({ error: clientError(error) }, { status: 400 }) }
}
