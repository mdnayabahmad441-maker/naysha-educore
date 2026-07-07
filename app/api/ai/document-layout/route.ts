import { NextResponse } from "next/server"
import { ensureSameSchool, requireAdminProfile } from "@/lib/api-auth"
import { requireAiEnabled } from "@/lib/ai-access"
import { createClaudeMessage, extractClaudeToolInput, getClaudeConfig } from "@/lib/claude"
import { getDefaultDocumentLayout, normalizeDocumentLayout, type DocumentKind } from "@/lib/document-layouts"
import { getAiTenantContext } from "@/lib/server-settings"
import type Anthropic from "@anthropic-ai/sdk"

const layoutTool: Anthropic.Tool = {
  name: "document_layout",
  description: "Return the detected field layout for a school document image",
  input_schema: {
    type: "object" as const,
    properties: {
      width: { type: "number" },
      height: { type: "number" },
      fields: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string" },
            label: { type: "string" },
            type: { type: "string", enum: ["text", "photo", "table"] },
            x: { type: "number" },
            y: { type: "number" },
            w: { type: "number" },
            h: { type: "number" },
            fontSize: { type: "number" },
            fontWeight: { type: "number" },
            color: { type: "string" },
            align: { type: "string", enum: ["left", "center", "right"] },
            uppercase: { type: "boolean" },
            bgColor: { type: "string" },
            bgOpacity: { type: "number" },
            borderRadius: { type: "number" },
            borderColor: { type: "string" },
            letterSpacing: { type: "number" }
          },
          required: ["id", "label", "type", "x", "y", "w", "h"]
        }
      }
    },
    required: ["width", "height", "fields"]
  }
}

const fieldGuides: Record<DocumentKind, string> = {
  id_card:
    "Detect the card layout for school ID cards. Position school name, school address, student photo, student name, father name, class/course, admission/enrollment number, phone/mobile number, and roll badge if the template suggests one.",
  report_card:
    "Detect the page layout for a school report card. Position school name, report title, student identity fields, exam summary fields, a marks table area, total marks, obtained marks, result, grade, and signature labels.",
  certificate:
    "Detect fill-in positions on a school certificate template. The template already has school name, title, and body text pre-printed — do NOT position schoolName, schoolAddress, certificateTitle, or certificateBody. Only detect where the dynamic values go: studentName (in the blank after 'Mr./Ms.' or 'Name:'), fatherName (in the blank after 'S/o', 'D/o', or 'Father:'), className (in the blank after 'class' or 'std'), studentCode (near 'Admission No', 'Roll No', or 'Student ID' blank), issueDate (near 'Date:' or 'Place:' area at the bottom), principalSign (at the principal/signature area). Place each field value just inside its dotted-line or underline placeholder."
}

export async function GET() {
  const config = getClaudeConfig()

  return NextResponse.json({
    configured: config.configured,
    model: config.model,
    missing: config.configured ? [] : ["ANTHROPIC_API_KEY"]
  })
}

export async function POST(req: Request) {
  const authResult = await requireAdminProfile(req)
  if ("response" in authResult) return authResult.response

  try {
    const body = await req.json()
    const kind = body?.kind as DocumentKind
    const imageUrl = String(body?.imageUrl || "").trim()
    const schoolId = String(body?.schoolId || "").trim()
    const sourceWidth = Number(body?.sourceWidth || 0)
    const sourceHeight = Number(body?.sourceHeight || 0)

    const schoolMismatch = ensureSameSchool(authResult.profile, schoolId)
    if (schoolMismatch) return schoolMismatch

    const aiBlocked = await requireAiEnabled(schoolId)
    if (aiBlocked) return aiBlocked

    if (!kind || !["id_card", "report_card", "certificate"].includes(kind)) {
      return NextResponse.json({ error: "Valid document kind is required" }, { status: 400 })
    }

    if (!imageUrl) {
      return NextResponse.json({ error: "imageUrl is required" }, { status: 400 })
    }

    const defaultLayout = getDefaultDocumentLayout(kind)
    const targetWidth = sourceWidth > 0 ? sourceWidth : defaultLayout.width
    const targetHeight = sourceHeight > 0 ? sourceHeight : defaultLayout.height
    const tenantContext = schoolId ? await getAiTenantContext(schoolId) : ""

    const response = await createClaudeMessage({
      system:
        [
          "You are a document layout extractor for a school ERP. Analyze the uploaded school document design and return an overlay layout that matches the template as closely as possible. All x, y, w, h values are percentages of the full image. Keep field ids unchanged from the starter layout whenever possible. Do not redesign the template. Detect the actual printed zones where dynamic text or photos should be placed.",
          tenantContext
        ]
          .filter(Boolean)
          .join("\n\n"),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `${fieldGuides[kind]}

Use this starter layout as the available field set:
${JSON.stringify(defaultLayout.fields, null, 2)}

Important rules:
- Return the same field ids from the starter layout.
- Use the uploaded image's real size: width=${targetWidth}, height=${targetHeight}.
- Match visible boxes, lines, badges, and text areas from the template.
- Keep text fields inside their printed placeholders and avoid overlapping labels or artwork.
- For photo fields, align to the visible photo frame exactly.
- For badge or pill fields, include background color, text color, and border radius when visible.
- If the template has pre-printed labels like Name, Father's Name, Course, Er. No., Mobile No., place only the dynamic values in the blank/value area, not over the labels.

Return only the tool result.`
            },
            {
              type: "image",
              source: { type: "url", url: imageUrl }
            }
          ]
        }
      ],
      tools: [layoutTool],
      toolChoice: { type: "tool", name: "document_layout" }
    })

    const parsed = extractClaudeToolInput(response)

    if (!parsed) {
      return NextResponse.json({ error: "Claude returned no layout" }, { status: 502 })
    }

    const layout = normalizeDocumentLayout(kind, parsed)
    layout.width = targetWidth
    layout.height = targetHeight

    return NextResponse.json({ success: true, layout })
  } catch (error) {
    console.error("AI document layout error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate AI layout" },
      { status: 500 }
    )
  }
}
