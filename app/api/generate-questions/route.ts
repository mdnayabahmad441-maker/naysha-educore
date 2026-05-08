import { NextResponse } from "next/server"
import { requireAuthorizedProfile } from "@/lib/api-auth"
import { createClaudeMessage, extractClaudeText } from "@/lib/claude"
import { supabaseAdmin } from "@/lib/supabase-admin"

export interface QuestionPaperInput {
  class: string
  subject: string
  chapter: string
  topic?: string
  difficulty: "Easy" | "Medium" | "Hard"
  marks: number
  schoolId: string
}

const ANSWER_KEY_DELIMITER = "===ANSWER KEY==="

export interface GenerateResult {
  content: string
  answerKey: string
}

export async function generateQuestionPaper(input: QuestionPaperInput): Promise<GenerateResult> {
  const topic = input.topic?.trim() || "All topics in the chapter"

  const prompt = `You are a CBSE question paper setter.

Generate a structured question paper AND its complete answer key / marking scheme.

Class: ${input.class}
Subject: ${input.subject}
Chapter: ${input.chapter}
Topic: ${topic}
Difficulty: ${input.difficulty}
Total Marks: ${input.marks}

PART 1 — QUESTION PAPER RULES:
- Follow CBSE pattern strictly
- Section A: MCQs (1 mark each)
- Section B: Short answer (2–3 marks)
- Section C: Long answer (4–5 marks)
- Include internal choices where applicable
- Cover important concepts from the chapter
- Avoid repetition
- Maintain mark distribution totalling exactly ${input.marks} marks
- Use age-appropriate language for Class ${input.class}

PART 1 OUTPUT FORMAT:
- School header line: "CBSE Question Paper"
- Class, Subject, Chapter on separate lines
- Time: [appropriate time] | Max Marks: ${input.marks}
- General Instructions (3–4 bullet points)
- Then sections clearly labelled: SECTION A, SECTION B, SECTION C
- Each question numbered
- Marks clearly written in brackets e.g. [1 Mark] [2 Marks]
- For MCQs: show 4 options labelled (a) (b) (c) (d)
- Internal choices marked as "OR"

After the complete question paper, output this exact line by itself:
===ANSWER KEY===

PART 2 — ANSWER KEY / MARKING SCHEME FORMAT:
- Title: "ANSWER KEY / MARKING SCHEME"
- Class, Subject, Chapter, Total Marks on next line
- SECTION A ANSWERS: Each MCQ number with correct option letter and the answer text e.g. "1. (b) Decomposition reaction"
- SECTION B KEY POINTS: For each question number, list 2–3 bullet-point marking key points. State how marks are awarded. For OR questions provide answers for both.
- SECTION C KEY POINTS: For each question, provide main headings / steps with mark distribution in brackets. For OR questions provide answers for both.
- End with "--- End of Answer Key ---"`

  const response = await createClaudeMessage({
    system: "You are an expert CBSE curriculum specialist and experienced question paper setter with 20 years of experience. Always output complete, well-structured question papers with proper CBSE formatting, followed by a thorough answer key.",
    messages: [{ role: "user", content: prompt }],
    maxTokens: 6000,
  })

  const raw = extractClaudeText(response)
  const idx = raw.indexOf(ANSWER_KEY_DELIMITER)

  if (idx !== -1) {
    return {
      content: raw.substring(0, idx).trim(),
      answerKey: raw.substring(idx + ANSWER_KEY_DELIMITER.length).trim(),
    }
  }

  return { content: raw, answerKey: "" }
}

export async function POST(req: Request) {
  const auth = await requireAuthorizedProfile(req, ["admin", "teacher"])
  if ("response" in auth) return auth.response

  try {
    const body = await req.json()
    const { class: cls, subject, chapter, topic, difficulty, marks, schoolId, save } = body

    if (!cls || !subject || !chapter || !difficulty || !marks || !schoolId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (!["Easy", "Medium", "Hard"].includes(difficulty)) {
      return NextResponse.json({ error: "Invalid difficulty" }, { status: 400 })
    }

    const marksNum = Number(marks)
    if (isNaN(marksNum) || marksNum < 10 || marksNum > 100) {
      return NextResponse.json({ error: "Marks must be between 10 and 100" }, { status: 400 })
    }

    const { content, answerKey } = await generateQuestionPaper({
      class: cls, subject, chapter, topic, difficulty, marks: marksNum, schoolId,
    })

    if (!content) {
      return NextResponse.json({ error: "AI generation failed — empty response" }, { status: 500 })
    }

    // Optionally save to DB
    if (save) {
      const { data: teacher } = await supabaseAdmin
        .from("teachers")
        .select("id")
        .eq("auth_id", auth.profile.userId)
        .maybeSingle()

      await supabaseAdmin.from("question_papers").insert({
        school_id: schoolId,
        teacher_id: teacher?.id ?? null,
        class: cls,
        subject,
        chapter,
        topic: topic || null,
        difficulty,
        total_marks: marksNum,
        content,
      })
    }

    return NextResponse.json({ success: true, content, answerKey })
  } catch (err: any) {
    console.error("[generate-questions]", err)
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 })
  }
}

// GET — saved papers for this teacher
export async function GET(req: Request) {
  const auth = await requireAuthorizedProfile(req, ["admin", "teacher"])
  if ("response" in auth) return auth.response

  const url = new URL(req.url)
  const schoolId = url.searchParams.get("schoolId")

  if (!schoolId) return NextResponse.json({ error: "schoolId required" }, { status: 400 })

  const { data: teacher } = await supabaseAdmin
    .from("teachers")
    .select("id")
    .eq("auth_id", auth.profile.userId)
    .maybeSingle()

  const query = supabaseAdmin
    .from("question_papers")
    .select("id, class, subject, chapter, difficulty, total_marks, created_at")
    .eq("school_id", schoolId)
    .order("created_at", { ascending: false })
    .limit(50)

  if (teacher?.id) {
    query.eq("teacher_id", teacher.id)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, papers: data || [] })
}
