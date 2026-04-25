import { NextResponse } from "next/server"
import { ensureSameSchool, requireAdminProfile } from "@/lib/api-auth"
import { createClaudeMessage, extractClaudeText } from "@/lib/claude"

export async function POST(req: Request) {
  const authResult = await requireAdminProfile(req)

  if ("response" in authResult) {
    return authResult.response
  }

  try {
    const body = await req.json()
    const schoolId = String(body?.schoolId || "")
    const schoolName = String(body?.schoolName || "School")
    const messages = Array.isArray(body?.messages) ? body.messages : []

    const schoolMismatch = ensureSameSchool(authResult.profile, schoolId)
    if (schoolMismatch) {
      return schoolMismatch
    }

    if (!messages.length) {
      return NextResponse.json({ error: "At least one message is required" }, { status: 400 })
    }

    // Claude requires messages to start with "user" and alternate roles.
    // Strip any leading assistant messages (the UI's initial greeting).
    const normalized = messages
      .filter((m: any) => m.role === "user" || m.role === "assistant")
      .map((m: any) => ({ role: m.role as "user" | "assistant", content: String(m.content || "") }))

    while (normalized.length > 0 && normalized[0].role === "assistant") {
      normalized.shift()
    }

    if (!normalized.length) {
      return NextResponse.json({ error: "No user message found" }, { status: 400 })
    }

    const response = await createClaudeMessage({
      system: `You are an ERP admin assistant for ${schoolName}. Help school admins with notices, admissions, fees, attendance, exams, parents, teachers, and document workflows. Be concise, practical, and operational.`,
      messages: normalized
    })

    const text = extractClaudeText(response)

    return NextResponse.json({
      success: true,
      message: text || "I could not generate a response."
    })
  } catch (error) {
    console.error("AI chat route error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to chat with AI" },
      { status: 500 }
    )
  }
}
