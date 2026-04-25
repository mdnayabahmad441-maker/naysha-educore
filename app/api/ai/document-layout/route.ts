import { NextResponse } from "next/server"
import { createClaudeMessage, extractClaudeToolInput, getClaudeConfig } from "@/lib/claude"
import { getDefaultDocumentLayout, normalizeDocumentLayout, type DocumentKind } from "@/lib/document-layouts"
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
    "Detect the layout for a school certificate. Position school name, school address, certificate title, large certificate body text block, student name, father name, class, admission number, issue date, and principal signature area."
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
  try {
    const body = await req.json()
    const kind = body?.kind as DocumentKind
    const imageUrl = String(body?.imageUrl || "").trim()

    if (!kind || !["id_card", "report_card", "certificate"].includes(kind)) {
      return NextResponse.json({ error: "Valid document kind is required" }, { status: 400 })
    }

    if (!imageUrl) {
      return NextResponse.json({ error: "imageUrl is required" }, { status: 400 })
    }

    const defaultLayout = getDefaultDocumentLayout(kind)

    const response = await createClaudeMessage({
      system:
        "You are a document layout extractor for a school ERP. Analyze the uploaded school document design and use the provided tool to return the detected field positions. All x, y, w, h values are percentages of the full page. Keep field ids unchanged from the starter layout whenever possible.",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `${fieldGuides[kind]}\n\nUse this starter layout as the available field set:\n${JSON.stringify(defaultLayout.fields, null, 2)}\n\nReturn the same fields with improved placement based on the uploaded template image. Preserve width=${defaultLayout.width} and height=${defaultLayout.height}.`
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

    return NextResponse.json({ success: true, layout })
  } catch (error) {
    console.error("AI document layout error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate AI layout" },
      { status: 500 }
    )
  }
}
