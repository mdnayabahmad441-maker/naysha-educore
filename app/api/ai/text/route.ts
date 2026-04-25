import { NextResponse } from "next/server"
import { ensureSameSchool, requireAdminProfile } from "@/lib/api-auth"
import { createOpenAIResponse, extractOpenAIText } from "@/lib/openai"

type AiTask = "certificate_text" | "notice_draft" | "enquiry_reply" | "report_card_remark"

const taskSchemaMap = {
  certificate_text: {
    name: "certificate_text",
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        title: { type: "string" },
        body: { type: "string" }
      },
      required: ["title", "body"]
    }
  },
  notice_draft: {
    name: "notice_draft",
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        title: { type: "string" },
        message: { type: "string" }
      },
      required: ["title", "message"]
    }
  },
  enquiry_reply: {
    name: "enquiry_reply",
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        subject: { type: "string" },
        message: { type: "string" }
      },
      required: ["subject", "message"]
    }
  },
  report_card_remark: {
    name: "report_card_remark",
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        remark: { type: "string" }
      },
      required: ["remark"]
    }
  }
} as const

function buildPrompt(task: AiTask, input: Record<string, unknown>) {
  if (task === "certificate_text") {
    return `Create a formal school certificate draft.
Certificate type: ${String(input.certificateType || "bonafide")}
School name: ${String(input.schoolName || "School")}
Student name: ${String(input.studentName || "Student")}
Father name: ${String(input.fatherName || "Parent")}
Class: ${String(input.className || "Class")}
Admission number: ${String(input.studentCode || "N/A")}
Issue date: ${String(input.issueDate || "")}
Reason: ${String(input.reason || "")}

Write official school wording. Keep it concise, printable, and ready for admin review.`
  }

  if (task === "notice_draft") {
    return `Create a school notice draft.
School name: ${String(input.schoolName || "School")}
Audience: ${String(input.audience || "All students")}
Topic: ${String(input.topic || "")}
Important details: ${String(input.details || "")}
Tone: professional, parent-friendly, school ERP notice.

Return a clear title and a message suitable for email/WhatsApp/ERP notice delivery.`
  }

  if (task === "report_card_remark") {
    return `Create a short, school-style report card remark.
School name: ${String(input.schoolName || "School")}
Student name: ${String(input.studentName || "Student")}
Class: ${String(input.className || "Class")}
Exam name: ${String(input.examName || "Exam")}
Percentage: ${String(input.percentage || "")}
Grade: ${String(input.grade || "")}
Result: ${String(input.result || "")}
Strength summary: ${String(input.strengths || "")}
Concern summary: ${String(input.concerns || "")}

Write one concise teacher remark suitable for a real school report card.`
  }

  return `Create a professional school admission enquiry reply.
School name: ${String(input.schoolName || "School")}
Student name: ${String(input.studentName || "Student")}
Father name: ${String(input.fatherName || "Parent")}
Class wanted: ${String(input.classWanted || "")}
Phone: ${String(input.phone || "")}
Email: ${String(input.email || "")}
Address: ${String(input.address || "")}
Status: ${String(input.status || "new")}

Write a helpful admissions follow-up that sounds warm, clear, and professional.`
}

export async function POST(req: Request) {
  const authResult = await requireAdminProfile(req)

  if ("response" in authResult) {
    return authResult.response
  }

  try {
    const body = await req.json()
    const task = body?.task as AiTask
    const schoolId = String(body?.schoolId || "")

    if (!task || !(task in taskSchemaMap)) {
      return NextResponse.json({ error: "Valid AI task is required" }, { status: 400 })
    }

    const schoolMismatch = ensureSameSchool(authResult.profile, schoolId)
    if (schoolMismatch) {
      return schoolMismatch
    }

    const schema = taskSchemaMap[task]
    const response = await createOpenAIResponse({
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text:
                "You write polished school ERP content. Return only valid JSON matching the requested schema. Keep wording practical and ready for real admin use."
            }
          ]
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: buildPrompt(task, body)
            }
          ]
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: schema.name,
          schema: schema.schema
        }
      }
    })

    const text = extractOpenAIText(response)
    if (!text) {
      return NextResponse.json({ error: "OpenAI returned no text" }, { status: 502 })
    }

    return NextResponse.json({
      success: true,
      data: JSON.parse(text)
    })
  } catch (error) {
    console.error("AI text route error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate AI text" },
      { status: 500 }
    )
  }
}
