import { createHmac, timingSafeEqual } from "crypto"
import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function verifyMetaSignature(rawBody: string, signatureHeader: string | null) {
  const appSecret = process.env.META_APP_SECRET

  if (!appSecret || !signatureHeader?.startsWith("sha256=")) {
    return false
  }

  const expectedSignature = createHmac("sha256", appSecret)
    .update(rawBody)
    .digest("hex")

  const receivedSignature = signatureHeader.slice("sha256=".length)
  const expectedBuffer = Buffer.from(expectedSignature, "hex")
  const receivedBuffer = Buffer.from(receivedSignature, "hex")

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false
  }

  return timingSafeEqual(expectedBuffer, receivedBuffer)
}

async function markWebhookEvent(phoneNumberId: string | null, status: string) {
  if (!phoneNumberId) {
    return
  }

  const { error } = await supabaseAdmin
    .from("school_whatsapp")
    .update({
      last_webhook_event_at: new Date().toISOString(),
      last_webhook_status: status,
      updated_at: new Date().toISOString(),
    })
    .eq("phone_number_id", phoneNumberId)

  if (error) {
    console.error("[WhatsApp webhook] Failed to update webhook status:", error.message)
  }
}

function extractEvents(payload: any) {
  const events: Array<{ phoneNumberId: string | null; summary: string }> = []

  for (const entry of payload?.entry || []) {
    for (const change of entry?.changes || []) {
      const value = change?.value || {}
      const phoneNumberId = value?.metadata?.phone_number_id || null

      for (const status of value?.statuses || []) {
        events.push({
          phoneNumberId,
          summary: `status:${status.status || "unknown"}:${status.recipient_id || "unknown"}`,
        })
      }

      for (const message of value?.messages || []) {
        events.push({
          phoneNumberId,
          summary: `message:${message.type || "unknown"}:${message.from || "unknown"}`,
        })
      }
    }
  }

  return events
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get("hub.mode")
  const token = searchParams.get("hub.verify_token")
  const challenge = searchParams.get("hub.challenge")

  if (mode === "subscribe" && token && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge || "", {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
      },
    })
  }

  return NextResponse.json({ error: "Verification failed" }, { status: 403 })
}

export async function POST(request: Request) {
  const rawBody = await request.text()
  const signature = request.headers.get("x-hub-signature-256")

  if (!verifyMetaSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  try {
    const payload = JSON.parse(rawBody)
    const events = extractEvents(payload)

    if (events.length === 0) {
      console.log("[WhatsApp webhook] No message or status events in payload")
      return NextResponse.json({ received: true })
    }

    for (const event of events) {
      await markWebhookEvent(event.phoneNumberId, event.summary)
    }

    console.log("[WhatsApp webhook] Events:", JSON.stringify(events))

    return NextResponse.json({ received: true, events: events.length })
  } catch (error) {
    console.error("WhatsApp webhook parse error:", error)
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }
}
