import { createHmac, timingSafeEqual } from "crypto"
import { NextResponse } from "next/server"

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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get("hub.mode")
  const token = searchParams.get("hub.verify_token")
  const challenge = searchParams.get("hub.challenge")

  if (
    mode === "subscribe" &&
    token &&
    token === process.env.WHATSAPP_VERIFY_TOKEN
  ) {
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

    console.log("WhatsApp webhook event:", JSON.stringify(payload))

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("WhatsApp webhook parse error:", error)
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }
}
