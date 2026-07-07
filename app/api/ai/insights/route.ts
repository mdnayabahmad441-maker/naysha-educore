import { NextResponse } from "next/server"
import { ensureSameSchool, requireAuthorizedProfile } from "@/lib/api-auth"
import { createClaudeMessage, extractClaudeToolInput } from "@/lib/claude"
import { getAiTenantContext } from "@/lib/server-settings"
import { requireAiEnabled } from "@/lib/ai-access"
import type Anthropic from "@anthropic-ai/sdk"

type InsightTask =
  | "dashboard_digest"
  | "attendance_summary"
  | "fee_reminders"
  | "result_analysis"

const taskTools: Record<InsightTask, Anthropic.Tool> = {
  dashboard_digest: {
    name: "dashboard_digest",
    description: "Generate a concise AI daily digest for school admin dashboard",
    input_schema: {
      type: "object" as const,
      properties: {
        summary: { type: "string", description: "2-3 sentence overview of the school day" },
        highlights: {
          type: "array",
          items: { type: "string" },
          description: "3-5 key highlights or action items for the admin"
        },
        alerts: {
          type: "array",
          items: { type: "string" },
          description: "Urgent items needing attention (empty if none)"
        }
      },
      required: ["summary", "highlights", "alerts"]
    }
  },

  attendance_summary: {
    name: "attendance_summary",
    description: "Generate insights and observations from today's attendance data",
    input_schema: {
      type: "object" as const,
      properties: {
        insight: { type: "string", description: "Key observation about today's attendance" },
        concern: { type: "string", description: "Any concerning pattern (empty string if none)" },
        suggestion: { type: "string", description: "One actionable suggestion for the admin" },
        absentMessages: {
          type: "array",
          description: "Personalised WhatsApp messages for each absent student's parent",
          items: {
            type: "object",
            properties: {
              studentName: { type: "string" },
              message: { type: "string" }
            },
            required: ["studentName", "message"]
          }
        }
      },
      required: ["insight", "concern", "suggestion", "absentMessages"]
    }
  },

  fee_reminders: {
    name: "fee_reminders",
    description: "Draft personalised fee reminder messages for students with pending fees",
    input_schema: {
      type: "object" as const,
      properties: {
        summary: { type: "string", description: "One-line summary of the pending fees situation" },
        reminders: {
          type: "array",
          description: "Personalised reminder message per student",
          items: {
            type: "object",
            properties: {
              studentName: { type: "string" },
              amount: { type: "number" },
              message: { type: "string", description: "WhatsApp-friendly reminder message" }
            },
            required: ["studentName", "amount", "message"]
          }
        }
      },
      required: ["summary", "reminders"]
    }
  },

  result_analysis: {
    name: "result_analysis",
    description: "Analyse exam results and generate class performance insights",
    input_schema: {
      type: "object" as const,
      properties: {
        overview: { type: "string", description: "Overall class performance summary" },
        topPerformers: {
          type: "array",
          items: { type: "string" },
          description: "Names of top 3 performers"
        },
        needsAttention: {
          type: "array",
          items: { type: "string" },
          description: "Names of students who need teacher attention"
        },
        subjectInsights: {
          type: "array",
          items: {
            type: "object",
            properties: {
              subject: { type: "string" },
              observation: { type: "string" }
            },
            required: ["subject", "observation"]
          }
        },
        recommendation: { type: "string", description: "Teacher/admin action recommendation" }
      },
      required: ["overview", "topPerformers", "needsAttention", "subjectInsights", "recommendation"]
    }
  }
}

