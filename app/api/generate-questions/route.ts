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
  schoolName?: string
  questionType?: "mixed" | "objective"
  examType?: "CBSE" | "NEET" | "JEE_MAINS" | "JEE_ADVANCED"
}

const ANSWER_KEY_DELIMITER = "===ANSWER KEY==="

export interface GenerateResult {
  content: string
  answerKey: string
}

export async function generateQuestionPaper(input: QuestionPaperInput): Promise<GenerateResult> {
  const topic = input.topic?.trim() || "All topics in the chapter"

  const examType = input.examType || "CBSE"
  const schoolName = input.schoolName?.trim() || "School"
  const isObjective = input.questionType === "objective"

  let prompt: string
  let systemPrompt: string

  if (examType === "NEET") {
    const neetQCount = Math.round(input.marks / 4)
    systemPrompt = "You are an expert NEET question paper setter with deep knowledge of NTA guidelines and NCERT curriculum. Generate precise, NEET-standard MCQs covering biology, physics, and chemistry concepts. Always follow NTA marking scheme."
    prompt = `Generate a NEET-style practice question paper AND its answer key.

School: ${schoolName}
Subject: ${input.subject}
Chapter: ${input.chapter}
Topic: ${topic}
Difficulty: ${input.difficulty}
Total Questions: ${neetQCount} (Marking: +4 correct, −1 wrong | Max Marks: ${input.marks})

NTA NEET GUIDELINES:
- ALL questions are Single Correct MCQs only
- Each question carries +4 marks for correct, −1 for incorrect, 0 for unattempted
- Questions must be NCERT-anchored with application, conceptual, and diagram-based types
- Language and difficulty level must match NTA NEET official papers
- Cover diverse important NEET topics from the chapter
- 4 options per question: (a) (b) (c) (d) — exactly one correct

OUTPUT FORMAT:
- Line 1: "${schoolName}"
- Line 2: "NEET Practice Question Paper"
- Line 3: Subject: ${input.subject} | Chapter: ${input.chapter}
- Line 4: Time: 60 Minutes | Max Marks: ${input.marks} | Marking: +4/−1
- General Instructions (2–3 bullet points mentioning marking scheme)
- Section label: SECTION A — PHYSICS/CHEMISTRY/BIOLOGY (match to subject) [${neetQCount} × 4 = ${input.marks} Marks]
- Each question numbered Q1. Q2. ...
- End each question stem with [4 Marks]
- Options (a)(b)(c)(d) each on their own line

After the complete question paper, output exactly:
===ANSWER KEY===

ANSWER KEY FORMAT:
- Line 1: "NEET ANSWER KEY"
- Line 2: ${schoolName} | ${input.subject} | ${input.chapter}
- For each question: "Q1. (b) — [brief explanation why this is correct, 1–2 lines]"
- End: "--- End of Answer Key ---"`

  } else if (examType === "JEE_MAINS") {
    const mcqCount = Math.round(input.marks * 0.6 / 4)
    const numCount = Math.round(input.marks * 0.4 / 4)
    systemPrompt = "You are an expert JEE Mains question paper setter with thorough knowledge of NTA JEE syllabus and paper pattern. Generate questions with JEE Mains difficulty: concept application, multi-step problems, and formula-based. Follow NTA JEE Mains official marking scheme strictly."
    prompt = `Generate a JEE Mains style practice question paper AND its answer key.

School: ${schoolName}
Subject: ${input.subject}
Chapter: ${input.chapter}
Topic: ${topic}
Difficulty: ${input.difficulty}
Total Marks: ${input.marks}

NTA JEE MAINS GUIDELINES:
- SECTION A: Single Correct MCQs (4 options, +4/−1 marking)
- SECTION B: Numerical Answer Type (integer/decimal answer, +4/0 marking — no negative)
- JEE Mains level difficulty: conceptual clarity + formula application + multi-step reasoning
- Cover standard JEE Mains question patterns from this chapter
- Questions must match NTA JEE Mains official paper language and style

OUTPUT FORMAT:
- Line 1: "${schoolName}"
- Line 2: "JEE Mains Practice Question Paper"
- Line 3: Subject: ${input.subject} | Chapter: ${input.chapter}
- Line 4: Time: 60 Minutes | Max Marks: ${input.marks}
- General Instructions (3–4 points with marking scheme details)
- SECTION A — SINGLE CORRECT TYPE (${mcqCount} Questions × 4 Marks = ${mcqCount * 4} Marks | +4/−1)
  - Each MCQ numbered Q1. Q2. ... with [4 Marks] at end
  - Options (a)(b)(c)(d) each on their own line
- SECTION B — NUMERICAL VALUE TYPE (${numCount} Questions × 4 Marks = ${numCount * 4} Marks | +4/0)
  - Questions numbered continuing from Section A
  - No options — just the problem requiring a numerical answer
  - [4 Marks, No Negative] at end

After the complete question paper, output exactly:
===ANSWER KEY===

ANSWER KEY FORMAT:
- Line 1: "JEE MAINS ANSWER KEY"
- Line 2: ${schoolName} | ${input.subject} | ${input.chapter}
- SECTION A: For each MCQ: "Q1. (c) — [step-by-step solution outline]"
- SECTION B: For each numerical: "Q#. Answer: [value with units] — [solution steps]"
- End: "--- End of Answer Key ---"`

  } else if (examType === "JEE_ADVANCED") {
    systemPrompt = "You are an expert JEE Advanced question paper setter with mastery of IIT JEE Advanced paper patterns. Generate highest-difficulty questions requiring multi-concept integration, deep derivation, and sharp analytical skills. Follow IIT JEE Advanced official marking scheme precisely."
    prompt = `Generate a JEE Advanced style practice question paper AND its answer key.

School: ${schoolName}
Subject: ${input.subject}
Chapter: ${input.chapter}
Topic: ${topic}
Difficulty: Very High (JEE Advanced Standard)
Total Marks: ${input.marks}

IIT JEE ADVANCED GUIDELINES:
- SECTION I: Single Correct MCQ (+3/−1)
- SECTION II: One or More Correct MCQs (+4 if all correct, partial +1 per correct option if no incorrect selected, −2 for any wrong selection)
- SECTION III: Integer Answer Type — 0 to 9 single digit (+3/0)
- Maximum difficulty: requires multi-step derivation, deep conceptual insight, and cross-topic integration
- Questions must mirror IIT JEE Advanced official paper language and cognitive demand

OUTPUT FORMAT:
- Line 1: "${schoolName}"
- Line 2: "JEE Advanced Practice Question Paper"
- Line 3: Subject: ${input.subject} | Chapter: ${input.chapter}
- Line 4: Time: 60 Minutes | Max Marks: ${input.marks}
- Detailed General Instructions (5–6 points with full marking scheme for each section)
- SECTION I — SINGLE CORRECT ANSWER TYPE (+3/−1)
  - MCQs numbered Q1. Q2. ... with [3 Marks] | Negative: −1
  - Options (a)(b)(c)(d) each on their own line
- SECTION II — ONE OR MORE CORRECT ANSWERS (+4/Partial/−2)
  - MCQs numbered continuing with [4 Marks] | Partial marking applies
  - Options (a)(b)(c)(d) each on their own line
- SECTION III — INTEGER ANSWER TYPE (+3/0)
  - Questions numbered continuing, no options [3 Marks]

After the complete question paper, output exactly:
===ANSWER KEY===

ANSWER KEY FORMAT:
- Line 1: "JEE ADVANCED ANSWER KEY"
- Line 2: ${schoolName} | ${input.subject} | ${input.chapter}
- SECTION I: "Q1. (b) — [detailed solution with key steps]"
- SECTION II: "Q#. (a)(c) — [explain which options are correct and why]"
- SECTION III: "Q#. Answer: [digit] — [solution steps]"
- End: "--- End of Answer Key ---"`

  } else if (isObjective) {
    systemPrompt = "You are an expert CBSE curriculum specialist and experienced question paper setter with 20 years of experience. Always output complete, well-structured objective question papers with proper CBSE formatting, followed by a thorough answer key."
    prompt = `Generate a CBSE objective-type question paper (MCQs only) AND its complete answer key.

School: ${schoolName}
Class: ${input.class}
Subject: ${input.subject}
Chapter: ${input.chapter}
Topic: ${topic}
Difficulty: ${input.difficulty}
Total Marks: ${input.marks}
Total Questions: ${input.marks} (each carrying 1 mark)

PAPER RULES:
- ALL questions must be Multiple Choice Questions (MCQs)
- Each question carries exactly 1 mark
- Each MCQ has exactly 4 options (a)(b)(c)(d) — only one correct
- Cover important and diverse concepts from the chapter
- Avoid repetition
- Use age-appropriate language for Class ${input.class}

OUTPUT FORMAT:
- Line 1: "${schoolName}"
- Line 2: "CBSE Objective Type Question Paper"
- Line 3: Class: ${input.class} | Subject: ${input.subject} | Chapter: ${input.chapter}
- Line 4: Time: [appropriate] | Max Marks: ${input.marks}
- General Instructions (2–3 bullet points)
- Section label: SECTION A — OBJECTIVE QUESTIONS (${input.marks} × 1 = ${input.marks} Marks)
- Each question numbered Q1. Q2. ...
- End each question with [1 Mark]
- Options (a)(b)(c)(d) each on their own line

After the complete question paper, output exactly:
===ANSWER KEY===

ANSWER KEY FORMAT:
- Title: "ANSWER KEY"
- ${schoolName} | Class ${input.class} | ${input.subject} | ${input.chapter}
- Each question: "Q1. (b) — [brief explanation]"
- End: "--- End of Answer Key ---"`

  } else {
    systemPrompt = "You are an expert CBSE curriculum specialist and experienced question paper setter with 20 years of experience. Always output complete, well-structured question papers with proper CBSE formatting, followed by a thorough answer key."
    prompt = `Generate a CBSE structured question paper AND its complete answer key / marking scheme.

School: ${schoolName}
Class: ${input.class}
Subject: ${input.subject}
Chapter: ${input.chapter}
Topic: ${topic}
Difficulty: ${input.difficulty}
Total Marks: ${input.marks}

PAPER RULES:
- Follow CBSE pattern strictly
- Section A: MCQs (1 mark each)
- Section B: Short answer (2–3 marks)
- Section C: Long answer (4–5 marks)
- Include internal choices where applicable
- Cover important concepts from the chapter
- Avoid repetition
- Maintain mark distribution totalling exactly ${input.marks} marks
- Use age-appropriate language for Class ${input.class}

OUTPUT FORMAT:
- Line 1: "${schoolName}"
- Line 2: "CBSE Question Paper"
- Line 3: Class: ${input.class} | Subject: ${input.subject} | Chapter: ${input.chapter}
- Line 4: Time: [appropriate] | Max Marks: ${input.marks}
- General Instructions (3–4 bullet points)
- Sections clearly labelled: SECTION A, SECTION B, SECTION C
- Each question numbered
- Marks in brackets e.g. [1 Mark] [2 Marks]
- For MCQs: options (a)(b)(c)(d) each on their own line
- Internal choices marked as "OR"

After the complete question paper, output exactly:
===ANSWER KEY===

ANSWER KEY FORMAT:
- Title: "ANSWER KEY / MARKING SCHEME"
- ${schoolName} | Class ${input.class} | ${input.subject} | ${input.chapter} | Total Marks: ${input.marks}
- SECTION A ANSWERS: each MCQ number with correct option letter and answer text
- SECTION B KEY POINTS: 2–3 bullet-point marking key points per question; OR answers included
- SECTION C KEY POINTS: main headings/steps with mark distribution; OR answers included
- End: "--- End of Answer Key ---"`
  }

  const response = await createClaudeMessage({
    system: systemPrompt,
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
    const { class: cls, subject, chapter, topic, difficulty, marks, schoolId, save, questionType, examType, schoolName } = body

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
      schoolName: schoolName || "",
      questionType: questionType === "objective" ? "objective" : "mixed",
      examType: examType || "CBSE",
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
