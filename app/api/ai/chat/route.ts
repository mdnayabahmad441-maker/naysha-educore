import { NextResponse } from "next/server"
import { ensureSameSchool, requireAuthorizedProfile } from "@/lib/api-auth"
import { createClaudeMessage, extractClaudeText } from "@/lib/claude"
import { getAiTenantContext, getSchoolLiveData } from "@/lib/server-settings"

export async function POST(req: Request) {
  const authResult = await requireAuthorizedProfile(req, ["admin", "teacher"])

  if ("response" in authResult) {
    return authResult.response
  }

  try {
    const body = await req.json()
    const schoolId = String(body?.schoolId || "")
    const schoolName = String(body?.schoolName || "School")
    const messages = Array.isArray(body?.messages) ? body.messages : []

    const schoolMismatch = ensureSameSchool(authResult.profile, schoolId)
    if (schoolMismatch) return schoolMismatch

    if (!messages.length) {
      return NextResponse.json({ error: "At least one message is required" }, { status: 400 })
    }

    const normalized = messages
      .filter((m: any) => m.role === "user" || m.role === "assistant")
      .map((m: any) => ({ role: m.role as "user" | "assistant", content: String(m.content || "") }))

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
      { error: error instanceof Error ? error.message : "Failed to chat with AI" },
      { status: 500 }
    )
  }
}
