import { NextResponse } from "next/server"
import { ensureSameSchool, requireAdminProfile } from "@/lib/api-auth"
import { createOpenAIResponse, extractOpenAIText } from "@/lib/openai"

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

    const transcript = messages
      .map((message: any) => `${message.role === "assistant" ? "Assistant" : "User"}: ${String(message.content || "")}`)
      .join("\n")

    const response = await createOpenAIResponse({
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text:
                `You are an ERP admin assistant for ${schoolName}. Help school admins with notices, admissions, fees, attendance, exams, parents, teachers, and document workflows. Be concise, practical, and operational.`
            }
          ]
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: transcript
            }
          ]
        }
      ]
    })

    const text = extractOpenAIText(response)

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
