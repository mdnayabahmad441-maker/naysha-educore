import { NextResponse } from "next/server"
import { ensureSameSchool, requireAuthorizedProfile } from "@/lib/api-auth"
import { createClaudeMessage, extractClaudeText } from "@/lib/claude"
import { getAiTenantContext, getSchoolLiveData } from "@/lib/server-settings"
import { requireAiEnabled } from "@/lib/ai-access"
import { consumeRateLimit } from "@/lib/security"

export async function POST(req: Request) {
  const authResult = await requireAuthorizedProfile(req, ["admin", "teacher"])

  if ("response" in authResult) {
    return authResult.response
  }

  try {
    const body = await req.json().catch(() => null)
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 })
    }

    const schoolId = String(body?.schoolId || "")
    const schoolName = String(body?.schoolName || "School")
    const messages = Array.isArray(body?.messages) ? body.messages : []

    const schoolMismatch = ensureSameSchool(authResult.profile, schoolId)
    if (schoolMismatch) return schoolMismatch

    const aiBlocked = await requireAiEnabled(schoolId)
    if (aiBlocked) return aiBlocked

    // User-level rate limit: max 15 requests per minute
    const userLimit = await consumeRateLimit(`ai:chat:user:${authResult.profile.userId}`, 15, 60 * 1000)
    if (!userLimit.allowed) {
      return NextResponse.json(
        { error: "AI chat rate limit exceeded. Please wait a moment before sending more messages." },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.max(1, Math.ceil((userLimit.resetAt - Date.now()) / 1000))),
          },
        }
      )
    }

    // School-level rate limit: max 45 requests per minute across staff
    const schoolLimit = await consumeRateLimit(`ai:chat:school:${schoolId}`, 45, 60 * 1000)
    if (!schoolLimit.allowed) {
      return NextResponse.json(
        { error: "School-wide AI rate limit reached. Please wait a moment before trying again." },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.max(1, Math.ceil((schoolLimit.resetAt - Date.now()) / 1000))),
          },
        }
      )
    }

    if (!messages.length) {
      return NextResponse.json({ error: "At least one message is required" }, { status: 400 })
    }

    if (messages.length > 25) {
      return NextResponse.json({ error: "Message history exceeds maximum allowed limit" }, { status: 400 })
    }

    const normalized = messages
      .filter((m: any) => m.role === "user" || m.role === "assistant")
      .map((m: any) => ({
        role: m.role as "user" | "assistant",
        content: String(m.content || "").slice(0, 3000),
      }))

    while (normalized.length > 0 && normalized[0].role === "assistant") {
      normalized.shift()
    }

    if (!normalized.length) {
      return NextResponse.json({ error: "No user message found" }, { status: 400 })
    }

    const [tenantContext, liveData] = await Promise.all([
      getAiTenantContext(schoolId),
      getSchoolLiveData(schoolId),
    ])

    const systemPrompt = [
      `You are an AI assistant for ${schoolName}, a school using NaySha EduCore ERP. ` +
      `Help the admin with reports, data analysis, drafting notices, fee summaries, attendance insights, and school operations. ` +
      `When answering data questions, use the live school data below. Be concise and practical.`,
      liveData,
      tenantContext,
    ]
      .filter(Boolean)
      .join("\n\n")

    const response = await createClaudeMessage({ system: systemPrompt, messages: normalized })
    const text = extractClaudeText(response)

    return NextResponse.json({ success: true, message: text || "I could not generate a response." })
  } catch (error) {
    console.error("AI chat route error:", error)
    return NextResponse.json(
      { error: "Failed to generate AI response. Please try again later." },
      { status: 500 }
    )
  }
}