function buildPrompt(task: InsightTask, input: Record<string, unknown>): string {
  const schoolName = String(input.schoolName || "School")
  const date = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })

  if (task === "dashboard_digest") {
    const stats = input.stats as Record<string, unknown> || {}
    return `Generate a concise daily digest for the admin of ${schoolName} on ${date}.

Current stats:
- Students enrolled: ${stats.students || 0}
- Teachers: ${stats.teachers || 0}
- Classes: ${stats.classes || 0}
- Today's attendance: ${stats.attendance || 0}%
- Fee collected: ₹${stats.collected || 0}
- Fee pending: ₹${stats.pending || 0}
- New admission enquiries: ${stats.newEnquiries || 0}
- Absent students today: ${stats.absentCount || 0}

Give a smart, helpful admin morning briefing. Flag anything that needs urgent attention.`
  }

  if (task === "attendance_summary") {
    const absentStudents = (input.absentStudents as Array<{ name: string; class: string }>) || []
    const presentCount = Number(input.presentCount || 0)
    const absentCount = Number(input.absentCount || 0)
    const percentage = Number(input.percentage || 0)
    const className = String(input.className || "the class")
    const dateStr = String(input.date || date)

    const absentList = absentStudents.map((s) => `- ${s.name} (${s.class})`).join("\n")

    return `Analyse today's attendance for ${className} at ${schoolName} on ${dateStr}.

Present: ${presentCount}, Absent: ${absentCount}, Rate: ${percentage}%

Absent students:
${absentList || "(none)"}

1. Give a brief attendance insight.
2. Note any concern (e.g. high absence rate).
3. Suggest one action.
4. Draft a short, warm WhatsApp message for each absent student's parent in the absentMessages array. Keep messages under 200 characters.`
  }

  if (task === "fee_reminders") {
    const pendingFees = (input.pendingFees as Array<{ studentName: string; amount: number; month: string }>) || []
    const month = String(input.month || "this month")

    const feeList = pendingFees
      .slice(0, 20)
      .map((f) => `- ${f.studentName}: ₹${f.amount} (${f.month || month})`)
      .join("\n")

    return `Draft fee reminder messages for ${schoolName} for ${month}.

Students with pending fees:
${feeList || "(none)"}

For each student, write a warm, polite WhatsApp reminder message for their parent. Keep messages under 250 characters. Be firm but friendly.`
  }

  if (task === "result_analysis") {
    const examName = String(input.examName || "Exam")
    const className = String(input.className || "Class")
    const results = (input.results as Array<{ name: string; percentage: number; grade: string }>) || []
    const subjects = (input.subjects as Array<{ name: string; classAvg: number }>) || []

    const resultsList = results
      .slice(0, 30)
      .map((r) => `${r.name}: ${r.percentage?.toFixed(1) || 0}% (${r.grade || "N/A"})`)
      .join(", ")

    const subjectsList = subjects
      .map((s) => `${s.name}: avg ${s.classAvg?.toFixed(1) || 0}%`)
      .join(", ")

    return `Analyse the results of "${examName}" for ${className} at ${schoolName}.

Student results: ${resultsList || "(none)"}
Subject averages: ${subjectsList || "(none)"}

Provide:
1. Overall class performance overview
2. Top 3 performers
3. Students needing attention (below 40%)
4. Subject-wise observations
5. One actionable recommendation for the teacher`
  }

  return "Generate an AI insight for this school ERP data."
}

export async function POST(req: Request) {
  const authResult = await requireAuthorizedProfile(req, ["admin", "teacher"])
  if ("response" in authResult) return authResult.response

  try {
    const body = await req.json()
    const task = body?.task as InsightTask
    const schoolId = String(body?.schoolId || "")

    if (!task || !(task in taskTools)) {
      return NextResponse.json({ error: "Valid task is required" }, { status: 400 })
    }

    const schoolMismatch = ensureSameSchool(authResult.profile, schoolId)
    if (schoolMismatch) return schoolMismatch

    const aiBlocked = await requireAiEnabled(schoolId)
    if (aiBlocked) return aiBlocked

    const tenantContext = await getAiTenantContext(schoolId)
    const tool = taskTools[task]

    const response = await createClaudeMessage({
      system: [
        "You are an expert school ERP data analyst. Provide concise, actionable insights for school admins. Use the provided tool to return structured output.",
        tenantContext
      ]
        .filter(Boolean)
        .join("\n\n"),
      messages: [{ role: "user", content: buildPrompt(task, body) }],
      tools: [tool],
      toolChoice: { type: "tool", name: tool.name },
      maxTokens: 3000
    })

    const result = extractClaudeToolInput(response)

    if (!result) {
      return NextResponse.json({ error: "AI returned no structured output" }, { status: 502 })
    }

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error("AI insights route error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate AI insight" },
      { status: 500 }
    )
  }
}
