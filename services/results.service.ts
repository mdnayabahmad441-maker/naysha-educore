import { supabase } from "@/lib/supabase"

function gradeFromPercentage(p:number){
  if (p >= 80) return "A"
  if (p >= 60) return "B"
  if (p >= 40) return "C"
  return "F"
}

export async function generateResults(examId:string){

  // Load students
  const { data: students } = await supabase
    .from("students")
    .select("id,name")

  // Load subjects for exam
  const { data: examSubjects } = await supabase
    .from("exam_subjects")
    .select("subject_id,max_marks")
    .eq("exam_id", examId)

  const subjectIds = (examSubjects || []).map(s => s.subject_id)
  const maxTotal = (examSubjects || []).reduce((a,b)=>a + (b.max_marks || 0), 0)

  // Load marks
  const { data: marks } = await supabase
    .from("marks")
    .select("*")
    .eq("exam_id", examId)
    .in("subject_id", subjectIds)

  const rows:any[] = []

  ;(students || []).forEach(student => {

    const studentMarks = (marks || []).filter(m => m.student_id === student.id)

    const total = studentMarks.reduce((a,b)=>a + Number(b.marks || 0), 0)
    const percentage = maxTotal ? (total / maxTotal) * 100 : 0

    rows.push({
      id: crypto.randomUUID(),
      exam_id: examId,
      student_id: student.id,
      total,
      percentage,
      grade: gradeFromPercentage(percentage)
    })

  })

  // Rank by total
  rows.sort((a,b)=> b.total - a.total)
  rows.forEach((r,i)=> r.rank = i+1)

  const { error } = await supabase
    .from("exam_results")
    .upsert(rows, { onConflict: "exam_id,student_id" })

  if (error) console.error(error)
}

export async function getResults(examId:string){

  const { data, error } = await supabase
    .from("exam_results")
    .select(`
      id,
      total,
      percentage,
      rank,
      grade,
      students(name)
    `)
    .eq("exam_id", examId)
    .order("rank")

  if (error) {
    console.error(error)
    return []
  }

  return data
}