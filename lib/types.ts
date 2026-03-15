export type Student = {
  id: string
  name: string
  class: string
  roll_no: number
}

export type Subject = {
  id: string
  name: string
}

export type Exam = {
  id: string
  name: string
  term: string
  date: string
}

export type Mark = {
  id: string
  student_id: string
  subject_id: string
  exam_id: string
  marks: number | null
  status: string
}

export type ExamSubject = {
  subject_id: string
  full_marks: number
  pass_marks: number
}